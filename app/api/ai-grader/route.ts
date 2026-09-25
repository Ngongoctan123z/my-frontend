import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'



const MODEL_CANDIDATES = [
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

async function tryGenerateWithFallback(apiKey: string, prompt: string, isJson: boolean = false): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastSignificantError: any = null
  
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase()
      
      // Nếu API Key sai hoàn toàn thì dừng luôn
      if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes('api key not valid')) {
        throw err
      }
      
      // Lưu lại các lỗi quan trọng (như Quota hoặc blocked) để hiển thị cho user nếu tất cả model đều xịt,
      // thay vì hiển thị lỗi "404 Not found" của những model thử nghiệm cuối cùng.
      if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('safety') || msg.includes('blocked')) {
        lastSignificantError = err
      }

      if (modelName === MODEL_CANDIDATES[MODEL_CANDIDATES.length - 1]) {
        throw lastSignificantError || err
      }
      continue
    }
  }
  
  throw new Error('MODEL_EXHAUSTED')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, type, prompt, essay } = body

    const clientKey = req.headers.get('x-gemini-key')
    const apiKey = clientKey || process.env.GEMINI_API_KEY || ''

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vui lòng nhập API Key Gemini để sử dụng tính năng này.' },
        { status: 400 }
      )
    }

    if (action === 'generate_prompt') {
      let systemPrompt = ''
      if (type === 'IELTS_TASK_2') {
        systemPrompt = `You are an IELTS Academic exam writer. Generate 1 random IELTS Writing Task 2 question (choose randomly from: Discuss both views, To what extent do you agree, Problems and Solutions, or Advantages and Disadvantages). Only return the English question text, nothing else.`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `You are a TOEIC Writing exam writer. Generate 1 random TOEIC Writing Question 8 (Opinion Essay) question. Only return the English question text, nothing else.`
      } else {
        return NextResponse.json({ error: 'Loại đề thi không hợp lệ.' }, { status: 400 })
      }

      const text = await tryGenerateWithFallback(apiKey, systemPrompt)
      return NextResponse.json({ text })
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        return NextResponse.json({ error: 'Thiếu đề bài hoặc bài làm.' }, { status: 400 })
      }

      let systemPrompt = ''

      if (type === 'IELTS_TASK_2') {
        systemPrompt = `
You are a strict IELTS Writing Task 2 examiner. Grade the following essay.

PROMPT:
${prompt}

ESSAY:
${essay}

Grade strictly using these 4 IELTS criteria:
1. Task Response (TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Each criterion is scored from 0 to 9 in 0.5 increments. The overall band is the average rounded to nearest 0.5.

Return ONLY valid JSON (no markdown, no backticks):
{
  "overallBand": 6.5,
  "criteria": {
    "taskResponse": { "score": 6.5, "feedback": "..." },
    "coherence": { "score": 6.0, "feedback": "..." },
    "lexical": { "score": 7.0, "feedback": "..." },
    "grammar": { "score": 6.5, "feedback": "..." }
  },
  "detailedFeedback": "Overall analysis in Vietnamese...",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "reason in Vietnamese" }
  ]
}
Be very strict. Identify grammar errors, vocabulary issues, and logical flaws clearly. Write all feedback in Vietnamese.
`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `
You are a strict TOEIC Writing examiner grading an Opinion Essay (Question 8).

PROMPT:
${prompt}

ESSAY:
${essay}

Grade using these 4 criteria on a scale of 0-5:
1. Grammar
2. Vocabulary
3. Organization
4. Reasons & Examples

Then convert to a TOEIC Writing score (0-200).

Return ONLY valid JSON (no markdown, no backticks):
{
  "overallBand": "4/5 (150/200)",
  "criteria": {
    "taskResponse": { "score": 4, "feedback": "Organization feedback..." },
    "coherence": { "score": 4, "feedback": "Reasons & Examples feedback..." },
    "lexical": { "score": 3, "feedback": "Vocabulary feedback..." },
    "grammar": { "score": 4, "feedback": "Grammar feedback..." }
  },
  "detailedFeedback": "Overall analysis in Vietnamese...",
  "corrections": [
    { "original": "wrong sentence", "corrected": "correct sentence", "explanation": "reason in Vietnamese" }
  ]
}
Be very strict. Write all feedback in Vietnamese.
`
      } else {
        return NextResponse.json({ error: 'Loại đề thi không hợp lệ.' }, { status: 400 })
      }

      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)

      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json(
          { error: 'Kết quả trả về không đúng định dạng. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    if (action === 'generate_paraphrase_prompt') {
      const { topic, level } = body
      if (!topic || !level) {
        return NextResponse.json({ error: 'Thiếu thông tin chủ đề hoặc trình độ.' }, { status: 400 })
      }

      const systemPrompt = `
You are an expert language teacher. 
Generate ONE random Vietnamese sentence (and its short context) for a student to practice translating into English at CEFR level ${level}.
Topic: ${topic}.
The sentence should be natural in Vietnamese and appropriate for someone learning English at ${level} level.

Return ONLY valid JSON (no markdown, no backticks, no markdown formatting):
{
  "vietnameseText": "Một câu tiếng Việt tự nhiên liên quan đến chủ đề.",
  "context": "Ngữ cảnh ngắn gọn (VD: Nói với bạn bè, Trong cuộc họp, ...)"
}
`
      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)

      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json(
          { error: 'Kết quả trả về không đúng định dạng. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    if (action === 'grade_paraphrase') {
      const { vietnameseText, contextText, userTranslation, level } = body
      if (!vietnameseText || !userTranslation) {
        return NextResponse.json({ error: 'Thiếu câu gốc hoặc câu dịch.' }, { status: 400 })
      }

      const systemPrompt = `
You are a very strict English teacher grading a student's translation/paraphrase from Vietnamese to English.
Level target: CEFR ${level}.
Vietnamese sentence to translate: "${vietnameseText}"
Context: "${contextText}"
Student's English sentence: "${userTranslation}"

Evaluate the student's translation strictly based on:
1. Accuracy (meaning preservation).
2. Naturalness and flow (is it idiomatic?).
3. Grammatical correctness.
4. Appropriateness for the target CEFR level (${level}).

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 7.5, // out of 10
  "feedback": "Strict feedback in Vietnamese analyzing grammar, vocabulary, and meaning.",
  "corrections": [
    { "original": "wrong part", "corrected": "better part", "explanation": "reason in Vietnamese" }
  ],
  "betterAlternatives": [
    "Alternative way to say it naturally 1",
    "Alternative way to say it naturally 2"
  ]
}
`
      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)

      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json(
          { error: 'Kết quả trả về không đúng định dạng. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    if (action === 'translate') {
      const { textToTranslate, direction } = body
      if (!textToTranslate) {
        return NextResponse.json({ error: 'Thiếu nội dung cần dịch.' }, { status: 400 })
      }

      const dirContext = direction === 'en-vi' ? 'English to Vietnamese' : 'Vietnamese to English'
      
      const systemPrompt = `
You are a professional translator and linguist. 
Translate the following text from ${dirContext}.

TEXT TO TRANSLATE:
"${textToTranslate}"

Analyze and provide the translation strictly in JSON format (no markdown):
{
  "translatedText": "The direct translation",
  "nuances": "Explanation of cultural/linguistic nuances in Vietnamese",
  "alternativeTranslations": ["Alternative 1", "Alternative 2"],
  "vocabulary": [
    { "word": "word", "meaning": "meaning", "example": "example usage" }
  ]
}
`
      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)
      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return NextResponse.json(JSON.parse(cleanedText))
      } catch {
        return NextResponse.json({ error: 'Lỗi định dạng trả về.' }, { status: 500 })
      }
    }

    if (action === 'grammar_check') {
      const { textToCheck } = body
      if (!textToCheck) {
        return NextResponse.json({ error: 'Thiếu nội dung cần soi lỗi.' }, { status: 400 })
      }

      const systemPrompt = `
You are an extremely strict English grammar nazi and writing coach.
Analyze the following English text for ANY grammar, vocabulary, or stylistic errors. Be very harsh.

TEXT TO CHECK:
"${textToCheck}"

Provide your feedback strictly in JSON format (no markdown):
{
  "overallComment": "Harsh overall feedback in Vietnamese",
  "errorsFound": 5,
  "corrections": [
    { "original": "wrong part", "corrected": "fixed part", "explanation": "Detailed harsh explanation in Vietnamese", "type": "Grammar/Vocabulary/Style" }
  ],
  "rewrittenText": "The completely rewritten, perfect version of the text"
}
`
      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)
      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return NextResponse.json(JSON.parse(cleanedText))
      } catch {
        return NextResponse.json({ error: 'Lỗi định dạng trả về.' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })

  } catch (error: any) {
    const msg = (error.message || '').toLowerCase()

    // API Key không hợp lệ
    if (msg.includes('api_key_invalid') || msg.includes('api key not valid') || msg.includes('permission_denied')) {
      return NextResponse.json(
        { error: 'API Key không hợp lệ hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại.' },
        { status: 401 }
      )
    }

    // Hết quota
    if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
      return NextResponse.json(
        { error: 'API Key đã hết lượt sử dụng miễn phí. Vui lòng đợi hoặc dùng key khác.' },
        { status: 429 }
      )
    }

    // Tất cả model đều không khả dụng
    if (msg.includes('model_exhausted')) {
      return NextResponse.json(
        { error: 'Tất cả phiên bản xử lý đều đang bảo trì. Vui lòng thử lại sau.' },
        { status: 503 }
      )
    }

    // Nội dung bị chặn bởi safety filter
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harm')) {
      return NextResponse.json(
        { error: 'Nội dung bài viết bị từ chối do vi phạm chính sách an toàn.' },
        { status: 400 }
      )
    }

    // Timeout
    if (msg.includes('timeout') || msg.includes('deadline')) {
      return NextResponse.json(
        { error: 'Hệ thống xử lý quá lâu. Vui lòng thử lại.' },
        { status: 504 }
      )
    }

    // Lỗi chung - trả raw error ra để debug
    console.error('[AI-Grader] Unhandled error:', error.message)
    return NextResponse.json(
      { error: 'Hệ thống AI đang bận hoặc gặp sự cố kết nối. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
