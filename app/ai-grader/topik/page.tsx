import { Metadata } from 'next'
import Script from 'next/script'
import { TopikGraderClient } from './TopikGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/topik',
    'Chấm Điểm Viết TOPIK II (Câu 51-54) Bằng AI Miễn Phí | VNDocs',
    'Luyện thi 쓰기 TOPIK II (câu 51, 52, 53, 54) hiệu quả với AI. Chấm điểm tự động, sửa lỗi ngữ pháp tiếng Hàn, gợi ý biểu hiện cao cấp và cấu trúc bài luận chuẩn TOPIK.'
  )
}

export default function TopikPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Chấm điểm TOPIK Writing bằng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Luyện thi 쓰기 TOPIK II (câu 51, 52, 53, 54) hiệu quả với AI. Chấm điểm tự động, sửa lỗi ngữ pháp tiếng Hàn, gợi ý biểu hiện cao cấp và cấu trúc bài luận chuẩn TOPIK.',
    url: `${FRONTEND_URL}/ai-grader/topik`
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
        name: 'TOPIK Writing',
        item: `${FRONTEND_URL}/ai-grader/topik`,
      }
    ]
  }

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-TopikGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-TopikGraderClient"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Luyện Viết TOPIK II 쓰기 Bằng AI</h1>
        <p className="text-slate-600 font-medium">Chấm chữa chi tiết các câu 51, 52, 53, 54 trong đề thi TOPIK II. AI sẽ sửa lỗi ngữ pháp, chính tả tiếng Hàn và gợi ý các biểu hiện ngữ pháp cao cấp giúp bạn ăn trọn điểm phần Viết.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <TopikGraderClient />
      </div>
    </div>
  )
}
