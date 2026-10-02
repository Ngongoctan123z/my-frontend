import Script from 'next/script'
import { TopikGraderClient } from './TopikGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/topik',
    'Chấm Điểm Writing TOPIK Bằng AI & Luyện Viết TOPIK II | VNDocs',
    'Trải nghiệm phần mềm chấm bài viết TOPIK (câu 51-54) bằng AI. Chấm điểm chi tiết, sửa lỗi ngữ pháp tiếng Hàn, gợi ý từ vựng cao cấp, dự đoán điểm số TOPIK chính xác.'
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
    description: 'Trải nghiệm phần mềm chấm bài viết TOPIK (câu 51-54) bằng AI. Chấm điểm chi tiết, sửa lỗi ngữ pháp tiếng Hàn, gợi ý từ vựng cao cấp.',
    url: `${FRONTEND_URL}/ai-grader/topik`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <Script
        id="topik-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Chấm Điểm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">TOPIK AI</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Luyện tập Viết TOPIK II (Câu 51-54) chuẩn form với đánh giá tự động và sửa lỗi chi tiết từng câu tiếng Hàn từ Trí Tuệ Nhân Tạo hoàn toàn miễn phí.
          </p>
        </div>
        <TopikGraderClient />
      </div>
    </div>
  )
}
