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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Chuyển Đổi Định Dạng Hình Ảnh Nhanh Chóng</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Với công cụ <strong>Chuyển đổi hình ảnh</strong> trực tuyến của VNDocs, bạn có thể dễ dàng chuyển đổi qua lại giữa các định dạng ảnh phổ biến (JPG, PNG, WEBP) chỉ với một cú click chuột mà không làm giảm chất lượng.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Tại Sao Cần Chuyển Đổi Định Dạng Ảnh?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>WEBP sang JPG/PNG:</strong> Rất nhiều ảnh tải từ web hiện nay có định dạng WEBP siêu nhẹ, nhưng lại không thể mở được trên một số phần mềm cũ như Photoshop hoặc Word. Chuyển đổi sang JPG sẽ giúp bạn dễ dàng chỉnh sửa.</li>
                  <li><strong>PNG sang JPG:</strong> Nếu bạn có một bức ảnh PNG sắc nét nhưng dung lượng quá lớn (vài chục MB), việc chuyển sang JPG sẽ giúp giảm thiểu 90% dung lượng mà không nhận ra sự khác biệt bằng mắt thường. Cực kỳ hữu ích khi cần upload ảnh lên làm hồ sơ, nộp CV.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Ưu Điểm Tuyệt Đối Của Công Cụ VNDocs
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Khác với các web nước ngoài đầy rẫy quảng cáo popup, VNDocs mang lại trải nghiệm hoàn toàn khác biệt:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Hoàn toàn Offline:</strong> Công nghệ xử lý trình duyệt cho phép chuyển đổi ảnh ngay trên máy của bạn. Nghĩa là ảnh của bạn KHÔNG bị tải lên bất kỳ máy chủ nào. An toàn tuyệt đối với ảnh cá nhân, CCCD hay giấy tờ tuỳ thân.</li>
                  <li><strong>Chuyển đổi hàng loạt (Batch Convert):</strong> Cho phép bạn kéo thả cả chục tấm hình cùng lúc và nhấn nút chuyển đổi. Rất tiết kiệm thời gian.</li>
                  <li><strong>Tốc độ ánh sáng:</strong> Vì không cần tải ảnh lên mạng nên quá trình convert diễn ra ngay lập tức, tốn chưa tới 1 giây cho mỗi ảnh.</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
