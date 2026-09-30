import { Metadata } from 'next'
import { AiGraderClient } from './AiGraderClient'

import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader',
    'Luyện Writing IELTS Bằng AI & Chấm Điểm Chuẩn Band | VNDocs',
    'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí (TR, CC, LR, GRA), sửa lỗi ngữ pháp, từ vựng và gợi ý nâng band điểm tự động. Tự học IELTS hiệu quả cùng VNDocs.'
  )
}

export default function AiGraderPage() {
  return <AiGraderClient />
}
