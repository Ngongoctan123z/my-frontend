import { Metadata } from 'next'
import Link from 'next/link'
import FileConverterWrapper from './FileConverterWrapper'

export const metadata: Metadata = {
  title: 'Chuyển Đổi Định Dạng Hình Ảnh | VNDocs',
  description: 'Tiện ích hỗ trợ chuyển đổi đa định dạng hình ảnh (JPG, PNG, WEBP, BMP, GIF) nhanh chóng và miễn phí 100%.',
  keywords: 'chuyển đổi ảnh, jpg sang png, png sang jpg, webp sang jpg, bmp sang jpg, convert image',
  openGraph: {
    title: 'Chuyển Đổi Định Dạng Hình Ảnh | VNDocs',
    description: 'Tiện ích hỗ trợ chuyển đổi đa định dạng hình ảnh (JPG, PNG, WEBP, BMP, GIF) nhanh chóng và miễn phí 100%.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function ConvertToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Chuyển Đổi Hình Ảnh</h1>
        <p className="text-slate-500">
          Tiện ích hỗ trợ chuyển đổi qua lại giữa các định dạng ảnh phổ biến (JPG, PNG, WEBP, BMP, GIF tĩnh).
        </p>
      </div>

      <FileConverterWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Công Cụ Chuyển Đổi PDF Trực Tuyến Tốt Nhất</h2>
          
          <p className="mb-4">
            Với công cụ <strong>chuyển đổi định dạng PDF</strong> trực tuyến của VNDocs, bạn có thể dễ dàng biến các hình ảnh (JPG, PNG) thành một tập tin PDF duy nhất để thuận tiện cho việc in ấn hoặc nộp bài tập. Đồng thời, công cụ cũng hỗ trợ xuất ngược các trang từ file PDF thành hình ảnh chất lượng cao một cách nhanh chóng và an toàn tuyệt đối. Mọi thao tác xử lý đều diễn ra ngay trên trình duyệt của bạn, không tải file lên máy chủ.
          </p>
          
          <p className="mb-4">
            Bên cạnh các tính năng chuyển đổi file cơ bản, bạn có thể tham khảo thêm hệ sinh thái giáo dục của chúng tôi. Nếu bạn đang trong quá trình học tập, <strong>VNDocs</strong> mang đến <Link href="/tai-lieu" className="text-blue-600 font-semibold no-underline hover:underline">Kho Tài Liệu & Đề Thi</Link> khổng lồ phục vụ ôn thi vào lớp 10 và kỳ thi THPT Quốc Gia môn Toán, Văn, Anh.
          </p>

          <p className="mb-4">
            Bạn cũng có thể trải nghiệm công nghệ AI tiên tiến qua tính năng <Link href="/ai-grader" className="text-blue-600 font-semibold no-underline hover:underline">Chấm Writing AI IELTS & TOEIC</Link> miễn phí. Hệ thống sẽ phân tích bài viết của bạn, sửa lỗi ngữ pháp chi tiết và đề xuất cách cải thiện bài làm một cách sát sao nhất. Và để việc ghi nhớ từ vựng tiếng Anh không còn là nỗi ám ảnh, hãy sử dụng <Link href="/flashcard/toeic" className="text-blue-600 font-semibold no-underline hover:underline">Bộ Flashcard TOEIC & IELTS</Link> được xây dựng dựa trên nguyên lý lặp lại ngắt quãng (Spaced Repetition) độc quyền.
          </p>
        </article>
      </section>
    </div>
  )
}
