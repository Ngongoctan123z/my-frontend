export type ToeicPicture = { id: number; imageUrl: string; keywords: [string, string]; description?: string; exampleAnswer?: string; source?: {url:string;credit:string;licenseUrl:string} }
export type ToeicPictureSet = { title: string; questions: ToeicPicture[]; provenance?: 'original_practice' }

// Original practice tasks. Reference captions deliberately describe visible,
// broad details rather than guessing the identities or intentions of people.
export const TOEIC_PICTURE_SETS: ToeicPictureSet[] = [{
  title: 'TOEIC Writing · Everyday places',
  questions: [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=85', keywords: ['people','table'] },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=85', keywords: ['chairs','inside'] },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1000&auto=format&fit=crop&q=85', keywords: ['books','shelves'] },
    { id: 4, imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=85', keywords: ['buildings','tall'] },
    { id: 5, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=85', keywords: ['laptop','open'] },
  ],
}]

export function parseToeicPictures(content: string, allowMissingContext = false): ToeicPictureSet {
  const parsed = JSON.parse(content)
  if (!parsed || typeof parsed.title !== 'string' || !parsed.title.trim() || parsed.title.length > 200 || !Array.isArray(parsed.questions) || parsed.questions.length !== 5) throw new Error('Cần đúng 5 câu theo ảnh, đánh số 1–5.')
  const questions: ToeicPicture[] = parsed.questions.map((row: any, index: number) => {
    if (row.id !== index + 1 || typeof row.imageUrl !== 'string' || row.imageUrl.length > 2000 || (!/^https:\/\//i.test(row.imageUrl) && !/^\/(?!\/)/.test(row.imageUrl))
      || !Array.isArray(row.keywords) || row.keywords.length !== 2 || row.keywords.some((word: any) => typeof word !== 'string' || !word.trim() || word.length > 100)
      || (!allowMissingContext && (typeof row.description !== 'string' || !row.description.trim())) || (row.description !== undefined && (typeof row.description !== 'string' || row.description.length > 2000))) throw new Error(`Câu ${index + 1}: cần ảnh hợp lệ, hai từ gợi ý và mô tả ảnh tham chiếu.`)
    if(row.exampleAnswer!==undefined && (typeof row.exampleAnswer!=='string'||row.exampleAnswer.length>1000))throw new Error(`Câu ${index+1}: câu mẫu không hợp lệ.`)
    if(row.source!==undefined && (!row.source || typeof row.source.url!=='string'||!/^https:\/\//i.test(row.source.url)||row.source.url.length>2000||typeof row.source.licenseUrl!=='string'||!/^https:\/\//i.test(row.source.licenseUrl)||row.source.licenseUrl.length>2000||typeof row.source.credit!=='string'||row.source.credit.length>200))throw new Error(`Câu ${index+1}: nguồn ảnh không hợp lệ.`)
    return { id: row.id, imageUrl: row.imageUrl, keywords: row.keywords.map((word: string) => word.trim()) as [string, string], ...(typeof row.description === 'string' ? {description:row.description.trim()} : {}), ...(row.exampleAnswer?{exampleAnswer:row.exampleAnswer.trim()}:{}),...(row.source?{source:{url:row.source.url,credit:row.source.credit,licenseUrl:row.source.licenseUrl}}:{}) }
  })
  return { title: parsed.title.trim(), questions, ...(parsed.provenance==='original_practice'?{provenance:'original_practice' as const}:{}) }
}
export function publicToeicPictures(set: ToeicPictureSet): ToeicPictureSet {
  return {...set,questions:set.questions.map(q=>({id:q.id,imageUrl:q.imageUrl,keywords:q.keywords,...(q.source?{source:q.source}:{})}))}
}
export function parseToeicPictureAnswers(essay: string): { id: number; answer: string }[] {
  const rows = JSON.parse(essay)
  if (!Array.isArray(rows) || rows.length !== 5 || rows.some((row, index) => row.id !== index + 1 || typeof row.answer !== 'string' || !row.answer.trim() || row.answer.length > 800)) throw new Error('Vui lòng viết một câu trả lời cho mỗi ảnh, đủ câu 1–5.')
  return rows.map(row => ({ id: row.id, answer: row.answer.trim() }))
}

