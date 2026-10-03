import { Metadata } from 'next'
import Link from 'next/link'
import PdfLockUnlockWrapper from './PdfLockUnlockWrapper'

export const metadata: Metadata = {
  title: 'Khóa / Mở Khóa File PDF (Protect PDF) | VNDocs',
  description: 'Công cụ mã hóa file PDF bằng mật khẩu chống xem, chống in hoặc xóa bỏ mật khẩu bảo vệ PDF nhanh chóng.',
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

      <PdfLockUnlockWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Mã Hóa & Gỡ Mật Khẩu PDF</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            An toàn thông tin là yếu tố quan trọng hàng đầu trong học tập và công việc. Công cụ <strong>Khóa & Mở khóa File PDF</strong> của VNDocs giúp bạn bảo mật các tài liệu nhạy cảm bằng một lớp mật khẩu vững chắc.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Tính Năng Khóa File (Protect PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Khi bạn gửi một bảng báo giá, hợp đồng hay một bài luận quan trọng cho người khác qua mạng, việc mã hóa PDF là vô cùng cần thiết:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Chống sao chép & In ấn:</strong> Bằng cách cài đặt mật khẩu, bạn có thể ngăn chặn bất kỳ ai in tài liệu hoặc copy nội dung văn bản bên trong nếu không có sự cho phép.</li>
                  <li><strong>Mã hóa AES cao cấp:</strong> Hệ thống sử dụng chuẩn mã hóa tiên tiến nhất hiện nay, đảm bảo không một phần mềm phá khóa nào có thể mở được file nếu không biết mật khẩu gốc.</li>
                  <li><strong>Cách dùng:</strong> Kéo thả file PDF vào ô tải lên ➔ Nhập mật khẩu bạn muốn cài đặt ➔ Nhấn Khóa PDF.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Tính Năng Mở Khóa (Unlock PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Tính năng này dùng để loại bỏ vĩnh viễn mật khẩu của một file PDF mà bạn đã biết trước mật khẩu gốc, giúp những lần mở sau tiện lợi hơn:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Gỡ bỏ ràng buộc:</strong> Khôi phục lại các quyền in ấn, chỉnh sửa và sao chép văn bản đã bị khóa trước đó.</li>
                  <li><strong>Không lưu trữ:</strong> Khác với nhiều website khác sẽ tải file của bạn lên server của họ, VNDocs chạy 100% bằng sức mạnh trình duyệt (Offline Mode). Không có gì bị tải lên mạng, bảo vệ 100% dữ liệu riêng tư của bạn.</li>
                  <li><strong>Cách dùng:</strong> Kéo thả file PDF đã bị khóa vào ➔ Hệ thống sẽ hỏi mật khẩu hiện tại ➔ Nhập mật khẩu và nhấn Mở Khóa. File tải về sẽ hoàn toàn "sạch bóng" mật khẩu.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
