import { Metadata } from 'next'
import Link from 'next/link'
import RemovePagesWrapper from './RemovePagesWrapper'
import { getRouteMetadata } from '@/src/utils/serverSeo'



export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/remove-pages',
    'Cáº¯t Trang & XÃ³a Trang PDF (Remove Pages) | VNDocs',
    'TrÃ­ch xuáº¥t, cáº¯t tÃ¡ch vÃ  loáº¡i bá» cÃ¡c trang PDF khÃ´ng mong muá»‘n ra khá»i tÃ i liá»‡u má»™t cÃ¡ch dá»… dÃ ng vÃ  hoÃ n toÃ n miá»…n phÃ­.'
  )
}

export default function RemovePagesToolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công c? Xóa trang PDF',
    operatingSystem: 'Web',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Xóa b?t các trang th?a trong file PDF m?t cách d? dàng. X? lý b?o m?t 100% trên trình duy?t.',
    url: 'https://vndocs.net/tools/remove-pages'
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Cáº¯t & XÃ³a Trang</h1>
        <p className="text-slate-500">
          Loáº¡i bá» cÃ¡c trang khÃ´ng cáº§n thiáº¿t khá»i tÃ i liá»‡u cá»§a báº¡n má»™t cÃ¡ch nhanh chÃ³ng.
        </p>
      </div>

      <RemovePagesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n Cáº¯t TÃ¡ch & XÃ³a Trang PDF ChuyÃªn Nghiá»‡p</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            ÄÃ´i khi má»™t file PDF dÃ i cáº£ trÄƒm trang nhÆ°ng báº¡n chá»‰ cáº§n lÆ°u láº¡i má»™t vÃ i trang quan trá»ng? TÃ­nh nÄƒng <strong>XÃ³a trang PDF (Remove PDF Pages)</strong> ra Ä‘á»i Ä‘á»ƒ giÃºp báº¡n tá»‘i Æ°u hÃ³a tÃ i liá»‡u nhanh chÃ³ng.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Trá»±c Quan VÃ  Dá»… DÃ ng Sá»­ Dá»¥ng
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">Giao diá»‡n cÃ´ng cá»¥ Ä‘Æ°á»£c thiáº¿t káº¿ cá»±c ká»³ trá»±c quan, hiá»ƒn thá»‹ báº£n xem trÆ°á»›c thu nhá» (Thumbnail) cá»§a tá»«ng trang PDF. Viá»‡c nÃ y giÃºp báº¡n:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Dá»… dÃ ng nháº­n diá»‡n ná»™i dung tá»«ng trang mÃ  khÃ´ng cáº§n má»Ÿ file lÃªn Ä‘á»c láº¡i.</li>
                  <li>Click chá»n vÃ o trang muá»‘n xÃ³a (trang sáº½ má» Ä‘i) hoáº·c nháº¥p láº¡i Ä‘á»ƒ bá» chá»n.</li>
                  <li>Loáº¡i bá» hoÃ n toÃ n cÃ¡c trang bÃ¬a, má»¥c lá»¥c thá»«a, hoáº·c cÃ¡c trang giáº¥y tráº¯ng lá»—i.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Báº£o Máº­t Dá»¯ Liá»‡u RiÃªng TÆ° (Offline Mode)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>KhÃ¡c vá»›i cÃ¡c trang web cáº¯t PDF trá»±c tuyáº¿n khÃ¡c yÃªu cáº§u upload file lÃªn mÃ¡y chá»§ (cÃ³ rá»§i ro rÃ² rá»‰ tÃ i liá»‡u), VNDocs á»©ng dá»¥ng cÃ´ng nghá»‡ WebAssembly xá»­ lÃ½ 100% táº¡i thiáº¿t bá»‹ cá»§a báº¡n. TÃ i liá»‡u cá»§a báº¡n <strong>khÃ´ng bao giá» cháº¡m vÃ o mÃ¡y chá»§ cá»§a chÃºng tÃ´i</strong>, Ä‘áº£m báº£o an toÃ n tuyá»‡t Ä‘á»‘i cho cÃ¡c há»£p Ä‘á»“ng, bÃ¡o cÃ¡o tÃ i chÃ­nh hay Ä‘á» thi báº£o máº­t.</p>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
