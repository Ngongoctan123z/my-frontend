import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { publicToeicExamSets } from './toeic-sets'
import { fallbackToeicExamSets } from '@/src/lib/toeicExamSets'
import type { SpeakingD1 } from '../speaking/store'
import { TOEIC_PICTURE_SETS, parseToeicPictures, parseToeicPictureAnswers, publicToeicPictures } from '@/src/data/toeicWriting'
import { ensureToeicPhotoBank } from './toeic-photo-bank'
import { emailPracticePrompts } from './toeic-email-bank'
import { toeicNativeRubric } from './toeic-native-rubric'
import { toeicEmailBank } from '@/src/data/toeicEmails'
import { PICTURE_RUBRIC, normalizePictureResult } from './toeic-pictures'
import { createKeyRotation, generateWithKeyRotation, normalizeApiKeys, sha256Hex, KeyPoolExhaustedError } from '@/src/lib/aiKeyRotation'
import { createDbKeyRotationStore } from './keyRotationStore'
// Web Crypto API will be used instead of node:crypto
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { checkRateLimit } from '@/src/lib/rateLimit'
import { systemConfigs, prompts as promptsTable, apiUsages, users, essayHistory } from '@/src/db/schema'
import { eq, sql, and, inArray } from 'drizzle-orm'
import {
  basePrompt, CRIT, correctionsSchema,
  IELTS_COMMON_RUBRIC, IELTS_T2_RUBRIC, IELTS_T1_RUBRIC,
  TOEIC_67_RUBRIC, TOEIC_8_RUBRIC,
  HSK_RUBRIC_COMMON, HSK5_RUBRIC, HSK6_RUBRIC,
  TOPIK_COMMON, TOPIK_5152_RUBRIC, TOPIK_53_RUBRIC, TOPIK_54_RUBRIC
} from './rubrics'
import {
  MAX_ESSAY_LENGTH, buildUserContent, postProcessResult, parseModelJson,
  getGradingSettings, GRADING_CONTRACT, CALIBRATION, countWords, countHanzi, countKoreanChars
} from './scoring'
import {
  TOEIC_RESPOND_FALLBACKS, TOEIC_ESSAY_FALLBACKS, TOEIC_PAIRED_SETS,
  TOPIK_51_FALLBACKS, TOPIK_52_FALLBACKS, TOPIK_53_FALLBACKS, TOPIK_54_FALLBACKS,
  IELTS_TASK_1_FALLBACKS, IELTS_TASK_2_FALLBACKS, IELTS_PAIRED_SETS,
  HSK_5_FALLBACKS, HSK_6_FALLBACKS, type FallbackPromptItem
} from '@/src/data/fallbackPrompts'

function getFallbackPromptsForType(type: string): FallbackPromptItem[] {
  if (type === 'TOEIC_PICTURE') return TOEIC_PICTURE_SETS.map(set => ({ content: JSON.stringify(set) }))
  if (type === 'TOEIC_RESPOND') return TOEIC_RESPOND_FALLBACKS
  if (type === 'TOEIC_ESSAY') return TOEIC_ESSAY_FALLBACKS
  if (type === 'TOPIK_51') return TOPIK_51_FALLBACKS
  if (type === 'TOPIK_52') return TOPIK_52_FALLBACKS
  if (type === 'TOPIK_53') return TOPIK_53_FALLBACKS
  if (type === 'TOPIK_54') return TOPIK_54_FALLBACKS
  if (type === 'HSK_5') return HSK_5_FALLBACKS
  if (type === 'HSK_6') return HSK_6_FALLBACKS
  if (type === 'IELTS_TASK_1') return IELTS_TASK_1_FALLBACKS
  if (type === 'IELTS_TASK_2') return IELTS_TASK_2_FALLBACKS
  return []
}

async function checkAndIncrementRateLimit(userId: string): Promise<{ allowed: boolean, limit: number }> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

  let limit = 7
  const userRows = await db.select().from(users).where(eq(users.email, userId))
  if (userRows.length > 0) {
    const plan = userRows[0].plan
    if (plan === 'pro') limit = 200
    else if (plan === 'plus') limit = 50
  }

  // Full TOEIC/TOPIK tests submit multiple questions concurrently. Reserve a
  // daily slot in one statement to prevent duplicate inserts or lost counts.
  const reserved = await db.insert(apiUsages).values({ userId, date: today, count: 1 })
    .onConflictDoUpdate({
      target: [apiUsages.userId, apiUsages.date],
      set: { count: sql`${apiUsages.count} + 1` },
      setWhere: sql`${apiUsages.count} < ${limit}`,
    })
    .returning({ count: apiUsages.count })
  return { allowed: reserved.length > 0, limit }
}

async function incrementGlobalCounter(usedKey: string) {
  try {
    const db = await getDb()
    const hash = await sha256Hex(usedKey)
    // Count every provider attempt, including errors, without losing concurrent
    // increments. Admin KEY_USAGE identifiers retain their existing format.
    for (const key of ['TOTAL_API_REQUESTS', `KEY_USAGE_${hash.slice(0, 16)}`]) {
      await db.insert(systemConfigs).values({ key, value: '1' })
        .onConflictDoUpdate({ target: systemConfigs.key,
          set: { value: sql`CAST(${systemConfigs.value} AS INTEGER) + 1` } })
    }
  } catch {
    console.error('[AI-Grader] Failed to record API usage')
  }
}

