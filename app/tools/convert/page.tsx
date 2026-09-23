import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chuyển đổi File PDF & Word | Kho Đề Thi',
  description: 'Công cụ chuyển đổi định dạng linh hoạt giữa PDF sang Word (Docx), Ảnh (JPG/PNG) và ngược lại hoàn toàn miễn phí.',
}

export default function ConvertToolPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Chuyển đổi định dạng File</h1>
        <p className="text-ink-muted">
          PDF sang Word, PDF sang Ảnh và nhiều tính năng chuyển đổi tài liệu khác.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-dashed border-line bg-surface text-center">
        <p className="text-lg font-medium text-ink">⏳ Sắp ra mắt!</p>
        <p className="text-sm text-ink-muted mt-2">Hệ thống xử lý file đang được xây dựng.</p>
      </div>
    </div>
  )
}
