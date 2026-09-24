import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { action, type, prompt, essay } = await req.json()

    // Accept API key from client header, fallback to server env
    const clientKey = req.headers.get('x-gemini-key')
    const apiKey = clientKey || process.env.GEMINI_API_KEY || ''

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vui lòng nhập API Key của bạn để sử dụng tính năng này.' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

    if (action === 'generate_prompt') {
      let systemPrompt = ''
      if (type === 'IELTS_TASK_2') {
        systemPrompt = `You are an IELTS Academic exam writer. Generate 1 random IELTS Writing Task 2 question (choose randomly from: Discuss both views, To what extent do you agree, Problems and Solutions, or Advantages and Disadvantages). Only return the English question text, nothing else.`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `You are a TOEIC Writing exam writer. Generate 1 random TOEIC Writing Question 8 (Opinion Essay) question. Only return the English question text, nothing else.`
      }

      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      const text = response.text()

      return NextResponse.json({ text })
    }

    if (action === 'grade_essay') {
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
      }

      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      const text = response.text()

      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch {
        console.error('Failed to parse Gemini response:', text)
        return NextResponse.json(
          { error: 'Hệ thống trả về kết quả không hợp lệ. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 })

  } catch (error: any) {
    console.error('AI Grader Error:', error)

    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      return NextResponse.json(
        { error: 'API Key không hợp lệ. Vui lòng kiểm tra lại key Gemini của bạn.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
