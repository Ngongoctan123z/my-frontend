import Groq from 'groq-sdk'
import { getDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

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

async function sha256Hex(text: string) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function incrementGlobalCounter(apiKey: string) {
  try {
    const db = await getDb()
    const hash = await sha256Hex(apiKey)
    const keyUsageKey = `groq_usage_${hash.slice(0, 16)}`
    const configs = await db.select().from(systemConfigs)
    const keyConfig = configs.find(c => c.key === keyUsageKey)
    if (keyConfig) {
      await db.update(systemConfigs).set({ value: (parseInt(keyConfig.value) + 1).toString() }).where(eq(systemConfigs.key, keyUsageKey))
    } else {
      await db.insert(systemConfigs).values({ key: keyUsageKey, value: '1' })
    }
  } catch (e) {
    console.error(e)
  }
}

export async function tryGenerateWithFallback(systemPrompt: string, isJson: boolean = false, maxTokens: number = 8192): Promise<{ text: string, usedKey: string }> {
  const { apiKeys, models: modelsToTry } = await getGroqConfigFromDb()
  
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error('GROQ_API_KEY_MISSING')
  }

  // Cache to track rate-limited keys
  const globalAny = global as any
  if (!globalAny.keyCooldowns) {
    globalAny.keyCooldowns = {}
  }
  const keyCooldowns = globalAny.keyCooldowns

  let retryCount = 0
  const MAX_RETRIES = 3
  while (retryCount < MAX_RETRIES) {
    const shuffledKeys = [...apiKeys]
    for (let i = shuffledKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
    }

    const now = Date.now()
    let availableKeys = shuffledKeys.filter(k => !keyCooldowns[k] || now > keyCooldowns[k])
    
    // Nếu tất cả các key đều đang bị cooldown, thử vận may nghiệm thu lại tất cả
    if (availableKeys.length === 0) {
      availableKeys = shuffledKeys
    }

    for (const apiKey of availableKeys) {
      const groq = new Groq({ apiKey, maxRetries: 0, timeout: 15000 })

      for (const modelName of modelsToTry) {
        try {
          const response = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }],
            model: modelName,
            temperature: 0.2,
            max_tokens: maxTokens,
            response_format: isJson ? { type: 'json_object' } : { type: 'text' },
          })
          return { text: response.choices[0]?.message?.content || '', usedKey: apiKey }
        } catch (err: any) {
          const msg = (err.message || '').toLowerCase()

          if (msg.includes('safety') || msg.includes('blocked')) {
            throw err 
          }

          if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('429')) {
            // Đưa key này vào blacklist tạm thời trong 1 phút để các request sau không bị kẹt
            keyCooldowns[apiKey] = Date.now() + 60 * 1000;
            break 
          }

          if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes('api key not valid') || msg.includes('authentication')) {
             break 
          }

          continue
        }
      }
    }

    await delay(2000)
    retryCount++
  }
  throw new Error('model_exhausted')
}

export async function tryGenerateWithFallbackWrapped(systemPrompt: string, isJson: boolean = false, maxTokens: number = 8192): Promise<string> {
  const result = await tryGenerateWithFallback(systemPrompt, isJson, maxTokens)
  await incrementGlobalCounter(result.usedKey)
  return result.text
}

export async function gradeIeltsTask1(promptData: { content: string, imageUrl?: string, imageDescription?: string }, essay: string) {
  const basePrompt = `Bạn là giám khảo IELTS chuyên nghiệp, khách quan. Nhiệm vụ duy nhất của bạn là chấm bài viết của thí sinh theo đúng tiêu chí IELTS.
QUY TẮC BẮT BUỘC:
1. KHÔNG nói chuyện phiếm, KHÔNG xuất bất kỳ văn bản nào ngoài JSON.
2. Kết quả đầu ra PHẢI là một JSON object. Tất cả nhận xét phải bằng tiếng Việt.
`

  let imagePromptAddon = ''
  if (promptData.imageDescription) {
    imagePromptAddon = `\nĐÂY LÀ THÔNG SỐ CỦA HÌNH ẢNH BIỂU ĐỒ (Do người ra đề cung cấp để hỗ trợ chấm thi):\n${promptData.imageDescription}\n`
  }

  const systemPrompt = basePrompt + `
ĐỀ BÀI:
${promptData.content}
${imagePromptAddon}

BÀI VIẾT:
${essay}

Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 1:
1. Task Achievement (TA)
2. Coherence and Cohesion (CC)
3. Lexical Resource (LR)
4. Grammatical Range and Accuracy (GRA)

Thang điểm 0 - 9, làm tròn 0.5.

Cấu trúc JSON:
{
  "overall_band": 0,
  "criteria_scores": { "task_achievement": 0, "coherence_cohesion": 0, "lexical_resource": 0, "grammatical_range_accuracy": 0 },
  "feedback": "Nhận xét chi tiết bằng tiếng Việt.",
  "sample_essay": "Bài mẫu điểm 8.0+ bằng tiếng Anh."
}`

  const text = await tryGenerateWithFallbackWrapped(systemPrompt, true)
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText)
}

