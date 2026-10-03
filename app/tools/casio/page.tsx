import { Metadata } from 'next'
import Link from 'next/link'
import { CasioCalculator } from '@/src/components/tools/CasioCalculator'

export const metadata: Metadata = {
  title: 'Máy Tính Casio Online (Fx-580VN X) | VNDocs',
  description: 'Trình giả lập máy tính bỏ túi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trực tuyến miễn phí giúp giải toán nhanh chóng.',
  openGraph: {
    title: 'Máy Tính Casio Online (Fx-580VN X) | VNDocs',
    description: 'Trình giả lập máy tính bỏ túi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trực tuyến miễn phí giúp giải toán nhanh chóng.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function CasioToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Giả lập Máy tính Casio Online</h1>
        <p className="text-slate-500">
          Phiên bản giả lập máy tính Casio fx-580VN X, fx-570VN Plus đầy đủ chức năng, hỗ trợ giải quyết các bài toán và công thức phức tạp nhất.
        </p>
      </div>

      <CasioCalculator />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Sử Dụng Máy Tính Casio Online</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Ứng dụng <strong>máy tính giả lập Casio trực tuyến</strong> là giải pháp hoàn hảo cho học sinh, sinh viên khi không mang theo máy tính vật lý. Hỗ trợ giải toán thần tốc ngay trên trình duyệt điện thoại hoặc máy tính.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Tính Năng Của Máy Tính Giả Lập
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Giao diện và phím bấm được thiết kế mô phỏng 100% tỷ lệ thực của máy Casio fx-580VN X, cho phép bạn thực hiện mọi phép toán từ cơ bản đến phức tạp:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Tính toán cơ bản:</strong> Cộng, trừ, nhân, chia, phân số, số thập phân tuần hoàn.</li>
                  <li><strong>Giải phương trình:</strong> Bậc 2, bậc 3, bậc 4, hệ phương trình 2-4 ẩn, bất phương trình.</li>
                  <li><strong>Toán cao cấp:</strong> Ma trận (Matrix), Véc-tơ, Số phức (Complex), Tích phân, Đạo hàm, Xác suất thống kê.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Ưu Điểm So Với App Cài Đặt
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Không cần cài đặt:</strong> Bạn không phải tốn dung lượng tải các phần mềm giả lập nặng nề trên PC hay App Store/CH Play. Chỉ cần mở web VNDocs là có thể bấm máy tính được ngay.</li>
                  <li><strong>Miễn phí & Không quảng cáo rác:</strong> Giao diện sạch sẽ, tập trung hoàn toàn vào việc tính toán, không bị quảng cáo video che mất màn hình lúc đang thi hoặc làm bài tập.</li>
                  <li><strong>Tương thích đa nền tảng:</strong> Chạy mượt mà trên iPad, iPhone, điện thoại Android hay Macbook, Windows.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}

