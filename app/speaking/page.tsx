import { getCoreMetadata } from '@/src/utils/serverSeo'
import { Metadata } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import { FRONTEND_URL } from '@/src/utils/constants'
import { SpeakingClient } from './SpeakingClient'

export async function generateMetadata(): Promise<Metadata> { return getCoreMetadata('/speaking') }

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Phòng Luyện Speaking IELTS & TOEIC Trực Tuyến VNDocs',
  operatingSystem: 'Web',
  inLanguage: 'vi',
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

