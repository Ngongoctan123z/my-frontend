import { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Chuyển Đổi File Online | VNDocs',
  description: 'Chuyển đổi linh hoạt giữa các định dạng PDF sang Ảnh (JPG/PNG) và ngược lại hoàn toàn miễn phí.',
}

import dynamic from 'next/dynamic'

const FileConverter = dynamic(() => import('@/src/components/tools/FileConverter').then(mod => mod.FileConverter), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-ink-muted">Đang tải công cụ...</div>
})

export default function ConvertToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Chuyển Đổi Định Dạng File</h1>
        <p className="text-ink-muted">
          Tiện ích hỗ trợ chuyển đổi từ Hình ảnh sang PDF và xuất trang PDF thành Hình ảnh (JPG, PNG).
        </p>
      </div>

      <FileConverter />
    </div>
  )
}
