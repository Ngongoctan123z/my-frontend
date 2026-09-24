import { Metadata } from 'next'
import { PdfLockUnlock } from '@/src/components/tools/PdfLockUnlock'

export const metadata: Metadata = {
  title: 'Bảo mật & Khóa File PDF | VNDocs',
  description: 'Công cụ đặt mật khẩu bảo vệ file PDF an toàn hoặc gỡ bỏ password cho các tài liệu PDF đã bị khóa.',
}

export default function LockToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Khóa và Gỡ Khóa PDF</h1>
        <p className="text-ink-muted">
          Tiện ích giúp bảo mật tài liệu cá nhân của bạn chỉ với một cú click chuột.
        </p>
      </div>

      <PdfLockUnlock />
    </div>
  )
}

