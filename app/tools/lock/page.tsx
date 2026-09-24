import { Metadata } from 'next'
import { PdfLockUnlock } from '@/src/components/tools/PdfLockUnlock'

export const metadata: Metadata = {
  title: 'Khóa & Mở Khóa PDF Online Miễn Phí | VNDocs',
  description: 'Công cụ đặt mật khẩu bảo vệ file PDF an toàn tuyệt đối (AES-256) hoặc gỡ bỏ mật khẩu PDF nhanh chóng. Không lưu file trên máy chủ.',
  keywords: 'khóa pdf, mở khóa pdf, đặt mật khẩu pdf, gỡ mật khẩu pdf, pdf password remover, encrypt pdf',
  openGraph: {
    title: 'Khóa & Mở Khóa PDF Online Miễn Phí | VNDocs',
    description: 'Công cụ đặt mật khẩu bảo vệ file PDF an toàn tuyệt đối (AES-256) hoặc gỡ bỏ mật khẩu PDF nhanh chóng. Không lưu file trên máy chủ.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function LockToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">KhÃ³a vÃ  Gá»¡ KhÃ³a PDF</h1>
        <p className="text-ink-muted">
          Tiá»‡n Ã­ch giÃºp báº£o máº­t tÃ i liá»‡u cÃ¡ nhÃ¢n cá»§a báº¡n chá»‰ vá»›i má»™t cÃº click chuá»™t.
        </p>
      </div>

      <PdfLockUnlock />
    </div>
  )
}


