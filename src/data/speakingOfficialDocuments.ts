import type { SpeakingExam } from '../lib/speaking'

// References to unchanged publisher originals, not locally reconstructed papers.
// Pages are one-based PDF pages, including cover/contents (not printed folios).
export const officialSpeakingDocuments: {
  id: string; examType: SpeakingExam; title: string; publisher: string
  url: string; sourceUrl: string; pageCount: number; verifiedOn: string
  sections: { title: string; description: string; page: number; promptId?: string }[]
}[] = [
  {
    id: 'ets-speaking-sample-2025', examType: 'TOEIC_SPEAKING',
    title: 'TOEIC Speaking · Đề mẫu ETS', publisher: 'ETS',
    url: 'https://www.ets.org/pdfs/toeic/toeic-speaking-writing-sample-tests.pdf',
    sourceUrl: 'https://www.ets.org/toeic/test-takers.html',
    pageCount: 12, verifiedOn: '2026-10-19',
    sections: [
      { title: 'Câu 1–2 · Đọc thành tiếng', description: 'Đoạn đọc gốc và hướng dẫn thời gian.', page: 4 },
      { title: 'Câu 3–4 · Mô tả ảnh', description: 'Ảnh nguyên bản nằm trong PDF của ETS.', page: 4 },
      { title: 'Câu 5–7 · Trả lời câu hỏi', description: 'Hai nhóm ví dụ về xem truyền hình và mua thực phẩm.', page: 5, promptId: 'ets-sample-television' },
      { title: 'Câu 8–10 · Dùng thông tin cho sẵn', description: 'Bảng lịch hội nghị và các câu hỏi đi kèm.', page: 6 },
      { title: 'Câu 11 · Nêu ý kiến', description: 'Cân nhắc thu nhập và thời gian nghỉ của một công việc.', page: 7, promptId: 'ets-sample-vacation-opinion' },
    ],
  },
  {
    id: 'ielts-speaking-sample-2023', examType: 'IELTS_SPEAKING',
    title: 'IELTS Speaking · Đề mẫu IELTS', publisher: 'IELTS · British Council / IDP / Cambridge',
    url: 'https://ielts.org/cdn/ielts-downloadable-assets/ielts-sample-tests/ielts-speaking-sample-tasks-2023.pdf',
    sourceUrl: 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test',
    pageCount: 7, verifiedOn: '2026-10-19',
    sections: [
      { title: 'Part 1 · Phỏng vấn', description: 'Quê hương, chỗ ở và bản chép lời bài nói mẫu.', page: 3 },
      { title: 'Part 2 · Nói theo thẻ chủ đề', description: 'Một vật có ý nghĩa với bản thân; kèm phần trả lời mẫu.', page: 5, promptId: 'ielts-official-important-possession' },
      { title: 'Part 3 · Thảo luận', description: 'Địa vị xã hội, các giá trị và ảnh hưởng của quảng cáo.', page: 6, promptId: 'ielts-official-values-advertising' },
    ],
  },
]

export function officialSpeakingDocumentUrl(document: typeof officialSpeakingDocuments[number], page: number) {
  return `${document.url}#page=${Math.min(document.pageCount, Math.max(1, Math.trunc(page) || 1))}`
}
