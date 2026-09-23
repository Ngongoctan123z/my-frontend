import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Máy tính Casio Online | Kho Đề Thi',
  description: 'Trình giả lập máy tính bỏ túi Casio Fx-580VN X trực tuyến giúp học sinh giải toán nhanh chóng, mọi lúc mọi nơi.',
}

export default function CasioToolPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Máy tính Casio Fx-580VN X</h1>
        <p className="text-ink-muted">
          Phiên bản giả lập máy tính bỏ túi trực tuyến. Đang được tích hợp.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-dashed border-line bg-surface text-center">
        <p className="text-lg font-medium text-ink">⏳ Sắp ra mắt!</p>
        <p className="text-sm text-ink-muted mt-2">Giao diện máy tính Casio sẽ xuất hiện tại đây.</p>
      </div>
    </div>
  )
}
