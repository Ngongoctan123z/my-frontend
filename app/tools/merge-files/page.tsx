import { Metadata } from 'next'
import Link from 'next/link'
import MergeFilesWrapper from './MergeFilesWrapper'

export const metadata: Metadata = {
  title: 'Gộp File PDF (Merge PDF) | VNDocs',
  description: 'Ghép nối nhiều tài liệu PDF hoặc hình ảnh thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả siêu nhanh và bảo mật 100%.',
  keywords: 'gộp file pdf, ghép file pdf, nối file pdf, merge pdf, combine pdf, gộp ảnh thành pdf',
  openGraph: {
    title: 'Gộp File PDF (Merge PDF) | VNDocs',
    description: 'Ghép nối nhiều tài liệu PDF hoặc hình ảnh thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả siêu nhanh và bảo mật 100%.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function MergeToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Gộp Nhiều File PDF</h1>
        <p className="text-slate-500">
          Ghép nhiều tài liệu hoặc hình ảnh thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả.
        </p>
      </div>

      <MergeFilesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Ghép Nối PDF Tiện Lợi Bằng Kéo Thả</h2>
          
          <p className="mb-4">
            Tính năng <strong>Gộp File PDF (Merge PDF)</strong> của VNDocs là giải pháp tối ưu khi bạn cần tổng hợp nhiều giấy tờ, báo cáo hay biểu mẫu rời rạc thành một văn bản thống nhất. Công cụ của chúng tôi không chỉ hỗ trợ gộp các file PDF với nhau mà còn cho phép chèn thêm các file Hình ảnh (JPG, PNG) trực tiếp vào quá trình gộp. 
          </p>
          
          <p className="mb-4">
            Giao diện được thiết kế hiện đại, hỗ trợ tính năng <strong>Kéo và Thả (Drag & Drop)</strong> mạnh mẽ. Bạn chỉ cần thả các file vào trình duyệt, bấm giữ và kéo để thay đổi thứ tự trang trước khi xuất bản. Tất cả xử lý đều chạy độc lập trên máy của bạn, cam kết 100% không lưu trữ dữ liệu lên đám mây, an toàn tuyệt đối.
          </p>

          <p className="mb-4">
            Bên cạnh các tính năng văn phòng hữu ích, <strong>VNDocs</strong> còn là nền tảng học tập đỉnh cao. Chúng tôi cung cấp <Link href="/tai-lieu" className="text-blue-600 font-semibold no-underline hover:underline">Hàng nghìn Đề Thi Tốt Nghiệp THPT & Tuyển Sinh Lớp 10</Link> cập nhật thường xuyên. Ngoài ra, tính năng <Link href="/ai-grader" className="text-blue-600 font-semibold no-underline hover:underline">Giám Khảo AI Chấm Điểm Writing IELTS / TOEIC</Link> sẽ là bí quyết giúp bạn nâng cao kỹ năng viết tiếng Anh vượt trội, kết hợp cùng hệ thống <Link href="/flashcard/ielts" className="text-blue-600 font-semibold no-underline hover:underline">Flashcard Lặp Lại Ngắt Quãng</Link> để củng cố từ vựng lâu dài.
          </p>
        </article>
      </section>
    </div>
  )
}
