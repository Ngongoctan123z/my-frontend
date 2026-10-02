import { Metadata } from 'next'
import Script from 'next/script'
import { ToeicGraderClient } from './ToeicGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/toeic',
    'Luyện Viết TOEIC Writing Bằng AI & Chấm Điểm Trực Tuyến | VNDocs',
    'Thực hành TOEIC Writing (Respond to a written request, Write an opinion essay) với hệ thống AI chấm điểm tức thì. Phát hiện lỗi sai, gợi ý cấu trúc câu và từ vựng ăn điểm giúp bạn đạt kết quả cao.'
  )
}

export default function ToeicPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Chấm điểm TOEIC Writing bằng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Thực hành TOEIC Writing (Respond to a written request, Write an opinion essay) với hệ thống AI chấm điểm tức thì. Phát hiện lỗi sai, gợi ý cấu trúc câu và từ vựng ăn điểm giúp bạn đạt kết quả cao.',
    url: `${FRONTEND_URL}/ai-grader/toeic`
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
        name: 'TOEIC Writing',
        item: `${FRONTEND_URL}/ai-grader/toeic`,
      }
    ]
  }

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-ToeicGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-ToeicGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Luyện Thi TOEIC Writing Online Bằng AI</h1>
        <p className="text-slate-600 font-medium">Luyện tập các dạng bài TOEIC Writing (Respond, Essay) với AI chấm điểm siêu tốc. Phân tích lỗi sai và đề xuất các từ vựng, cấu trúc ăn điểm giúp tối ưu hóa thời gian làm bài.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>
    </div>
  )
}
