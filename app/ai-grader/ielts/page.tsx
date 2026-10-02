import { Metadata } from 'next'
import Script from 'next/script'
import { AiGraderClient } from './AiGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/ielts',
    'Luyện Writing IELTS Bằng AI & Chấm Điểm Chuẩn Band | VNDocs',
    'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí (TR, CC, LR, GRA), sửa lỗi ngữ pháp, từ vựng và gợi ý nâng band điểm tự động. Tự học IELTS hiệu quả cùng VNDocs.'
  )
}

export default function IeltsGraderPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Chấm điểm IELTS Writing bằng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí (TR, CC, LR, GRA), sửa lỗi ngữ pháp, từ vựng và gợi ý nâng band điểm tự động.',
    url: `${FRONTEND_URL}/ai-grader/ielts`
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
        name: 'AI Chấm điểm',
        item: `${FRONTEND_URL}/ai-grader`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'IELTS Writing',
        item: `${FRONTEND_URL}/ai-grader/ielts`,
      }
    ]
  }

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-AiGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-AiGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Chấm IELTS Writing Online Bằng AI</h1>
        <p className="text-slate-600 font-medium">Chấm điểm siêu tốc chi tiết 4 tiêu chí chuẩn IELTS, tự động phát hiện và sửa lỗi ngữ pháp, từ vựng giúp bạn nâng band điểm hiệu quả mỗi ngày hoàn toàn miễn phí.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <AiGraderClient />
      </div>
    </div>
  )
}
