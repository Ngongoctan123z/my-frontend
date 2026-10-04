import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { systemConfigs, prompts as promptsTable, apiUsages, users } from '@/src/db/schema'
import { eq, sql } from 'drizzle-orm'

async function checkAndIncrementRateLimit(userId: string): Promise<{ allowed: boolean, limit: number }> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA')
  
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
      const keyUsageKey = `KEY_USAGE_${usedKey}`
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

async function getGroqConfigFromDb(): Promise<{ apiKeys: string[], models: string[] }> {
  let apiKeys = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.split(',').map(k => k.trim()).filter(Boolean) : []
  let models = FALLBACK_MODELS

  try {
    const db = await getDb()
    const configs = await db.select().from(systemConfigs)
    const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
    
    if (configMap['GROQ_API_KEY']) {
      apiKeys = configMap['GROQ_API_KEY'].split(',').map((k: string) => k.trim()).filter(Boolean)
    }

    if (configMap['ACTIVE_GROQ_MODEL']) {
      const chosenModels = configMap['ACTIVE_GROQ_MODEL'].split(',').map((m: string) => m.trim()).filter(Boolean)
      if (chosenModels.length > 0) {
        models = [...chosenModels, ...FALLBACK_MODELS.filter(m => !chosenModels.includes(m))]
      }
    }
  } catch (e) {
    console.error("DB config read error:", e)
  }
  
  return { apiKeys, models }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function tryGenerateWithFallback(systemPrompt: string, isJson: boolean = false): Promise<{ text: string, usedKey: string }> {
  const { apiKeys, models: modelsToTry } = await getGroqConfigFromDb()
  
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('GROQ_API_KEY_MISSING')
  }

  let retryCount = 0
  const MAX_RETRIES = 3
  while (retryCount < MAX_RETRIES) {
    const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random())

    for (const apiKey of shuffledKeys) {
      const groq = new Groq({ apiKey, maxRetries: 0, timeout: 15000 })

      for (const modelName of modelsToTry) {
        try {
          const response = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }],
            model: modelName,
            temperature: 0.2,
            response_format: isJson ? { type: 'json_object' } : { type: 'text' },
          })
          return { text: response.choices[0]?.message?.content || '', usedKey: apiKey }
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase()

          if (msg.includes('safety') || msg.includes('blocked')) {
            throw err // Lỗi vi phạm chính sách nội dung thì dừng lại
          }

          if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('429')) {
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

    // Nếu chạy hết toàn bộ Key và Model mà vẫn xịt (hết Rate Limit chung), 
    // đợi 2 giây rồi xoay vòng lại từ đầu không báo lỗi
    await delay(2000)
    retryCount++
  }
  throw new Error('model_exhausted')
}

// Wrapper to increment global counter
async function tryGenerateWithFallbackWrapped(systemPrompt: string, isJson: boolean = false): Promise<string> {
  const result = await tryGenerateWithFallback(systemPrompt, isJson)
  await incrementGlobalCounter(result.usedKey)
  return result.text
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, type, prompt, essay } = body

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
      )
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        return NextResponse.json({ error: 'Thiếu đề bài hoặc bài làm.' }, { status: 400 })
      }

      let systemPrompt = ''

      const basePrompt = `
Bạn là giám khảo chuyên nghiệp, khách quan. Nhiệm vụ duy nhất của bạn là chấm bài viết của thí sinh theo đúng tiêu chí chấm điểm chính thức của kỳ thi.
QUY TẮC BẮT BUỘC:
1. KHÔNG ĐƯỢC nói chuyện phiếm. KHÔNG ĐƯỢC thêm lời chào hỏi hay dẫn nhập.
2. KHÔNG ĐƯỢC thêm các câu như "Đây là kết quả", "Được rồi", "Tôi sẽ đánh giá". KHÔNG ĐƯỢC xuất bất kỳ văn bản nào ngoài object JSON.
3. Chấm điểm công bằng, chính xác theo chuẩn quốc tế. Nhận xét phải xây dựng, ngắn gọn và khách quan.
4. Kết quả đầu ra PHẢI là một JSON object hợp lệ theo đúng schema bên dưới. Tất cả các trường 'feedback', 'detailedFeedback', và 'explanation' phải viết hoàn toàn bằng tiếng Việt.
5. Nhận xét phải cụ thể, có tính hành động. Tránh giải thích chung chung hoặc quá dài dòng.
`

      if (type === 'IELTS_TASK_2') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT:
${essay}

Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 2:
1. Task Response (TR) - Mức độ đáp ứng yêu cầu đề bài
2. Coherence and Cohesion (CC) - Tính mạch lạc và liên kết
3. Lexical Resource (LR) - Vốn từ vựng
4. Grammatical Range and Accuracy (GRA) - Độ phong phú và chính xác ngữ pháp

