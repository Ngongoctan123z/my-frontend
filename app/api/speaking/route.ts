import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { checkRateLimit } from '@/src/lib/rateLimit'
import { KeyPoolExhaustedError } from '@/src/lib/aiKeyRotation'
import { canonicalPart, hashSpeakingAudio, type SpeakingExam, type SpeakingReport } from '@/src/lib/speaking'
import { SpeakingStore, type SpeakingD1 } from './store'
import { SpeakingRequestError, validateManifest } from './validation'
import { loadSpeakingCatalog } from './catalog'
import { persistSpeakingAudio } from './audio'
import { speakingConfig, transcribeSpeakingAudio, gradeSpeakingAudio, speakingCoachReply } from './providers'

async function account() {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) throw new SpeakingRequestError(401, 'Vui lòng đăng nhập để nộp và lưu bài nói.')
  return email
}
function responseError(error: unknown) {
  if (error instanceof SpeakingRequestError) return NextResponse.json({ error: error.message }, { status: error.status, headers: error.retryAfterSeconds ? { 'Retry-After': String(error.retryAfterSeconds) } : undefined })
  if (error instanceof KeyPoolExhaustedError) return NextResponse.json({ error: 'Dịch vụ AI đang chạm giới hạn. Bản thu vẫn được giữ; vui lòng thử lại sau.' }, { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } })
  const message = error instanceof Error ? error.message : ''
  console.error('[Speaking] Request failed:', /GROQ_API_KEY_MISSING|API_KEY_INVALID/.test(message) ? 'provider_configuration' : 'processing_error')
  return NextResponse.json({ error: /GROQ_API_KEY_MISSING|API_KEY_INVALID/.test(message) ? 'Dịch vụ Speaking chưa có API key hợp lệ. Vui lòng liên hệ quản trị viên.' : 'Chưa xử lý được bài nói. Bản thu vẫn được giữ để bạn gửi lại.' }, { status: 503 })
}
function rateLimit(email: string, action: string, max: number, windowMs: number) {
  const result = checkRateLimit(`speaking:v2:${action}:${email}`, max, windowMs)
  if (!result.allowed) throw new SpeakingRequestError(429, `Thao tác quá nhanh. Vui lòng chờ ${result.retryAfterSeconds} giây.`, result.retryAfterSeconds)
}
async function boundedBody(req: Request, limit: number) {
  const length = Number(req.headers.get('content-length'))
  if (Number.isFinite(length) && length > limit) throw new SpeakingRequestError(413, 'Bản thu hoặc dữ liệu gửi lên quá lớn.')
  const reader = req.body?.getReader()
  if (!reader) throw new SpeakingRequestError(400, 'Không có dữ liệu bài nói.')
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) { await reader.cancel(); throw new SpeakingRequestError(413, 'Bản thu hoặc dữ liệu gửi lên quá lớn.') }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}
async function jsonBody(req: Request) {
  try { return JSON.parse(new TextDecoder().decode(await boundedBody(req, 200_000))) }
  catch (error) { if (error instanceof SpeakingRequestError) throw error; throw new SpeakingRequestError(400, 'Dữ liệu JSON không hợp lệ.') }
}
async function legacyReports(client: SpeakingD1, email: string): Promise<SpeakingReport[]> {
  try {
    const { results } = await client.prepare('SELECT * FROM speaking_session WHERE email=? ORDER BY createdAt DESC LIMIT 20').bind(email).all()
    return results.flatMap(row => {
      try {
        const result = JSON.parse(row.aiResult || '{}'), metrics = JSON.parse(row.fluencyData || '{}')
        const part = canonicalPart(row.part)
        const question = { id: row.id, examType: row.examType, part, questionNumber: ({ Q1_2: 1, Q3_4: 3, Q5_7: 5, Q8_10: 8, Q11: 11 } as Record<string, number>)[part] || 1, topic: 'Bài luyện trước đây', questionEn: row.promptEn, questionVi: row.promptVi || '', prepTimeSec: 0, speakTimeSec: 45, startGraceSec: 0, criteria: [], difficulty: 'medium' as const }
        return [{ id: `legacy:${row.id}`, examType: row.examType, mode: 'practice' as const, fullTest: false, feedbackLang: 'Tiếng Việt', createdAt: row.createdAt, status: 'completed', items: [{ id: row.id, question, status: 'completed', result: {
          valid: true as const, assessmentStatus: 'content_only' as const, transcript: row.transcript || '', feedback: result.feedback_vi || 'Bài luyện đã lưu từ phiên bản trước.', strengths: result.strengths_vi || '', issues: [], criteria: [], score: null,
          pronunciationNote: 'Kết quả được lưu từ phiên bản Speaking trước.', fluency: { wordsPerMinute: metrics.wpm || 0, fillerCount: metrics.fillerCount || 0, repetitionCount: metrics.repetitionCount || 0, longPauseCount: metrics.longPauseCount || 0, speechSeconds: Math.round((metrics.speechDurationMs || 0) / 1000) },
        } }] }]
      } catch { return [] }
    })
  } catch { return [] }
}

