import Script from 'next/script'
import { ToeicGraderClient } from './ToeicGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/toeic',
    'Luyện Writing TOEIC Bằng AI & Chấm Điểm Chuẩn ETS | VNDocs',
    'Công cụ chấm điểm TOEIC Writing bằng AI tiên tiến. Thực hành mô tả ảnh, viết email và viết bài luận theo format thực tế. AI nhận xét chi tiết ngữ pháp, từ vựng và gợi ý nâng điểm hiệu quả.'
  )
}

export default function ToeicGraderPage() {
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
    description: 'Công cụ chấm điểm TOEIC Writing bằng AI tiên tiến. Thực hành mô tả ảnh, viết email và viết bài luận theo format thực tế.',
    url: `${FRONTEND_URL}/ai-grader/toeic`
  }

  return (
    <div className="py-8">
      <Script
        id="toeic-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Luyện Viết TOEIC (Writing) Bằng AI</h1>
        <p className="text-slate-600 font-medium">Ôn luyện kỹ năng viết TOEIC Q6-7 và Q8 với công nghệ chấm điểm AI tức thì. Phân tích chi tiết và đưa ra gợi ý nâng band theo chuẩn ETS hoàn toàn miễn phí.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>
    </div>
  )
}