export async function gradeIeltsTask2(promptData: { content: string }, essay: string) {
  const basePrompt = `Bạn là giám khảo IELTS chuyên nghiệp.
QUY TẮC: Trả về 100% JSON object, tất cả nhận xét bằng tiếng Việt.
`

  const systemPrompt = basePrompt + `
ĐỀ BÀI:
${promptData.content}

BÀI VIẾT:
${essay}

Hãy chấm theo 4 tiêu chí IELTS Task 2. Thang 0-9.

Cấu trúc JSON:
{
  "overall_band": 0,
  "criteria_scores": { "task_response": 0, "coherence_cohesion": 0, "lexical_resource": 0, "grammatical_range_accuracy": 0 },
  "feedback": "Nhận xét chi tiết tiếng Việt.",
  "sample_essay": "Bài mẫu điểm 8.0+ tiếng Anh."
}`

  const text = await tryGenerateWithFallbackWrapped(systemPrompt, true)
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleanedText)
}

export async function gradeAnyExam(type: string, promptData: { content: string, imageUrl?: string, imageDescription?: string }, essay: string) {
  const basePrompt = `Bạn là giám khảo chuyên nghiệp, khách quan. Nhiệm vụ duy nhất của bạn là chấm bài viết của thí sinh theo đúng tiêu chí chấm điểm chính thức của kỳ thi.
QUY TẮC BẮT BUỘC:
1. KHÔNG ĐƯỢC nói chuyện phiếm. KHÔNG ĐƯỢC thêm lời chào hỏi hay dẫn nhập.
2. KHÔNG ĐƯỢC thêm các câu như "Đây là kết quả", "Được rồi", "Tôi sẽ đánh giá". KHÔNG ĐƯỢC xuất bất kỳ văn bản ngoài object JSON.
3. Chấm điểm công bằng, chính xác theo chuẩn quốc tế. Nhận xét phải xây dựng và khách quan.
4. Kết quả đầu ra PHẢI là JSON hợp lệ theo đúng schema.
5. Tiếng Việt phải được sử dụng cho feedback.

QUY TẮC NHẬN XÉT & SỬA LỖI (Mục "corrections"):
1. NẾU BÀI VIẾT ĐÃ TỐT (câu văn chuẩn xác, tự nhiên, ngữ pháp đúng): TUYỆT ĐỐI KHÔNG CẦN NHẬN XÉT SỬA CÂU, trả về "corrections": []. Không được cố tình tìm lỗi vặt khi bài đã tốt.
2. CHỈ đưa ra nhận xét sửa khi thực sự cần thiết, phân loại chính xác:
   - 'type': "Lỗi" -> CHỈ dùng cho lỗi sai ngữ pháp, chính tả, cấu trúc câu hoặc dùng từ sai nghĩa nghiêm trọng.
   - 'type': "Gợi ý" -> Dùng khi câu không sai ngữ pháp nhưng diễn đạt còn gượng hoặc lặp từ, gợi ý cách viết tự nhiên hơn.
   - 'type': "Nâng cao" -> Dùng khi câu thí sinh đã đúng và tốt, gợi ý cách viết xuất sắc C1-C2 / từ vựng học thuật đỉnh cao (VIP).
3. "original" PHẢI là nguyên văn chính xác từ bài làm. Không tự bịa.
4. Rà toàn bộ từng câu/đơn vị diễn đạt, liệt kê TẤT CẢ lỗi có thật, không giới hạn số mục corrections và không chỉ chọn lỗi tiêu biểu. Mỗi vị trí lỗi riêng biệt là một mục; không gộp lỗi độc lập hoặc bỏ lỗi lặp ở câu khác.
5. Nếu output dài, rút gọn explanation và bỏ gợi ý "Nâng cao" không thiết yếu trước; không lược bỏ lỗi thật. Nếu bài không có lỗi cần sửa, trả về corrections: [].
6. Chấm ngữ pháp và từ vựng theo mật độ, mức độ nghiêm trọng và tính lặp lại của lỗi so với độ dài bài; đánh giá riêng độ tự nhiên, trôi chảy, độ đa dạng và phù hợp của từ vựng. Hai bài tương đương nhưng một bài có khoảng 40 lỗi thay vì 10 lỗi phải có điểm ngôn ngữ thấp hơn, theo rubric chứ không quy đổi máy móc.`;

  let systemPrompt = '';
  const prompt = promptData.content;

  if (type === 'IELTS_TASK_2') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Hãy chấm điểm khách quan theo 4 tiêu chí IELTS Task 2. Thang 0-9. Cấu trúc JSON bắt buộc:
{ "overallBand": 0.0, "criteria": { "taskResponse": { "score": 0.0, "feedback": "" }, "coherenceCohesion": { "score": 0.0, "feedback": "" }, "lexicalResource": { "score": 0.0, "feedback": "" }, "grammaticalRange": { "score": 0.0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'IELTS_TASK_1') {
    const imagePromptAddon = promptData.imageDescription ? `\nĐÂY LÀ THÔNG SỐ CỦA HÌNH ẢNH BIỂU ĐỒ:\n${promptData.imageDescription}\n` : '';
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
${imagePromptAddon}
BÀI VIẾT:
${essay}
Hãy chấm điểm IELTS Task 1. Thang 0-9. Cấu trúc JSON bắt buộc:
{ "overallBand": 0.0, "criteria": { "taskResponse": { "score": 0.0, "feedback": "" }, "coherenceCohesion": { "score": 0.0, "feedback": "" }, "lexicalResource": { "score": 0.0, "feedback": "" }, "grammaticalRange": { "score": 0.0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'TOEIC_RESPOND') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Hãy chấm điểm TOEIC Writing câu 6-7 theo 4 tiêu chí chuẩn ETS (thang 0-4): taskFulfillment, organization, grammar, vocabulary. Nếu lạc đề hoặc chép đề, taskFulfillment = 0 và overallBand = 0. JSON:
{ "overallBand": 0, "criteria": { "taskFulfillment": { "score": 0, "feedback": "" }, "organization": { "score": 0, "feedback": "" }, "grammar": { "score": 0, "feedback": "" }, "vocabulary": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'TOEIC_ESSAY') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Hãy chấm điểm TOEIC Writing câu 8 theo 4 tiêu chí chuẩn ETS (thang 0-5): reasonsAndExamples, organization, grammar, vocabulary. Nếu lạc đề hoặc chép đề, reasonsAndExamples = 0 và overallBand = 0. JSON:
{ "overallBand": 0, "criteria": { "reasonsAndExamples": { "score": 0, "feedback": "" }, "organization": { "score": 0, "feedback": "" }, "grammar": { "score": 0, "feedback": "" }, "vocabulary": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'TOPIK_51_52' || type === 'TOPIK_51' || type === 'TOPIK_52') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Chấm TOPIK II Writing Câu 51-52. Thang 0-10. JSON:
{ "overallBand": 0, "criteria": { "taskCompletion": { "score": 0, "feedback": "" }, "grammarAndVocabulary": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'TOPIK_53') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Chấm TOPIK II Writing Câu 53. Thang 0-30. JSON:
{ "overallBand": 0, "criteria": { "contentAndTask": { "score": 0, "feedback": "" }, "structure": { "score": 0, "feedback": "" }, "languageUse": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type === 'TOPIK_54') {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Chấm TOPIK II Writing Câu 54. Thang 0-50. JSON:
{ "overallBand": 0, "criteria": { "contentAndTask": { "score": 0, "feedback": "" }, "structure": { "score": 0, "feedback": "" }, "languageUse": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else if (type.startsWith('HSK')) {
    systemPrompt = basePrompt + `
ĐỀ BÀI:
${prompt}
BÀI VIẾT:
${essay}
Chấm HSK Writing. Thang 0-100. JSON:
{ "overallBand": 0, "criteria": { "content": { "score": 0, "feedback": "" }, "grammar": { "score": 0, "feedback": "" }, "characters": { "score": 0, "feedback": "" } }, "detailedFeedback": "", "corrections": [
    { 
      "type": "Lỗi",
      "original": "câu sai", 
      "corrected": "câu đã sửa", 
      "explanation": "lý do ngắn gọn bằng tiếng Việt",
      "impact": "Ngữ pháp | Từ vựng | Cấu trúc | Yêu cầu đề bài | Không ảnh hưởng"
    }
  ] }`;
  } else {
    throw new Error('Unsupported exam type');
  }

  const text = await tryGenerateWithFallbackWrapped(systemPrompt, true);
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
}
