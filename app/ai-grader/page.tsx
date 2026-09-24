import { Metadata } from 'next'
import { AiGraderClient } from './AiGraderClient'

export const metadata: Metadata = {
  title: 'Chấm Thi Writing IELTS & TOEIC AI | VNDocs',
  description: 'Hệ thống ứng dụng Trí tuệ nhân tạo (AI) tự động tạo đề và chấm chữa chi tiết bài viết IELTS Task 2, TOEIC Writing theo chuẩn rubric quốc tế.',
}

export default function AiGraderPage() {
  return (
    <div className="py-12 px-4 sm:px-6 w-full max-w-6xl mx-auto">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Công Cụ Chấm Điểm Writing Tự Động
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Hệ thống tự động chấm điểm bài thi IELTS & TOEIC, phân tích lỗi ngữ pháp và nhận xét chi tiết 4 tiêu chí.
        </p>
      </div>

      <AiGraderClient />
    </div>
  )
}
