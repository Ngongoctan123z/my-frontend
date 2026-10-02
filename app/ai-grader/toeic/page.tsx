import { Metadata } from 'next'
import Script from 'next/script'
import { ToeicGraderClient } from './ToeicGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/toeic',
    'Luyá»‡n Writing TOEIC Báº±ng AI & Cháº¥m Äiá»ƒm Chuáº©n ETS | VNDocs',
    'CÃ´ng cá»¥ cháº¥m Ä‘iá»ƒm TOEIC Writing báº±ng AI tiÃªn tiáº¿n. Thá»±c hÃ nh mÃ´ táº£ áº£nh, viáº¿t email vÃ  viáº¿t bÃ i luáº­n theo format thá»±c táº¿. AI nháº­n xÃ©t chi tiáº¿t ngá»¯ phÃ¡p, tá»« vá»±ng vÃ  gá»£i Ã½ nÃ¢ng Ä‘iá»ƒm hiá»‡u quáº£.'
  )
}

export default function ToeicGraderPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CÃ´ng cá»¥ Cháº¥m Ä‘iá»ƒm TOEIC Writing báº±ng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'CÃ´ng cá»¥ cháº¥m Ä‘iá»ƒm TOEIC Writing báº±ng AI tiÃªn tiáº¿n. Thá»±c hÃ nh mÃ´ táº£ áº£nh, viáº¿t email vÃ  viáº¿t bÃ i luáº­n theo format thá»±c táº¿.',
    url: `${FRONTEND_URL}/ai-grader/toeic`
  }

  return (
    <div className="py-8">
      <Script
        id="toeic-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Luyá»‡n Viáº¿t TOEIC (Writing) báº±ng AI</h1>
        <p className="text-slate-600 font-medium">Ã”n luyá»‡n kÄ© nÄƒng viáº¿t TOEIC Q6-7 vÃ  Q8 vá»›i cÃ´ng nghá»‡ cháº¥m Ä‘iá»ƒm AI tá»©c thÃ¬. PhÃ¢n tÃ­ch chi tiáº¿t vÃ  Ä‘Æ°a ra gá»£i Ã½ nÃ¢ng band theo chuáº©n ETS hoÃ n toÃ n miá»…n phÃ­.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>
    </div>
  )
}
