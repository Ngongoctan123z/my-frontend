import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Google Generative AI with the API key from env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { action, type, prompt, essay } = await req.json()
    
    // Check if API key is provided
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trên Server.' },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    if (action === 'generate_prompt') {
      let systemPrompt = ''
      if (type === 'IELTS_TASK_2') {
        systemPrompt = `Bạn là một chuyên gia ra đề IELTS Academic. Hãy tạo ra 1 đề bài Writing Task 2 ngẫu nhiên (dạng Discuss both views, To what extent do you agree, Problems and Solutions, hoặc Advantages and Disadvantages). Chỉ trả về nội dung tiếng Anh của đề bài, không giải thích gì thêm.`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `Bạn là một chuyên gia ra đề TOEIC Writing. Hãy tạo ra 1 đề bài TOEIC Writing (Question 8: Write an opinion essay) ngẫu nhiên. Chỉ trả về nội dung tiếng Anh của đề bài, không giải thích gì thêm.`
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
Bạn là một giám khảo IELTS khắt khe chấm bài Writing Task 2.
Đề bài (Prompt):
${prompt}

Bài viết (Essay):
${essay}

Hãy chấm điểm bài viết trên theo 4 tiêu chí của IELTS:
1. Task Response (TR)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Yêu cầu định dạng Output (PHẢI TRẢ VỀ CHÍNH XÁC JSON NÀY, không markdown block \`\`\`json):
{
  "overallBand": 6.5,
  "criteria": {
    "taskResponse": { "score": 6.5, "feedback": "..." },
    "coherence": { "score": 6.0, "feedback": "..." },
    "lexical": { "score": 7.0, "feedback": "..." },
    "grammar": { "score": 6.5, "feedback": "..." }
  },
  "detailedFeedback": "Nhận xét tổng quan và phân tích chi tiết...",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đúng", "explanation": "lý do sửa" }
  ]
}
Chấm gắt gao, chỉ ra lỗi sai ngữ pháp, từ vựng và tư duy logic rõ ràng. Ngôn ngữ phản hồi bằng Tiếng Việt.
`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `
Bạn là một giám khảo TOEIC Writing khắt khe chấm câu hỏi Opinion Essay.
Đề bài (Prompt):
${prompt}

Bài viết (Essay):
${essay}

Hãy chấm điểm bài viết TOEIC trên thang điểm từ 0 đến 5 (sau đó quy đổi ra điểm TOEIC Writing tổng 0-200).
Tiêu chí chấm:
1. Grammar
2. Vocabulary
3. Organization
4. Reasons & Examples

Yêu cầu định dạng Output (PHẢI TRẢ VỀ CHÍNH XÁC JSON NÀY, không markdown block \`\`\`json):
{
  "overallBand": "4/5 (150/200 điểm)",
  "criteria": {
    "taskResponse": { "score": 4, "feedback": "Nhận xét về Organization..." },
    "coherence": { "score": 4, "feedback": "Nhận xét về Reasons & Examples..." },
    "lexical": { "score": 3, "feedback": "Nhận xét về Vocabulary..." },
    "grammar": { "score": 4, "feedback": "Nhận xét về Grammar..." }
  },
  "detailedFeedback": "Nhận xét tổng quan...",
  "corrections": [
    { "original": "câu sai", "corrected": "câu đúng", "explanation": "lý do sửa" }
  ]
}
Chấm gắt gao. Ngôn ngữ phản hồi bằng Tiếng Việt.
`
      }

      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      const text = response.text()
      
      // Attempt to parse JSON from the text
      try {
        // Strip markdown backticks if the model accidentally included them
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanedText)
        return NextResponse.json(parsed)
      } catch (err) {
        console.error('Error parsing JSON from Gemini', text)
        return NextResponse.json(
          { error: 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('AI Grader API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Đã xảy ra lỗi hệ thống.' },
      { status: 500 }
    )
  }
}
