// Original bilingual copy shared by pages, the admin editor, sitemap and audit.
// Only advertise alternate URLs that actually have a translated page.
export type PageSeo = { title: string; description: string; h1: string }
export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    "title": "Luyện Writing và Speaking Online với AI | VNDocs",
    "description": "Luyện viết IELTS, TOEIC, TOPIK, HSK và luyện nói IELTS, TOEIC trên VNDocs. Chấm bài bằng AI, sửa lỗi chi tiết, nghe lại bản thu và xem lịch sử.",
    "h1": "Luyện Writing và Speaking"
  },
  "/ai-grader": {
    "title": "Luyện viết IELTS, TOEIC, TOPIK, HSK & chấm AI | VNDocs",
    "description": "Luyện Writing IELTS, TOEIC, TOPIK và HSK theo từng dạng bài. Nhận điểm tham khảo, sửa lỗi ngữ pháp, từ vựng, bố cục và lưu lịch sử bài viết.",
    "h1": "Luyện viết IELTS, TOEIC, TOPIK và HSK"
  },
  "/ai-grader/ielts": {
    "title": "Chấm IELTS Writing Task 1, Task 2 với AI | VNDocs",
    "description": "Luyện IELTS Writing Task 1 và Task 2, nhận band điểm tham khảo từ AI, sửa lỗi ngữ pháp, từ vựng và bố cục. Lưu bài viết để theo dõi tiến bộ.",
    "h1": "Luyện IELTS Writing Task 1 và Task 2"
  },
  "/ai-grader/toeic": {
    "title": "Luyện TOEIC Writing câu 1–8: ảnh, email, luận | VNDocs",
    "description": "Luyện đủ 8 câu TOEIC Writing: viết câu theo ảnh, trả lời hai email và viết bài luận. Nhận điểm luyện tập, sửa lỗi và gợi ý diễn đạt từ AI.",
    "h1": "Luyện TOEIC Writing: câu 1–5, câu 6–7 và câu 8"
  },
  "/ai-grader/topik": {
    "title": "Luyện viết TOPIK II câu 51–54, chấm bài AI | VNDocs",
    "description": "Luyện phần viết TOPIK II câu 51–54: điền chỗ trống, mô tả biểu đồ và viết luận. Chấm bài bằng AI, chỉ lỗi tiếng Hàn và gợi ý cách sửa.",
    "h1": "Luyện viết TOPIK II câu 51–54 (쓰기)"
  },
  "/ai-grader/hsk": {
    "title": "Luyện viết HSK 5, HSK 6 và chấm bài bằng AI | VNDocs",
    "description": "Luyện viết HSK 5 và HSK 6: sắp xếp câu, viết đoạn 80 chữ và tóm tắt 400 chữ. Nhận điểm tham khảo, sửa ngữ pháp và từ vựng tiếng Trung.",
    "h1": "Luyện viết tiếng Trung HSK 5 và HSK 6"
  },
  "/speaking": {
    "title": "Luyện IELTS, TOEIC Speaking: ghi âm & góp ý AI | VNDocs",
    "description": "Luyện IELTS và TOEIC Speaking: chọn đề, ghi âm, nghe lại và xem bản chép lời. Nhận góp ý AI về cách diễn đạt, độ trôi chảy và điểm cần cải thiện.",
    "h1": "Phòng Luyện Speaking"
  },
  "/en": {
    "title": "AI Writing & Speaking Practice for IELTS & TOEIC | VNDocs",
    "description": "Practise IELTS and TOEIC Writing and Speaking, plus TOPIK and HSK writing. Get AI feedback, review corrections, replay recordings and track your progress.",
    "h1": "Practice Writing and Speaking"
  },
  "/en/ai-grader": {
    "title": "AI Writing Checker: IELTS, TOEIC, TOPIK & HSK | VNDocs",
    "description": "Practise IELTS, TOEIC, TOPIK and HSK writing with AI feedback. Review grammar, vocabulary and structure, see practice scores and save your writing history.",
    "h1": "AI Writing Practice for IELTS, TOEIC, TOPIK and HSK"
  },
  "/en/ai-grader/ielts": {
    "title": "IELTS Writing Checker for Task 1 & Task 2 | VNDocs",
    "description": "Practise IELTS Writing Task 1 and Task 2 with AI feedback on task response, coherence, vocabulary and grammar. Review estimated bands and suggested corrections.",
    "h1": "IELTS Writing Practice: Task 1 and Task 2"
  },
  "/en/ai-grader/toeic": {
    "title": "TOEIC Writing Practice: Photos, Emails & Essay | VNDocs",
    "description": "Practise all 8 TOEIC Writing questions: five picture sentences, two email responses and an opinion essay. Get AI corrections and practice score feedback.",
    "h1": "TOEIC Writing Practice: Questions 1–8"
  },
  "/en/ai-grader/topik": {
    "title": "TOPIK II Writing Practice: Questions 51–54 | VNDocs",
    "description": "Practise TOPIK II writing questions 51–54, from sentence completion to charts and essays. Get AI feedback on Korean grammar, vocabulary and organisation.",
    "h1": "TOPIK II Writing Practice: Questions 51–54"
  },
  "/en/ai-grader/hsk": {
    "title": "HSK 5 & HSK 6 Writing Practice and AI Feedback | VNDocs",
    "description": "Practise HSK 5 sentence ordering and 80-character writing, plus HSK 6 summaries. Review AI corrections, vocabulary suggestions and estimated practice scores.",
    "h1": "HSK 5 and HSK 6 Writing Practice"
  }
}
export function pageLanguage(path: string): 'vi' | 'en' {
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'vi'
}
export function pageUrl(path: string): string {
  return 'https://vndocs.net' + (path === '/' ? '' : path)
}
export function languageAlternates(path: string): Record<string, string> | undefined {
  const vi = pageLanguage(path) === 'en' ? path.slice(3) || '/' : path
  const en = vi === '/' ? '/en' : '/en' + vi
  if (PAGE_SEO[vi] && PAGE_SEO[en]) return { vi: pageUrl(vi), en: pageUrl(en), 'x-default': pageUrl(vi) }
  if (PAGE_SEO[path]) return { [pageLanguage(path)]: pageUrl(path), 'x-default': pageUrl(path) }
  return undefined
}