Mỗi tiêu chí được chấm từ 0 đến 9, theo thang 0.5. Band tổng là trung bình cộng của 4 tiêu chí, làm tròn đến 0.5 gần nhất.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0.0,
  "criteria": {
    "taskResponse": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "coherenceCohesion": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "lexicalResource": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "grammaticalRange": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt. Xây dựng và đi thẳng vào vấn đề.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else if (type === 'IELTS_TASK_1') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT:
${essay}

Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 1:
1. Task Achievement (TA) - Mức độ hoàn thành nhiệm vụ
2. Coherence and Cohesion (CC) - Tính mạch lạc và liên kết
3. Lexical Resource (LR) - Vốn từ vựng
4. Grammatical Range and Accuracy (GRA) - Độ phong phú và chính xác ngữ pháp

Mỗi tiêu chí được chấm từ 0 đến 9, theo thang 0.5. Band tổng là trung bình cộng của 4 tiêu chí, làm tròn đến 0.5 gần nhất.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0.0,
  "criteria": {
    "taskResponse": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "coherenceCohesion": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "lexicalResource": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." },
    "grammaticalRange": { "score": 0.0, "feedback": "Nhận xét ngắn gọn, trực tiếp." }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt. Xây dựng và đi thẳng vào vấn đề.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else if (type === 'TOEIC_RESPOND') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT:
${essay}

Hãy chấm điểm khách quan theo tiêu chí TOEIC Writing câu 6-7 (Phản hồi yêu cầu bằng văn bản):
1. Chất lượng và sự đa dạng của câu văn (Ngữ pháp và Từ vựng)
2. Tổ chức và tính liên kết
3. Mức độ trả lời đầy đủ các yêu cầu của đề bài

Thang điểm từ 0 đến 5.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0,
  "criteria": {
    "grammarAndVocabulary": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "organization": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "taskFulfillment": { "score": 0, "feedback": "Nhận xét ngắn gọn" }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT:
${essay}

Hãy chấm điểm khách quan theo tiêu chí TOEIC Writing câu 8 (Bài luận nêu quan điểm):
1. Lý lẽ, ví dụ và chi tiết minh họa
2. Tổ chức và tính liên kết
3. Ngữ pháp và từ vựng

Thang điểm từ 0 đến 5.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0,
  "criteria": {
    "reasonsAndExamples": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "organization": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "grammarAndVocabulary": { "score": 0, "feedback": "Nhận xét ngắn gọn" }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else if (type === 'HSK_5' || type === 'HSK_6') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT (viết bằng tiếng Trung):
${essay}

Hãy chấm điểm khách quan theo tiêu chí thi viết HSK:
1. Độ chính xác về ngữ pháp và cú pháp
2. Sự đa dạng và chính xác của từ vựng
3. Tính mạch lạc và mức độ hoàn thành nhiệm vụ (HSK 5: dùng hết từ gợi ý hoặc mô tả ảnh / HSK 6: tóm tắt chính xác nội dung bài đọc, có tiêu đề, không nêu ý kiến cá nhân)

Thang điểm từ 0 đến 100.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0,
  "criteria": {
    "grammar": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "vocabulary": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "taskFulfillment": { "score": 0, "feedback": "Nhận xét ngắn gọn" }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else if (type === 'TOPIK_51_52' || type === 'TOPIK_53' || type === 'TOPIK_54') {
        systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}

BÀI VIẾT (viết bằng tiếng Hàn):
${essay}

Hãy chấm điểm khách quan theo tiêu chí thi viết TOPIK II:
1. Ngữ pháp và từ vựng (Độ chính xác trong diễn đạt và ngữ pháp)
2. Hoàn thành nhiệm vụ (Nội dung và mức độ đáp ứng yêu cầu)
3. Tổ chức bài viết (Tính mạch lạc và cấu trúc)

Thang điểm từ 0 đến 100.

Cấu trúc JSON bắt buộc:
{
  "overallBand": 0,
  "criteria": {
    "grammarAndVocabulary": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "taskCompletion": { "score": 0, "feedback": "Nhận xét ngắn gọn" },
    "organization": { "score": 0, "feedback": "Nhận xét ngắn gọn" }
  },
  "detailedFeedback": "Nhận xét tổng thể bằng tiếng Việt.",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đã sửa", "explanation": "lý do ngắn gọn bằng tiếng Việt" }
  ]
}
Viết toàn bộ nhận xét bằng tiếng Việt.
`
      } else {
        return NextResponse.json({ error: 'Loại đề thi không hợp lệ.' }, { status: 400 })
      }
      const text = await tryGenerateWithFallbackWrapped(systemPrompt, true)

      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json(
          { error: 'Kết quả trả về không đúng định dạng JSON. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
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
    const today = new Date().toLocaleDateString('en-CA')

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
