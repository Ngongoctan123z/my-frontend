import { TOEIC_PAIRED_SETS, TOEIC_RESPOND_FALLBACKS } from '@/src/data/fallbackPrompts'
import { TOEIC_PICTURE_SETS, parseToeicPictures, publicToeicPictures } from '@/src/data/toeicWriting'
import { ensureToeicPhotoBank } from './toeic-photo-bank'
import type { CompleteToeicSet } from '@/src/lib/toeicExamSets'
import type { D1Statement, SpeakingD1 } from '../speaking/store'
import { SpeakingRequestError } from '../speaking/validation'

export const TOEIC_SET_SCHEMA = `CREATE TABLE IF NOT EXISTS writing_exam_set (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, picturePromptId TEXT NOT NULL,
  email6PromptId TEXT NOT NULL, email7PromptId TEXT NOT NULL, essayPromptId TEXT NOT NULL,
  isPublished INTEGER NOT NULL DEFAULT 1, createdAt INTEGER NOT NULL
)`
const seedKey = 'TOEIC_LINKED_SETS_SEEDED_V1'
export async function ensureToeicExamSets(db: SpeakingD1) {
  await ensureToeicPhotoBank(db)
  await db.prepare(TOEIC_SET_SCHEMA).run()
  if (await db.prepare('SELECT value FROM system_config WHERE key=?').bind(seedKey).first()) return
  const statements: D1Statement[] = []
  const addPrompt = (id: string, type: string, content: string) => {
    statements.push(db.prepare(`INSERT INTO prompt(id,type,content,imageUrl,createdAt)
      SELECT ?,?,?,NULL,? WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`).bind(id,type,content,Date.now(),seedKey))
  }
  addPrompt('toeic-default-pictures-1','TOEIC_PICTURE',JSON.stringify(TOEIC_PICTURE_SETS[0]))
  // Explicit IDs are persisted once. Reordering, inserting or deleting unrelated
  // questions never silently changes the membership of an existing exam set.
  TOEIC_PAIRED_SETS.forEach((set,index) => {
    const suffix = String(index+1), e6 = `toeic-default-email6-${suffix}`, e7 = `toeic-default-email7-${suffix}`, essay = `toeic-default-essay-${suffix}`
    addPrompt(e6,'TOEIC_RESPOND',set.part1.content)
    addPrompt(e7,'TOEIC_RESPOND',(TOEIC_RESPOND_FALLBACKS.find(p => p.content !== set.part1.content) || TOEIC_RESPOND_FALLBACKS[0]).content)
    addPrompt(essay,'TOEIC_ESSAY',set.part2.content)
    statements.push(db.prepare(`INSERT INTO writing_exam_set(id,title,picturePromptId,email6PromptId,email7PromptId,essayPromptId,isPublished,createdAt)
      SELECT ?,?,'toeic-default-pictures-1',?,?,?,1,? WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`)
      .bind(`toeic-default-set-${suffix}`,set.title,e6,e7,essay,Date.now(),seedKey))
  })
  statements.push(db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(seedKey,'1'))
  await db.batch(statements)
}
export async function listToeicExamSets(db: SpeakingD1) {
  await ensureToeicExamSets(db)
  const { results } = await db.prepare(`SELECT s.*,p.content AS pictureContent,p.type AS pictureType,
    e6.content AS email6Content,e6.type AS email6Type,e7.content AS email7Content,e7.type AS email7Type,
    e.content AS essayContent,e.type AS essayType
    FROM writing_exam_set s LEFT JOIN prompt p ON p.id=s.picturePromptId
    LEFT JOIN prompt e6 ON e6.id=s.email6PromptId LEFT JOIN prompt e7 ON e7.id=s.email7PromptId
    LEFT JOIN prompt e ON e.id=s.essayPromptId ORDER BY s.createdAt DESC,s.id`).all()
  return results.map(row => {
    let issue = ''
    if (row.pictureType !== 'TOEIC_PICTURE' || row.email6Type !== 'TOEIC_RESPOND' || row.email7Type !== 'TOEIC_RESPOND' || row.essayType !== 'TOEIC_ESSAY') issue = 'Thiếu đề thành phần hoặc liên kết sai loại câu.'
    else if (row.email6PromptId === row.email7PromptId || row.email6Content === row.email7Content) issue = 'Câu 6 và câu 7 cần hai email khác nhau.'
    else { try { parseToeicPictures(row.pictureContent) } catch { issue = 'Bộ ảnh cần đủ 5 câu hợp lệ.' } }
    return { ...row, isPublished: !!row.isPublished, issue, valid: !issue }
  })
}
export async function publicToeicExamSets(db: SpeakingD1): Promise<{ sets: CompleteToeicSet[]; source: string }> {
  const rows = await listToeicExamSets(db)
  return { source: 'database', sets: rows.filter(row => row.isPublished && row.valid).map(row => ({
    id: row.id, title: row.title, picturePromptId: row.picturePromptId, pictures: publicToeicPictures(parseToeicPictures(row.pictureContent)),
    part1: { id: row.email6PromptId, content: row.email6Content }, email7: { id: row.email7PromptId, content: row.email7Content },
    part2: { id: row.essayPromptId, content: row.essayContent },
  })) }
}
export async function mutateToeicExamSet(db: SpeakingD1, action: string, payload: any) {
  await ensureToeicExamSets(db)
  if (!payload || typeof payload !== 'object') throw new SpeakingRequestError(422,'Thiếu thông tin bộ đề TOEIC.')
  const id = action === 'add_toeic_exam_set' ? crypto.randomUUID() : payload.id
  if (typeof id !== 'string' || !id || id.length > 200) throw new SpeakingRequestError(422,'ID bộ đề không hợp lệ.')
  if (action !== 'add_toeic_exam_set' && !await db.prepare('SELECT id FROM writing_exam_set WHERE id=?').bind(id).first()) throw new SpeakingRequestError(404,'Bộ đề không tồn tại. Hãy tải lại danh sách.')
  if (action === 'delete_toeic_exam_set') { await db.prepare('DELETE FROM writing_exam_set WHERE id=?').bind(id).run(); return { success:true,id } }
  const keys = ['picturePromptId','email6PromptId','email7PromptId','essayPromptId']
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  if (!title || title.length > 200 || keys.some(key => typeof payload[key] !== 'string' || !payload[key] || payload[key].length > 200) || typeof payload.isPublished !== 'boolean') throw new SpeakingRequestError(422,'Cần tên đề, đủ ID của 3 nhóm câu và trạng thái xuất bản.')
  const rows = await db.prepare(`SELECT id,type,content FROM prompt WHERE id IN (?,?,?,?)`).bind(...keys.map(key => payload[key])).all()
  const expected = ['TOEIC_PICTURE','TOEIC_RESPOND','TOEIC_RESPOND','TOEIC_ESSAY']
  if (keys.some((key,i) => !rows.results.some(row => row.id === payload[key] && row.type === expected[i]))) throw new SpeakingRequestError(422,'ID được chọn không tồn tại hoặc không đúng loại câu.')
  if (payload.email6PromptId === payload.email7PromptId || rows.results.find(row => row.id === payload.email6PromptId)?.content === rows.results.find(row => row.id === payload.email7PromptId)?.content) throw new SpeakingRequestError(422,'Câu 6 và câu 7 phải là hai email khác nhau.')
  try { parseToeicPictures(rows.results.find(row => row.id === payload.picturePromptId)!.content) } catch { throw new SpeakingRequestError(422,'Bộ ảnh chưa đủ 5 câu hợp lệ.') }
  const values = [title,...keys.map(key => payload[key]),payload.isPublished ? 1 : 0]
  if (action === 'add_toeic_exam_set') await db.prepare('INSERT INTO writing_exam_set(title,picturePromptId,email6PromptId,email7PromptId,essayPromptId,isPublished,id,createdAt) VALUES(?,?,?,?,?,?,?,?)').bind(...values,id,Date.now()).run()
  else await db.prepare('UPDATE writing_exam_set SET title=?,picturePromptId=?,email6PromptId=?,email7PromptId=?,essayPromptId=?,isPublished=? WHERE id=?').bind(...values,id).run()
  return (await listToeicExamSets(db)).find(row => row.id === id)
}
