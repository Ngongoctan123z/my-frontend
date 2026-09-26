import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'



const MODEL_CANDIDATES = [
  // Gemini 3.8 - mới nhất, GA
  'gemini-3.8-flash',

  // Gemini 3.5 - GA, ổn định
  'gemini-3.5-flash',

  // Gemini 3.1 - stable
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',

  // Gemini 3 - vẫn còn preview, docs mặc định dùng cái này
  'gemini-3-flash-preview',

  // Gemini 2.5 - stable, có free tier + free Google Search grounding
  // ⚠️ SẼ BỊ TẮT 16/10/2026 - còn chưa tới 3 tuần nữa!
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
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

      const randomSeed = Math.floor(Math.random() * 9999999);
      const systemPrompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo viên tiếng Anh xuất sắc. (Random Seed: ${randomSeed})
Hãy tạo ra MỘT câu tiếng Việt duy nhất (kèm theo ngữ cảnh ngắn gọn) để học sinh luyện dịch sang tiếng Anh ở trình độ CEFR ${level}.
Chủ đề: ${topic}.

YÊU CẦU QUAN TRỌNG:
1. Đa dạng hóa tình huống: Hãy tưởng tượng các tình huống vô cùng phong phú trong đời sống thực tế tại Việt Nam (công sở, trường học, gia đình, thời sự, khoa học...). Không lặp lại các lối mòn nhàm chán.
2. Văn phong chuẩn Việt: Câu tiếng Việt phải hoàn toàn tự nhiên, đúng ngữ pháp và cách diễn đạt của người Việt Nam. KHÔNG dịch word-by-word từ tiếng Anh sang tiếng Việt. KHÔNG cố nhồi nhét từ lóng (slang) không cần thiết.
3. Độ khó phù hợp: Từ vựng và cấu trúc ngữ pháp cần dịch sang tiếng Anh phải tương xứng với trình độ ${level}.
4. Ngữ cảnh rõ ràng: Chỉ ra ai đang nói, với ai, hoặc diễn ra trong hoàn cảnh cụ thể nào để học sinh chọn từ vựng tiếng Anh cho đúng sắc thái (trang trọng hay thân mật).

Return ONLY valid JSON (no markdown, no backticks, no markdown formatting):
{
  "vietnameseText": "Câu tiếng Việt tự nhiên, đa dạng liên quan đến chủ đề.",
  "context": "Ngữ cảnh cụ thể (Ví dụ: Trong một cuộc họp ban giám đốc bàn về doanh thu, Một thông báo của nhà trường, Hai đồng nghiệp đang bàn về dự án mới, ...)"
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
Bạn là một chuyên gia ngôn ngữ và giám khảo chấm thi tiếng Anh quốc tế cực kỳ chuyên nghiệp và chuẩn xác.
Nhiệm vụ của bạn là đánh giá câu dịch của học sinh từ tiếng Việt sang tiếng Anh.
Trình độ mục tiêu: CEFR ${level}.
Câu tiếng Việt gốc: "${vietnameseText}"
Ngữ cảnh: "${contextText}"
Câu dịch của học sinh: "${userTranslation}"

Hãy chấm điểm (trên thang điểm 10) và nhận xét câu dịch của học sinh dựa trên các tiêu chí sau:
1. Accuracy (Độ chính xác về ý nghĩa): Học sinh có truyền tải đúng và đủ ý của câu gốc không?
2. Grammar & Vocabulary (Ngữ pháp & Từ vựng): Có sai sót ngữ pháp nào không? Có sử dụng từ vựng chính xác trong ngữ cảnh không?
3. Naturalness (Độ tự nhiên): Câu dịch có giống cách người bản xứ nói/viết không, hay bị dịch word-by-word?
4. Sắc thái (Register/Tone): Có phù hợp với ngữ cảnh đã cho không? Trình độ từ vựng có tương xứng với mức ${level} không?

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": 8.5,
  "feedback": "Nhận xét chuyên sâu, phân tích rõ ràng và chuyên nghiệp bằng tiếng Việt. Chỉ ra điểm tốt và điểm cần cải thiện.",
  "corrections": [
    { "original": "cụm từ sai hoặc chưa hay của học sinh", "corrected": "cụm từ đúng", "explanation": "Giải thích chi tiết tại sao lại sửa như vậy" }
  ],
  "betterAlternatives": [
    "Một câu gợi ý dịch hoàn toàn tự nhiên, chuẩn bản xứ (cách 1)",
    "Một câu gợi ý dịch theo cấu trúc hoặc từ vựng cao cấp hơn phù hợp với trình độ ${level} (cách 2)"
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

    // API Key không hợp lệ / sai loại xác thực
    if (
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('permission_denied') ||
      msg.includes('unauthorized') ||
      msg.includes('access_token_type_unsupported') ||
      msg.includes('invalid authentication') ||
      msg.includes('401')
    ) {
      return NextResponse.json(
        { error: 'API Key không hợp lệ hoặc sai loại. Vui lòng vào Google AI Studio để lấy đúng API Key (không phải OAuth token).' },
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
      { error: `Hệ thống AI đang bận hoặc gặp sự cố: ${error.message}` },
      { status: 500 }
    )
  }
}