const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
]

// ===== MODEL RIÊNG CHO CHẤM ĐIỂM =====
// Chỉ dùng model mạnh, KHÔNG shuffle, KHÔNG rơi xuống model nhỏ (model nhỏ chấm rất lệch).
// Có thể ghi đè bằng key GRADING_GROQ_MODEL trong systemConfigs (danh sách cách nhau bởi dấu phẩy, theo thứ tự ưu tiên).
// Kiểm tra lại tên model còn tồn tại trên trang models của Groq.
const GRADING_MODELS = [
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b'
]

async function getGroqConfigFromDb(forGrading: boolean = false): Promise<{ apiKeys: string[], models: string[] }> {
  let apiKeys = process.env.GROQ_API_KEY ? normalizeApiKeys(process.env.GROQ_API_KEY) : []
  let models = forGrading ? GRADING_MODELS : FALLBACK_MODELS

  try {
    const db = await getDb()
    const configs = await db.select().from(systemConfigs)
      .where(inArray(systemConfigs.key, ['GROQ_API_KEY', 'GRADING_GROQ_MODEL', 'ACTIVE_GROQ_MODEL']))
    const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)

    if (configMap['GROQ_API_KEY']) {
      apiKeys = normalizeApiKeys(configMap['GROQ_API_KEY'])
    }

    if (forGrading) {
      if (configMap['GRADING_GROQ_MODEL']) {
        const gradingModels = configMap['GRADING_GROQ_MODEL'].split(',').map((m: string) => m.trim()).filter(Boolean)
        if (gradingModels.length > 0) models = gradingModels
      }
    } else if (configMap['ACTIVE_GROQ_MODEL']) {
      const chosenModels = configMap['ACTIVE_GROQ_MODEL'].split(',').map((m: string) => m.trim()).filter(Boolean)
      if (chosenModels.length > 0) {
        for (let i = chosenModels.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chosenModels[i], chosenModels[j]] = [chosenModels[j], chosenModels[i]];
        }
        models = [...chosenModels, ...FALLBACK_MODELS.filter(m => !chosenModels.includes(m))]
      }
    }
  } catch (e) {
    console.error("DB config read error:", e)
  }

  return { apiKeys, models }
}

interface GenerateOptions {
  accountId: string     // Luôn lấy từ session phía server, không tin userId trong body
  userContent?: string   // Nội dung bài làm tách riêng khỏi system prompt
  temperature?: number
  forGrading?: boolean   // true => dùng danh sách model mạnh, không shuffle
  maxTokens?: number
}

async function tryGenerateWithFallbackWrapped(systemPrompt: string, isJson: boolean, options: GenerateOptions): Promise<{ text: string, model: string, finishReason: string }> {
  const { apiKeys, models } = await getGroqConfigFromDb(!!options.forGrading)
  const db = await getDb()
  const rotation = await createKeyRotation(apiKeys, options.accountId, createDbKeyRotationStore(db))
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }]
  if (options.userContent) messages.push({ role: 'user', content: options.userContent })

  const { result: response, model } = await generateWithKeyRotation(rotation, models, async (apiKey, modelName) => {
    const groq = new Groq({ apiKey, maxRetries: 0, timeout: options.forGrading ? 45000 : 15000 })
    return groq.chat.completions.create({
      messages,
      model: modelName,
      temperature: options.temperature ?? 0.2,
      ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
      response_format: isJson ? { type: 'json_object' } : { type: 'text' },
    })
  }, incrementGlobalCounter)

  return {
    text: response.choices[0]?.message?.content || '',
    model,
    finishReason: response.choices[0]?.finish_reason || '',
  }
}

