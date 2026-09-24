import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cắt / Gộp File PDF | VNDocs',
  description: 'Trình quản lý PDF đa năng: Cho phép ghép nhiều tài liệu thành một file duy nhất hoặc tách rời các trang tài liệu dễ dàng.',
}

export default function SplitMergeToolPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Cắt và Gộp File PDF</h1>
        <p className="text-ink-muted">
          Chỉnh sửa tài liệu linh hoạt theo ý muốn của bạn mà không làm giảm chất lượng.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-dashed border-line bg-surface text-center">
        <p className="text-lg font-medium text-ink">⏳ Sắp ra mắt!</p>
        <p className="text-sm text-ink-muted mt-2">Công cụ đang trong quá trình phát triển.</p>
      </div>
    </div>
  )
}

