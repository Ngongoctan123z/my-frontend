import { getRouteMetadata } from '@/src/utils/serverSeo';
import Link from 'next/link'
import RemovePagesWrapper from '@/app/tools/remove-pages/RemovePagesWrapper'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/tools/remove-pages',
    'Remove PDF Pages — Split & Delete Pages Online Free | VNDocs',
    'Easily delete unwanted pages, extract specific pages, or split PDF documents online. Fast, secure, and entirely processed client-side without server uploads.'
  )
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Remove PDF Pages",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function EnRemovePagesToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Cut & Remove PDF Pages</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Extract, split and permanently remove redundant pages from your PDF documents. Super fast operation, visual preview of each page, and absolute privacy guaranteed.
        </p>
      </div>

      <RemovePagesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Professional Guide to Removing PDF Pages</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Sometimes a PDF file is hundreds of pages long but you only need to keep a few important ones? The <strong>Remove PDF Pages</strong> feature is here to help you optimize your documents quickly.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Visual and Easy to Use
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">The tool's interface is designed to be highly intuitive, displaying thumbnail previews of each PDF page. This helps you:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Easily identify the content of each page without opening the file to read it again.</li>
                  <li>Click on the page you want to remove (the page will dim) or click again to deselect.</li>
                  <li>Completely remove redundant cover pages, extra table of contents, or blank error pages.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Private Data Security (Offline Mode)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Unlike other online PDF cutting websites that require uploading files to a server (with risks of document leaks), VNDocs uses WebAssembly technology to process 100% locally on your device. Your documents <strong>never touch our servers</strong>, ensuring absolute safety for contracts, financial reports, or confidential exams.</p>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Best Use Cases for This Tool
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">The page removal feature maximizes its utility in various situations:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Reduce file size:</strong> Remove unnecessary appendices, making the file lighter for emailing.</li>
                  <li><strong>Data extraction:</strong> You downloaded a 500-page ebook but only want to keep 1 specific chapter? Just remove all the rest and save the new version.</li>
                  <li><strong>Remove corrupted pages:</strong> Cut out blank pages, blurry pages, or upside-down pages caused by initial scanning errors.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
