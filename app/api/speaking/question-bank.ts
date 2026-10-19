import {officialSpeakingSamples} from '@/src/data/speakingOfficialSamples'
import { canonicalPart, fallbackCatalog, SPEAKING_PARTS, type SpeakingExam } from '@/src/lib/speaking'
import { SpeakingRequestError } from './validation'
import type { SpeakingD1 } from './store'

export const QUESTION_BANK_SCHEMA = `CREATE TABLE IF NOT EXISTS speaking_prompt (
  id TEXT PRIMARY KEY, examType TEXT NOT NULL, part TEXT NOT NULL, topic TEXT NOT NULL,
  questionEn TEXT NOT NULL, questionVi TEXT NOT NULL, cueCard TEXT, subQuestions TEXT,
  suggestedVocabulary TEXT, imageUrl TEXT, prepTimeSec INTEGER NOT NULL DEFAULT 0,
  speakTimeSec INTEGER NOT NULL DEFAULT 45, startGraceSec INTEGER NOT NULL DEFAULT 0,
  criteria TEXT, difficulty TEXT NOT NULL DEFAULT 'medium', setId TEXT,
  isPublished INTEGER NOT NULL DEFAULT 1, createdAt INTEGER NOT NULL
)`
const columns = ['examType','part','topic','questionEn','questionVi','cueCard','subQuestions','suggestedVocabulary','imageUrl','prepTimeSec','speakTimeSec','startGraceSec','criteria','difficulty','setId','isPublished']
const seedKey = 'SPEAKING_BANK_SEEDED_V1'
export async function ensureQuestionBank(db: SpeakingD1) {
  await db.batch([
    db.prepare(QUESTION_BANK_SCHEMA),
    db.prepare('CREATE INDEX IF NOT EXISTS speaking_prompt_exam_part ON speaking_prompt(examType,part,isPublished)'),
  ])
  const officialKey='SPEAKING_OFFICIAL_SAMPLES_V1'
  if(!await db.prepare('SELECT value FROM system_config WHERE key=?').bind(officialKey).first())await db.batch([
    ...officialSpeakingSamples.map(p=>{const row=validateQuestion({...p,isPublished:true});return db.prepare(`INSERT INTO speaking_prompt(id,${columns.join(',')},createdAt) SELECT ${Array(columns.length+2).fill('?').join(',')} WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`).bind(p.id,...columns.map(k=>row[k]),Date.now(),officialKey)}),
    db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(officialKey,'1'),
  ])
  if (await db.prepare('SELECT value FROM system_config WHERE key=?').bind(seedKey).first()) return
  const defaults = (['IELTS_SPEAKING','TOEIC_SPEAKING'] as SpeakingExam[]).flatMap(exam => Object.values(fallbackCatalog(exam)).flat())
  // The marker and initial rows are committed together. Deleted/hidden questions
  // are never resurrected on subsequent requests; existing edits win conflicts.
  await db.batch([
    ...defaults.map(p => {
      const row = validateQuestion({ ...p, part: canonicalPart(p.part), isPublished: true })
      return db.prepare(`INSERT INTO speaking_prompt(id,${columns.join(',')},createdAt)
        SELECT ${Array(columns.length + 2).fill('?').join(',')} WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?)
        ON CONFLICT(id) DO NOTHING`).bind(p.id, ...columns.map(k => row[k]), Date.now(), seedKey)
    }),
    db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(seedKey, '1'),
  ])
}
export function validateQuestion(payload: unknown): Record<string, string | number | null> {
  const p = payload as Record<string, any>
  if (!p || typeof p !== 'object') throw new SpeakingRequestError(422, 'Thiếu thông tin đề Speaking.')
  const exam = p.examType as SpeakingExam, part = canonicalPart(p.part || '')
  if (!SPEAKING_PARTS[exam]?.includes(part)) throw new SpeakingRequestError(422, 'Phần thi Speaking không hợp lệ.')
  const text = (key: string, max: number, required = false) => {
    if (p[key] !== undefined && p[key] !== null && typeof p[key] !== 'string') throw new SpeakingRequestError(422, `${key} phải là văn bản.`)
    const value = String(p[key] || '').trim()
    if ((required && !value) || value.length > max) throw new SpeakingRequestError(422, `Nội dung ${key} trống hoặc quá dài.`)
    return value
  }
  const list = (key: string) => {
    let value = p[key] || []
    if (typeof value === 'string') { try { value = JSON.parse(value) } catch { throw new SpeakingRequestError(422, `${key} phải là danh sách.`) } }
    if (!Array.isArray(value) || value.length > 15 || value.some(v => typeof v !== 'string' || v.length > 4000)) throw new SpeakingRequestError(422, `${key} không hợp lệ.`)
    return JSON.stringify(value.map(v => v.trim()).filter(Boolean))
  }
  const imageUrl = text('imageUrl', 2000)
  if (imageUrl && !/^https:\/\//i.test(imageUrl) && !/^\/(?!\/)/.test(imageUrl)) throw new SpeakingRequestError(422, 'Ảnh cần đường dẫn HTTPS hoặc đường dẫn trong website.')
  if (typeof p.isPublished !== 'boolean' && p.isPublished !== undefined) throw new SpeakingRequestError(422, 'Trạng thái xuất bản không hợp lệ.')
  return { examType: exam, part, topic: text('topic', 200, true), questionEn: text('questionEn', 12000, true), questionVi: text('questionVi', 12000),
    cueCard: text('cueCard', 6000) || null, subQuestions: list('subQuestions'), suggestedVocabulary: list('suggestedVocabulary'),
    imageUrl: imageUrl || null, prepTimeSec: part === 'PART_2' ? 60 : ['Q1_2','Q3_4','Q11'].includes(part) ? 45 : 0,
    speakTimeSec: part === 'PART_2' ? 120 : ['PART_3','Q11'].includes(part) ? 60 : part === 'Q3_4' ? 30 : 45,
    startGraceSec: 0, criteria: list('criteria'), difficulty: ['easy','medium','hard'].includes(p.difficulty) ? p.difficulty : 'medium',
    setId: text('setId', 150) || null, isPublished: p.isPublished === false ? 0 : 1 }
}
export async function mutateQuestionBank(db: SpeakingD1, action: string, payload: any) {
  await ensureQuestionBank(db)
  if (!payload || typeof payload !== 'object') throw new SpeakingRequestError(422, 'Thiếu thông tin đề Speaking.')
  const adding = action === 'add_speaking_prompt'
  const id = adding ? crypto.randomUUID() : payload.id
  if (typeof id !== 'string' || !id || id.length > 200) throw new SpeakingRequestError(422, 'Mã đề không hợp lệ.')
  if (!adding && !await db.prepare('SELECT id FROM speaking_prompt WHERE id=?').bind(id).first()) throw new SpeakingRequestError(404, 'Đề đã bị xoá hoặc không tồn tại. Vui lòng tải lại kho đề.')
  if (action === 'delete_speaking_prompt') {
    await db.prepare('DELETE FROM speaking_prompt WHERE id=?').bind(id).run()
    return { success: true, id }
  }
  if (action === 'toggle_speaking_prompt_publish') {
    if (typeof payload.isPublished !== 'boolean') throw new SpeakingRequestError(422, 'Trạng thái xuất bản không hợp lệ.')
    await db.prepare('UPDATE speaking_prompt SET isPublished=? WHERE id=?').bind(payload.isPublished ? 1 : 0, id).run()
  } else {
    const row = validateQuestion(payload)
    if (adding) await db.prepare(`INSERT INTO speaking_prompt(id,${columns.join(',')},createdAt) VALUES(${Array(columns.length + 2).fill('?').join(',')})`).bind(id, ...columns.map(k => row[k]), Date.now()).run()
    else await db.prepare(`UPDATE speaking_prompt SET ${columns.map(k => `${k}=?`).join(',')} WHERE id=?`).bind(...columns.map(k => row[k]), id).run()
  }
  const saved = await db.prepare('SELECT * FROM speaking_prompt WHERE id=?').bind(id).first()
  return { ...saved, isPublished: !!saved.isPublished }
}
