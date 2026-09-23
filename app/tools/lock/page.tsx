import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bảo mật & Khóa File PDF | Kho Đề Thi',
  description: 'Công cụ đặt mật khẩu bảo vệ file PDF an toàn hoặc gỡ bỏ password cho các tài liệu PDF đã bị khóa.',
}

export default function LockToolPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Khóa và Gỡ Khóa PDF</h1>
        <p className="text-ink-muted">
          Tiện ích giúp bảo mật tài liệu cá nhân của bạn chỉ với một cú click chuột.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-dashed border-line bg-surface text-center">
        <p className="text-lg font-medium text-ink">⏳ Sắp ra mắt!</p>
        <p className="text-sm text-ink-muted mt-2">Chúng tôi đang cấu hình công cụ mã hóa file.</p>
      </div>
    </div>
  )
}
