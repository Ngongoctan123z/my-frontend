import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { systemConfigs, prompts as promptsTable, apiUsages } from '@/src/db/schema'
import { eq, sql } from 'drizzle-orm'

async function checkAndIncrementRateLimit(userId: string): Promise<boolean> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  
  const usages = await db.select().from(apiUsages).where(sql`userId = ${userId} AND date = ${today}`)
  const usage = usages[0]

  if (!usage) {
    await db.insert(apiUsages).values({ userId, date: today, count: 1 })
    return true
  }

  if (usage.count >= 20) {
    return false
  }

  await db.update(apiUsages).set({ count: usage.count + 1 }).where(sql`userId = ${userId} AND date = ${today}`)
  return true
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
  } catch (e) {}
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

  while (true) {
    const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random())

    for (const apiKey of shuffledKeys) {
      const groq = new Groq({ apiKey, maxRetries: 0, timeout: 15000 })
      let hitRateLimit = false

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
            hitRateLimit = true
            break // Chuyển sang key khác
          }

          if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes('api key not valid') || msg.includes('authentication')) {
             hitRateLimit = true 
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
  }
}

// Wrapper to increment global counter
async function tryGenerateWithFallbackWrapped(systemPrompt: string, isJson: boolean = false): Promise<string> {
  const result = await tryGenerateWithFallback(systemPrompt, isJson)
  await incrementGlobalCounter(result.usedKey)
  return result.text
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập để sử dụng tính năng này.' },
        { status: 401 }
      )
    }

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
          return NextResponse.json({ 
            error: 'Kho đề trống. Vui lòng liên hệ Admin để thêm đề vào kho.' 
          }, { status: 404 })
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

    // Rate Limit Check
    const isAllowed = await checkAndIncrementRateLimit(session.user.email || session.user.id!)
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Bạn đã đạt giới hạn 20 lần sử dụng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai!' },
        { status: 429 }
      )
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        return NextResponse.json({ error: 'Thiếu đề bài hoặc bài làm.' }, { status: 400 })
      }

      let systemPrompt = ''

      let basePrompt = `
You are a highly qualified and objective IELTS examiner.
You must grade the essay against the official IELTS marking criteria.
CRITICAL RULES:
1. NO CHITCHAT. NO CONVERSATIONAL TEXT. NO GREETINGS.
2. DO NOT output ANY text outside of the JSON object.
3. Use fair and moderate international standard IELTS grading. Be constructive and objective. Do not be overly punishing for minor errors.
4. Output MUST be a valid JSON object matching the exact schema below.
5. Do NOT hesitate to award high bands (8.0, 8.5, or 9.0) if the essay is exceptionally well-written, demonstrates advanced vocabulary, and has negligible errors. Do not artificially cap the score at 7.0 or 7.5.
`

      if (type === 'IELTS_TASK_2') {
        systemPrompt = basePrompt + `
PROMPT:
${prompt}

ESSAY:
${essay}

Grade objectively using these 4 IELTS criteria:
1. Task Response (TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Each criterion is scored from 0 to 9 in 0.5 increments. The overall band is the average rounded to nearest 0.5.

JSON Schema:
{
  "overallBand": 6.5,
  "criteria": {
    "taskResponse": { "score": 6.5, "feedback": "Concise and direct feedback." },
    "coherenceCohesion": { "score": 6.0, "feedback": "Concise and direct feedback." },
    "lexicalResource": { "score": 7.0, "feedback": "Concise and direct feedback." },
    "grammaticalRange": { "score": 6.5, "feedback": "Concise and direct feedback." }
  },
  "detailedFeedback": "Overall analysis in Vietnamese. Constructive and direct.",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "brief reason in Vietnamese" }
  ]
}
Write all feedback in Vietnamese.
`
      } else if (type === 'IELTS_TASK_1') {
        systemPrompt = basePrompt + `
PROMPT:
${prompt}

ESSAY:
${essay}

Grade objectively using these 4 IELTS criteria:
1. Task Achievement (TA)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Each criterion is scored from 0 to 9 in 0.5 increments. The overall band is the average rounded to nearest 0.5.

JSON Schema:
{
  "overallBand": 6.5,
  "criteria": {
    "taskResponse": { "score": 6.5, "feedback": "Concise and direct feedback." },
    "coherenceCohesion": { "score": 6.0, "feedback": "Concise and direct feedback." },
    "lexicalResource": { "score": 7.0, "feedback": "Concise and direct feedback." },
    "grammaticalRange": { "score": 6.5, "feedback": "Concise and direct feedback." }
  },
  "detailedFeedback": "Overall analysis in Vietnamese. Constructive and direct.",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "brief reason in Vietnamese" }
  ]
}
Write all feedback in Vietnamese.
`
      } else if (type === 'TOEIC_RESPOND') {
        systemPrompt = basePrompt.replace('IELTS', 'TOEIC Writing') + `
PROMPT:
${prompt}

ESSAY:
${essay}

Grade objectively using TOEIC Writing Question 6-7 (Respond to a written request) criteria:
1. Quality and variety of your sentences (Grammar & Vocabulary)
2. Organization and cohesion
3. Whether you answered all parts of the request

Score from 0 to 5.

JSON Schema:
{
  "overallBand": 4.0,
  "criteria": {
    "grammarAndVocabulary": { "score": 4, "feedback": "Concise feedback" },
    "organization": { "score": 4, "feedback": "Concise feedback" },
    "taskFulfillment": { "score": 4, "feedback": "Concise feedback" }
  },
  "detailedFeedback": "Overall analysis in Vietnamese.",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "brief reason in Vietnamese" }
  ]
}
Write all feedback in Vietnamese.
`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = basePrompt.replace('IELTS', 'TOEIC Writing') + `
PROMPT:
${prompt}

ESSAY:
${essay}

Grade objectively using TOEIC Writing Question 8 (Opinion Essay) criteria:
1. Reasons, examples, and details
2. Organization and cohesion
3. Grammar and vocabulary

Score from 0 to 5.

JSON Schema:
{
  "overallBand": 4.0,
  "criteria": {
    "reasonsAndExamples": { "score": 4, "feedback": "Concise feedback" },
    "organization": { "score": 4, "feedback": "Concise feedback" },
    "grammarAndVocabulary": { "score": 4, "feedback": "Concise feedback" }
  },
  "detailedFeedback": "Overall analysis in Vietnamese.",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "brief reason in Vietnamese" }
  ]
}
Write all feedback in Vietnamese.
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
