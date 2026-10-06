import { Metadata } from 'next'
import Link from 'next/link'
import PdfLockUnlockWrapper from '@/app/tools/lock/PdfLockUnlockWrapper'

export const metadata: Metadata = {
  title: 'Lock / Unlock PDF File (Protect PDF) | VNDocs',
  description: 'A tool to encrypt PDF files with a password to prevent viewing, printing, or quickly removing PDF password protection.',
  alternates: {
    canonical: 'https://vndocs.net/en/tools/lock',
  },
  openGraph: {
    title: 'Lock / Unlock PDF File (Protect PDF) | VNDocs',
    description: 'A tool to encrypt PDF files with a password to prevent viewing, printing, or quickly removing PDF password protection.',
    url: 'https://vndocs.net/en/tools/lock',
    siteName: 'VNDocs',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lock / Unlock PDF File (Protect PDF) | VNDocs',
    description: 'A tool to encrypt PDF files with a password to prevent viewing, printing, or quickly removing PDF password protection.',
  }
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Lock & Unlock PDF",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function EnLockToolPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Lock & Unlock PDF</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Set a secure password to protect personal PDF files against viewing, printing, and copying, or quickly remove document protection with a single click. Works 100% offline ensuring absolute safety.
        </p>
      </div>

      <PdfLockUnlockWrapper />

      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Guide to Encrypting & Removing PDF Passwords</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Information security is a top priority in study and work. The <strong>Lock & Unlock PDF File</strong> tool by VNDocs helps you secure sensitive documents with a solid password layer.
          </p>

          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. File Locking Feature (Protect PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">When sending a quote, contract, or an important essay to someone else over the internet, encrypting the PDF is extremely necessary:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Anti-copy & Printing:</strong> By setting a password, you can prevent anyone from printing the document or copying text inside without permission.</li>
                  <li><strong>Advanced AES Encryption:</strong> The system uses the most advanced encryption standard today, ensuring no password cracking software can open the file without knowing the original password.</li>
                  <li><strong>How to use:</strong> Drag and drop the PDF file into the upload box ➔ Enter the password you want to set ➔ Click Lock PDF.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Unlocking Feature (Unlock PDF)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-2">This feature is used to permanently remove the password of a PDF file for which you already know the original password, making future openings more convenient:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Remove restrictions:</strong> Restore previously locked printing, editing, and text copying permissions.</li>
                  <li><strong>No storage:</strong> Unlike many other websites that upload your file to their server, VNDocs runs 100% on browser power (Offline Mode). Nothing is uploaded to the internet, 100% protecting your private data.</li>
                  <li><strong>How to use:</strong> Drag and drop the locked PDF file ➔ The system will ask for the current password ➔ Enter the password and click Unlock. The downloaded file will be completely password-free.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
