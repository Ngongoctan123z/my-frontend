import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
  description: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng, và máy tính Casio ảo miễn phí 100%.',
  keywords: 'gộp pdf, cắt pdf, khóa pdf, chuyển pdf sang ảnh, máy tính casio online',
  openGraph: {
    title: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
    description: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng miễn phí.',
    url: 'https://vndocs.net/tools',
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Casio */}
        <Link href="/tools/casio" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Máy tính Casio</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Trình giả lập máy tính bỏ túi Casio Fx-580VN X trực tuyến giúp giải toán nhanh chóng, hiển thị trực quan.</p>
        </Link>



        {/* Lock */}
        <Link href="/tools/lock" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-rose-500 transition-colors">Khóa & Mở PDF</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Đặt mật khẩu an toàn bảo vệ file PDF cá nhân hoặc gỡ bỏ lớp bảo vệ tài liệu nhanh chóng bằng một click.</p>
        </Link>

        {/* Remove Pages */}
        <Link href="/tools/remove-pages" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Cắt & Xóa Trang PDF</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Dễ dàng chọn lựa và loại bỏ các trang PDF không cần thiết khỏi tài liệu để giảm dung lượng và tối ưu file.</p>
        </Link>

        {/* Merge Files */}
        <Link href="/tools/merge-files" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Gộp Nhiều File PDF</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Ghép nối nhiều tài liệu PDF hoặc hình ảnh thành một tệp duy nhất. Có thể kéo thả để sắp xếp lại thứ tự các file.</p>
        </Link>
      </div>
      
      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Công Cụ Tiện Ích PDF & Giáo Dục Miễn Phí Tại VNDocs</h2>
          
          <p className="mb-4">
            Bên cạnh hệ thống kho đề thi và tài liệu học tập khổng lồ, <strong>VNDocs</strong> còn phát triển một <strong>bộ công cụ tiện ích hoàn toàn miễn phí</strong> nhằm hỗ trợ tối đa cho học sinh, sinh viên và nhân viên văn phòng. 
            Mọi thao tác xử lý file đều được thực hiện trực tiếp trên trình duyệt của bạn (Client-side), đảm bảo <strong>tuyệt đối an toàn và bảo mật dữ liệu</strong> vì tài liệu sẽ không bao giờ bị tải lên bất kỳ máy chủ nào.
          </p>
          
          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Tính Năng Xử Lý File PDF Mạnh Mẽ</h3>
          <p className="mb-4">
            Bộ công cụ của chúng tôi cung cấp các tính năng chuyên sâu để thao tác với tệp tin PDF như:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Gộp PDF (Merge PDF):</strong> Cho phép bạn chọn nhiều file PDF riêng lẻ hoặc hình ảnh và hợp nhất chúng thành một tệp tin duy nhất. Việc sắp xếp thứ tự trang chỉ cần thao tác kéo thả đơn giản.</li>
            <li><strong>Xóa trang PDF (Remove PDF Pages):</strong> Bạn có một tài liệu dài và chỉ muốn trích xuất những trang quan trọng? Tính năng xóa trang sẽ giúp bạn lược bỏ các trang thừa thãi để tối ưu hóa dung lượng.</li>
            <li><strong>Chuyển đổi PDF (PDF Converter):</strong> Chuyển đổi định dạng PDF sang ảnh (JPG, PNG) cực kỳ sắc nét để dễ dàng chia sẻ, hoặc nén file PDF dung lượng cao.</li>
            <li><strong>Khóa và Bảo mật PDF (Protect PDF):</strong> Mã hóa file bằng mật khẩu chống sao chép và in ấn, hoặc mở khóa các tài liệu bị giới hạn (yêu cầu mật khẩu gốc).</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Máy Tính Bỏ Túi Giả Lập Trực Tuyến</h3>
          <p>
            Đặc biệt dành cho các bạn học sinh, sinh viên, hệ thống tích hợp sẵn <strong>trình giả lập Máy tính bỏ túi điện tử (Casio Fx-580VN X)</strong>. 
            Sở hữu giao diện quen thuộc, hỗ trợ đầy đủ các hàm lượng giác, giải phương trình, hệ phương trình, ma trận, thống kê... giúp bạn có thể học tập và tính toán mọi lúc mọi nơi ngay trên trình duyệt mà không cần phải cài đặt thêm phần mềm phức tạp nào.
          </p>
        </article>
      </section>
    </div>
  )
}

