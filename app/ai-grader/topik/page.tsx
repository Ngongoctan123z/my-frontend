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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Hướng dẫn tự học & Chấm bài TOPIK II (쓰기) bằng AI</h2>
          <p>Phần thi Viết (쓰기) luôn là nỗi ám ảnh lớn nhất của các thí sinh thi TOPIK II tiếng Hàn. Tuy nhiên, với sự hỗ trợ của <strong>Trợ lý AI chấm bài TOPIK</strong> từ VNDocs, việc đạt điểm cao ở các câu 51, 52, 53 và 54 không còn là điều quá xa vời.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Phân tích chi tiết từng dạng bài</h3>
          <ul>
            <li><strong>Câu 51 & 52 (Điền vào chỗ trống):</strong> AI sẽ phân tích mạch văn, văn cảnh (văn bản thực dụng hay giải thích) để gợi ý các đuôi câu phù hợp (-ㅂ/습니다 hoặc -ㄴ/는다).</li>
            <li><strong>Câu 53 (Viết biểu đồ):</strong> Tự động kiểm tra các biểu hiện miêu tả xu hướng (tăng, giảm, giữ nguyên, so sánh) và cách nối câu mạch lạc.</li>
            <li><strong>Câu 54 (Nghị luận xã hội):</strong> Chấm điểm dựa trên tính logic, sự đa dạng của từ vựng cao cấp (Hán Hàn) và cấu trúc ngữ pháp nâng cao (cấp 4-6).</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Giá trị và Tiện ích vượt trội</h3>
          <p>Bạn không cần phải mất chi phí thuê giáo viên người Hàn chấm bài. AI hoạt động 24/7, cung cấp nhận xét siêu tốc và chi tiết từng lỗi sai chính tả, cách dùng tiểu từ (은/는, 이/가, 을/를). Đồng thời, hệ thống còn <strong>cung cấp bài mẫu điểm tối đa</strong> để bạn học hỏi cách tư duy của người bản xứ.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Cơ chế hoạt động & Bảo mật</h3>
          <p>Được tinh chỉnh trên lượng lớn dữ liệu bài thi TOPIK thực tế, AI hiểu rõ các tiêu chí chấm điểm của Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED). Các bài viết của bạn chỉ được xử lý tạm thời và bị xóa ngay lập tức sau khi trả kết quả, bảo vệ tối đa tính riêng tư của người dùng.</p>
        </article>
      </div>
    </div>
  )
}
