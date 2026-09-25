import { Metadata } from 'next'
import Link from 'next/link'
import RemovePagesWrapper from './RemovePagesWrapper'

export const metadata: Metadata = {
  title: 'Cắt Trang & Xóa Trang PDF (Remove Pages) | VNDocs',
  description: 'Trích xuất, cắt tách và loại bỏ các trang PDF không mong muốn ra khỏi tài liệu một cách dễ dàng và hoàn toàn miễn phí.',
  keywords: 'cắt trang pdf, xóa trang pdf, split pdf, remove pages pdf, trích xuất trang pdf',
  openGraph: {
    title: 'Cắt Trang & Xóa Trang PDF (Remove Pages) | VNDocs',
    description: 'Trích xuất, cắt tách và loại bỏ các trang PDF không mong muốn ra khỏi tài liệu một cách dễ dàng và hoàn toàn miễn phí.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function RemovePagesToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Cắt & Xóa Trang PDF</h1>
        <p className="text-slate-500">
          Loại bỏ các trang không cần thiết khỏi tài liệu của bạn hoặc tách trang PDF một cách nhanh chóng.
        </p>
      </div>

      <RemovePagesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Loại Bỏ Trang PDF Dư Thừa Đơn Giản Nhất</h2>
          
          <p className="mb-4">
            Đôi khi một file PDF dài cả trăm trang nhưng bạn chỉ cần lưu lại một vài trang quan trọng? Tính năng <strong>Xóa trang PDF (Remove PDF Pages)</strong> ra đời để giải quyết vấn đề đó. Giao diện công cụ được thiết kế trực quan, hiển thị bản xem trước thu nhỏ của từng trang (Thumbnail), giúp bạn dễ dàng nhấp chọn những trang muốn giữ lại hoặc xóa đi. 
          </p>
          
          <p className="mb-4">
            Điều tuyệt vời nhất là ứng dụng hoạt động 100% trên thiết bị của bạn. Tài liệu của bạn <strong>không bao giờ bị tải lên mạng internet</strong>, vì vậy bạn hoàn toàn yên tâm khi cắt tách các hợp đồng hoặc tài liệu bí mật.
          </p>

          <p className="mb-4">
            Đồng thời, nếu bạn là một học sinh đang trong giai đoạn nước rút, đừng quên truy cập ngay <Link href="/tai-lieu" className="text-blue-600 font-semibold no-underline hover:underline">Hệ thống Đề thi Miễn phí</Link> của VNDocs với vô vàn đề thi thử Đại học và vào lớp 10 được cập nhật mới nhất mỗi ngày. Đặc biệt, công cụ <Link href="/ai-grader" className="text-blue-600 font-semibold no-underline hover:underline">Chấm Writing IELTS & TOEIC</Link> siêu việt của chúng tôi sẽ là trợ thủ đắc lực giúp bạn chinh phục đỉnh cao điểm số. Hãy kết hợp cùng <Link href="/flashcard/toeic" className="text-blue-600 font-semibold no-underline hover:underline">Bộ Flashcard Học Từ Vựng TOEIC</Link> để đạt kết quả hoàn hảo nhé!
          </p>
        </article>
      </section>
    </div>
  )
}
