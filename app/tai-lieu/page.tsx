import { SearchResults } from '@/src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '@/src/services/examService'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
  description: 'Tải miễn phí hàng ngàn tài liệu luyện thi, đề thi vào 10, đề thi THPT Quốc gia (Toán, Văn, Anh), PDF ôn thi IELTS, TOEIC cập nhật mới nhất có đáp án.',
  keywords: 'tài liệu miễn phí, đề thi thử, đề thi thpt quốc gia, đề thi vào 10, tài liệu pdf miễn phí, đề thi tiếng anh, đề thi toán, đáp án đề thi',
  openGraph: {
    title: 'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
    description: 'Tải miễn phí tài liệu luyện thi, đề thi vào 10, THPT Quốc gia, PDF ôn thi IELTS/TOEIC mới nhất có đáp án chi tiết.',
    url: 'https://vndocs.net/tai-lieu',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default async function TaiLieuPage() {
  let initialExams: import('@/src/types/exam').ExamListResponse = { data: [], total: 0, page: 0, limit: 12 }
  try {
    initialExams = await getExams({ limit: 12, page: 0, sort: 'recent' })
  } catch (e) {}

  return (
    <Suspense fallback={<div className="p-12 text-center text-ink-muted">Đang tải dữ liệu...</div>}>
      <SearchResults initialExams={initialExams} />
    </Suspense>
  )
}