// =====================================================================
//  CHẤM ĐIỂM: HẰNG SỐ, RUBRIC VÀ HÀM HẬU XỬ LÝ (TÍNH ĐIỂM BẰNG CODE)
// =====================================================================

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra kích thước payload sơ bộ trước khi đọc body để bảo vệ Worker CPU & Memory
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 200000) {
      return NextResponse.json(
        { error: 'Dữ liệu gửi lên vượt quá giới hạn cho phép (tối đa 200KB).' },
        { status: 413 }
      )
    }

    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type không hợp lệ, yêu cầu application/json.' },
        { status: 415 }
      )
    }

    const body = await req.json()
    const { action, prompt, essay, feedbackLang } = body
    const requestedType=body.type
    const emailNumber=requestedType==='TOEIC_EMAIL_6'?6:requestedType==='TOEIC_EMAIL_7'?7:undefined
    const type=emailNumber?'TOEIC_RESPOND':requestedType
    // TOPIK clients send chartExtra; retain imageDescription compatibility.
    const imageDescription = body.imageDescription ?? body.chartExtra

    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon'
    // Phân loại: Chấm bài (grade_essay) tốn tài nguyên AI thì giới hạn chặt,
    // còn lấy đề thi / chuyển tab (get_paired_full_test, generate_prompt_batch) thì thả lỏng để người dùng thao tác nhanh không bị chặn
    const isHeavyAction = action === 'grade_essay'
    const maxReqs = isHeavyAction ? 6 : 40
    const windowMs = isHeavyAction ? 10000 : 5000
    const rl = checkRateLimit(`grader:${isHeavyAction ? 'heavy' : 'light'}:${ip}`, maxReqs, windowMs)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Thao tác quá nhanh. Vui lòng chờ ${rl.retryAfterSeconds} giây trước khi gửi tiếp.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfterSeconds)
          }
        }
      )
    }

    if (action === 'get_paired_full_test' && body.exam === 'TOEIC') {
      try {
        const db = await getDb()
        return NextResponse.json(await publicToeicExamSets(db.$client as SpeakingD1))
      } catch {
        return NextResponse.json({sets:fallbackToeicExamSets(),source:'fallback'})
      }
    }

    // Ghép cặp trọn bộ đề thi (IELTS Task 1 + Task 2 hoặc TOEIC Part 1 + Part 2)
    if (action === 'get_paired_full_test') {
      const exam = body.exam // 'IELTS' hoặc 'TOEIC'
      const fallbackSets = exam === 'TOEIC' ? TOEIC_PAIRED_SETS : IELTS_PAIRED_SETS

      try {
        const db = await getDb()
        
        let type1 = ''
        let type2 = ''
        if (exam === 'IELTS') {
          type1 = 'IELTS_TASK_1'
          type2 = 'IELTS_TASK_2'
        } else if (exam === 'TOEIC') {
          type1 = 'TOEIC_RESPOND'
          type2 = 'TOEIC_ESSAY'
        } else {
          return NextResponse.json({ error: 'Loại bài thi không hợp lệ.' }, { status: 400 })
        }

        const [prompts1, prompts2] = await Promise.all([
          db.select().from(promptsTable).where(eq(promptsTable.type, type1)).orderBy(promptsTable.createdAt).limit(30),
          db.select().from(promptsTable).where(eq(promptsTable.type, type2)).orderBy(promptsTable.createdAt).limit(30)
        ])

        if (prompts1.length === 0 || prompts2.length === 0) {
          return NextResponse.json({ sets: fallbackSets })
        }

        const maxLen = Math.max(prompts1.length, prompts2.length)
        type PairedSet = {
          id: number
          title: string
          part1: { content: string; imageUrl?: string | null }
          part2: { content: string; imageUrl?: string | null }
        }
        let pairedSets: PairedSet[] = []

        for (let i = 0; i < maxLen; i++) {
          const p1 = i < prompts1.length 
            ? prompts1[i] 
            : prompts1[Math.floor(Math.random() * prompts1.length)]
          
          const p2 = i < prompts2.length 
            ? prompts2[i] 
            : prompts2[Math.floor(Math.random() * prompts2.length)]

          pairedSets.push({
            id: i + 1,
            title: `Bộ đề số #${i + 1}`,
            part1: { content: p1.content, imageUrl: p1.imageUrl },
            part2: { content: p2.content, imageUrl: p2.imageUrl },
          })
        }

        // Ưu tiên 100% các bộ đề người dùng CHƯA LÀM (tỷ lệ lặp lại 0%)
        const doneList: string[] = []
        const session = await auth()

        if (session?.user?.email) {
          const userEmail = session.user.email.toLowerCase().trim()
          const doneRecords = await db.select({ prompt: essayHistory.prompt })
            .from(essayHistory)
            .where(sql`LOWER(${essayHistory.email}) = ${userEmail}`)
          doneList.push(...doneRecords.map(r => r.prompt))
        }
        if (Array.isArray(body.donePrompts)) {
          doneList.push(...body.donePrompts)
        }

        const isSetDone = (s: typeof pairedSets[0]) => {
          return doneList.some(done => {
            if (!done) return false
            const d = done.toLowerCase()
            const sTitle = s.title.toLowerCase()
            if (d.includes(sTitle) || d.includes(`bộ đề số #${s.id}`) || d.includes(`số #${s.id}`)) return true
            const p1 = s.part1?.content?.toLowerCase()
            const p2 = s.part2?.content?.toLowerCase()
            if (p1 && (d.includes(p1) || p1.includes(d))) return true
            if (p2 && (d.includes(p2) || p2.includes(d))) return true
            const snip1 = p1?.slice(0, 50).trim()
            if (snip1 && snip1.length >= 15 && d.includes(snip1)) return true
            const snip2 = p2?.slice(0, 50).trim()
            if (snip2 && snip2.length >= 15 && d.includes(snip2)) return true
            return false
          })
        }

        const uncompletedSets = pairedSets.filter(s => !isSetDone(s))
        const completedSets = pairedSets.filter(s => isSetDone(s))

        // TUYỆT ĐỐI không hiển thị đề cũ nếu còn đề chưa làm:
        // Chỉ khi đã làm hết 100% toàn bộ các bộ đề (uncompletedSets.length === 0) mới random lại đề cũ
        if (uncompletedSets.length > 0) {
          pairedSets = uncompletedSets
        } else {
          pairedSets = completedSets
        }

        return NextResponse.json({ sets: pairedSets.length > 0 ? pairedSets : fallbackSets })
      } catch (e: any) {
        console.warn('[AI-Grader] get_paired_full_test DB error, using fallback sets:', e.message)
        return NextResponse.json({ sets: fallbackSets })
      }
    }

    if(emailNumber && (action==='generate_prompt_batch'||action==='generate_prompt')){
      try{const db=await getDb();return NextResponse.json(await emailPracticePrompts(db.$client as SpeakingD1,requestedType,Array.isArray(body.donePrompts)?body.donePrompts.filter((v:any)=>typeof v==='string'):[]))}
      catch{return NextResponse.json({error:'Không tải được kho email. Hãy thử lại; đề đang làm vẫn được giữ.'},{status:503})}
    }

    // Handle prompt batch generation from Database with intelligent random weighting (0% chance for completed prompts until all done)
    if (action === 'generate_prompt_batch' || action === 'generate_prompt') {
      const fallbacks = getFallbackPromptsForType(type)

      try {
        const db = await getDb()
        const session = await auth()

        if(type === 'TOEIC_PICTURE')await ensureToeicPhotoBank(db.$client)

        const allPrompts = await db.select()
          .from(promptsTable)
          .where(eq(promptsTable.type, type))
          .limit(type === 'TOEIC_PICTURE' ? 200 : 40)

        if (allPrompts.length === 0) {
          if (fallbacks.length > 0) {
            return NextResponse.json({
              text: fallbacks[0].content,
              prompts: fallbacks
            })
          }
          return NextResponse.json(
            { error: 'Chưa có đề thi nào trong kho dữ liệu cho phần này.' },
            { status: 200 }
          )
        }

        // Lấy danh sách đề người dùng đã làm
        const donePromptTexts: string[] = []
        if (session?.user?.email) {
          const userEmail = session.user.email.toLowerCase().trim()
          const historyRows = await db.select({ prompt: essayHistory.prompt, essay: essayHistory.essay })
            .from(essayHistory)
            .where(sql`LOWER(${essayHistory.email}) = ${userEmail}`)
            .limit(50)
          donePromptTexts.push(...historyRows.map(r => r.prompt))
          donePromptTexts.push(...historyRows.map(r => r.essay).filter(Boolean) as string[])
        }
        if (Array.isArray(body.donePrompts)) {
          donePromptTexts.push(...body.donePrompts)
        }

        const isDone = (p: typeof allPrompts[0]) => {
          const pContent = (p.content || '').trim()
          if (!pContent) return false
          const pContentLower = pContent.toLowerCase()
          const snippet = pContentLower.slice(0, 50).trim()

          // Parse JSON chỉ 1 lần duy nhất cho mỗi prompt, tránh gọi JSON.parse lặp lại trong vòng lặp lồng
          let parsedTitle = ''
          let parsedTopic = ''
          let parsedSnippet = ''
          if (pContent.startsWith('{')) {
            try {
              const parsed = JSON.parse(pContent)
              if (parsed.title) parsedTitle = String(parsed.title).toLowerCase()
              if (parsed.topic) parsedTopic = String(parsed.topic).toLowerCase()
              if (parsed.text) parsedSnippet = String(parsed.text).slice(0, 40).toLowerCase()
            } catch {}
          }

          return donePromptTexts.some(done => {
            if (!done) return false
            const d = done.trim().toLowerCase()
            if (d === pContentLower || d.includes(pContentLower) || pContentLower.includes(d)) return true
            if (snippet.length >= 15 && d.includes(snippet)) return true
            if (parsedTitle && d.includes(parsedTitle)) return true
            if (parsedTopic && d.includes(parsedTopic)) return true
            if (parsedSnippet && d.includes(parsedSnippet)) return true
            return false
          })
        }

        const uncompletedPrompts = allPrompts.filter(p => !isDone(p))
        const completedPrompts = allPrompts.filter(p => isDone(p))

        // TUYỆT ĐỐI không hiển thị đề cũ khi vẫn còn đề chưa làm:
        // Chỉ khi uncompletedPrompts.length === 0 (đã hoàn thành 100% đề) mới được phép lấy từ completedPrompts
        const pool = uncompletedPrompts.length > 0 ? [...uncompletedPrompts] : [...completedPrompts]
        const chosenPrompts: typeof allPrompts = []
        const needed = Math.min(3, pool.length)

        for (let i = 0; i < needed; i++) {
          if (pool.length > 0) {
            const randIdx = Math.floor(Math.random() * pool.length)
            chosenPrompts.push(pool.splice(randIdx, 1)[0])
          }
        }

        // Return array of objects containing content and imageUrl
        const promptObjects = chosenPrompts.map(p => ({
          id: p.id,
          content: type === 'TOEIC_PICTURE' ? JSON.stringify(publicToeicPictures(parseToeicPictures(p.content))) : p.content,
          imageUrl: p.imageUrl
        }))
        return NextResponse.json({
          text: promptObjects[0]?.content || fallbacks[0]?.content || '',
          prompts: promptObjects.length > 0 ? promptObjects : fallbacks,
          ...(type === 'TOEIC_PICTURE' ? {totalPrompts:allPrompts.length} : {})
        })
      } catch (e: any) {
        console.warn('[AI-Grader] generate_prompt_batch DB error, using fallbacks:', e.message)
        if (fallbacks.length > 0) {
          return NextResponse.json({
            text: fallbacks[0].content,
            prompts: fallbacks
          })
        }
        return NextResponse.json({ error: 'Lỗi khi lấy đề thi: ' + e.message }, { status: 500 })
      }
    }

    // 1. Authenticate user for Grading
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập để chấm bài thi.' },
        { status: 401 }
      )
    }

    const gradingTypes = Object.keys(CALIBRATION)
    if (action !== 'grade_essay' || typeof type !== 'string' || !gradingTypes.includes(type)) {
      return NextResponse.json({ error: 'Yêu cầu hoặc loại đề thi không hợp lệ.' }, { status: 400 })
    }
    if (typeof prompt !== 'string' || !prompt.trim() || typeof essay !== 'string' || !essay.trim()
      || prompt.length > 24000 || essay.length > MAX_ESSAY_LENGTH
      || (imageDescription !== undefined && (typeof imageDescription !== 'string' || imageDescription.length > 24000))) {
      return NextResponse.json({ error: 'Đề bài hoặc bài làm không hợp lệ / quá dài.' }, { status: 400 })
    }
    if (type === 'TOEIC_PICTURE') {
      try { parseToeicPictures(prompt); parseToeicPictureAnswers(essay) }
      catch (error: any) { return NextResponse.json({ error: error.message }, { status: 400 }) }
    }
    const gradingSettings = await getGradingSettings(type)

    // Rate Limit Check
    const userId = session.user.email
    if (!userId) {
      return NextResponse.json({ error: 'Không thể xác thực tài khoản.' }, { status: 401 })
    }
    const { allowed, limit } = await checkAndIncrementRateLimit(userId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Bạn đã đạt giới hạn ' + limit + ' lần sử dụng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai!' },
        { status: 429 }
      )
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        return NextResponse.json({ error: 'Thiếu đề bài hoặc bài làm.' }, { status: 400 })
      }
      if (String(essay).length > MAX_ESSAY_LENGTH) {
        return NextResponse.json({ error: 'Bài làm quá dài.' }, { status: 400 })
      }

      let systemPrompt = ''
      let userContent = ''

      if (type === 'TOEIC_PICTURE') {
        systemPrompt = PICTURE_RUBRIC
        userContent = buildUserContent(prompt, essay, 'Five sentences, scores 0–3 each.')
      } else if (type === 'IELTS_TASK_2') {
        systemPrompt = basePrompt + IELTS_COMMON_RUBRIC + IELTS_T2_RUBRIC + `
ĐÁNH GIÁ VỚI BẢN LĨNH GIÁM KHẢO KHẢO THÍ CHÍNH THỨC (IELTS EXAMINER EVALUATION):
Chấm điểm khách quan theo 4 tiêu chí chuẩn Cambridge cho IELTS Task 2:
1. Task Response (TR): Trả lời trọn vẹn mọi vế của đề; quan điểm rõ ràng xuyên suốt; lập luận sâu theo PEEL; kiểm tra nghiêm ngặt lỗi liệt kê ý và khái quát hóa thái quá.
2. Coherence and Cohesion (CC): Tiến triển ý logic; dùng cohesive referencing (this trend, such issues) thay vì lạm dụng từ nối cơ học (Firstly, Secondly...).
3. Lexical Resource (LR): Độ tự nhiên bản xứ và collocation chuẩn xác; phát hiện và phạt nặng lỗi dịch thô Việt-Anh (L1) và văn mẫu học vẹt rập khuôn.
4. Grammatical Range and Accuracy (GRA): Độ đa dạng và chính xác của cú pháp (câu phức, đảo ngữ, câu điều kiện, danh từ hóa).

Mỗi tiêu chí chấm từ 0 đến 9, theo thang 0.5. Không cần tính điểm tổng, hệ thống sẽ tự tính.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "taskResponse": ${CRIT},
    "coherenceCohesion": ${CRIT},
    "lexicalResource": ${CRIT},
    "grammaticalRange": ${CRIT}
  },
  "detailedFeedback": "Trình bày nhận xét khảo thí súc tích bằng tiếng Việt theo 3 phần rõ rệt:\\n1. [Đánh giá tổng quan]: Tóm tắt điểm mạnh và mức độ đáp ứng bài thi theo barem.\\n2. [Fatal Errors & Limiters Detected]: Trích dẫn NGUYÊN VĂN các cụm từ/câu từ bài viết của thí sinh và phân tích vì sao chúng hạ band điểm (đặc biệt: dịch thô L1 Việt-Anh, văn mẫu sáo rỗng, lạm dụng từ nối, câu thiếu ví dụ thực tế).\\n3. [Chiến lược nâng band lên 8.0+]: Hướng dẫn cụ thể, mang tính hành động cao.",
  ${correctionsSchema('L1 Translation | Văn mẫu học vẹt | Ngữ pháp & Cú pháp | Nâng cấp Band 8.0+')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)} (yêu cầu tối thiểu 250 từ)`)
      } else if (type === 'IELTS_TASK_1') {
        const imageDescAddon = imageDescription ? `\nTHÔNG SỐ CỦA HÌNH ẢNH BIỂU ĐỒ (do người ra đề cung cấp để hỗ trợ chấm thi, dùng làm chuẩn kiểm tra số liệu):\n${imageDescription}\n` : ''
        systemPrompt = basePrompt + IELTS_COMMON_RUBRIC + IELTS_T1_RUBRIC + `
ĐÁNH GIÁ VỚI BẢN LĨNH GIÁM KHẢO KHẢO THÍ CHÍNH THỨC (IELTS EXAMINER EVALUATION):
Chấm điểm khách quan theo 4 tiêu chí chuẩn Cambridge cho IELTS Task 1:
1. Task Achievement (TA): Báo cáo dữ liệu khách quan; bắt buộc có Overview rõ ràng không chứa số liệu; phân nhóm dữ liệu thông minh; TUYỆT ĐỐI XỬ PHẠT NẶNG nếu có suy diễn chủ quan (Subjective Speculation), liệt kê cơ học hoặc so sánh sai bản chất.
2. Coherence and Cohesion (CC): Tổ chức bài mạch lạc theo nhóm xu hướng/tương phản; liên kết tự nhiên.
3. Lexical Resource (LR): Từ vựng mô tả xu hướng và số liệu chuẩn xác; phạt lỗi dịch thô L1 và văn mẫu rập khuôn.
4. Grammatical Range and Accuracy (GRA): Cú pháp đa dạng (mệnh đề phân từ: accounting for, standing at; cấu trúc so sánh hơn/nhất; đúng thì thời gian).

Mỗi tiêu chí chấm từ 0 đến 9, theo thang 0.5. Không cần tính điểm tổng, hệ thống sẽ tự tính.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "taskAchievement": ${CRIT},
    "coherenceCohesion": ${CRIT},
    "lexicalResource": ${CRIT},
    "grammaticalRange": ${CRIT}
  },
  "detailedFeedback": "Trình bày nhận xét khảo thí súc tích bằng tiếng Việt theo 3 phần rõ rệt:\\n1. [Đánh giá tổng quan]: Tóm tắt điểm mạnh và mức độ đáp ứng bài thi theo barem.\\n2. [Fatal Errors & Limiters Detected]: Trích dẫn NGUYÊN VĂN các cụm từ/câu từ bài viết của thí sinh và phân tích vì sao chúng hạ band điểm (đặc biệt: suy diễn chủ quan ngoài biểu đồ, số liệu trong Overview, lỗi L1 translation, so sánh sai bản chất).\\n3. [Chiến lược nâng band lên 8.0+]: Hướng dẫn phân nhóm số liệu và tích hợp dữ liệu linh hoạt.",
  ${correctionsSchema('L1 Translation | Suy diễn ngoài biểu đồ | Phân tích số liệu | Nâng cấp Band 8.0+')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)} (yêu cầu tối thiểu 150 từ)`, imageDescAddon)
      } else if (type === 'TOEIC_RESPOND' || type === 'TOEIC_ESSAY') {
        systemPrompt = toeicNativeRubric(type==='TOEIC_ESSAY')+'\nFeedback language: '+(feedbackLang||'Tiếng Việt')+'\nKeep requirement and evidence strings in their original English; do not translate these fields.'
        const emailTask=type==='TOEIC_RESPOND'?toeicEmailBank().find(row=>row.content===prompt):undefined
        userContent = buildUserContent(prompt,essay,`Word count: ${countWords(essay)}. ${emailNumber?'Question '+emailNumber+'. ':''}Keep the exact prompt and candidate response separate. ${emailTask?'Directions requirements (copy these exact strings into requirementChecks): '+JSON.stringify(emailTask.requirements):''}`)
      } else if (type === 'HSK_5') {
        systemPrompt = basePrompt + HSK5_RUBRIC + `
Hãy chấm điểm khách quan, chuẩn xác toàn diện cả 3 phần của bài thi viết HSK 5:
1. part1_ordering: Sắp xếp 8 câu (Câu 91 - 98) (tối đa 40 điểm, mỗi câu 5 điểm)
2. part2_keywords: Đoạn văn theo 5 từ khóa (Câu 99) (tối đa 30 điểm)
3. part3_picture: Đoạn văn theo tranh (Câu 100) (tối đa 30 điểm)

Trong "evidence" và "original" giữ nguyên chữ Hán trích từ bài làm.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "part1_ordering": {
      "evidence": ["trích dẫn câu làm ở phần 1"],
      "reasoning": "giải thích điểm phần 1 (thang 0-40)",
      "score": 0,
      "feedback": "nhận xét phần sắp xếp 8 câu"
    },
    "part2_keywords": {
      "evidence": ["trích dẫn câu làm ở phần 2"],
      "reasoning": "giải thích điểm phần 2 (thang 0-30)",
      "score": 0,
      "feedback": "nhận xét phần viết đoạn theo từ khóa"
    },
    "part3_picture": {
      "evidence": ["trích dẫn câu làm ở phần 3"],
      "reasoning": "giải thích điểm phần 3 (thang 0-30)",
      "score": 0,
      "feedback": "nhận xét phần viết đoạn theo tranh"
    }
  },
  "hsk5Parts": {
    "part1": {
      "score": 0,
      "maxScore": 40,
      "feedback": "nhận xét tổng quan phần 1",
      "items": [
        {
          "q": 91,
          "userAnswer": "câu của thí sinh hoặc Chưa làm",
          "correctAnswer": "đáp án chuẩn ngữ pháp tiếng Trung",
          "isCorrect": true,
          "score": 5,
          "explanation": "giải thích ngữ pháp tiếng Trung ngắn gọn bằng tiếng Việt"
        }
      ]
    },
    "part2": {
      "score": 0,
      "maxScore": 30,
      "feedback": "nhận xét đoạn văn từ khóa",
      "usedKeywords": ["các từ thí sinh đã sử dụng"],
      "missingKeywords": ["các từ thí sinh còn thiếu nếu có"]
    },
    "part3": {
      "score": 0,
      "maxScore": 30,
      "feedback": "nhận xét đoạn văn theo tranh"
    }
  },
  "detailedFeedback": "Nhận xét tổng thể cả 3 phần bằng tiếng Việt, hướng dẫn chi tiết cách cải thiện ngữ pháp và từ vựng.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Cấu trúc | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số chữ Hán toàn bài: ${countHanzi(essay)}`)
      } else if (type === 'HSK_6') {
        systemPrompt = basePrompt + HSK6_RUBRIC + `
Hãy chấm điểm khách quan theo tiêu chí thi viết HSK:
1. grammar: độ chính xác về ngữ pháp và cú pháp
2. vocabulary: sự đa dạng và chính xác của từ vựng
3. taskFulfillment: tính mạch lạc và mức độ hoàn thành nhiệm vụ (HSK 6: tóm tắt chính xác nội dung bài đọc, có tiêu đề, không nêu ý kiến cá nhân)

Mỗi tiêu chí chấm 0-100. Không cần tính điểm tổng, hệ thống sẽ tự tính.
Trong "evidence" và "original" giữ nguyên chữ Hán trích từ bài làm.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "grammar": ${CRIT},
    "vocabulary": ${CRIT},
    "taskFulfillment": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến điểm.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Cấu trúc | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số chữ Hán: ${countHanzi(essay)} (mục tiêu khoảng 400 chữ)`)
      } else if (type === 'TOPIK_51_52' || type === 'TOPIK_51' || type === 'TOPIK_52' || type === 'TOPIK_53' || type === 'TOPIK_54') {
        const topikRubric = (type === 'TOPIK_51_52' || type === 'TOPIK_51' || type === 'TOPIK_52')
          ? TOPIK_5152_RUBRIC
          : type === 'TOPIK_53'
            ? TOPIK_53_RUBRIC
            : TOPIK_54_RUBRIC
        const lengthHint = type === 'TOPIK_53'
          ? ' (yêu cầu 200-300 ký tự tính cả khoảng trắng)'
          : type === 'TOPIK_54'
            ? ' (yêu cầu 600-700 ký tự tính cả khoảng trắng)'
            : ' (hoàn thành 2 chỗ trống ㉠ và ㉡, không giới hạn độ dài)'

        const chartExtra = (type === 'TOPIK_53' && (imageDescription || prompt))
          ? `\nTHÔNG TIN DỮ LIỆU & SỐ LIỆU GỐC CỦA BIỂU ĐỒ (Dùng làm cơ sở chuẩn để đối chiếu số liệu khi chấm Câu 53, thí sinh chỉ nhìn hình biểu đồ để viết bài nên hãy đối chiếu với số liệu chuẩn này, tránh chấm sai nếu thí sinh viết đúng số liệu):\n${imageDescription || prompt}\n`
          : ''

        systemPrompt = basePrompt + topikRubric + `
Hãy chấm điểm khách quan theo tiêu chí thi viết TOPIK II:
1. grammarAndVocabulary: ngữ pháp và từ vựng (độ chính xác trong diễn đạt và ngữ pháp)
2. taskCompletion: hoàn thành nhiệm vụ (nội dung và mức độ đáp ứng yêu cầu)
3. organization: tổ chức bài viết (tính mạch lạc và cấu trúc)

Mỗi tiêu chí chấm 0-100. Không cần tính điểm tổng, hệ thống sẽ tự tính.
Trong "evidence" và "original" giữ nguyên chữ Hàn trích từ bài làm.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "grammarAndVocabulary": ${CRIT},
    "taskCompletion": ${CRIT},
    "organization": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến điểm.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Cấu trúc | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số ký tự (tính cả khoảng trắng): ${countKoreanChars(essay)}${lengthHint}`, chartExtra)
      } else {
        return NextResponse.json({ error: 'Loại đề thi không hợp lệ.' }, { status: 400 })
      }

      systemPrompt += '\nHƯỚNG DẪN BỔ SUNG TỪ QUẢN TRỊ:\n' + (type === 'TOEIC_PICTURE' ? '' : gradingSettings.prompt) + '\n' + GRADING_CONTRACT + `

YÊU CẦU CUỐI CÙNG VỀ TÍNH ĐẦY ĐỦ:
- corrections phải là một mảng JSON, kể cả khi không có lỗi (khi đó dùng []).
- Rà toàn bộ từng câu và liệt kê mọi lỗi thật, không giới hạn số mục, không chỉ chọn lỗi tiêu biểu. Mỗi vị trí lỗi riêng biệt phải có một mục với original trích nguyên văn chính xác.
- Không bỏ lỗi vì muốn giữ output ngắn. Nếu output dài, rút ngắn explanation và bỏ gợi ý nâng cao không thiết yếu trước; giữ đầy đủ các lỗi.
- Điểm Grammar/Language và Vocabulary phải phản ánh mật độ, mức độ nghiêm trọng và tính lặp lại của lỗi so với độ dài bài, đồng thời đánh giá riêng độ tự nhiên/trôi chảy và độ phù hợp của từ vựng theo rubric.
`

      if (feedbackLang && feedbackLang !== 'Tiếng Việt') {
        systemPrompt = systemPrompt.replace(/tiếng việt/gi, feedbackLang)
        systemPrompt += `\n\n[CRITICAL DIRECTIVE: YOU MUST TRANSLATE ALL YOUR FEEDBACK, REASONING, EXPLANATION AND SUGGESTIONS TO ${feedbackLang.toUpperCase()}. DO NOT TRANSLATE THE 'evidence' OR 'original' FIELDS.]`
      }

      // Kiểm tra nguồn theo task
      // Bỏ logic CẢNH BÁO thiếu hình ảnh/đoạn văn gốc do user yêu cầu

      // Retry loop
      let lastError: any = null
      let validationErrorMsg = ''
      for (let attempt = 0; attempt < 2; attempt++) {
        const textRes = await tryGenerateWithFallbackWrapped(systemPrompt + (validationErrorMsg ? '\\n\\n[HỆ THỐNG] LỖI VALIDATION TỪ LẦN CHẤM TRƯỚC:\\n' + validationErrorMsg : ''), true, {
          accountId: userId,
          userContent,
          temperature: 0,
          forGrading: true,
          maxTokens: 8192,
        })
        
        if (textRes.finishReason === 'length') {
          validationErrorMsg = 'Output bị cắt do quá dài. Hãy rút gọn detailedFeedback và explanation, bỏ các gợi ý Nâng cao không thiết yếu, nhưng phải giữ mọi lỗi thật trong corrections và xuất JSON đầy đủ.'
          continue;
        }

        try {
          const parsed = parseModelJson(textRes.text)
          const calibValue = gradingSettings.calibration[type] || 0
          if(type==='TOEIC_RESPOND'){const task=toeicEmailBank().find(row=>row.content===prompt);if(task&&(!Array.isArray(parsed.requirementChecks)||parsed.requirementChecks.length!==task.requirements.length||task.requirements.some(requirement=>!parsed.requirementChecks.some((row:any)=>row.requirement===requirement))))throw new Error('email_directions_coverage_mismatch')}
          const finalResult: any = type === 'TOEIC_PICTURE' ? normalizePictureResult(parsed, prompt, essay) : postProcessResult(parsed, type, essay, calibValue)
          
          // Metadata
          finalResult.assessmentStatus = type === 'TOEIC_PICTURE' ? 'reference_based' : type.startsWith('TOEIC')?'practice_estimate':'verified'
          finalResult.modelUsed = textRes.model
          finalResult.rubricVersion = type.startsWith('TOEIC')?'toeic-native-2':'1.0'
          if(emailNumber)finalResult.questionNumber=emailNumber
          finalResult.scoreKind = type.includes('IELTS') ? 'band' : 'score'
          // postProcessResult already sets the task-specific scale and text
          // (TOPIK 51/52: 10, 53: 30, 54: 50). Preserve that scoring contract.

          return NextResponse.json(finalResult)
        } catch (e: any) {
          lastError = e
          validationErrorMsg = 'Lỗi JSON: ' + e.message + '. Yêu cầu trả về đúng định dạng JSON, không tự ý đổi điểm để lách luật, chỉ cần sửa format.'
        }
      }
      console.error('[AI-Grader] Parse/validate failed:', lastError?.message)
      return NextResponse.json(
        { error: `Kết quả trả về không đúng định dạng JSON (${lastError?.message || 'Lỗi phân tích cú pháp'}). Vui lòng thử lại.` },
        { status: 500 }
      )
    }



    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })

  } catch (error: any) {
    if (error instanceof KeyPoolExhaustedError) {
      return NextResponse.json(
        { error: 'Các API key đang tạm bị giới hạn. Vui lòng thử lại sau.', retryAfterSeconds: error.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
      )
    }
    const msg = (error.message || '').toLowerCase()

    if (msg.includes('groq_api_key_missing')) {
      return NextResponse.json({ error: 'Chưa cấu hình GROQ_API_KEY trên hệ thống.' }, { status: 500 })
    }

    if (msg.includes('api_key_invalid') || msg.includes('unauthorized') || msg.includes('401')) {
      return NextResponse.json({ error: 'API Key hệ thống bị từ chối.' }, { status: 500 })
    }

    if (msg.includes('quota') || msg.includes('rate limit')) {
      return NextResponse.json({ error: 'Hệ thống AI đang quá tải lượt gọi (Rate Limit). Vui lòng thử lại sau.' }, { status: 429 })
    }

    if (msg.includes('model_exhausted')) {
      return NextResponse.json({ error: 'Tất cả model AI đều đang bận. Vui lòng thử lại.' }, { status: 503 })
    }

    console.error('[AI-Grader] Unhandled server error')
    return NextResponse.json(
      { error: 'Hệ thống máy chủ AI đang gặp sự cố. Vui lòng thử lại sau ít phút.' },
      { status: 500 }
    )
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ count: 0, limit: 7, plan: 'free' })
    }

    const userId = session.user.email
    const db = await getDb()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

    const userRows = await db.select().from(users).where(eq(users.email, userId))
    let limit = 7
    let plan = 'free'
    if (userRows.length > 0) {
      plan = userRows[0].plan
      if (plan === 'pro') limit = 200
      else if (plan === 'plus') limit = 50
    }

    const usages = await db.select().from(apiUsages).where(sql`userId = ${userId} AND date = ${today}`)
    const count = usages[0]?.count || 0

    return NextResponse.json({ count, limit, plan })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ count: 0, limit: 7, plan: 'free' })
  }
}
