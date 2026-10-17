import { Metadata } from 'next'
import { PremiumClient } from './PremiumClient'

export const metadata: Metadata = {
  title: 'Nâng cấp Premium — Mở khoá chấm bài AI không giới hạn | VNDocs',
  description: 'Nâng cấp VNDocs Premium để chấm bài IELTS, TOEIC, TOPIK không giới hạn, tạo đề thi tuỳ chỉnh và trải nghiệm học tập toàn diện.',
}

export default function PremiumPage() {
  return <PremiumClient />
}
