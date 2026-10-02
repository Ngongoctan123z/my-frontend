import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { CasioCalculator } from '@/src/components/tools/CasioCalculator'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/casio',
    'MÃ¡y TÃ­nh Casio Online (Fx-580VN X) | VNDocs',
    'TrÃ¬nh giáº£ láº­p mÃ¡y tÃ­nh bá» tÃºi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trá»±c tuyáº¿n miá»…n phÃ­ giÃºp giáº£i toÃ¡n nhanh chÃ³ng.'
  )
}

export default function CasioToolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MÃ¡y TÃ­nh Casio Online (Fx-580VN X)',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'TrÃ¬nh giáº£ láº­p mÃ¡y tÃ­nh bá» tÃºi Casio fx-580VN X, fx-570VN Plus, fx-880BTG trá»±c tuyáº¿n miá»…n phÃ­ giÃºp giáº£i toÃ¡n nhanh chÃ³ng.',
    url: `${FRONTEND_URL}/tools/casio`
  }

  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <Script
        id="casio-software-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Giáº£ láº­p MÃ¡y tÃ­nh Casio Online</h1>
        <p className="text-slate-500">
          PhiÃªn báº£n giáº£ láº­p mÃ¡y tÃ­nh Casio fx-580VN X, fx-570VN Plus Ä‘áº§y Ä‘á»§ chá»©c nÄƒng, há»— trá»£ giáº£i quyáº¿t cÃ¡c bÃ i toÃ¡n vÃ  cÃ´ng thá»©c phá»©c táº¡p nháº¥t.
        </p>
      </div>

      <CasioCalculator />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n Sá»­ Dá»¥ng MÃ¡y TÃ­nh Casio Online</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            á»¨ng dá»¥ng <strong>mÃ¡y tÃ­nh giáº£ láº­p Casio trá»±c tuyáº¿n</strong> lÃ  giáº£i phÃ¡p hoÃ n háº£o cho há»c sinh, sinh viÃªn khi khÃ´ng mang theo mÃ¡y tÃ­nh váº­t lÃ½. Há»— trá»£ giáº£i toÃ¡n tháº§n tá»‘c ngay trÃªn trÃ¬nh duyá»‡t Ä‘iá»‡n thoáº¡i hoáº·c mÃ¡y tÃ­nh.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. TÃ­nh NÄƒng Cá»§a MÃ¡y TÃ­nh Giáº£ Láº­p
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Giao diá»‡n vÃ  phÃ­m báº¥m Ä‘Æ°á»£c thiáº¿t káº¿ mÃ´ phá»ng 100% tá»· lá»‡ thá»±c cá»§a mÃ¡y Casio fx-580VN X, cho phÃ©p báº¡n thá»±c hiá»‡n má»i phÃ©p toÃ¡n tá»« cÆ¡ báº£n Ä‘áº¿n phá»©c táº¡p:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>TÃ­nh toÃ¡n cÆ¡ báº£n:</strong> Cá»™ng, trá»«, nhÃ¢n, chia, phÃ¢n sá»‘, sá»‘ tháº­p phÃ¢n tuáº§n hoÃ n.</li>
                  <li><strong>Giáº£i phÆ°Æ¡ng trÃ¬nh:</strong> Báº­c 2, báº­c 3, báº­c 4, há»‡ phÆ°Æ¡ng trÃ¬nh 2-4 áº©n, báº¥t phÆ°Æ¡ng trÃ¬nh.</li>
                  <li><strong>ToÃ¡n cao cáº¥p:</strong> Ma tráº­n (Matrix), VÃ©c-tÆ¡, Sá»‘ phá»©c (Complex), TÃ­ch phÃ¢n, Äáº¡o hÃ m, XÃ¡c suáº¥t thá»‘ng kÃª.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Æ¯u Äiá»ƒm So Vá»›i App CÃ i Äáº·t
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>KhÃ´ng cáº§n cÃ i Ä‘áº·t:</strong> Báº¡n khÃ´ng pháº£i tá»‘n dung lÆ°á»£ng táº£i cÃ¡c pháº§n má»m giáº£ láº­p náº·ng ná» trÃªn PC hay App Store/CH Play. Chá»‰ cáº§n má»Ÿ web VNDocs lÃ  cÃ³ thá»ƒ báº¥m mÃ¡y tÃ­nh Ä‘Æ°á»£c ngay.</li>
                  <li><strong>Miá»…n phÃ­ & KhÃ´ng quáº£ng cÃ¡o rÃ¡c:</strong> Giao diá»‡n sáº¡ch sáº½, táº­p trung hoÃ n toÃ n vÃ o viá»‡c tÃ­nh toÃ¡n, khÃ´ng bá»‹ quáº£ng cÃ¡o video che máº¥t mÃ n hÃ¬nh lÃºc Ä‘ang thi hoáº·c lÃ m bÃ i táº­p.</li>
                  <li><strong>TÆ°Æ¡ng thÃ­ch Ä‘a ná»n táº£ng:</strong> Cháº¡y mÆ°á»£t mÃ  trÃªn iPad, iPhone, Ä‘iá»‡n thoáº¡i Android hay Macbook, Windows.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}

