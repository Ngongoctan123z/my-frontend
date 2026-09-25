import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Danh sách model ưu tiên, thử từ trên xuống
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash', 
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

async function tryGenerateWithFallback(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  
  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (err: any) {
      const msg = err.message || ''
      // Nếu lỗi do model không tồn tại hoặc bị khai tử → thử model tiếp theo
      if (msg.includes('not found') || msg.includes('no longer available') || msg.includes('404') || msg.includes('is not available')) {
        continue
      }
      // Lỗi khác (key sai, quota hết, ...) → throw ngay, không cần thử tiếp
      throw err
    }
  }
  
  throw new Error('MODEL_EXHAUSTED')
}

export async function POST(req: NextRequest) {
  try {
    const { action, type, prompt, essay } = await req.json()

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

      const text = await tryGenerateWithFallback(apiKey, systemPrompt)

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
      const { vietnameseText, contextText, userTranslation, level } = await req.json()
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
      const text = await tryGenerateWithFallback(apiKey, systemPrompt)

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

    // Lỗi chung - KHÔNG trả raw error message ra ngoài
    console.error('[AI-Grader] Unhandled error:', error.message)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
