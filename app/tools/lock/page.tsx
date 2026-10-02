import { Metadata } from 'next'
import Link from 'next/link'
import PdfLockUnlockWrapper from './PdfLockUnlockWrapper'
import { getRouteMetadata } from '@/src/utils/serverSeo'



export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/lock',
    'KhÃ³a / Má»Ÿ KhÃ³a File PDF (Protect PDF) | VNDocs',
    'CÃ´ng cá»¥ mÃ£ hÃ³a file PDF báº±ng máº­t kháº©u chá»‘ng xem, chá»‘ng in hoáº·c xÃ³a bá» máº­t kháº©u báº£o vá»‡ PDF nhanh chÃ³ng.'
  )
}

export default function LockToolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công c? Ð?t m?t kh?u file PDF',
    operatingSystem: 'Web',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'B?o m?t tài li?u c?a b?n b?ng cách d?t m?t kh?u ch?ng m?, ch?ng in ?n và sao chép. Mã hóa 128-bit an toàn, x? lý hoàn toàn trên trình duy?t.',
    url: 'https://vndocs.net/tools/lock'
  }

  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">KhÃ³a & Má»Ÿ KhÃ³a PDF</h1>
        <p className="text-slate-500">
          Äáº·t máº­t kháº©u an toÃ n báº£o vá»‡ file PDF cÃ¡ nhÃ¢n hoáº·c gá»¡ bá» lá»›p báº£o vá»‡ tÃ i liá»‡u nhanh chÃ³ng báº±ng má»™t click.
        </p>
      </div>

      <PdfLockUnlockWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n MÃ£ HÃ³a & Gá»¡ Máº­t Kháº©u PDF</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            An toÃ n thÃ´ng tin lÃ  yáº¿u tá»‘ quan trá»ng hÃ ng Ä‘áº§u trong há»c táº­p vÃ  cÃ´ng viá»‡c. CÃ´ng cá»¥ <strong>KhÃ³a & Má»Ÿ khÃ³a File PDF</strong> cá»§a VNDocs giÃºp báº¡n báº£o máº­t cÃ¡c tÃ i liá»‡u nháº¡y cáº£m báº±ng má»™t lá»›p máº­t kháº©u vá»¯ng cháº¯c.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. TÃ­nh NÄƒng KhÃ³a File (Protect PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Khi báº¡n gá»­i má»™t báº£ng bÃ¡o giÃ¡, há»£p Ä‘á»“ng hay má»™t bÃ i luáº­n quan trá»ng cho ngÆ°á»i khÃ¡c qua máº¡ng, viá»‡c mÃ£ hÃ³a PDF lÃ  vÃ´ cÃ¹ng cáº§n thiáº¿t:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Chá»‘ng sao chÃ©p & In áº¥n:</strong> Báº±ng cÃ¡ch cÃ i Ä‘áº·t máº­t kháº©u, báº¡n cÃ³ thá»ƒ ngÄƒn cháº·n báº¥t ká»³ ai in tÃ i liá»‡u hoáº·c copy ná»™i dung vÄƒn báº£n bÃªn trong náº¿u khÃ´ng cÃ³ sá»± cho phÃ©p.</li>
                  <li><strong>MÃ£ hÃ³a AES cao cáº¥p:</strong> Há»‡ thá»‘ng sá»­ dá»¥ng chuáº©n mÃ£ hÃ³a tiÃªn tiáº¿n nháº¥t hiá»‡n nay, Ä‘áº£m báº£o khÃ´ng má»™t pháº§n má»m phÃ¡ khÃ³a nÃ o cÃ³ thá»ƒ má»Ÿ Ä‘Æ°á»£c file náº¿u khÃ´ng biáº¿t máº­t kháº©u gá»‘c.</li>
                  <li><strong>CÃ¡ch dÃ¹ng:</strong> KÃ©o tháº£ file PDF vÃ o Ã´ táº£i lÃªn âž” Nháº­p máº­t kháº©u báº¡n muá»‘n cÃ i Ä‘áº·t âž” Nháº¥n KhÃ³a PDF.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. TÃ­nh NÄƒng Má»Ÿ KhÃ³a (Unlock PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">TÃ­nh nÄƒng nÃ y dÃ¹ng Ä‘á»ƒ loáº¡i bá» vÄ©nh viá»…n máº­t kháº©u cá»§a má»™t file PDF mÃ  báº¡n Ä‘Ã£ biáº¿t trÆ°á»›c máº­t kháº©u gá»‘c, giÃºp nhá»¯ng láº§n má»Ÿ sau tiá»‡n lá»£i hÆ¡n:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Gá»¡ bá» rÃ ng buá»™c:</strong> KhÃ´i phá»¥c láº¡i cÃ¡c quyá»n in áº¥n, chá»‰nh sá»­a vÃ  sao chÃ©p vÄƒn báº£n Ä‘Ã£ bá»‹ khÃ³a trÆ°á»›c Ä‘Ã³.</li>
                  <li><strong>KhÃ´ng lÆ°u trá»¯:</strong> KhÃ¡c vá»›i nhiá»u website khÃ¡c sáº½ táº£i file cá»§a báº¡n lÃªn server cá»§a há», VNDocs cháº¡y 100% báº±ng sá»©c máº¡nh trÃ¬nh duyá»‡t (Offline Mode). KhÃ´ng cÃ³ gÃ¬ bá»‹ táº£i lÃªn máº¡ng, báº£o vá»‡ 100% dá»¯ liá»‡u riÃªng tÆ° cá»§a báº¡n.</li>
                  <li><strong>CÃ¡ch dÃ¹ng:</strong> KÃ©o tháº£ file PDF Ä‘Ã£ bá»‹ khÃ³a vÃ o âž” Há»‡ thá»‘ng sáº½ há»i máº­t kháº©u hiá»‡n táº¡i âž” Nháº­p máº­t kháº©u vÃ  nháº¥n Má»Ÿ KhÃ³a. File táº£i vá» sáº½ hoÃ n toÃ n "sáº¡ch bÃ³ng" máº­t kháº©u.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
