import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
// Web Crypto API will be used instead of node:crypto
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { systemConfigs, prompts as promptsTable, apiUsages, users } from '@/src/db/schema'
import { eq, sql } from 'drizzle-orm'
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

async function checkAndIncrementRateLimit(userId: string): Promise<{ allowed: boolean, limit: number }> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

  let limit = 2
  const userRows = await db.select().from(users).where(eq(users.email, userId))
  if (userRows.length > 0) {
    const plan = userRows[0].plan
    if (plan === 'pro') limit = 200
    else if (plan === 'plus') limit = 50
  }

  const usages = await db.select().from(apiUsages).where(sql`userId = ${userId} AND date = ${today}`)
  const usage = usages[0]

  if (!usage) {
    await db.insert(apiUsages).values({ userId, date: today, count: 1 })
    return { allowed: true, limit }
  }

  if (usage.count >= limit) {
    return { allowed: false, limit }
  }

  await db.update(apiUsages).set({ count: usage.count + 1 }).where(sql`userId = ${userId} AND date = ${today}`)
  return { allowed: true, limit }
}

async function sha256Hex(text: string) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function incrementGlobalCounter(usedKey?: string) {
  try {
    const db = await getDb()
    const configs = await db.select().from(systemConfigs)

    const totalConfig = configs.find(c => c.key === 'TOTAL_API_REQUESTS')
    if (totalConfig) {
      await db.update(systemConfigs).set({ value: (parseInt(totalConfig.value) + 1).toString() }).where(eq(systemConfigs.key, 'TOTAL_API_REQUESTS'))
    } else {
      await db.insert(systemConfigs).values({ key: 'TOTAL_API_REQUESTS', value: '1' })
    }

    if (usedKey) {
      const hash = await sha256Hex(usedKey)
      const keyUsageKey = `KEY_USAGE_${hash.slice(0, 16)}`
      const keyConfig = configs.find(c => c.key === keyUsageKey)
      if (keyConfig) {
        await db.update(systemConfigs).set({ value: (parseInt(keyConfig.value) + 1).toString() }).where(eq(systemConfigs.key, keyUsageKey))
      } else {
        await db.insert(systemConfigs).values({ key: keyUsageKey, value: '1' })
      }
    }
  } catch (e) {
    console.error(e)
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
  let apiKeys = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.split(',').map(k => k.trim()).filter(Boolean) : []
  let models = forGrading ? GRADING_MODELS : FALLBACK_MODELS

  try {
    const db = await getDb()
    const configs = await db.select().from(systemConfigs)
    const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)

    if (configMap['GROQ_API_KEY']) {
      apiKeys = configMap['GROQ_API_KEY'].split(',').map((k: string) => k.trim()).filter(Boolean)
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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

interface GenerateOptions {
  userContent?: string   // Nội dung bài làm tách riêng khỏi system prompt
  temperature?: number
  forGrading?: boolean   // true => dùng danh sách model mạnh, không shuffle
  maxTokens?: number
}

async function tryGenerateWithFallback(systemPrompt: string, isJson: boolean = false, options: GenerateOptions = {}): Promise<{ text: string, usedKey: string, model: string, finishReason: string }> {
  const { apiKeys, models: modelsToTry } = await getGroqConfigFromDb(!!options.forGrading)

  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('GROQ_API_KEY_MISSING')
  }

  // Cache to track rate-limited keys
  const globalAny = global as any
  if (!globalAny.keyCooldowns) {
    globalAny.keyCooldowns = {}
  }
  const keyCooldowns = globalAny.keyCooldowns

  const messages: any[] = [{ role: 'system', content: systemPrompt }]
  if (options.userContent) messages.push({ role: 'user', content: options.userContent })

  let retryCount = 0
  const MAX_RETRIES = 3
  while (retryCount < MAX_RETRIES) {
    const shuffledKeys = [...apiKeys]
    for (let i = shuffledKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
    }

    const now = Date.now()
    const availableKeys = shuffledKeys.filter(k => !keyCooldowns[k] || now > keyCooldowns[k])

    // Nếu tất cả các key đều đang bị cooldown, đừng cố thử lại (gây 1102 CPU time limit và tốn subrequests)
    if (availableKeys.length === 0) {
      throw new Error('Hệ thống đang quá tải do giới hạn của Groq API. Vui lòng đợi 1 phút và thử lại.')
    }

    for (const apiKey of availableKeys) {
      const groq = new Groq({ apiKey, maxRetries: 0, timeout: options.forGrading ? 45000 : 15000 })

      for (const modelName of modelsToTry) {
        try {
          const response = await groq.chat.completions.create({
            messages,
            model: modelName,
            temperature: options.temperature ?? 0.2,
            ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
            response_format: isJson ? { type: 'json_object' } : { type: 'text' },
          })
          return { text: response.choices[0]?.message?.content || '', usedKey: apiKey, model: modelName, finishReason: response.choices[0]?.finish_reason || '' }
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase()

          if (msg.includes('safety') || msg.includes('blocked')) {
            throw err // Lỗi vi phạm chính sách nội dung thì dừng lại
          }

          if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('429')) {
            // Đưa key này vào blacklist tạm thời trong 1 phút để các request sau không bị kẹt
            keyCooldowns[apiKey] = Date.now() + 60 * 1000;
            break // Chuyển sang key khác
          }

          if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes('api key not valid') || msg.includes('authentication')) {
            break // Chuyển sang key khác
          }

          // Lỗi 500, Timeout... thử model tiếp theo
          continue
        }
      }
    }

    // Hết key ở lượt này, đợi 2 giây rồi thử lại. 
    // Tuy nhiên nếu availableKeys = 0 ở trên nó đã throw Error, nên vòng lặp sẽ không quay cuồng lãng phí CPU.
    await delay(2000)
    retryCount++
  }
  throw new Error('model_exhausted')
}

