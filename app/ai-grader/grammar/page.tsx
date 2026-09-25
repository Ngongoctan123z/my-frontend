import { Metadata } from 'next'
import { Construction } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Soi Lỗi Gắt AI | VNDocs',
}

export default function GrammarPage() {
  return (
    <div className="bg-white rounded-xl border border-line p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[400px]">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
        <Construction size={32} />
      </div>
      <h2 className="text-xl font-bold text-ink">Công cụ Soi Lỗi Gắt đang được phát triển</h2>
      <p className="text-ink-muted max-w-md text-sm">
        AI sẽ trở thành "giám thị khó tính", chấm cấu trúc, độ thông hiểu và bóc tách từng lỗi sai ngữ pháp nhỏ nhất của bạn.
      </p>
    </div>
  )
}
