import { SearchResults } from '@/src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '@/src/services/examService'

import { Metadata } from 'next'

import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/tai-lieu',
    'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
    'Tải miễn phí hàng ngàn tài liệu luyện thi, đề thi vào 10, đề thi THPT Quốc gia (Toán, Văn, Anh), PDF ôn thi IELTS, TOEIC cập nhật mới nhất có đáp án.'
  )
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
