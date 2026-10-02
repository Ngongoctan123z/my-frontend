import { Metadata } from 'next'
import Script from 'next/script'
import { TopikGraderClient } from './TopikGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/topik',
    'Cháº¥m Äiá»ƒm Writing TOPIK Báº±ng AI & Luyá»‡n Viáº¿t TOPIK II | VNDocs',
    'Tráº£i nghiá»‡m pháº§n má»m cháº¥m bÃ i viáº¿t TOPIK (cÃ¢u 51-54) báº±ng AI. Cháº¥m Ä‘iá»ƒm chi tiáº¿t, sá»­a lá»—i ngá»¯ phÃ¡p tiáº¿ng HÃ n, gá»£i Ã½ tá»« vá»±ng cao cáº¥p, dá»± Ä‘oÃ¡n Ä‘iá»ƒm sá»‘ TOPIK chÃ­nh xÃ¡c.'
  )
}

export default function TopikPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CÃ´ng cá»¥ Cháº¥m Ä‘iá»ƒm TOPIK Writing báº±ng AI',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Tráº£i nghiá»‡m pháº§n má»m cháº¥m bÃ i viáº¿t TOPIK (cÃ¢u 51-54) báº±ng AI. Cháº¥m Ä‘iá»ƒm chi tiáº¿t, sá»­a lá»—i ngá»¯ phÃ¡p tiáº¿ng HÃ n, gá»£i Ã½ tá»« vá»±ng cao cáº¥p.',
    url: `${FRONTEND_URL}/ai-grader/topik`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <Script
        id="topik-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Cháº¥m Äiá»ƒm Writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">TOPIK AI</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            Luyá»‡n táº­p Viáº¿t TOPIK II (CÃ¢u 51-54) chuáº©n form vá»›i Ä‘Ã¡nh giÃ¡ tá»± Ä‘á»™ng vÃ  sá»­a lá»—i chi tiáº¿t tá»«ng cÃ¢u tiáº¿ng HÃ n tá»« TrÃ­ Tuá»‡ NhÃ¢n Táº¡o hoÃ n toÃ n miá»…n phÃ­.
          </p>
        </div>
        <TopikGraderClient />
      </div>
    </div>
  )
}
