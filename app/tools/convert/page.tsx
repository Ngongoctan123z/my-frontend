import { Metadata } from 'next'
import Link from 'next/link'
import FileConverterWrapper from './FileConverterWrapper'
import { getRouteMetadata } from '@/src/utils/serverSeo'



export async function generateMetadata() {
  return getRouteMetadata(
    '/tools/convert',
    'Chuyá»ƒn Äá»•i Äá»‹nh Dáº¡ng HÃ¬nh áº¢nh | VNDocs',
    'Tiá»‡n Ã­ch há»— trá»£ chuyá»ƒn Ä‘á»•i Ä‘a Ä‘á»‹nh dáº¡ng hÃ¬nh áº£nh (JPG, PNG, WEBP, BMP, GIF) nhanh chÃ³ng vÃ  miá»…n phÃ­ 100%.'
  )
}

export default function ConvertToolPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công c? Chuy?n Ð?i Ð?nh D?ng Hình ?nh',
    operatingSystem: 'Web',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Ti?n ích h? tr? chuy?n d?i da d?nh d?ng hình ?nh (JPG, PNG, WEBP, BMP, GIF) nhanh chóng và mi?n phí 100%.',
    url: 'https://vndocs.net/tools/convert'
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Chuyá»ƒn Äá»•i HÃ¬nh áº¢nh</h1>
        <p className="text-slate-500">
          Tiá»‡n Ã­ch há»— trá»£ chuyá»ƒn Ä‘á»•i qua láº¡i giá»¯a cÃ¡c Ä‘á»‹nh dáº¡ng áº£nh phá»• biáº¿n (JPG, PNG, WEBP, BMP, GIF tÄ©nh).
        </p>
      </div>

      <FileConverterWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n Chuyá»ƒn Äá»•i Äá»‹nh Dáº¡ng HÃ¬nh áº¢nh Nhanh ChÃ³ng</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Vá»›i cÃ´ng cá»¥ <strong>Chuyá»ƒn Ä‘á»•i hÃ¬nh áº£nh</strong> trá»±c tuyáº¿n cá»§a VNDocs, báº¡n cÃ³ thá»ƒ dá»… dÃ ng chuyá»ƒn Ä‘á»•i qua láº¡i giá»¯a cÃ¡c Ä‘á»‹nh dáº¡ng áº£nh phá»• biáº¿n (JPG, PNG, WEBP) chá»‰ vá»›i má»™t cÃº click chuá»™t mÃ  khÃ´ng lÃ m giáº£m cháº¥t lÆ°á»£ng.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Táº¡i Sao Cáº§n Chuyá»ƒn Äá»•i Äá»‹nh Dáº¡ng áº¢nh?
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>WEBP sang JPG/PNG:</strong> Ráº¥t nhiá»u áº£nh táº£i tá»« web hiá»‡n nay cÃ³ Ä‘á»‹nh dáº¡ng WEBP siÃªu nháº¹, nhÆ°ng láº¡i khÃ´ng thá»ƒ má»Ÿ Ä‘Æ°á»£c trÃªn má»™t sá»‘ pháº§n má»m cÅ© nhÆ° Photoshop hoáº·c Word. Chuyá»ƒn Ä‘á»•i sang JPG sáº½ giÃºp báº¡n dá»… dÃ ng chá»‰nh sá»­a.</li>
                  <li><strong>PNG sang JPG:</strong> Náº¿u báº¡n cÃ³ má»™t bá»©c áº£nh PNG sáº¯c nÃ©t nhÆ°ng dung lÆ°á»£ng quÃ¡ lá»›n (vÃ i chá»¥c MB), viá»‡c chuyá»ƒn sang JPG sáº½ giÃºp giáº£m thiá»ƒu 90% dung lÆ°á»£ng mÃ  khÃ´ng nháº­n ra sá»± khÃ¡c biá»‡t báº±ng máº¯t thÆ°á»ng. Cá»±c ká»³ há»¯u Ã­ch khi cáº§n upload áº£nh lÃªn lÃ m há»“ sÆ¡, ná»™p CV.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Æ¯u Äiá»ƒm Tuyá»‡t Äá»‘i Cá»§a CÃ´ng Cá»¥ VNDocs
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">KhÃ¡c vá»›i cÃ¡c web nÆ°á»›c ngoÃ i Ä‘áº§y ráº«y quáº£ng cÃ¡o popup, VNDocs mang láº¡i tráº£i nghiá»‡m hoÃ n toÃ n khÃ¡c biá»‡t:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>HoÃ n toÃ n Offline:</strong> CÃ´ng nghá»‡ xá»­ lÃ½ trÃ¬nh duyá»‡t cho phÃ©p chuyá»ƒn Ä‘á»•i áº£nh ngay trÃªn mÃ¡y cá»§a báº¡n. NghÄ©a lÃ  áº£nh cá»§a báº¡n KHÃ”NG bá»‹ táº£i lÃªn báº¥t ká»³ mÃ¡y chá»§ nÃ o. An toÃ n tuyá»‡t Ä‘á»‘i vá»›i áº£nh cÃ¡ nhÃ¢n, CCCD hay giáº¥y tá» tuá»³ thÃ¢n.</li>
                  <li><strong>Chuyá»ƒn Ä‘á»•i hÃ ng loáº¡t (Batch Convert):</strong> Cho phÃ©p báº¡n kÃ©o tháº£ cáº£ chá»¥c táº¥m hÃ¬nh cÃ¹ng lÃºc vÃ  nháº¥n nÃºt chuyá»ƒn Ä‘á»•i. Ráº¥t tiáº¿t kiá»‡m thá»i gian.</li>
                  <li><strong>Tá»‘c Ä‘á»™ Ã¡nh sÃ¡ng:</strong> VÃ¬ khÃ´ng cáº§n táº£i áº£nh lÃªn máº¡ng nÃªn quÃ¡ trÃ¬nh convert diá»…n ra ngay láº­p tá»©c, tá»‘n chÆ°a tá»›i 1 giÃ¢y cho má»—i áº£nh.</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
