import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
  description: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng, và máy tính Casio ảo miễn phí 100%.',
  keywords: 'gộp pdf, cắt pdf, khóa pdf, chuyển pdf sang ảnh, máy tính casio online',
  openGraph: {
    title: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
    description: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng miễn phí.',
    url: 'https://www.vndocs.net/tools',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function ToolsIndexPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Bộ công cụ tiện ích</h1>
        <p className="text-ink-muted text-lg">
          Trợ thủ đắc lực cho việc học tập và xử lý tài liệu của bạn. Hoàn toàn miễn phí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


        {/* Casio */}
        <Link href="/tools/casio" className="group rounded-2xl border border-line bg-surface p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors">Máy tính Casio</h2>
          </div>
          <p className="text-ink-muted">Trình giả lập máy tính bỏ túi Casio Fx-580VN X trực tuyến giúp giải toán nhanh chóng.</p>
        </Link>

        {/* Convert */}
        <Link href="/tools/convert" className="group rounded-2xl border border-line bg-surface p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            </div>
            <h2 className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors">Chuyển đổi File</h2>
          </div>
          <p className="text-ink-muted">Chuyển đổi linh hoạt giữa các định dạng PDF sang Word (Docx), Ảnh (JPG/PNG) và ngược lại.</p>
        </Link>

        {/* Lock */}
        <Link href="/tools/lock" className="group rounded-2xl border border-line bg-surface p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors">Khóa File (Bảo mật)</h2>
          </div>
          <p className="text-ink-muted">Đặt mật khẩu an toàn cho file PDF hoặc xóa bỏ lớp bảo vệ tài liệu nhanh chóng.</p>
        </Link>

        {/* Remove Pages */}
        <Link href="/tools/remove-pages" className="group rounded-2xl border border-line bg-surface p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
            </div>
            <h2 className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors">Xóa Trang</h2>
          </div>
          <p className="text-ink-muted">Loại bỏ các trang không cần thiết khỏi tài liệu của bạn một cách nhanh chóng.</p>
        </Link>

        {/* Merge Files */}
        <Link href="/tools/merge-files" className="group rounded-2xl border border-line bg-surface p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            </div>
            <h2 className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors">Gộp File</h2>
          </div>
          <p className="text-ink-muted">Ghép nhiều tài liệu thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả.</p>
        </Link>
      </div>
    </div>
  )
}

