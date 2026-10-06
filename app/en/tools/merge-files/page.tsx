import { Metadata } from 'next'
import Link from 'next/link'
import MergeFilesWrapper from '@/app/tools/merge-files/MergeFilesWrapper'

export const metadata: Metadata = {
  title: 'Merge PDF Files | VNDocs',
  description: 'Combine multiple PDF documents or images into a single file. Reorder files with blazing fast drag and drop, 100% secure.',
  alternates: {
    canonical: 'https://vndocs.net/en/tools/merge-files',
  },
  openGraph: {
    title: 'Merge PDF Files | VNDocs',
    description: 'Combine multiple PDF documents or images into a single file. Reorder files with blazing fast drag and drop, 100% secure.',
    url: 'https://vndocs.net/en/tools/merge-files',
    siteName: 'VNDocs',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merge PDF Files | VNDocs',
    description: 'Combine multiple PDF documents or images into a single file. Reorder files with blazing fast drag and drop, 100% secure.',
  }
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Merge PDF Files",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function EnMergeToolPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Merge Multiple Documents</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Combine multiple PDF documents or images (JPG, PNG) into a single file. Intuitive interface allows ordering pages with smart drag and drop.
        </p>
      </div>

      <MergeFilesWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Guide to Merging PDF Files Super Fast</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            The <strong>Merge PDF</strong> feature by VNDocs is the optimal solution when you need to combine multiple loose papers, reports, or forms into a unified document.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Outstanding Features
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Support mixing Images & PDF:</strong> Our tool not only merges PDF files together but also allows inserting Image files (JPG, PNG) directly into the merging process to create a single PDF file.</li>
                  <li><strong>Smart Drag & Drop:</strong> You just drop the files into the browser, hold and drag the files to change the page order before publishing extremely intuitively.</li>
                  <li><strong>100% Absolute Security:</strong> All processing (reading, merging, exporting files) runs completely independently on your computer browser using WebAssembly technology. We guarantee no files are uploaded to the server.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. How to Use
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Click the <strong>"Select File"</strong> button or drag and drop PDF/Image files into the designated area.</li>
                  <li>Wait for the system to load the files (happens extremely fast because there's no time wasted uploading to the internet).</li>
                  <li>Move the mouse to reorder the files if necessary.</li>
                  <li>Click the <strong>"Merge Now"</strong> button and the system will automatically download the complete PDF file to your machine.</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
