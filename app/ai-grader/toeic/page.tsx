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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Hướng dẫn tự học & Chấm điểm TOEIC Writing bằng AI</h2>
          <p>Kỹ năng Viết trong bài thi TOEIC (TOEIC Writing) thường khiến nhiều thí sinh lúng túng vì yêu cầu tính thực tế cao trong môi trường công sở. Công cụ <strong>chấm điểm TOEIC Writing bằng AI</strong> của VNDocs được thiết kế chuyên biệt để giúp bạn chinh phục dạng bài thi này một cách dễ dàng nhất.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Tiêu chí đánh giá sát đề thi thật</h3>
          <p>Hệ thống AI đánh giá bài viết của bạn dựa trên các tiêu chí chuẩn của ETS (đơn vị ra đề thi TOEIC):</p>
          <ul>
            <li><strong>Chất lượng và sự logic của câu trả lời:</strong> Bạn có trả lời đúng trọng tâm câu hỏi không? Các luận điểm đưa ra có hỗ trợ tốt cho ý kiến của bạn không?</li>
            <li><strong>Sự đa dạng về từ vựng (Vocabulary):</strong> Kiểm tra cách sử dụng từ vựng công sở (Business English), sự phong phú của hệ thống từ ngữ.</li>
            <li><strong>Ngữ pháp và Cấu trúc câu (Grammar & Syntax):</strong> Khả năng sử dụng các cấu trúc câu phức, câu điều kiện và sự chính xác trong thì, mạo từ.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Lợi ích mang lại</h3>
          <p>Việc sử dụng công cụ AI để luyện viết TOEIC giúp bạn rút ngắn thời gian ôn thi đáng kể. Mỗi bài viết sau khi gửi sẽ nhận được kết quả ngay lập tức bao gồm: Điểm số ước lượng, Các lỗi ngữ pháp cần sửa, và <strong>Bài viết mẫu (Sample Answer)</strong> để bạn tham khảo cách hành văn đạt điểm cao.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Tính bảo mật tuyệt đối</h3>
          <p>Chúng tôi hiểu rằng một số bài tập bạn làm có thể liên quan đến email công việc thực tế. Vì vậy, hệ thống không lưu trữ bất kỳ văn bản nào của bạn sau khi chấm xong. Quá trình mã hóa đầu cuối đảm bảo mọi dữ liệu của bạn an toàn 100%.</p>
        </article>
      </div>
    </div>
  )
}
