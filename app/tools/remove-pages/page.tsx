import { Metadata } from 'next'
import Link from 'next/link'
import RemovePagesWrapper from './RemovePagesWrapper'

export const metadata: Metadata = {
  title: 'Cắt Trang & Xóa Trang PDF (Remove Pages) | VNDocs',
  description: 'Trích xuất, cắt tách và loại bỏ các trang PDF không mong muốn ra khỏi tài liệu một cách dễ dàng và hoàn toàn miễn phí.',
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
        <p className="text-slate-500 max-w-2xl mx-auto">
          Trích xuất, cắt tách và loại bỏ vĩnh viễn các trang thừa thãi ra khỏi tài liệu PDF của bạn. Thao tác siêu nhanh, xem trước trực quan từng trang và cam kết bảo mật quyền riêng tư tuyệt đối.
        </p>
      </div>

      <RemovePagesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Cắt Tách & Xóa Trang PDF Chuyên Nghiệp</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Đôi khi một file PDF dài cả trăm trang nhưng bạn chỉ cần lưu lại một vài trang quan trọng? Tính năng <strong>Xóa trang PDF (Remove PDF Pages)</strong> ra đời để giúp bạn tối ưu hóa tài liệu nhanh chóng.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Trực Quan Và Dễ Dàng Sử Dụng
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Giao diện công cụ được thiết kế cực kỳ trực quan, hiển thị bản xem trước thu nhỏ (Thumbnail) của từng trang PDF. Việc này giúp bạn:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Dễ dàng nhận diện nội dung từng trang mà không cần mở file lên đọc lại.</li>
                  <li>Click chọn vào trang muốn xóa (trang sẽ mờ đi) hoặc nhấp lại để bỏ chọn.</li>
                  <li>Loại bỏ hoàn toàn các trang bìa, mục lục thừa, hoặc các trang giấy trắng lỗi.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Bảo Mật Dữ Liệu Riêng Tư (Offline Mode)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Khác với các trang web cắt PDF trực tuyến khác yêu cầu upload file lên máy chủ (có rủi ro rò rỉ tài liệu), VNDocs ứng dụng công nghệ WebAssembly xử lý 100% tại thiết bị của bạn. Tài liệu của bạn <strong>không bao giờ chạm vào máy chủ của chúng tôi</strong>, đảm bảo an toàn tuyệt đối cho các hợp đồng, báo cáo tài chính hay đề thi bảo mật.</p>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Các Trường Hợp Nên Sử Dụng Công Cụ Này
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Tính năng loại bỏ trang sẽ phát huy tối đa tác dụng trong nhiều tình huống khác nhau:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Giảm dung lượng file:</strong> Bỏ đi những phần phụ lục không cần thiết, giúp file nhẹ hơn khi gửi email.</li>
                  <li><strong>Trích xuất dữ liệu:</strong> Bạn tải được một ebook dài 500 trang nhưng chỉ muốn giữ lại 1 chương duy nhất (ví dụ từ trang 20 đến 35)? Chỉ cần xóa hết các phần còn lại và lưu bản mới.</li>
                  <li><strong>Loại bỏ trang bị lỗi:</strong> Cắt bỏ trang trắng, trang bị mờ, hoặc trang bị ngược do lỗi scan tài liệu ban đầu.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
