import { SearchResults } from '@/src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '@/src/services/examService'

import { Metadata } from 'next'

import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'
import { examPath } from '@/src/utils/slug'

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
    description: 'Tải miễn phí hàng ngàn tài liệu luyện thi, đề thi vào 10, đề thi THPT Quốc gia (Toán, Văn, Anh), PDF ôn thi IELTS, TOEIC cập nhật mới nhất có đáp án.',
    url: `${FRONTEND_URL}/tai-lieu`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: initialExams.data.map((exam, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${FRONTEND_URL}${examPath(exam as any)}`
      }))
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: FRONTEND_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tài liệu & Đề thi',
        item: `${FRONTEND_URL}/tai-lieu`,
      }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      <Suspense fallback={<div className="p-12 text-center text-ink-muted">Đang tải dữ liệu...</div>}>
        <SearchResults initialExams={initialExams} />
      </Suspense>
    </>
  )
}
