import { Metadata } from 'next'
import { HskGraderClient } from './HskGraderClient'

export const metadata: Metadata = {
  title: 'Chấm Thi Writing HSK AI | VNDocs',
  description: 'Tính năng luyện viết và chấm điểm HSK bằng AI với kết quả chuẩn xác.',
}

export default function HskPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Chấm Điểm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">HSK AI</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Luyện tập Viết HSK 5, HSK 6 theo format chuẩn với nhận xét chi tiết và sửa lỗi tự động từ hệ thống AI chuyên sâu tiếng Trung.
          </p>
        </div>
        <HskGraderClient />
      </div>
    </div>
  )
}
