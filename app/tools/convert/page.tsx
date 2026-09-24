import { Metadata } from 'next'
import FileConverterWrapper from './FileConverterWrapper'

export const metadata: Metadata = {
  title: 'Chuyển Đổi Định Dạng File PDF / Ảnh | VNDocs',
  description: 'Tiện ích hỗ trợ chuyển đổi từ Hình ảnh sang PDF và xuất trang PDF thành Hình ảnh (JPG, PNG) miễn phí 100%.',
  keywords: 'chuyển pdf sang ảnh, chuyển ảnh sang pdf, pdf to jpg, jpg to pdf, pdf converter',
  openGraph: {
    title: 'Chuyển Đổi Định Dạng File PDF / Ảnh | VNDocs',
    description: 'Tiện ích hỗ trợ chuyển đổi từ Hình ảnh sang PDF và xuất trang PDF thành Hình ảnh (JPG, PNG) miễn phí 100%.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function ConvertToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Chuyá»ƒn Äá»•i Äá»‹nh Dáº¡ng File</h1>
        <p className="text-ink-muted">
          Tiá»‡n Ã­ch há»— trá»£ chuyá»ƒn Ä‘á»•i tá»« HÃ¬nh áº£nh sang PDF vÃ  xuáº¥t trang PDF thÃ nh HÃ¬nh áº£nh (JPG, PNG).
        </p>
      </div>

      <FileConverterWrapper />
    </div>
  )
}

