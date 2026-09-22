import { SearchResults } from '../src/views/SearchResults'
import { Suspense } from 'react'

import { getExams } from '../src/services/examService'

export default async function HomePage() {
  let initialExams: import('../src/types/exam').ExamListResponse = { data: [], total: 0, page: 0, limit: 12 }
  try {
    initialExams = await getExams({ limit: 12, page: 0, sort: 'recent' })
  } catch (e) {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn'}#organization`,
        name: 'Kho Đề Thi',
        url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn',
        logo: {
          '@type': 'ImageObject',
          url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn'}/logo.png`
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn'}#website`,
        url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn',
        name: 'Kho Đề Thi',
        publisher: {
          '@id': `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn'}#organization`
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.khodethi.id.vn'}?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Suspense fallback={<div>Đang tải...</div>}>
        <SearchResults initialExams={initialExams} />
      </Suspense>
    </>
  )
}
