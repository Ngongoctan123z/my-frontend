import { sha256Hex } from '@/src/lib/aiKeyRotation'
import type { SpeakingFeedback, SpeakingReport } from '@/src/lib/speaking'
import { SpeakingRequestError, type SubmissionManifest } from './validation'

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = any>(): Promise<T | null>
  all<T = any>(): Promise<{ results: T[] }>
  run(): Promise<unknown>
}
export interface SpeakingD1 { prepare(query: string): D1Statement; batch(queries: D1Statement[]): Promise<any[]> }
type StoredSubmission = { id: string; email: string; fingerprint: string; feedbackLang: string; status: string; createdAt: number; manifest: SubmissionManifest }

export const SPEAKING_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS speaking_submission (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, fingerprint TEXT NOT NULL, examType TEXT NOT NULL,
    mode TEXT NOT NULL, feedbackLang TEXT NOT NULL, manifest TEXT NOT NULL, quotaDate TEXT NOT NULL,
    status TEXT NOT NULL, createdAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS speaking_submission_owner_created ON speaking_submission(email, createdAt)`,
  `CREATE TABLE IF NOT EXISTS speaking_recording (
    id TEXT PRIMARY KEY, submissionId TEXT NOT NULL, itemIndex INTEGER NOT NULL, contentHash TEXT NOT NULL,
    transcript TEXT, result TEXT, status TEXT NOT NULL DEFAULT 'pending', leaseToken TEXT, leaseUntil INTEGER,
    error TEXT, chatLog TEXT, updatedAt INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS speaking_recording_submission ON speaking_recording(submissionId, itemIndex)`,
  `CREATE TABLE IF NOT EXISTS speaking_audio (recordingId TEXT PRIMARY KEY, objectKey TEXT NOT NULL, mimeType TEXT NOT NULL, byteSize INTEGER NOT NULL, createdAt INTEGER NOT NULL)`,
]
let schemaReady = false
export class SpeakingStore {
  private db: SpeakingD1
  constructor(db: SpeakingD1) { this.db = db }
  async ensure() {
    if (!schemaReady) {
      // Idempotent bootstrap also supports existing deployments whose older
      // migration history never created Speaking tables. No existing data is changed.
      await this.db.batch(SPEAKING_SCHEMA.map(query => this.db.prepare(query)))
      schemaReady = true
    }
  }
  async usage(email: string) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const user = await this.db.prepare('SELECT plan FROM user WHERE email = ?').bind(email).first<{ plan: string }>()
    const limit = user?.plan === 'pro' ? 100 : user?.plan === 'plus' ? 30 : 5
    const usage = await this.db.prepare('SELECT count FROM api_usage WHERE userId = ? AND date = ?').bind(email + ':speaking', today).first<{ count: number }>()
    return { today, limit, count: usage?.count || 0 }
  }
  async begin(email: string, manifest: SubmissionManifest) {
    await this.ensure()
    const id = await sha256Hex(email + ':' + manifest.clientSubmissionId)
    const fingerprint = await sha256Hex(JSON.stringify(manifest))
    const { today, limit } = await this.usage(email)
    const now = Date.now()
    // D1 batches are transactional. changes() refers to the immediately preceding
    // quota statement, so an existing reservation never consumes a second slot.
    await this.db.batch([
      this.db.prepare(`INSERT INTO speaking_submission(id,email,fingerprint,examType,mode,feedbackLang,manifest,quotaDate,status,createdAt)
        VALUES(?,?,?,?,?,?,?,?, 'pending', ?)
        ON CONFLICT(id) DO UPDATE SET status='pending', quotaDate=excluded.quotaDate
        WHERE speaking_submission.status='limit' AND speaking_submission.fingerprint=excluded.fingerprint AND speaking_submission.email=excluded.email`)
        .bind(id, email, fingerprint, manifest.examType, manifest.mode, manifest.feedbackLang, JSON.stringify(manifest), today, now),
      this.db.prepare(`INSERT INTO api_usage(userId,date,count)
        SELECT ?,?,1 WHERE EXISTS(SELECT 1 FROM speaking_submission WHERE id=? AND email=? AND fingerprint=? AND status='pending')
        ON CONFLICT(userId,date) DO UPDATE SET count=api_usage.count+1 WHERE api_usage.count < ? RETURNING count`)
        .bind(email + ':speaking', today, id, email, fingerprint, limit),
      this.db.prepare(`UPDATE speaking_submission SET status=CASE WHEN changes()>0 THEN 'reserved' ELSE 'limit' END
        WHERE id=? AND email=? AND fingerprint=? AND status='pending'`).bind(id, email, fingerprint),
    ])
    const row = await this.submission(email, id)
    if (row.fingerprint !== fingerprint) throw new SpeakingRequestError(409, 'Bản thu hoặc ngôn ngữ đã thay đổi. Vui lòng tạo lần nộp mới.')
    if (row.status === 'limit') throw new SpeakingRequestError(429, `Bạn đã dùng hết ${limit} lượt chấm Speaking hôm nay.`)
    await this.db.batch(manifest.items.map((item, index) => this.db.prepare(`INSERT INTO speaking_recording(id,submissionId,itemIndex,contentHash,status,updatedAt)
      VALUES(?,?,?,?,'pending',?) ON CONFLICT(id) DO NOTHING`).bind(`${id}:${index}`, id, index, item.audioHash, now)))
    return { id, ...(await this.usage(email)), report: await this.report(email, id) }
  }
  async submission(email: string, id: string): Promise<StoredSubmission> {
    if (!/^[a-f\d]{64}$/i.test(id)) throw new SpeakingRequestError(400, 'Mã bài nộp không hợp lệ.')
    const row = await this.db.prepare('SELECT * FROM speaking_submission WHERE id=? AND email=?').bind(id, email).first()
    if (!row) throw new SpeakingRequestError(404, 'Không tìm thấy bài luyện của tài khoản này.')
    return { ...row, manifest: JSON.parse(row.manifest) as SubmissionManifest }
  }
  async recording(email: string, id: string) {
    const row = await this.db.prepare(`SELECT r.* FROM speaking_recording r JOIN speaking_submission s ON s.id=r.submissionId WHERE r.id=? AND s.email=?`).bind(id, email).first()
    if (!row) throw new SpeakingRequestError(404, 'Không tìm thấy câu trả lời của tài khoản này.')
    return row
  }
  async claim(email: string, submissionId: string, index: number) {
    const submission = await this.submission(email, submissionId)
    if (!Number.isInteger(index) || index < 0 || index >= submission.manifest.items.length) throw new SpeakingRequestError(400, 'Câu hỏi không hợp lệ.')
    const id = `${submissionId}:${index}`
    const previous = await this.recording(email, id)
    if (previous.status === 'completed' && previous.result) return { submission, row: previous, token: null }
    const token = crypto.randomUUID(), now = Date.now()
    const rows = await this.db.prepare(`UPDATE speaking_recording SET leaseToken=?,leaseUntil=?,status='processing',error=NULL,updatedAt=?
      WHERE id=? AND status!='completed' AND (leaseUntil IS NULL OR leaseUntil<?) RETURNING *`).bind(token, now + 180_000, now, id, now).all()
    if (!rows.results.length) throw new SpeakingRequestError(409, 'Câu này đang được xử lý. Bản thu vẫn được giữ; hãy thử lại sau ít giây.', 5)
    return { submission, row: rows.results[0], token }
  }
  async saveTranscript(id: string, token: string, transcript: string) {
    await this.db.prepare('UPDATE speaking_recording SET transcript=?,leaseUntil=?,updatedAt=? WHERE id=? AND leaseToken=?').bind(transcript, Date.now() + 180_000, Date.now(), id, token).run()
  }
  async complete(id: string, token: string, result: SpeakingFeedback) {
    const saved = await this.db.prepare(`UPDATE speaking_recording SET result=?,transcript=?,status='completed',leaseToken=NULL,leaseUntil=NULL,updatedAt=?
      WHERE id=? AND leaseToken=? RETURNING submissionId`).bind(JSON.stringify(result), result.transcript, Date.now(), id, token).all<{ submissionId: string }>()
    if (!saved.results.length) throw new SpeakingRequestError(409, 'Lần xử lý đã được thay thế. Vui lòng tải lại kết quả.')
    await this.db.prepare(`UPDATE speaking_submission SET status='completed' WHERE id=? AND NOT EXISTS
      (SELECT 1 FROM speaking_recording WHERE submissionId=? AND status!='completed')`).bind(saved.results[0].submissionId, saved.results[0].submissionId).run()
  }
  async fail(id: string, token: string, error: string) {
    await this.db.prepare(`UPDATE speaking_recording SET status='error',error=?,leaseToken=NULL,leaseUntil=NULL,updatedAt=? WHERE id=? AND leaseToken=?`)
      .bind(error.slice(0, 250), Date.now(), id, token).run()
  }
  async audio(recordingId: string) {
    return this.db.prepare('SELECT * FROM speaking_audio WHERE recordingId=?').bind(recordingId).first<{ objectKey: string; mimeType: string; byteSize: number }>()
  }
  async saveAudio(recordingId: string, objectKey: string, mimeType: string, size: number) {
    await this.db.prepare('INSERT INTO speaking_audio(recordingId,objectKey,mimeType,byteSize,createdAt) VALUES(?,?,?,?,?) ON CONFLICT(recordingId) DO NOTHING').bind(recordingId, objectKey, mimeType, size, Date.now()).run()
  }
  async report(email: string, id: string): Promise<SpeakingReport> {
    const submission = await this.submission(email, id)
    const { results } = await this.db.prepare('SELECT r.id,r.itemIndex,r.status,r.result,a.recordingId AS audioId FROM speaking_recording r LEFT JOIN speaking_audio a ON a.recordingId=r.id WHERE r.submissionId=? ORDER BY r.itemIndex').bind(id).all()
    return { id, examType: submission.manifest.examType, mode: submission.manifest.mode, fullTest: submission.manifest.fullTest,
      feedbackLang: submission.feedbackLang, createdAt: submission.createdAt, status: submission.status,
      items: submission.manifest.items.map((item, index) => {
        const row = results.find(row => row.itemIndex === index)
        return { id: `${id}:${index}`, question: item.question, status: row?.status || 'pending', audioAvailable: !!row?.audioId, metrics: item.metrics, result: row?.result ? JSON.parse(row.result) : null }
      }) }
  }
  async history(email: string) {
    await this.ensure()
    const { results } = await this.db.prepare(`SELECT id FROM speaking_submission WHERE email=? AND status NOT IN ('pending','limit') ORDER BY createdAt DESC LIMIT 20`).bind(email).all<{ id: string }>()
    return Promise.all(results.map(row => this.report(email, row.id)))
  }
  async saveChat(id: string, messages: unknown[]) {
    await this.db.prepare('UPDATE speaking_recording SET chatLog=? WHERE id=?').bind(JSON.stringify(messages.slice(-12)), id).run()
  }
}
