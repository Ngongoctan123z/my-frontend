import Script from 'next/script'
import { HskGraderClient } from './HskGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/hsk',
    'Chấm Điểm Writing HSK Bằng AI & Luyện Viết Tiếng Trung | VNDocs',
    'Trợ lý AI chấm điểm bài viết HSK (cấp 4, 5, 6) nhanh chóng, chính xác. Kiểm tra ngữ pháp, lỗi dùng từ, thứ tự nét chữ Hán và đưa ra nhận xét chuyên sâu giúp cải thiện kỹ năng Viết tiếng Trung.'
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
    description: 'Trợ lý AI chấm điểm bài viết HSK (cấp 4, 5, 6) nhanh chóng, chính xác. Kiểm tra ngữ pháp, lỗi dùng từ, thứ tự nét chữ Hán.',
    url: `${FRONTEND_URL}/ai-grader/hsk`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <Script
        id="hsk-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Chấm Điểm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">HSK AI</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Luyện tập Viết HSK 5, HSK 6 theo format chuẩn với nhận xét chi tiết và sửa lỗi tự động từ hệ thống AI chuyên sâu tiếng Trung hoàn toàn miễn phí.
          </p>
        </div>
        <HskGraderClient />
      </div>
    </div>
  )
}
