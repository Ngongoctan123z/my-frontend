import { Metadata } from 'next'
import Script from 'next/script'
import { HskGraderClient } from './HskGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/hsk',
    'Chấm Điểm Writing HSK Bằng AI & Luyện Viết Tiếng Trung | VNDocs',
    'Trợ lý AI chấm điểm bài viết HSK (cấp 4, 5, 6) nhanh chóng, chính xác. Kiểm tra ngữ pháp, lỗi dùng từ, thức tỉnh nét chữ Hán và đưa ra nhận xét chuyên sâu giúp cải thiện kỹ năng Viết tiếng Trung.'
  )
}

export default function HskPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Chấm điểm HSK Writing bằng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Trợ lý AI chấm điểm bài viết HSK (cấp 4, 5, 6) nhanh chóng, chính xác. Kiểm tra ngữ pháp, lỗi dùng từ, thức tỉnh nét chữ Hán và đưa ra nhận xét chuyên sâu giúp cải thiện kỹ năng Viết tiếng Trung.',
    url: `${FRONTEND_URL}/ai-grader/hsk`
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
        name: 'HSK Writing',
        item: `${FRONTEND_URL}/ai-grader/hsk`,
      }
    ]
  }

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-HskGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-HskGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Chấm Điểm HSK Writing Online Bằng AI</h1>
        <p className="text-slate-600 font-medium">Tự động sửa lỗi ngữ pháp, từ vựng tiếng Trung, phân tích cấu trúc câu và gợi ý cách hành văn tự nhiên chuẩn người bản xứ cho các cấp độ HSK.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <HskGraderClient />
      </div>
    </div>
  )
}
