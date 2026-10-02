import { Metadata } from 'next'
import Script from 'next/script'
import { HskGraderClient } from './HskGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/hsk',
    'Cháº¥m Äiá»ƒm Writing HSK Báº±ng AI & Luyá»‡n Viáº¿t Tiáº¿ng Trung | VNDocs',
    'Trá»£ lÃ½ AI cháº¥m Ä‘iá»ƒm bÃ i viáº¿t HSK (cáº¥p 4, 5, 6) nhanh chÃ³ng, chÃ­nh xÃ¡c. Kiá»ƒm tra ngá»¯ phÃ¡p, lá»—i dÃ¹ng tá»«, thá»© tá»± nÃ©t chá»¯ HÃ¡n vÃ  Ä‘Æ°a ra nháº­n xÃ©t chuyÃªn sÃ¢u giÃºp cáº£i thiá»‡n ká»¹ nÄƒng Viáº¿t tiáº¿ng Trung.'
  )
}

export default function HskPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CÃ´ng cá»¥ Cháº¥m Ä‘iá»ƒm HSK Writing báº±ng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Trá»£ lÃ½ AI cháº¥m Ä‘iá»ƒm bÃ i viáº¿t HSK (cáº¥p 4, 5, 6) nhanh chÃ³ng, chÃ­nh xÃ¡c. Kiá»ƒm tra ngá»¯ phÃ¡p, lá»—i dÃ¹ng tá»«, thá»© tá»± nÃ©t chá»¯ HÃ¡n.',
    url: `${FRONTEND_URL}/ai-grader/hsk`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <Script
        id="hsk-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Cháº¥m Äiá»ƒm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">HSK AI</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Luyá»‡n táº­p Viáº¿t HSK 5, HSK 6 theo format chuáº©n vá»›i nháº­n xÃ©t chi tiáº¿t vÃ  sá»­a lá»—i tá»± Ä‘á»™ng tá»« há»‡ thá»‘ng AI chuyÃªn sÃ¢u tiáº¿ng Trung hoÃ n toÃ n miá»…n phÃ­.
          </p>
        </div>
        <HskGraderClient />
      </div>
    </div>
  )
}
