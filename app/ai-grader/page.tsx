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
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">
          Trợ Lý <span className="text-primary">AI Chấm Thi Writing</span>
        </h1>
        <p className="text-lg text-ink-muted max-w-2xl mx-auto">
          Tạo đề ngẫu nhiên và nhận điểm số, nhận xét chi tiết từng tiêu chí, sửa lỗi ngữ pháp cùng chuyên gia AI 24/7.
        </p>
      </div>

      <AiGraderClient />
    </div>
  )
}
