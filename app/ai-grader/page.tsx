import { Metadata } from 'next'
import { AiGraderClient } from './AiGraderClient'

export const metadata: Metadata = {
  title: 'Chấm Thi Writing IELTS & TOEIC AI | VNDocs',
  description: 'Hệ thống ứng dụng Trí tuệ nhân tạo (AI) tự động tạo đề và chấm chữa chi tiết bài viết IELTS Task 2, TOEIC Writing theo chuẩn rubric quốc tế.',
}

export default function AiGraderPage() {
  return <AiGraderClient />
}
