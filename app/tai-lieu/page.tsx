import { SearchResults } from '@/src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '@/src/services/examService'

export const metadata = {
  title: 'Thư Viện Tài Liệu & Đề Thi | VNDocs',
  description: 'Kho tàng tài liệu, đề thi vào 10, THPT Quốc gia cập nhật liên tục.'
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
