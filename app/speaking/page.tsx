import { Metadata } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import { FRONTEND_URL } from '@/src/utils/constants'
import { SpeakingClient } from './SpeakingClient'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Luyện IELTS & TOEIC Speaking Online | VNDocs',
    description: 'Luyện Speaking IELTS và TOEIC: chọn đề, thu âm, nghe lại và nhận góp ý từ AI. Luyện từng phần hoặc thi thử trọn bộ.',
    openGraph: {
      title: 'Luyện Speaking IELTS & TOEIC AI | VNDocs',
      description: 'Luyện IELTS Part 1–3 và đủ 11 câu TOEIC Speaking. Lưu bản thu, xem nhận xét từng câu và hỏi AI Coach.',
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
  description: 'Luyện IELTS và TOEIC Speaking với bản thu, nhận xét luyện tập và lịch sử theo tài khoản.',
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

