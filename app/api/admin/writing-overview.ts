import { parseToeicPictures } from '@/src/data/toeicWriting'
import type { WritingRow } from '@/src/lib/writingBank'
import type { WritingOverview, WritingOverviewCategory, WritingOverviewLevel, WritingOverviewSet } from '@/src/lib/writingOverview'
import type { SpeakingD1 } from '../speaking/store'

type PromptRow = WritingRow & { createdAt?: number }
type ToeicParent = {
  id: string; title: string; picturePromptId: string; email6PromptId: string
  email7PromptId: string; essayPromptId: string; isPublished: number
}
const types = {
  IELTS: ['IELTS_TASK_1', 'IELTS_TASK_2'],
  TOEIC: ['TOEIC_PICTURE', 'TOEIC_RESPOND', 'TOEIC_EMAIL_6', 'TOEIC_EMAIL_7', 'TOEIC_ESSAY'],
  TOPIK: ['TOPIK_51', 'TOPIK_52', 'TOPIK_53', 'TOPIK_54'],
  HSK: ['HSK_5', 'HSK_6'],
} as const

function category(exam: WritingOverviewCategory['exam'], rows: PromptRow[], relationMode: WritingOverviewCategory['relationMode']): WritingOverviewCategory {
  return {
    exam, relationMode, componentCounts: Object.fromEntries(types[exam].map(type => [type, rows.filter(row => row.type === type).length])),
    totalSets: 0, completeSets: 0, brokenSets: 0, hiddenSets: 0, unlinkedPrompts: 0, sets: [],
  }
}

function countLevel(sets: WritingOverviewSet[], rows: PromptRow[], linked: Set<string>): WritingOverviewLevel {
  return {
    totalSets: sets.length,
    completeSets: sets.filter(set => !set.issues.length).length,
    brokenSets: sets.filter(set => !!set.issues.length).length,
    unlinkedPrompts: rows.filter(row => !linked.has(row.id)).length,
  }
}

