import { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PdfLockUnlock = dynamic(() => import('@/src/components/tools/PdfLockUnlock').then(mod => mod.PdfLockUnlock), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-slate-500">Đang tải công cụ...</div>
})

export const metadata: Metadata = {
  title: 'Khóa / Mở Khóa File PDF (Protect PDF) | VNDocs',
  description: 'Công cụ mã hóa file PDF bằng mật khẩu chống xem, chống in hoặc xóa bỏ mật khẩu bảo vệ PDF nhanh chóng.',
  keywords: 'khóa pdf, mã hóa pdf, đặt mật khẩu pdf, mở khóa pdf, xóa mật khẩu pdf, bảo vệ pdf',
  openGraph: {
    title: 'Khóa / Mở Khóa File PDF (Protect PDF) | VNDocs',
    description: 'Công cụ mã hóa file PDF bằng mật khẩu chống xem, chống in hoặc xóa bỏ mật khẩu bảo vệ PDF nhanh chóng.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function LockToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Khóa & Mở Khóa PDF</h1>
        <p className="text-slate-500">
          Đặt mật khẩu an toàn bảo vệ file PDF cá nhân hoặc gỡ bỏ lớp bảo vệ tài liệu nhanh chóng bằng một click.
        </p>
      </div>

      <PdfLockUnlock />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Bảo Mật Tài Liệu PDF Tuyệt Đối Với VNDocs</h2>

          <p className="mb-4">
            An toàn thông tin là yếu tố quan trọng hàng đầu trong học tập và công việc. Công cụ <strong>Khóa File PDF (Protect PDF)</strong> của chúng tôi giúp bạn mã hóa các tài liệu nhạy cảm bằng một lớp mật khẩu bảo vệ vững chắc, ngăn chặn những người không có quyền truy cập, sao chép hoặc in ấn tài liệu. Tất cả đều được mã hóa theo chuẩn bảo mật cao cấp (AES 128/256-bit).
          </p>

          <p className="mb-4">
            Bên cạnh đó, nếu bạn có một file PDF chính chủ nhưng bị giới hạn một số quyền (như không cho in), tính năng <strong>Mở khóa PDF (Unlock PDF)</strong> sẽ giúp bạn loại bỏ mọi rào cản đó (Yêu cầu phải có mật khẩu gốc của file). Mọi thao tác đều xử lý 100% trên thiết bị của bạn, bảo mật quyền riêng tư tuyệt đối.
          </p>

          <p className="mb-4">
            Và đừng quên, <strong>VNDocs</strong> còn là kho tàng giáo dục miễn phí với <Link href="/tai-lieu" className="text-blue-600 font-semibold no-underline hover:underline">Hàng ngàn bộ Đề Thi</Link> chất lượng cho học sinh lớp 9 và 12 ôn thi. Để cải thiện toàn diện trình độ tiếng Anh, hãy thử sức ngay với tính năng <Link href="/ai-grader" className="text-blue-600 font-semibold no-underline hover:underline">Chấm Writing IELTS & TOEIC 1-1 với AI</Link> hoặc tăng tốc độ học từ vựng cùng <Link href="/flashcard/ielts" className="text-blue-600 font-semibold no-underline hover:underline">Bộ Flashcard IELTS</Link> độc quyền của chúng tôi!
          </p>
        </article>
      </section>
    </div>
  )
}
