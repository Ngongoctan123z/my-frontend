import { Metadata } from 'next'
import { TopikGraderClient } from './TopikGraderClient'

export const metadata: Metadata = {
  title: 'Chấm Thi Writing TOPIK II AI | VNDocs',
  description: 'Tính năng luyện viết và chấm điểm TOPIK bằng AI với kết quả chuẩn xác.',
}

export default function TopikPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Chấm Điểm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">TOPIK AI</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Luyện tập Viết TOPIK II (Câu 51-54) chuẩn form với đánh giá tự động và sửa lỗi chi tiết từng câu tiếng Hàn từ Trí Tuệ Nhân Tạo.
          </p>
        </div>
        <TopikGraderClient />
      </div>
    </div>
  )
}
