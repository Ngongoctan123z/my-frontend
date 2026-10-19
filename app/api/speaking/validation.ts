import { PAUSE_START_MS, type SpeakingDelivery } from '@/src/lib/speechDelivery'
import { SPEAKING_PARTS, type SpeakingExam, type SpeakingSubmissionItem, type SpeakingMetrics, type PracticePart } from '@/src/lib/speaking'

export class SpeakingRequestError extends Error {
  readonly retryable = false
  status: number
  retryAfterSeconds: number
  constructor(status: number, message: string, retryAfterSeconds = 0) { super(message); this.status = status; this.retryAfterSeconds = retryAfterSeconds }
}
export type SubmissionManifest = {
  clientSubmissionId: string; examType: SpeakingExam; fullTest: boolean
  mode: 'practice' | 'exam'; feedbackLang: 'Tiếng Việt' | 'English'; items: SpeakingSubmissionItem[]
}
const text = (value: unknown, max: number, required = false): string => {
  if (value === undefined && !required) return ''
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new SpeakingRequestError(400, 'Dữ liệu bài nói không hợp lệ.')
  return value.trim()
}
function deliveryData(value: any, totalMs: number): SpeakingDelivery | undefined {
  if(value === undefined)return undefined
  if(!value || typeof value.recognitionAvailable!=='boolean' || !Array.isArray(value.segments) || value.segments.length>120 || !Array.isArray(value.pauses) || value.pauses.length>120)throw new SpeakingRequestError(400,'Dữ liệu nhịp nói không hợp lệ.')
  let totalChars=0,lastAt=-1
  const segments=value.segments.map((row:any)=>{
    const content=text(row.text,2000,true);totalChars+=content.length
    if(totalChars>6000 || !Number.isFinite(row.atMs) || row.atMs<0 || row.atMs>totalMs || row.atMs<lastAt || typeof row.final!=='boolean')throw new SpeakingRequestError(400,'Mốc thời gian lời nói không hợp lệ.')
    lastAt=row.atMs;return {text:content,atMs:Math.round(row.atMs),final:row.final}
  })
  let lastEnd=0
  const pauses=value.pauses.map((row:any)=>{
    if(!Number.isFinite(row.startMs)||!Number.isFinite(row.durationMs)||row.startMs<lastEnd||row.durationMs<PAUSE_START_MS||row.startMs+row.durationMs>totalMs+1)throw new SpeakingRequestError(400,'Mốc ngừng nói không hợp lệ.')
    lastEnd=row.startMs+row.durationMs;return {startMs:Math.round(row.startMs),durationMs:Math.round(row.durationMs)}
  })
  return {recognitionAvailable:value.recognitionAvailable,segments,pauses}
}
export function validateManifest(body: any): SubmissionManifest {
  if (!body || !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(body.clientSubmissionId || '')) throw new SpeakingRequestError(400, 'Mã lần nộp không hợp lệ.')
  const examType = body.examType as SpeakingExam
  if (!SPEAKING_PARTS[examType] || !['practice', 'exam'].includes(body.mode) || !['Tiếng Việt', 'English'].includes(body.feedbackLang)) throw new SpeakingRequestError(400, 'Kỳ thi hoặc ngôn ngữ nhận xét không hợp lệ.')
  if (typeof body.fullTest !== 'boolean' || !Array.isArray(body.items) || !body.items.length || body.items.length > 15) throw new SpeakingRequestError(400, 'Danh sách câu hỏi không hợp lệ.')
  if (body.mode === 'exam' && !body.fullTest) throw new SpeakingRequestError(400, 'Thi thử cần một bộ đề trọn bộ.')
  const items: SpeakingSubmissionItem[] = body.items.map((item: any) => {
    const q = item?.question
    if (!q || q.examType !== examType || !SPEAKING_PARTS[examType].includes(q.part) || !Number.isInteger(q.questionNumber) || q.questionNumber < 1 || q.questionNumber > 20) throw new SpeakingRequestError(400, 'Phần hoặc số câu hỏi không hợp lệ.')
    if (!/^[a-f\d]{64}$/i.test(item.audioHash || '')) throw new SpeakingRequestError(400, 'Bản thu chưa được kiểm tra. Vui lòng thử nộp lại.')
    const m = item.metrics as SpeakingMetrics
    if (!m || !Number.isFinite(m.totalDurationMs) || m.totalDurationMs < 1000 || m.totalDurationMs > 300_500
      || !Number.isFinite(m.speechDurationMs) || m.speechDurationMs < 0 || m.speechDurationMs > m.totalDurationMs
      || !Number.isFinite(m.totalPauseSec) || m.totalPauseSec < 0 || m.totalPauseSec > m.totalDurationMs / 1000 + 1
      || ![m.pauseCount, m.longPauseCount].every(n => Number.isInteger(n) && n >= 0 && n <= 1000)) throw new SpeakingRequestError(400, 'Bản thu quá ngắn hoặc thống kê thời gian không hợp lệ.')
    const part = q.part as PracticePart
    const speakTimeSec = part === 'PART_2' ? 120 : part === 'PART_3' ? 60 : part === 'PART_1' ? (body.fullTest ? 40 : 45)
      : part === 'Q1_2' ? 45 : part === 'Q3_4' ? 30 : part === 'Q11' ? 60 : q.questionNumber === 7 || q.questionNumber === 10 ? 30 : 15
    if (body.mode === 'exam' && m.totalDurationMs > speakTimeSec * 1000 + 5000) throw new SpeakingRequestError(400, 'Thời lượng bản thu vượt thời gian câu thi thử.')
    const imageUrl = text(q.imageUrl, 2048)
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) throw new SpeakingRequestError(400, 'Địa chỉ ảnh đề bài không hợp lệ.')
    return {
      audioHash: item.audioHash.toLowerCase(),
      delivery: deliveryData(item.delivery,m.totalDurationMs),
      metrics: { totalDurationMs: Math.round(m.totalDurationMs), speechDurationMs: Math.round(m.speechDurationMs), pauseCount: m.pauseCount, longPauseCount: m.longPauseCount, totalPauseSec: m.totalPauseSec, signalDetected: !!m.signalDetected },
      question: { id: text(q.id, 160, true), examType, part, questionNumber: q.questionNumber,
        topic: text(q.topic, 160, true), questionEn: text(q.questionEn, 6500, true), questionVi: text(q.questionVi, 6500),
        cueCard: text(q.cueCard, 3000) || undefined, informationText: text(q.informationText, 8000) || undefined,
        imageUrl: imageUrl || undefined, prepTimeSec: part === 'PART_2' ? 60 : ['Q1_2', 'Q3_4', 'Q11'].includes(part) ? 45 : part.startsWith('Q') ? 3 : 0,
        speakTimeSec, startGraceSec: 0, criteria: [], difficulty: 'medium',
        readingTimeSec: part === 'Q8_10' && q.questionNumber === 8 ? 45 : 0,
        repeatQuestion: part === 'Q8_10' && q.questionNumber === 10,
      },
    }
  })
  if (new Set(items.map(i => i.question.id)).size !== items.length) throw new SpeakingRequestError(400, 'Danh sách có câu hỏi trùng nhau.')
  if (body.fullTest) {
    if (items.some((item, index) => item.question.questionNumber !== index + 1)) throw new SpeakingRequestError(400, 'Thứ tự câu hỏi trọn bộ không hợp lệ.')
    if (examType === 'TOEIC_SPEAKING') {
      const expected = ['Q1_2', 'Q1_2', 'Q3_4', 'Q3_4', 'Q5_7', 'Q5_7', 'Q5_7', 'Q8_10', 'Q8_10', 'Q8_10', 'Q11']
      if (items.length !== 11 || items.some((item, index) => item.question.part !== expected[index])) throw new SpeakingRequestError(400, 'TOEIC Speaking trọn bộ cần đủ 11 câu đúng thứ tự.')
    } else {
      const parts = items.map(item => item.question.part)
      if (parts.filter(p => p === 'PART_1').length < 4 || parts.filter(p => p === 'PART_2').length !== 1 || parts.filter(p => p === 'PART_3').length < 3
        || parts.join(',') !== [...parts].sort().join(',')) throw new SpeakingRequestError(400, 'Bộ IELTS cần đủ các câu Part 1, cue card Part 2 và phần thảo luận Part 3.')
    }
  } else if (new Set(items.map(i => i.question.part)).size !== 1) throw new SpeakingRequestError(400, 'Bài luyện từng phần chỉ gồm một dạng câu hỏi.')
  if (JSON.stringify(items).length > 110_000) throw new SpeakingRequestError(413, 'Nội dung bộ đề quá lớn.')
  return { clientSubmissionId: body.clientSubmissionId, examType, mode: body.mode, fullTest: body.fullTest, feedbackLang: body.feedbackLang, items }
}
