import { Metadata } from 'next'
import { CasioCalculator } from '@/components/tools/CasioCalculator'

export const metadata: Metadata = {
  title: 'Máy tính Casio Online | VNDocs',
  description: 'Trình giả lập máy tính bỏ túi Casio Fx-580VN X trực tuyến giúp học sinh giải toán nhanh chóng, mọi lúc mọi nơi.',
}

export default function CasioToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Máy tính Casio Fx-580VN X</h1>
        <p className="text-ink-muted">
          Phiên bản giả lập máy tính bỏ túi trực tuyến hỗ trợ tính toán nhanh.
        </p>
      </div>

      <CasioCalculator />
    </div>
  )
}

