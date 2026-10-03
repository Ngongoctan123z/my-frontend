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
        <p className="text-slate-600 font-medium mb-2">Chấm điểm siêu tốc chi tiết 4 tiêu chí chuẩn IELTS, tự động phát hiện và sửa lỗi ngữ pháp, từ vựng giúp bạn nâng band điểm hiệu quả mỗi ngày hoàn toàn miễn phí.</p>
        <p className="text-slate-600 font-medium">Ứng dụng công nghệ AI tiên tiến giúp kiểm tra ngữ pháp, nâng band điểm IELTS Writing Task 1 & 2. Tối ưu hóa quá trình luyện thi, nhận xét chi tiết và đánh giá chính xác năng lực thực tế của bạn.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <AiGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Hướng dẫn sử dụng công cụ Chấm điểm IELTS Writing bằng AI</h2>
          <p>Để đạt được kết quả chấm điểm chính xác nhất và tối ưu quá trình <strong>nâng band điểm IELTS Writing Task 1 & 2</strong>, bạn chỉ cần thực hiện các bước đơn giản sau:</p>
          <ul>
            <li><strong>Bước 1:</strong> Chọn loại bài (Task 1 hoặc Task 2) và nhập đề bài (Prompt) vào ô tương ứng.</li>
            <li><strong>Bước 2:</strong> Dán bài viết của bạn vào khung văn bản. Chú ý giữ nguyên cấu trúc đoạn văn để AI dễ dàng nhận diện.</li>
            <li><strong>Bước 3:</strong> Nhấn nút "Chấm Điểm". Hệ thống AI sẽ phân tích và trả về kết quả ngay lập tức bao gồm điểm tổng, điểm từng tiêu chí và nhận xét chi tiết.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">4 Tiêu chí chấm điểm chuẩn IELTS</h3>
          <p>Hệ thống AI được huấn luyện (fine-tune) theo đúng chuẩn barem chấm thi của giám khảo bản xứ, dựa trên 4 tiêu chí cốt lõi:</p>
          <ul>
            <li><strong>Task Response (TR) / Task Achievement (TA):</strong> Đánh giá mức độ trả lời đúng, đủ yêu cầu đề bài và tính logic của các luận điểm.</li>
            <li><strong>Coherence and Cohesion (CC):</strong> Đánh giá sự mạch lạc, liên kết giữa các câu, các đoạn và cấu trúc tổng thể của bài viết.</li>
            <li><strong>Lexical Resource (LR):</strong> Phân tích vốn từ vựng, mức độ đa dạng, độ khó của từ và <strong>tự động sửa lỗi sai từ vựng</strong> nếu có.</li>
            <li><strong>Grammatical Range and Accuracy (GRA):</strong> <strong>Kiểm tra ngữ pháp</strong> chi tiết, phát hiện lỗi sai cú pháp, dấu câu và khuyến khích sử dụng đa dạng cấu trúc ngữ pháp phức tạp.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">Mục đích phục vụ & Giá trị mang lại</h3>
          <p>Với mục tiêu hỗ trợ tối đa cho cộng đồng học viên Việt Nam, công cụ chấm bài AI này mang đến một giải pháp tự học toàn diện. Bạn không còn phải chờ đợi nhiều ngày để nhận được phản hồi từ giáo viên, mà có thể luyện tập liên tục, sửa sai ngay lập tức. Đây là một công cụ không thể thiếu để <strong>nâng band điểm IELTS Writing</strong> một cách nhanh chóng và tiết kiệm chi phí.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">Cơ chế hoạt động & Tính bảo mật</h3>
          <p>Hệ thống sử dụng các mô hình Ngôn ngữ lớn (LLM) hiện đại nhất, kết hợp thuật toán phân tích ngữ nghĩa chuyên sâu. Chúng tôi cam kết tuyệt đối bảo vệ quyền riêng tư của bạn. Mọi bài viết sau khi được phân tích sẽ không được lưu trữ hoặc sử dụng cho mục đích thương mại khác. Dữ liệu trao đổi được mã hóa, mang đến <strong>tính bảo mật</strong> cao nhất cho quá trình học tập của bạn.</p>
        </article>
      </div>
    </div>
  )
}
