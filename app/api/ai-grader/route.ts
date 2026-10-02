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

  if (usage.count >= 15) {
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

    // Đợi 2 giây rồi thử lại
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

    const userId = session.user.email
    if (!userId) {
      return NextResponse.json({ error: 'Không thể xác thực tài khoản.' }, { status: 401 })
    }
    const isAllowed = await checkAndIncrementRateLimit(userId)
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Bạn đã đạt giới hạn 15 lần sử dụng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai!' },
        { status: 429 }
      )
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        return NextResponse.json({ error: 'Thiếu đề bài hoặc bài làm.' }, { status: 400 })
      }

      let systemPrompt = ''

      const basePrompt = `
You are an expert examiner. Your task is to grade the user's writing based on official exam criteria.
CRITICAL RULES:
1. NO CHITCHAT. NO CONVERSATIONAL TEXT. DO NOT output ANY text outside of the JSON object.
2. Evaluate fairly and objectively based strictly on the provided criteria. Do not be overly harsh or overly lenient. Ensure your scoring accurately reflects the true ability of the candidate according to the rubric.
3. Output MUST be a valid JSON object matching the exact schema below, strictly using Vietnamese language for the 'feedback', 'detailedFeedback', and 'explanation' fields.
4. In the 'corrections' array, you MUST find and fix EVERY grammatical, lexical, and structural error. Provide precise, actionable explanations.
`

      if (type === 'IELTS_TASK_2') {
        systemPrompt = basePrompt + `
PROMPT:
${prompt}

ESSAY:
${essay}

# CORE SCORING PRINCIPLES
1. Do NOT judge overall writing quality first. Score each criterion independently.
2. A sophisticated essay can receive a low TR score if it does not answer the question properly.
3. Do not let vocabulary influence grammar scoring. Do not let grammar influence Task Response scoring.
4. Do not let the apparent intelligence of the argument automatically increase the score.

# TASK RESPONSE (TR)
Evaluate: Answers ALL parts of the question; Clear position maintained throughout; Main ideas relevant and sufficiently developed.
- Band 9: Fully addresses every part. Fully developed position. Ideas fully extended.
- Band 8: Sufficiently addresses all parts. Clear and well-developed position. Minor omissions possible.
- Band 7: Addresses task appropriately. Clear position. Some ideas may be overgeneralised.
- Band 6: Addresses main parts. Position may become unclear. Main ideas insufficiently developed.
- Band 5: Partial address. Unclear position. Repetitive/insufficient ideas.
- Band 4: Barely addresses task. Unclear position. Poorly developed ideas.

# COHERENCE AND COHESION (CC)
Evaluate: Logical organisation; Overall progression; Paragraphing; Use of cohesive devices (natural vs mechanical).
- Band 9: Effortless coherence. Skilful paragraphing. Natural cohesion.
- Band 8: Logical sequencing. Clear progression. Appropriate paragraphing.
- Band 7: Logical organisation. Some over/under-use of cohesive devices. Generally effective paragraphing.
- Band 6: Generally coherent. Faulty or mechanical cohesive devices.
- Band 5: Limited organisation. Unclear progression. Inadequate paragraphing.
- Band 4: Ideas difficult to follow. Poor paragraphing.

# LEXICAL RESOURCE (LR)
Evaluate: Range of vocabulary; Precision; Flexibility; Collocation; Spelling.
- Band 9: Extremely wide vocabulary. Very natural and sophisticated control. Virtually no errors.
- Band 8: Wide vocabulary. Fluent and flexible use. Occasional errors.
- Band 7: Sufficient range. Some less common vocabulary. Occasional word choice/spelling errors.
- Band 6: Adequate range. Some attempts at less common vocabulary. Noticeable errors but meaning clear.
- Band 5: Limited range. Basic vocabulary dominates. Errors cause difficulty.
- Band 4: Basic vocabulary only. Frequent repetition and inappropriate word choice.

# GRAMMATICAL RANGE AND ACCURACY (GRA)
Evaluate: Variety of complex structures; Subordination; Accuracy; Punctuation.
- Band 9: Full range of structures. Accurate and flexible. Errors extremely rare.
- Band 8: Wide range of structures. Majority error-free sentences. Occasional minor errors.
- Band 7: Variety of complex structures. Good control. Frequent error-free sentences.
- Band 6: Mix of simple/complex. Errors occur in complex structures. Meaning clear.
- Band 5: Limited range. Frequent grammatical errors causing difficulty.
- Band 4: Very limited structural range. Frequent errors interfering with communication.

# HALF-BAND RULE
Use 0.5 bands (e.g., 6.5, 7.5) when the essay clearly falls between two descriptor levels. Do NOT use .5 simply to appear precise.

# IMPORTANT DISTINCTION: QUALITY VS COMPLEXITY
Do NOT reward unnecessarily long sentences, obscure vocabulary, excessive linking words, memorised phrases, or generic intros/conclusions.
Reward precise reasoning, natural cohesion, accurate vocabulary, and clear communication.

# OUTPUT FORMAT
Each criterion is scored from 0 to 9 in 0.5 increments. The overall band is the average rounded according to IELTS convention (e.g., 7.25 -> 7.5, 7.75 -> 8.0, 7.125 -> 7.0).

JSON Schema:
{
  "overallBand": 6.5,
  "criteria": {
    "taskResponse": { "score": 6.5, "feedback": "Detailed justification based on the rubric above. Note strengths and weaknesses." },
    "coherenceCohesion": { "score": 6.0, "feedback": "Detailed justification based on the rubric above." },
    "lexicalResource": { "score": 7.0, "feedback": "Detailed justification based on the rubric above." },
    "grammaticalRange": { "score": 6.5, "feedback": "Detailed justification based on the rubric above." }
  },
  "detailedFeedback": "Overall Examiner Summary in Vietnamese explaining why the essay received this score and the most important improvements.",
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
      } else if (type === 'HSK_5' || type === 'HSK_6') {
        systemPrompt = basePrompt.replace('IELTS', 'HSK Writing').replace('English', 'Chinese') + `
PROMPT:
${prompt}

ESSAY (written in Chinese):
${essay}

Grade objectively based on HSK Writing criteria:
1. Grammar and syntax accuracy
2. Vocabulary range and correctness
3. Coherence and task fulfillment (for HSK 5: used all words or described picture / for HSK 6: summarized accurately with title, no personal opinions)

Score from 0 to 100.

JSON Schema:
{
  "overallBand": 85,
  "criteria": {
    "grammar": { "score": 85, "feedback": "Concise feedback" },
    "vocabulary": { "score": 85, "feedback": "Concise feedback" },
    "taskFulfillment": { "score": 85, "feedback": "Concise feedback" }
  },
  "detailedFeedback": "Overall analysis in Vietnamese.",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "brief reason in Vietnamese" }
  ]
}
Write all feedback in Vietnamese.
`
      } else if (type === 'TOPIK_51_52' || type === 'TOPIK_53' || type === 'TOPIK_54') {
        systemPrompt = basePrompt.replace('IELTS', 'TOPIK II Writing').replace('English', 'Korean') + `
PROMPT:
${prompt}

ESSAY (written in Korean):
${essay}

Grade objectively based on TOPIK II Writing criteria:
1. Grammar and vocabulary (Grammar and expression accuracy)
2. Task completion (Content and task fulfillment)
3. Organization (Coherence and structure)

Score from 0 to 100.

JSON Schema:
{
  "overallBand": 75,
  "criteria": {
    "grammarAndVocabulary": { "score": 75, "feedback": "Concise feedback" },
    "taskCompletion": { "score": 75, "feedback": "Concise feedback" },
    "organization": { "score": 75, "feedback": "Concise feedback" }
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

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ count: 0, limit: 15 })
    }

    const userId = session.user.email || session.user.id!
    const db = await getDb()
    const today = new Date().toLocaleDateString('en-CA')

    const usages = await db.select().from(apiUsages).where(sql`userId = ${userId} AND date = ${today}`)
    const count = usages[0]?.count || 0

    return NextResponse.json({ count, limit: 15 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ count: 0, limit: 15 })
  }
}