// Wrapper to increment global counter
async function tryGenerateWithFallbackWrapped(systemPrompt: string, isJson: boolean = false, options: GenerateOptions = {}): Promise<{ text: string, model: string, finishReason: string }> {
  const result = await tryGenerateWithFallback(systemPrompt, isJson, options)
  await incrementGlobalCounter(result.usedKey)
  return { text: result.text, model: result.model, finishReason: result.finishReason }
}

// =====================================================================
//  CHẤM ĐIỂM: HẰNG SỐ, RUBRIC VÀ HÀM HẬU XỬ LÝ (TÍNH ĐIỂM BẰNG CODE)
// =====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, type, prompt, essay, imageDescription, feedbackLang = 'Tiếng Việt' } = body

    // Handle prompt batch generation from Database instead of AI
    if (action === 'generate_prompt_batch' || action === 'generate_prompt') {
      try {
        const db = await getDb()
        // SQLite RANDOM() order by
        const randomPrompts = await db.select()
          .from(promptsTable)
          .where(eq(promptsTable.type, type))
          .orderBy(sql`RANDOM()`)
          .limit(3)

        if (randomPrompts.length === 0) {
          // Trả về lỗi nếu chưa có đề thi thay vì tự tạo
          return NextResponse.json(
            { error: 'Chưa có đề thi nào trong kho dữ liệu cho phần này.' },
            { status: 404 }
          )
        }

        // Return array of objects containing content and imageUrl
        const promptObjects = randomPrompts.map(p => ({
          content: p.content,
          imageUrl: p.imageUrl
        }))
        return NextResponse.json({
          text: promptObjects[0].content, // for legacy single prompt
          prompts: promptObjects  // for new batch prompt
        })
      } catch (e: any) {
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

      if (type === 'IELTS_TASK_2') {
        systemPrompt = basePrompt + IELTS_COMMON_RUBRIC + IELTS_T2_RUBRIC + `
Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 2:
1. Task Response (TR) - Mức độ đáp ứng yêu cầu đề bài
2. Coherence and Cohesion (CC) - Tính mạch lạc và liên kết
3. Lexical Resource (LR) - Vốn từ vựng
4. Grammatical Range and Accuracy (GRA) - Độ phong phú và chính xác ngữ pháp

Mỗi tiêu chí chấm từ 0 đến 9, theo thang 0.5. Không cần tính điểm tổng, hệ thống sẽ tự tính.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "taskResponse": ${CRIT},
    "coherenceCohesion": ${CRIT},
    "lexicalResource": ${CRIT},
    "grammaticalRange": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến band điểm và 2-3 việc cần làm để lên band.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)} (yêu cầu tối thiểu 250 từ)`)
      } else if (type === 'IELTS_TASK_1') {
        const imageDescAddon = imageDescription ? `\nTHÔNG SỐ CỦA HÌNH ẢNH BIỂU ĐỒ (do người ra đề cung cấp để hỗ trợ chấm thi, dùng làm chuẩn kiểm tra số liệu):\n${imageDescription}\n` : ''
        systemPrompt = basePrompt + IELTS_COMMON_RUBRIC + IELTS_T1_RUBRIC + `
Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 1:
1. Task Achievement (TA) - Mức độ hoàn thành nhiệm vụ
2. Coherence and Cohesion (CC) - Tính mạch lạc và liên kết
3. Lexical Resource (LR) - Vốn từ vựng
4. Grammatical Range and Accuracy (GRA) - Độ phong phú và chính xác ngữ pháp

Mỗi tiêu chí chấm từ 0 đến 9, theo thang 0.5. Không cần tính điểm tổng, hệ thống sẽ tự tính.

Cấu trúc JSON bắt buộc:
{
  "criteria": {
    "taskAchievement": ${CRIT},
    "coherenceCohesion": ${CRIT},
    "lexicalResource": ${CRIT},
    "grammaticalRange": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến band điểm và 2-3 việc cần làm để lên band.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Phân tích số liệu | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)} (yêu cầu tối thiểu 150 từ)`, imageDescAddon)
      } else if (type === 'TOEIC_RESPOND') {
        systemPrompt = basePrompt + TOEIC_67_RUBRIC + `
Hãy chấm điểm khách quan theo tiêu chí TOEIC Writing câu 6-7 (Phản hồi yêu cầu bằng văn bản). Mỗi tiêu chí chấm số nguyên 0-4. KHÔNG lấy trung bình ba tiêu chí.

Cấu trúc JSON bắt buộc:
{
  "holisticScore": 0,
  "criteria": {
    "grammarAndVocabulary": ${CRIT},
    "organization": ${CRIT},
    "taskFulfillment": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến điểm.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Phù hợp ngữ cảnh | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)}`)
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = basePrompt + TOEIC_8_RUBRIC + `
Hãy chấm điểm khách quan theo tiêu chí TOEIC Writing câu 8 (Bài luận nêu quan điểm). Mỗi tiêu chí chấm số nguyên 0-5. KHÔNG lấy trung bình ba tiêu chí.

Cấu trúc JSON bắt buộc:
{
  "holisticScore": 0,
  "criteria": {
    "reasonsAndExamples": ${CRIT},
    "organization": ${CRIT},
    "grammarAndVocabulary": ${CRIT}
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt, tập trung vào các yếu tố ảnh hưởng trực tiếp đến điểm.",
  ${correctionsSchema('Ngữ pháp | Từ vựng | Cấu trúc | Nâng cấp từ vựng')}
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
        userContent = buildUserContent(prompt, essay, `Số từ: ${countWords(essay)} (khuyến nghị tối thiểu 300 từ)`)
      } else if (type === 'HSK_5' || type === 'HSK_6') {
        systemPrompt = basePrompt + (type === 'HSK_5' ? HSK5_RUBRIC : HSK6_RUBRIC) + `
