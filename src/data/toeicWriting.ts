export type ToeicPicture = { id: number; imageUrl: string; keywords: [string, string]; description: string }
export type ToeicPictureSet = { title: string; questions: ToeicPicture[] }

// Original practice tasks. Reference captions deliberately describe visible,
// broad details rather than guessing the identities or intentions of people.
export const TOEIC_PICTURE_SETS: ToeicPictureSet[] = [{
  title: 'TOEIC Writing · Everyday places',
  questions: [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=85', keywords: ['people','table'], description: 'Several people are together around a table in a shared indoor workspace.' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=85', keywords: ['chairs','inside'], description: 'A cafe interior contains tables, chairs, plants and interior lights. A counter is visible in the background.' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1000&auto=format&fit=crop&q=85', keywords: ['books','shelves'], description: 'A library interior contains many books arranged on shelves.' },
    { id: 4, imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=85', keywords: ['buildings','tall'], description: 'Tall modern buildings with many windows are seen from below, with sky between them.' },
    { id: 5, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=85', keywords: ['laptop','open'], description: 'A close-up of a partly open laptop computer. The keyboard, touchpad and outside of the lid are visible under purple and blue lighting.' },
  ],
}]

export function parseToeicPictures(content: string): ToeicPictureSet {
  const parsed = JSON.parse(content)
  if (!parsed || typeof parsed.title !== 'string' || !parsed.title.trim() || parsed.title.length > 200 || !Array.isArray(parsed.questions) || parsed.questions.length !== 5) throw new Error('Cần đúng 5 câu theo ảnh, đánh số 1–5.')
  const questions: ToeicPicture[] = parsed.questions.map((row: any, index: number) => {
    if (row.id !== index + 1 || typeof row.imageUrl !== 'string' || row.imageUrl.length > 2000 || (!/^https:\/\//i.test(row.imageUrl) && !/^\/(?!\/)/.test(row.imageUrl))
      || !Array.isArray(row.keywords) || row.keywords.length !== 2 || row.keywords.some((word: any) => typeof word !== 'string' || !word.trim() || word.length > 100)
      || typeof row.description !== 'string' || !row.description.trim() || row.description.length > 2000) throw new Error(`Câu ${index + 1}: cần ảnh hợp lệ, hai từ gợi ý và mô tả ảnh tham chiếu.`)
    return { id: row.id, imageUrl: row.imageUrl, keywords: row.keywords.map((word: string) => word.trim()) as [string, string], description: row.description.trim() }
  })
  return { title: parsed.title.trim(), questions }
}
export function parseToeicPictureAnswers(essay: string): { id: number; answer: string }[] {
  const rows = JSON.parse(essay)
  if (!Array.isArray(rows) || rows.length !== 5 || rows.some((row, index) => row.id !== index + 1 || typeof row.answer !== 'string' || !row.answer.trim() || row.answer.length > 800)) throw new Error('Vui lòng viết một câu trả lời cho mỗi ảnh, đủ câu 1–5.')
  return rows.map(row => ({ id: row.id, answer: row.answer.trim() }))
}
