import { CompressClient } from '@/app/tools/compress/CompressClient'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/tools/compress/page.tsx',
    'Free Image & File Compression (ZIP)',
    'Image compression tool (reduce file size) and compress multiple files into a .zip file entirely in the browser, no server upload required, 100% secure.'
  )
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Image & ZIP File Compression",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function EnCompressPage() {
  return (
    <main className="min-h-screen bg-surface p-4 md:p-10 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-[900] tracking-tight text-ink md:text-4xl mb-3">
            Compress Images & Create ZIP Files
          </h1>
          <p className="text-ink-muted text-[15px] max-w-2xl mx-auto leading-relaxed">
            Compress image sizes or group multiple files into a single .zip file. 
            All processing operations are done entirely <strong className="text-ink font-bold">on your browser</strong>, 
            without uploading any data to the server, ensuring absolute safety & privacy!
          </p>
        </header>

        <CompressClient />
        
        {/* SEO Content Box */}
        <section className="mt-16 pt-12 border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Comprehensive Guide to Image Compression & ZIP File Creation</h2>
            <p className="mb-6 text-slate-600 text-center leading-relaxed">
              Optimizing storage space is crucial. The <strong>Image Compression & ZIP Creation</strong> tool by VNDocs is the perfect solution for sharing large files without losing quality.
            </p>

            <div className="space-y-4">
              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  1. Benefits of Image Compression & ZIP Files
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Reduce file size:</strong> Image files (JPG, PNG) are often very large. Our image compression feature minimizes the size while preserving natural sharpness.</li>
                    <li><strong>Easy sharing:</strong> Instead of attaching each file separately to an email, you can group them all into a single, neat ZIP file to send quickly.</li>
                    <li><strong>Save bandwidth:</strong> Uploading and downloading a ZIP file takes significantly less time and data than original files.</li>
                  </ul>
                </div>
              </details>

              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  2. 100% Offline Capability
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <p>With advanced WebAssembly technology, VNDocs turns your browser into a real file compression software. You only need to load the website once, and the entire compression and ZIP process is performed <strong>directly on your computer</strong>. Your data is absolutely not uploaded to any server, ensuring 100% security.</p>
                </div>
              </details>

              <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
                <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                  3. Step-by-step Usage Guide
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Drag and drop or select the images/documents you want to process into the upload area.</li>
                    <li>Adjust the image compression slider (e.g., 80% is a great balance between size and quality).</li>
                    <li>Click the <strong>Create ZIP File</strong> button to pack them.</li>
                    <li>Download the resulting .zip file with maximally optimized size.</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