Hãy chấm điểm khách quan theo tiêu chí thi viết HSK:
1. grammar: độ chính xác về ngữ pháp và cú pháp
2. vocabulary: sự đa dạng và chính xác của từ vựng
3. taskFulfillment: tính mạch lạc và mức độ hoàn thành nhiệm vụ (${type === 'HSK_5' ? 'HSK 5: dùng hết từ gợi ý hoặc mô tả đúng ảnh' : 'HSK 6: tóm tắt chính xác nội dung bài đọc, có tiêu đề, không nêu ý kiến cá nhân'})

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
        userContent = buildUserContent(prompt, essay, `Số chữ Hán: ${countHanzi(essay)} (mục tiêu khoảng ${type === 'HSK_5' ? 80 : 400} chữ)`)
      } else if (type === 'TOPIK_51_52' || type === 'TOPIK_53' || type === 'TOPIK_54') {
        const topikRubric = type === 'TOPIK_51_52' ? TOPIK_5152_RUBRIC : type === 'TOPIK_53' ? TOPIK_53_RUBRIC : TOPIK_54_RUBRIC
        const lengthHint = type === 'TOPIK_53' ? ' (yêu cầu 200-300 ký tự)' : type === 'TOPIK_54' ? ' (yêu cầu 600-700 ký tự)' : ''
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
        userContent = buildUserContent(prompt, essay, `Số ký tự (tính cả khoảng trắng): ${countKoreanChars(essay)}${lengthHint}`)
      } else {
        return NextResponse.json({ error: 'Loại đề thi không hợp lệ.' }, { status: 400 })
      }

      systemPrompt += '\nHƯỚNG DẪN BỔ SUNG TỪ QUẢN TRỊ:\n' + gradingSettings.prompt + '\n' + GRADING_CONTRACT

      if (feedbackLang && feedbackLang !== 'Tiếng Việt') {
        systemPrompt = systemPrompt.replace(/tiếng việt/gi, feedbackLang)
        systemPrompt += `\n\n[CRITICAL DIRECTIVE: YOU MUST TRANSLATE ALL YOUR FEEDBACK, REASONING, EXPLANATION AND SUGGESTIONS TO ${feedbackLang.toUpperCase()}. DO NOT TRANSLATE THE 'evidence' OR 'original' FIELDS.]`
      }

      // Kiểm tra nguồn theo task
      let hasSource = true;
      let missingSourceMsg = '';
      if (type === 'IELTS_TASK_1' && !imageDescription) {
        hasSource = false; missingSourceMsg = 'Thiếu mô tả biểu đồ/hình ảnh gốc.';
      } else if (type === 'TOPIK_53' && !imageDescription && !prompt.includes('biểu đồ')) {
        hasSource = false; missingSourceMsg = 'Thiếu số liệu biểu đồ gốc.';
      } else if (type === 'HSK_5' && prompt.includes('bức tranh') && !imageDescription) {
        hasSource = false; missingSourceMsg = 'Thiếu mô tả bức tranh gốc.';
      } else if (type === 'HSK_6' && !prompt.includes('Bài đọc:')) {
        hasSource = false; missingSourceMsg = 'Thiếu bài đọc gốc.';
      } else if (type === 'TOPIK_51_52' && !prompt.includes('ngữ cảnh')) {
        hasSource = false; missingSourceMsg = 'Thiếu ngữ cảnh xung quanh chỗ trống.';
      }

      // Retry loop
      let lastError: any = null
      let validationErrorMsg = ''
      for (let attempt = 0; attempt < 2; attempt++) {
        const textRes = await tryGenerateWithFallbackWrapped(systemPrompt + (validationErrorMsg ? '\\n\\n[HỆ THỐNG] LỖI VALIDATION TỪ LẦN CHẤM TRƯỚC:\\n' + validationErrorMsg : ''), true, {
          userContent,
          temperature: 0,
          forGrading: true,
          maxTokens: 4096,
        })
        
        if (textRes.finishReason === 'length') {
          validationErrorMsg = 'Output bị cắt do quá dài. Hãy tóm tắt lại và xuất JSON đầy đủ.'
          continue;
        }

        try {
          const parsed = parseModelJson(textRes.text)
          const finalResult = postProcessResult(parsed, type, essay, gradingSettings.calibration)
          
          // Metadata
          finalResult.assessmentStatus = hasSource ? 'verified' : 'provisional'
          if (!hasSource) {
            finalResult.detailedFeedback = '[CẢNH BÁO: ' + missingSourceMsg + ' Điểm số chỉ mang tính tham khảo ngôn ngữ] ' + finalResult.detailedFeedback
            finalResult.overallBand = null // Không chấm điểm tổng nếu thiếu nguồn
          }
          finalResult.modelUsed = textRes.model
          finalResult.rubricVersion = '1.0'
          finalResult.scoreKind = type.includes('IELTS') ? 'band' : 'score'
          finalResult.scoreScale = type.includes('IELTS') ? 9 : (type.includes('TOEIC') ? (type === 'TOEIC_ESSAY' ? 5 : 4) : 100)

          return NextResponse.json(finalResult)
        } catch (e: any) {
          lastError = e
          validationErrorMsg = 'Lỗi JSON: ' + e.message + '. Yêu cầu trả về đúng định dạng JSON, không tự ý đổi điểm để lách luật, chỉ cần sửa format.'
        }
      }
      console.error('[AI-Grader] Parse/validate failed:', lastError?.message)
      return NextResponse.json(
        { error: 'Kết quả trả về không đúng định dạng JSON. Vui lòng thử lại.' },
        { status: 500 }
      )
    }



    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })

  } catch (error: any) {
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

    console.error('[AI-Grader] Unhandled error:', error.message)
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
      return NextResponse.json({ count: 0, limit: 2, plan: 'free' })
    }

    const userId = session.user.email
    const db = await getDb()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

    const userRows = await db.select().from(users).where(eq(users.email, userId))
    let limit = 2
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
    return NextResponse.json({ count: 0, limit: 2, plan: 'free' })
  }
}