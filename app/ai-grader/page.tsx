import { Metadata } from 'next'
import { AiGraderClient } from './AiGraderClient'

export const metadata: Metadata = {
  title: 'Luyện Writing IELTS Bằng AI & Chấm Điểm Chuẩn Band | VNDocs',
  description: 'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí (TR, CC, LR, GRA), sửa lỗi ngữ pháp, từ vựng và gợi ý nâng band điểm tự động. Tự học IELTS hiệu quả cùng VNDocs.',
  keywords: 'luyện writing ielts bằng ai, chấm điểm ielts writing ai, luyện thi ielts, sửa bài ielts task 1, ielts task 2, tự học ielts, đánh giá band điểm ielts',
  openGraph: {
    title: 'Luyện Writing IELTS Bằng AI & Chấm Điểm Chuẩn Band',
    description: 'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí, sửa lỗi và gợi ý nâng band điểm.',
  }
}

export default function AiGraderPage() {
  return <AiGraderClient />
}
