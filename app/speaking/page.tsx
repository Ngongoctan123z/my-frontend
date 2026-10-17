import { Metadata } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import { FRONTEND_URL } from '@/src/utils/constants'
import { SpeakingClient } from './SpeakingClient'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Luyện IELTS & TOEIC Speaking Online Chuẩn Barem | VNDocs',
    description: 'Phòng luyện Speaking IELTS và TOEIC trực tuyến với AI. Thu âm giọng nói, phân tích độ trôi chảy, phát hiện khoảng nghỉ, nhận xét chi tiết theo barem khảo thí.',
    openGraph: {
      title: 'Luyện Speaking IELTS & TOEIC AI | VNDocs',
      description: 'Luyện nói IELTS Part 1-3, TOEIC Q1-11. AI phân tích fluency, từ phát âm sai, khoảng nghỉ và đưa ra câu hỏi follow-up.',
      url: `${FRONTEND_URL}/speaking`,
    }
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Phòng Luyện Speaking IELTS & TOEIC Trực Tuyến VNDocs',
  operatingSystem: 'Web',
  applicationCategory: 'EducationalApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
  description: 'Luyện tập nói IELTS và TOEIC với AI. Phân tích fluency, khoảng nghỉ và phát âm sai theo barem chính thức.',
  url: `${FRONTEND_URL}/speaking`
}

export default function SpeakingPage() {
  return (
    <div className="py-2.5 sm:py-6">
      <Script
        id="speaking-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Đang tải phòng luyện Speaking...</div>}>
        <SpeakingClient />
      </Suspense>
    </div>
  )
}
