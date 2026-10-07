import { getRouteMetadata } from '@/src/utils/serverSeo';
import FileConverterWrapper from '@/app/tools/convert/FileConverterWrapper'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/tools/convert/page.tsx',
    'Image Format Converter | VNDocs',
    'Convert images between JPG, PNG, WEBP, BMP, GIF, ICO formats for free and quickly.'
  )
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Image Format Converter",
  "operatingSystem": "Web",
  "applicationCategory": "UtilitiesApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function EnConvertImagePage() {
  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Image Format Converter</h1>
        <p className="text-slate-500 font-medium max-w-3xl mx-auto">
          Convert images between popular formats like JPG, PNG, WEBP, BMP, GIF, ICO completely free. Supports batch operations, local processing right in the browser ensures absolute data privacy.
        </p>
      </div>

      <FileConverterWrapper />

      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="max-w-4xl mx-auto prose prose-slate">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Fast & Safe Image Format Converter Tool</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            In a digital work environment, changing image formats is a frequent need. Whether you need <strong>WEBP</strong> format to optimize website loading speed, <strong>PNG</strong> format to keep transparent backgrounds, or common <strong>JPG</strong> format to send to partners, VNDocs' tool fully meets your needs for completely free.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Why use the VNDocs tool?</h3>
          <ul>
            <li><strong>Super fast conversion without internet:</strong> All conversion processes are performed using processing power right on your device. This process happens instantly without waiting for a server to process or queue for download.</li>
            <li><strong>100% Privacy Protection:</strong> Personal images, company documents will <strong>never be uploaded to the internet</strong>. We respect privacy and promise the tool works completely in Offline Mode on your browser.</li>
            <li><strong>Original display quality:</strong> Advanced optimization algorithms help switch between JPG, PNG, WEBP while maintaining the sharpest and truest colors possible.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. How to use</h3>
          <p>The process is extremely simple, designed to be maximally simplified:</p>
          <ol>
            <li><strong>Add File:</strong> Drag and drop multiple images into the designated area, or click the upload image button.</li>
            <li><strong>Output options:</strong> Choose the format you want to export to (for example: convert from PNG to WEBP or JPG).</li>
            <li><strong>Download:</strong> Click the "Convert" button, images will be processed in a blink. You can download each image or click Download all as a ZIP file.</li>
          </ol>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Differences between formats</h3>
          <p>
            Each image format has its own pros and cons. <strong>JPG</strong> is suitable for multi-colored photos, compresses well to reduce size. <strong>PNG</strong> is ideal for images needing high definition or having transparent backgrounds (logos, icons). <strong>WEBP</strong> is Google's new generation format, making images significantly lighter than JPG and PNG but quality is not inferior, highly suitable for SEO and speeding up website loading.
          </p>
        </article>
      </section>
    </div>
  )
}
