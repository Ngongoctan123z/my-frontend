import { Metadata } from 'next'
import { CasioCalculator } from '@/src/components/tools/CasioCalculator'

export const metadata: Metadata = {
  title: 'Máy Tính Casio Online (Fx-580VN X) | VNDocs',
  description: 'Trình giả lập máy tính bỏ túi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trực tuyến miễn phí giúp giải toán nhanh chóng.',
  keywords: 'máy tính casio online, casio fx 580vn x online, giả lập casio, máy tính bỏ túi online',
  openGraph: {
    title: 'Máy Tính Casio Online (Fx-580VN X) | VNDocs',
    description: 'Trình giả lập máy tính bỏ túi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trực tuyến miễn phí giúp giải toán nhanh chóng.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function CasioToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">MÃ¡y tÃ­nh Casio Fx-580VN X</h1>
        <p className="text-ink-muted">
          PhiÃªn báº£n giáº£ láº­p mÃ¡y tÃ­nh bá» tÃºi trá»±c tuyáº¿n há»— trá»£ tÃ­nh toÃ¡n nhanh.
        </p>
      </div>

      <CasioCalculator />
    </div>
  )
}


