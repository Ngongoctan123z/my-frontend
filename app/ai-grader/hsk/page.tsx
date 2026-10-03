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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Bí quyết chinh phục HSK Writing với Công cụ chấm bài AI</h2>
          <p>Kỹ năng Viết (书写) trong kỳ thi năng lực Hán ngữ HSK, đặc biệt từ cấp 4 đến cấp 6, đòi hỏi sự chính xác cao về ngữ pháp và tư duy mạch lạc. Trợ lý AI của VNDocs ra đời giúp bạn <strong>chấm điểm và sửa lỗi HSK Writing</strong> một cách toàn diện nhất.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Tiêu chuẩn đánh giá chuẩn HSK</h3>
          <p>Hệ thống AI mô phỏng cách chấm điểm của giám khảo Trung Quốc, tập trung vào các khía cạnh:</p>
          <ul>
            <li><strong>Độ chính xác của từ vựng và chữ Hán:</strong> Sửa các lỗi dùng sai từ (từ gần nghĩa, sai ngữ cảnh) và lỗi chính tả chữ Hán (nếu gõ pinyin sai).</li>
            <li><strong>Ngữ pháp (语法):</strong> Phát hiện các lỗi sai trật tự từ, sử dụng sai các trợ từ động thái (了, 着, 过) hay các cấu trúc câu đặc biệt (câu chữ 把, câu chữ 被).</li>
            <li><strong>Cấu trúc bài viết:</strong> Đánh giá tính mạch lạc, cách sử dụng các từ nối (liên từ) để đoạn văn tự nhiên và logic.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Lợi ích khi sử dụng tiện ích AI</h3>
          <p>Bạn có thể chủ động luyện viết bất kỳ lúc nào. Sau khi nộp bài, AI sẽ chỉ ra những điểm còn hạn chế, giải thích chi tiết lý do sai bằng tiếng Việt và đề xuất cách sửa lại cho giống với văn phong người bản ngữ nhất. Đây là phương pháp tối ưu giúp bạn đạt điểm cao trong kỳ thi HSK sắp tới.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. An toàn thông tin tuyệt đối</h3>
          <p>Chúng tôi cam kết hệ thống không thu thập hay chia sẻ bài viết của bạn với bất kỳ bên thứ ba nào. Quá trình trao đổi dữ liệu được mã hóa SSL, đảm bảo quyền riêng tư và an toàn thông tin ở mức cao nhất.</p>
        </article>
      </div>
    </div>
  )
}
