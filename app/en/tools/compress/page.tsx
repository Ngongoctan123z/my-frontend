import { Metadata } from 'next'
import { CompressClient } from '@/app/tools/compress/CompressClient'

export const metadata: Metadata = {
  title: 'Free Image & File Compression (ZIP)',
  description: 'Image compression tool (reduce file size) and compress multiple files into a .zip file entirely in the browser, no server upload required, 100% secure.',
  alternates: {
    canonical: 'https://vndocs.net/en/tools/compress',
  },
  openGraph: {
    title: 'Free Image & File Compression (ZIP)',
    description: 'Image compression tool (reduce file size) and compress multiple files into a .zip file entirely in the browser, no server upload required, 100% secure.',
    url: 'https://vndocs.net/en/tools/compress',
    siteName: 'VNDocs',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Image & File Compression (ZIP)',
    description: 'Image compression tool (reduce file size) and compress multiple files into a .zip file entirely in the browser, no server upload required, 100% secure.',
  }
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
      </div>
    </main>
  )
}
