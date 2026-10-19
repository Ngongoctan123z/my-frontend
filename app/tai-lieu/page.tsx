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

export default async function TaiLieuPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const value = (key: string) => typeof query[key] === 'string' ? query[key] as string : ''
  const q=value('q'), examType=value('examType') as import('@/src/types/exam').ExamType | '', subject=value('subject'), province=value('province'), year=value('year'), sort=(value('sort') || 'recent') as 'recent' | 'popular' | 'name'
  let initialExams: import('@/src/types/exam').ExamListResponse | undefined
  try {
    initialExams = await getExams({ limit: 8, page: 0, q, examType, subject, province, year: year ? Number(year) : undefined, sort })
  } catch {}
  return <Suspense fallback={<div className="p-12 text-center text-ink-muted">Đang tải dữ liệu...</div>}>
    <SearchResults initialExams={initialExams} initialFilterKey={JSON.stringify([q,examType,subject,province,year,sort])} />
  </Suspense>
}
