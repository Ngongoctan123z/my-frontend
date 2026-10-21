// Closed public sections stay explicitly retired, including localized aliases.
export const RETIRED_SECTION_PREFIXES = ['/tai-lieu', '/tai-lieu-mien-phi', '/exams', '/files', '/backend-files', '/exam-papers', '/ai-grader/tai-lieu-tong-hop', '/tools', '/quan-tri-he-thong-123', '/favorites', '/documents', '/de-thi', '/vao-10', '/thpt'] as const
export const SITE_TITLE = 'VNDocs — Luyện Writing và Speaking Online'
export const SITE_DESCRIPTION = 'Luyện Writing IELTS, TOEIC, TOPIK, HSK và Speaking IELTS, TOEIC. Nhận điểm luyện tập, sửa lỗi chi tiết và theo dõi tiến bộ qua từng bài làm.'
export const SITE_TITLE_EN = 'VNDocs — Writing and Speaking Practice'
export const SITE_DESCRIPTION_EN = 'Practice IELTS, TOEIC, TOPIK and HSK Writing, plus IELTS and TOEIC Speaking, with detailed feedback, recordings and learning history.'

export function isRetiredPath(path: string): boolean {
  try { path = decodeURIComponent(path) } catch { return true }
  path = path.split(/[?#]/)[0].replace(/\/+/g, '/').toLowerCase()
  if (path === '/en') path = '/'
  else if (path.startsWith('/en/')) path = path.slice(3)
  return RETIRED_SECTION_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'))
}

// Old saved SEO must not restore the removed exam library on live pages.
export function hasRetiredSeo(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const text = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  return /\bthpt\b|vao (?:lop )?10|lop 10|grade[ -]?10|high school|kho (?:de thi|tai lieu)|tai lieu mien phi|trang de thi|exam repositor|pdf utilit|pdf tools|productivity|cong cu (?:hoc tap|xu ly file|pdf)|\/tai-lieu|\/exams(?:\/|\b)|\/exam-papers|\/tools(?:\/|\b)/.test(text)
}

export function retiredSectionResponse(): Response {
  return new Response('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title>Nội dung đã được gỡ | VNDocs</title></head><body><main><h1>Nội dung đã được gỡ</h1><p>VNDocs hiện tập trung vào luyện Writing và Speaking.</p><p><a href="/ai-grader">Luyện Writing</a> · <a href="/speaking">Luyện Speaking</a></p></main></body></html>', {
    status: 410,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet', 'Cache-Control': 'no-store' },
  })
}