// Exact legacy values observed in production D1. Upgrade those fields only;
// preserve deliberate custom text, H1, images and all other configuration.
const LEGACY_PAGE_SEO: Record<string, {title: string; description: string}> = {
  "/ai-grader/ielts": {
    "title": "Chấm IELTS Writing Online Miễn Phí Bằng AI | VNDocs",
    "description": "Chấm bài IELTS Writing Task 1 & Task 2 bằng AI miễn phí: điểm Band theo 4 tiêu chí TR, CC, LR, GRA kèm gợi ý sửa lỗi từ vựng, ngữ pháp trong 15 giây."
  },
  "/ai-grader/toeic": {
    "title": "Chấm TOEIC Writing Online Miễn Phí Bằng AI | VNDocs",
    "description": "Chấm TOEIC Writing bằng AI miễn phí: luyện mô tả ảnh, viết email, viết bài luận theo format thi thật, nhận điểm ước lượng và gợi ý sửa lỗi ngữ pháp, từ vựng."
  },
  "/ai-grader/topik": {
    "title": "Chấm TOPIK Writing Online Bằng AI Miễn Phí | VNDocs",
    "description": "Chấm bài TOPIK Writing (쓰기) bằng AI miễn phí: đánh giá bài viết, sửa lỗi từ vựng, ngữ pháp tiếng Hàn và gợi ý cải thiện trong 15 giây."
  }
}
export function upgradeSavedPageSeo(path: string, saved: Record<string, any>): Record<string, any> {
  const legacy = LEGACY_PAGE_SEO[path], copy = PAGE_SEO[path]
  if (!legacy || !copy || !saved) return saved
  return {
    ...saved,
    title: saved.title === legacy.title ? copy.title : saved.title,
    description: saved.description === legacy.description ? copy.description : saved.description,
  }
}