export async function GET() {
  try {
    const session = await auth(), email = session?.user?.email?.trim().toLowerCase()
    if (!email) return NextResponse.json({ authenticated: false, count: 0, limit: 5, audioAssessmentAvailable: false })
    const db = await getDb(), store = new SpeakingStore(db.$client as SpeakingD1)
    const [usage, config] = await Promise.all([store.usage(email), speakingConfig(db)])
    return NextResponse.json({ authenticated: true, count: usage.count, limit: usage.limit, audioAssessmentAvailable: config.audioKeys.length > 0 })
  } catch (error) { return responseError(error) }
}
export async function POST(req: NextRequest) {
  try {
    const type = req.headers.get('content-type') || ''
    if (type.includes('multipart/form-data')) {
      const email = await account()
      rateLimit(email, 'audio', 30, 120_000)
      const bytes = await boundedBody(req, 13_000_000)
      let form: FormData
      try { form = await new Request(req.url, { method: 'POST', headers: req.headers, body: bytes }).formData() }
      catch { throw new SpeakingRequestError(400, 'Dữ liệu bản thu không hợp lệ.') }
      if (!['submit_audio','upload_audio'].includes(String(form.get('action')))) throw new SpeakingRequestError(426, 'Phiên Speaking đã được cập nhật. Vui lòng tải lại trang trước khi nộp.')
      const audio = form.get('audio') as File | null, id = String(form.get('submissionId') || ''), index = Number(form.get('itemIndex'))
      if (!audio || typeof audio.arrayBuffer !== 'function' || audio.size < 500 || audio.size > 12_000_000) throw new SpeakingRequestError(422, 'Bản thu rỗng, quá ngắn hoặc vượt giới hạn 12MB. Vui lòng thu lại.')
      if (!/^audio\/(webm|ogg|mp4|m4a|wav|mpeg|mp3|aac)(;|$)/i.test(audio.type)) throw new SpeakingRequestError(415, 'Định dạng âm thanh chưa được hỗ trợ. Vui lòng thu lại bằng trình duyệt.')
      const db = await getDb(), store = new SpeakingStore(db.$client as SpeakingD1)
      await store.ensure()
      const submission = await store.submission(email, id)
      if (!Number.isInteger(index) || !submission.manifest.items[index]) throw new SpeakingRequestError(400, 'Câu trả lời không hợp lệ.')
      if (submission.status === 'limit' || submission.status === 'pending') throw new SpeakingRequestError(429, 'Bài nói chưa được cấp lượt chấm.')
      const item = submission.manifest.items[index]
      if (await hashSpeakingAudio(audio) !== item.audioHash) throw new SpeakingRequestError(409, 'Bản thu đã thay đổi. Vui lòng nộp lại từ đầu.')
      if (form.get('action') === 'upload_audio') {
        await persistSpeakingAudio(store, `${id}:${index}`, audio, item.audioHash)
        return NextResponse.json({ recordingId: `${id}:${index}`, audioAvailable: true })
      }
      const { row, token } = await store.claim(email, id, index)
      if (!token) {
        await persistSpeakingAudio(store, row.id, audio, item.audioHash)
        return NextResponse.json({ recordingId: row.id, result: JSON.parse(row.result), cached: true, audioAvailable: true })
      }
      try {
        await persistSpeakingAudio(store, row.id, audio, item.audioHash)
        let transcript = row.transcript
        if (!transcript) {
          transcript = await transcribeSpeakingAudio(db, email, audio)
          await store.saveTranscript(row.id, token, transcript)
        }
        const result = await gradeSpeakingAudio(db, email, audio, item.question, transcript, item.metrics, submission.feedbackLang, item.delivery)
        await store.complete(row.id, token, result)
        return NextResponse.json({ recordingId: row.id, result, cached: false })
      } catch (error) {
        await store.fail(row.id, token, error instanceof SpeakingRequestError ? error.message : 'Chưa xử lý được câu này.').catch(() => {})
        throw error
      }
    }
    if (!type.includes('application/json')) throw new SpeakingRequestError(415, 'Định dạng yêu cầu không hợp lệ.')
    const body = await jsonBody(req)
    if (body?.action === 'catalog' || body?.action === 'get_prompts') {
      const exam = body.examType as SpeakingExam
      if (!['IELTS_SPEAKING', 'TOEIC_SPEAKING'].includes(exam)) throw new SpeakingRequestError(400, 'Kỳ thi không hợp lệ.')
      const data = await loadSpeakingCatalog(exam)
      return NextResponse.json(body.action === 'get_prompts' ? { prompts: data.catalog[canonicalPart(body.part || '')] || [], source: data.source } : data)
    }
    const email = await account()
    const db = await getDb(), client = db.$client as SpeakingD1, store = new SpeakingStore(client)
    await store.ensure()
    if (body?.action === 'begin_submission') {
      rateLimit(email, 'begin', 8, 30_000)
      const manifest = validateManifest(body)
      return NextResponse.json(await store.begin(email, manifest))
    }
    if (body?.action === 'report') {
      if (body.submissionId) return NextResponse.json({ report: await store.report(email, body.submissionId) })
      const [reports, legacy] = await Promise.all([store.history(email), legacyReports(client, email)])
      return NextResponse.json({ reports: [...reports, ...legacy].sort((a, b) => b.createdAt - a.createdAt).slice(0, 25) })
    }
    if (body?.action === 'chat_history') {
      if (typeof body.recordingId !== 'string') throw new SpeakingRequestError(400, 'Mã câu trả lời không hợp lệ.')
      const row = await store.recording(email, body.recordingId)
      return NextResponse.json({ messages: JSON.parse(row.chatLog || '[]') })
    }
    if (body?.action === 'chat') {
      rateLimit(email, 'chat', 10, 30_000)
      if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1800 || typeof body.recordingId !== 'string') throw new SpeakingRequestError(400, 'Nội dung câu hỏi không hợp lệ.')
      const row = await store.recording(email, body.recordingId)
      if (row.status !== 'completed') throw new SpeakingRequestError(409, 'Hãy nộp và nhận kết quả bài nói trước khi hỏi AI.')
      const submission = await store.submission(email, row.submissionId)
      const result = JSON.parse(row.result), history = JSON.parse(row.chatLog || '[]')
      const reply = await speakingCoachReply(db, email, body.message.trim(), history, { question: submission.manifest.items[row.itemIndex].question, result }, submission.feedbackLang)
      await store.saveChat(row.id, [...history, { role: 'user', content: body.message.trim() }, { role: 'assistant', content: reply }])
      return NextResponse.json({ reply })
    }
    throw new SpeakingRequestError(400, 'Thao tác Speaking không hợp lệ.')
  } catch (error) { return responseError(error) }
}
