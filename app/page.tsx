import { SearchResults } from '../src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '../src/services/examService'

export default async function HomePage() {
  let initialExams: import('../src/types/exam').ExamListResponse = { data: [], total: 0, page: 0, limit: 12 }
  try {
    initialExams = await getExams({ limit: 12, page: 0, sort: 'recent' })
  } catch (e) {}

  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <SearchResults initialExams={initialExams} />
    </Suspense>
  )
}
