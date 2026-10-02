import { Metadata } from 'next'
import Link from 'next/link'
import MergeFilesWrapper from './MergeFilesWrapper'
import { getRouteMetadata } from '@/src/utils/serverSeo'



export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/merge-files',
    'Gá»™p File PDF (Merge PDF) | VNDocs',
    'GhÃ©p ná»‘i nhiá»u tÃ i liá»‡u PDF hoáº·c hÃ¬nh áº£nh thÃ nh má»™t báº£n duy nháº¥t. Sáº¯p xáº¿p thá»© tá»± cÃ¡c file báº±ng thao tÃ¡c kÃ©o tháº£ siÃªu nhanh vÃ  báº£o máº­t 100%.'
  )
}

export default function MergeToolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công c? Ghép n?i file PDF',
    operatingSystem: 'Web',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Ghép nhi?u file PDF thành m?t t?p duy nh?t nhanh chóng, d? dàng, b?o m?t 100% b?ng x? lý tr?c ti?p trên trình duy?t.',
    url: 'https://vndocs.net/tools/merge-files'
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Gá»™p Nhiá»u TÃ i Liá»‡u</h1>
        <p className="text-slate-500">
          GhÃ©p nhiá»u tÃ i liá»‡u hoáº·c hÃ¬nh áº£nh thÃ nh má»™t báº£n duy nháº¥t. Sáº¯p xáº¿p thá»© tá»± cÃ¡c file báº±ng thao tÃ¡c kÃ©o tháº£.
        </p>
      </div>

      <MergeFilesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n CÃ¡ch Gá»™p File PDF SiÃªu Nhanh</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            TÃ­nh nÄƒng <strong>Gá»™p File PDF (Merge PDF)</strong> cá»§a VNDocs lÃ  giáº£i phÃ¡p tá»‘i Æ°u khi báº¡n cáº§n tá»•ng há»£p nhiá»u giáº¥y tá», bÃ¡o cÃ¡o hay biá»ƒu máº«u rá»i ráº¡c thÃ nh má»™t vÄƒn báº£n thá»‘ng nháº¥t.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. TÃ­nh NÄƒng VÆ°á»£t Trá»™i
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Há»— trá»£ trá»™n HÃ¬nh áº¢nh & PDF:</strong> CÃ´ng cá»¥ cá»§a chÃºng tÃ´i khÃ´ng chá»‰ gá»™p cÃ¡c file PDF vá»›i nhau mÃ  cÃ²n cho phÃ©p chÃ¨n thÃªm cÃ¡c file HÃ¬nh áº£nh (JPG, PNG) trá»±c tiáº¿p vÃ o quÃ¡ trÃ¬nh gá»™p Ä‘á»ƒ táº¡o thÃ nh 1 file PDF duy nháº¥t.</li>
                  <li><strong>KÃ©o vÃ  Tháº£ (Drag & Drop) thÃ´ng minh:</strong> Báº¡n chá»‰ cáº§n tháº£ cÃ¡c file vÃ o trÃ¬nh duyá»‡t, báº¥m giá»¯ vÃ  kÃ©o tháº£ (Drag) cÃ¡c file Ä‘á»ƒ thay Ä‘á»•i thá»© tá»± trang trÆ°á»›c khi xuáº¥t báº£n má»™t cÃ¡ch cá»±c ká»³ trá»±c quan.</li>
                  <li><strong>Báº£o máº­t tuyá»‡t Ä‘á»‘i 100%:</strong> Táº¥t cáº£ xá»­ lÃ½ (Ä‘á»c, gá»™p, xuáº¥t file) Ä‘á»u cháº¡y hoÃ n toÃ n Ä‘á»™c láº­p trÃªn trÃ¬nh duyá»‡t mÃ¡y tÃ­nh cá»§a báº¡n báº±ng cÃ´ng nghá»‡ WebAssembly. Cam káº¿t khÃ´ng cÃ³ báº¥t ká»³ file nÃ o cá»§a báº¡n bá»‹ upload lÃªn mÃ¡y chá»§.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. HÆ°á»›ng Dáº«n Sá»­ Dá»¥ng
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Báº¥m nÃºt <strong>"Chá»n File"</strong> hoáº·c kÃ©o tháº£ cÃ¡c file PDF/HÃ¬nh áº£nh vÃ o khu vá»±c quy Ä‘á»‹nh.</li>
                  <li>Chá» há»‡ thá»‘ng táº£i file (diá»…n ra cá»±c nhanh vÃ¬ khÃ´ng tá»‘n thá»i gian upload lÃªn máº¡ng).</li>
                  <li>Di chuyá»ƒn chuá»™t Ä‘á»ƒ sáº¯p xáº¿p láº¡i thá»© tá»± cÃ¡c file náº¿u cáº§n thiáº¿t.</li>
                  <li>Báº¥m nÃºt <strong>"Gá»™p File Ngay"</strong> vÃ  há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng táº£i file PDF hoÃ n chá»‰nh vá» mÃ¡y cá»§a báº¡n.</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
