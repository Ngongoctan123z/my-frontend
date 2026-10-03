import { Metadata } from 'next'
import Link from 'next/link'
import MergeFilesWrapper from './MergeFilesWrapper'

export const metadata: Metadata = {
  title: 'Gộp File PDF (Merge PDF) | VNDocs',
  description: 'Ghép nối nhiều tài liệu PDF hoặc hình ảnh thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả siêu nhanh và bảo mật 100%.',
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Gộp Nhiều Tài Liệu</h1>
        <p className="text-slate-500">
          Ghép nhiều tài liệu hoặc hình ảnh thành một bản duy nhất. Sắp xếp thứ tự các file bằng thao tác kéo thả.
        </p>
      </div>

      <MergeFilesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Cách Gộp File PDF Siêu Nhanh</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Tính năng <strong>Gộp File PDF (Merge PDF)</strong> của VNDocs là giải pháp tối ưu khi bạn cần tổng hợp nhiều giấy tờ, báo cáo hay biểu mẫu rời rạc thành một văn bản thống nhất.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Tính Năng Vượt Trội
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Hỗ trợ trộn Hình Ảnh & PDF:</strong> Công cụ của chúng tôi không chỉ gộp các file PDF với nhau mà còn cho phép chèn thêm các file Hình ảnh (JPG, PNG) trực tiếp vào quá trình gộp để tạo thành 1 file PDF duy nhất.</li>
                  <li><strong>Kéo và Thả (Drag & Drop) thông minh:</strong> Bạn chỉ cần thả các file vào trình duyệt, bấm giữ và kéo thả (Drag) các file để thay đổi thứ tự trang trước khi xuất bản một cách cực kỳ trực quan.</li>
                  <li><strong>Bảo mật tuyệt đối 100%:</strong> Tất cả xử lý (đọc, gộp, xuất file) đều chạy hoàn toàn độc lập trên trình duyệt máy tính của bạn bằng công nghệ WebAssembly. Cam kết không có bất kỳ file nào của bạn bị upload lên máy chủ.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Hướng Dẫn Sử Dụng
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Bấm nút <strong>"Chọn File"</strong> hoặc kéo thả các file PDF/Hình ảnh vào khu vực quy định.</li>
                  <li>Chờ hệ thống tải file (diễn ra cực nhanh vì không tốn thời gian upload lên mạng).</li>
                  <li>Di chuyển chuột để sắp xếp lại thứ tự các file nếu cần thiết.</li>
                  <li>Bấm nút <strong>"Gộp File Ngay"</strong> và hệ thống sẽ tự động tải file PDF hoàn chỉnh về máy của bạn.</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
