import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
]

async function tryGenerateWithFallback(apiKey: string, prompt: string, isJson: boolean = false): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastSignificantError: any = null

  const MAX_RETRIES = 2
  for (let loop = 0; loop < MAX_RETRIES; loop++) {
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
      } catch (err: any) {
        const msg = (err.message || '').toLowerCase()

        if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes('api key not valid')) {
          throw err
        }

        if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('safety') || msg.includes('blocked')) {
          throw err
        }

        lastSignificantError = err
        continue
      }
    }
  }

  throw new Error('MODEL_EXHAUSTED')
}

export async function callAiGraderClient(body: any, apiKey: string) {
  try {
    const { action, type, prompt, essay, topic, level, vietnameseText, contextText, userTranslation, textToTranslate, direction, textToCheck } = body

    if (!apiKey) {
      throw new Error('Vui lòng nhập API Key Gemini để sử dụng tính năng này.')
    }

    if (action === 'generate_prompt') {
      let systemPrompt = ''
      if (type === 'IELTS_TASK_2') {
        systemPrompt = `You are an IELTS Academic exam writer. Generate 1 random IELTS Writing Task 2 question (choose randomly from: Discuss both views, To what extent do you agree, Problems and Solutions, or Advantages and Disadvantages). Only return the English question text, nothing else.`
      } else if (type === 'TOEIC_ESSAY') {
        systemPrompt = `You are a TOEIC Writing exam writer. Generate 1 random TOEIC Writing Question 8 (Opinion Essay) question. Only return the English question text, nothing else.`
      } else {
        throw new Error('Loại đề thi không hợp lệ.')
      }
      const text = await tryGenerateWithFallback(apiKey, systemPrompt)
      return { text }
    }

    if (action === 'grade_essay') {
      if (!prompt || !essay) {
        throw new Error('Thiếu đề bài hoặc bài làm.')
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
        throw new Error('Loại đề thi không hợp lệ.')
      }

      const text = await tryGenerateWithFallback(apiKey, systemPrompt, true)
      try {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(cleanedText)
      } catch {
        throw new Error('Kết quả trả về không đúng định dạng. Vui lòng thử lại.')
      }
    }

    if (action === 'generate_paraphrase_prompt') {
      if (!topic || !level) {
        throw new Error('Thiếu thông tin chủ đề hoặc trình độ.')
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
        return JSON.parse(cleanedText)
      } catch {
        throw new Error('Kết quả trả về không đúng định dạng. Vui lòng thử lại.')
      }
    }

    if (action === 'grade_paraphrase') {
      if (!vietnameseText || !userTranslation) {
        throw new Error('Thiếu câu gốc hoặc câu dịch.')
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
        return JSON.parse(cleanedText)
      } catch {
        throw new Error('Kết quả trả về không đúng định dạng. Vui lòng thử lại.')
      }
    }

    if (action === 'translate') {
      if (!textToTranslate) {
        throw new Error('Thiếu nội dung cần dịch.')
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
        return JSON.parse(cleanedText)
      } catch {
        throw new Error('Lỗi định dạng trả về.')
      }
    }

    if (action === 'grammar_check') {
      if (!textToCheck) {
        throw new Error('Thiếu nội dung cần soi lỗi.')
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
        return JSON.parse(cleanedText)
      } catch {
        throw new Error('Lỗi định dạng trả về.')
      }
    }

    throw new Error('Yêu cầu không hợp lệ.')

  } catch (error: any) {
    const msg = (error.message || '').toLowerCase()

    if (msg.includes('api_key_invalid') || msg.includes('permission_denied')) {
      throw new Error('API Key không hợp lệ hoặc bị từ chối truy cập. Vui lòng kiểm tra lại.')
    }
    if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
      throw new Error('API Key đã hết lượt sử dụng miễn phí. Vui lòng đợi hoặc dùng key khác.')
    }
    if (msg.includes('model_exhausted')) {
      throw new Error('Tất cả phiên bản AI đều đang bận. Vui lòng thử lại sau.')
    }
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harm')) {
      throw new Error('Nội dung bị từ chối do vi phạm chính sách an toàn của Google.')
    }

    console.error('[AI-Grader Client] Unhandled error:', error.message)
    throw new Error(`Hệ thống AI đang bận hoặc gặp sự cố: ${error.message}`)
  }
}