/** Summarise stored membership only. Surplus standalone prompts are not broken sets. */
export function buildWritingOverview(rows: PromptRow[], toeicParents: ToeicParent[]): WritingOverview {
  const byId = new Map(rows.map(row => [row.id, row]))
  const categories = {
    IELTS: category('IELTS', rows, 'legacy'),
    TOEIC: category('TOEIC', rows, 'stored'),
    TOPIK: category('TOPIK', rows, 'stored'),
    HSK: category('HSK', rows, 'independent'),
  }
  const linked = { TOEIC: new Set<string>(), TOPIK: new Set<string>(), HSK: new Set<string>() }
  const check = (children: Record<string, string>, expected: Record<string, readonly string[]>, issues: string[], used: Set<string>) => {
    for (const [slot, accepted] of Object.entries(expected)) {
      const id = children[slot]
      if (typeof id !== 'string' || !id) { issues.push(`Thiếu ID ${slot}.`); continue }
      const row = byId.get(id)
      if (row) used.add(id)
      if (!row) issues.push(`Không tìm thấy ${slot}: ${id}.`)
      else if (!accepted.includes(row.type)) issues.push(`${slot} liên kết sai loại câu: ${id}.`)
      else if (typeof row.content !== 'string' || !row.content.trim()) issues.push(`${slot} chưa có nội dung: ${id}.`)
    }
  }

  for (const parent of toeicParents) {
    const children = {
      TOEIC_PICTURE: parent.picturePromptId, TOEIC_EMAIL_6: parent.email6PromptId,
      TOEIC_EMAIL_7: parent.email7PromptId, TOEIC_ESSAY: parent.essayPromptId,
    }
    const issues: string[] = []
    check(children, { TOEIC_PICTURE: ['TOEIC_PICTURE'], TOEIC_EMAIL_6: ['TOEIC_RESPOND', 'TOEIC_EMAIL_6'], TOEIC_EMAIL_7: ['TOEIC_RESPOND', 'TOEIC_EMAIL_7'], TOEIC_ESSAY: ['TOEIC_ESSAY'] }, issues, linked.TOEIC)
    const email6 = byId.get(parent.email6PromptId), email7 = byId.get(parent.email7PromptId)
    if (email6 && email7 && (email6.id === email7.id || email6.content === email7.content)) issues.push('Câu 6 và câu 7 phải là hai email khác nhau.')
    const pictures = byId.get(parent.picturePromptId)
    if (pictures?.type === 'TOEIC_PICTURE') {
      try { parseToeicPictures(pictures.content) } catch { issues.push('Câu 1–5 chưa đủ năm ảnh, từ gợi ý và mô tả hợp lệ.') }
    }
    const published = !!parent.isPublished
    categories.TOEIC.sets.push({ id: parent.id, title: parent.title || parent.id, children, published, issues, status: issues.length ? 'broken' : published ? 'complete' : 'hidden' })
  }

  const hskSets: Record<'HSK_5' | 'HSK_6', WritingOverviewSet[]> = { HSK_5: [], HSK_6: [] }
  for (const parent of rows.filter(row => ['WRITING_SET_TOPIK', 'WRITING_SET_HSK_5', 'WRITING_SET_HSK_6'].includes(row.type))) {
    const exam = parent.type.slice('WRITING_SET_'.length) as 'TOPIK' | 'HSK_5' | 'HSK_6'
    const target = exam === 'TOPIK' ? categories.TOPIK : categories.HSK
    const used = exam === 'TOPIK' ? linked.TOPIK : linked.HSK
    const issues: string[] = []
    let value: any
    try { value = JSON.parse(parent.content) } catch { issues.push('Không đọc được dữ liệu liên kết bộ đề.') }
    const children: Record<string, string> = {}
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.id !== parent.id || value.exam !== exam) issues.push('ID hoặc loại bộ đề không khớp bản lưu.')
      if (!value.children || typeof value.children !== 'object' || Array.isArray(value.children)) issues.push('Thiếu danh sách ID câu thành phần.')
      else for (const type of exam === 'TOPIK' ? types.TOPIK : [exam]) {
        if (typeof value.children[type] === 'string') children[type] = value.children[type]
      }
    } else if (!issues.length) issues.push('Dữ liệu liên kết bộ đề không hợp lệ.')
    const expected = Object.fromEntries((exam === 'TOPIK' ? types.TOPIK : [exam]).map(type => [type, [type]]))
    check(children, expected, issues, used)
    if (exam === 'TOPIK') {
      const chart = byId.get(children.TOPIK_53)
      if (chart?.type === 'TOPIK_53' && !chart.imageUrl) issues.push('Câu 53 chưa có biểu đồ.')
    }
    const set: WritingOverviewSet = {
      id: parent.id, title: typeof value?.title === 'string' && value.title ? value.title : parent.id,
      children, published: true, issues, status: issues.length ? 'broken' : 'complete',
    }
    target.sets.push(set)
    if (exam !== 'TOPIK') hskSets[exam].push(set)
  }

  for (const exam of ['TOEIC', 'TOPIK', 'HSK'] as const) {
    const result = categories[exam]
    Object.assign(result, countLevel(result.sets, rows.filter(row => (types[exam] as readonly string[]).includes(row.type)), linked[exam]))
    result.hiddenSets = result.sets.filter(set => !set.published).length
  }
  categories.HSK.levels = Object.fromEntries((['HSK_5', 'HSK_6'] as const).map(exam => [exam, countLevel(hskSets[exam], rows.filter(row => row.type === exam), linked.HSK)])) as Record<'HSK_5' | 'HSK_6', WritingOverviewLevel>
  categories.HSK.note = 'HSK 5 và HSK 6 là hai cấp độ độc lập; không ghép chéo và không so chênh lệch số đề.'
  const ielts = categories.IELTS
  const task1 = Math.min(ielts.componentCounts.IELTS_TASK_1, 30), task2 = Math.min(ielts.componentCounts.IELTS_TASK_2, 30)
  ielts.legacyPairableSets = Math.min(task1, task2)
  ielts.legacyLearnerSets = task1 && task2 ? Math.max(task1, task2) : 0
  ielts.unlinkedPrompts = ielts.componentCounts.IELTS_TASK_1 + ielts.componentCounts.IELTS_TASK_2
  ielts.note = 'IELTS hiện ghép tự động khi làm bài, dùng tối đa 30 đề mỗi Task và có thể dùng lại đề ở Task ít hơn. Chưa có bộ ghép lưu bằng ID; chênh số lượng không phải lỗi liên kết.'
  return { source: 'database', categories }
}

/** Read only: opening the overview never seeds, repairs or rewrites question IDs. */
export async function writingOverview(db: SpeakingD1): Promise<WritingOverview> {
  const rows = await db.prepare(`SELECT id,type,content,imageUrl,createdAt FROM prompt WHERE type IN (
    'IELTS_TASK_1','IELTS_TASK_2','TOEIC_PICTURE','TOEIC_RESPOND','TOEIC_EMAIL_6','TOEIC_EMAIL_7','TOEIC_ESSAY',
    'TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54','HSK_5','HSK_6','WRITING_SET_TOPIK','WRITING_SET_HSK_5','WRITING_SET_HSK_6'
  ) ORDER BY createdAt,id`).all<PromptRow>()
  const table = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='writing_exam_set'").first()
  const parents = table ? (await db.prepare('SELECT id,title,picturePromptId,email6PromptId,email7PromptId,essayPromptId,isPublished FROM writing_exam_set ORDER BY createdAt DESC,id').all<ToeicParent>()).results : []
  return buildWritingOverview(rows.results, parents)
}

/** Examples of legacy automatic pairing, never persisted or filtered by personal history. */
export async function ieltsPreviewSets(db: SpeakingD1) {
  const read = async (type: string) => (await db.prepare('SELECT id,content,imageUrl FROM prompt WHERE type=? ORDER BY createdAt,id LIMIT 30').bind(type).all<{id: string; content: string; imageUrl?: string | null}>()).results
  const [task1, task2] = await Promise.all([read('IELTS_TASK_1'), read('IELTS_TASK_2')])
  const sets = task1.length && task2.length ? Array.from({length: Math.max(task1.length, task2.length)}, (_, index) => ({
    id: index + 1,
    title: `Cặp tham khảo #${index + 1}`,
    part1: task1[index % task1.length],
    part2: task2[index % task2.length],
  })) : []
  return {source: 'database' as const, mode: 'preview' as const, sets}
}
