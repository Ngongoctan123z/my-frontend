import { Metadata } from 'next'
import Link from 'next/link'

import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/tools',
    'Free PDF & Educational Utility Tools | VNDocs',
    '100% Free tools to merge PDF, remove PDF pages, lock PDF, convert formats, and an advanced online scientific calculator.'
  )
}

export default function EnToolsIndexPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Utility Tools</h1>
        <p className="text-ink-muted text-lg">
          Your ultimate assistant for studying and document processing. Completely free.
        </p>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Providing optimal solutions to quickly process and edit PDF files, along with an advanced scientific calculator emulator to help you study and solve problems effortlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Casio */}
        <Link href="/en/tools/casio" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Scientific Calculator</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">A super powerful scientific and graphing calculator emulator to help solve the most complex math formulas.</p>
        </Link>

        {/* Convert */}
        <Link href="/en/tools/convert" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-amber-500 transition-colors">Image Converter</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Flexibly convert between PDF and Word (Docx), Images (JPG/PNG) and vice versa, 100% free.</p>
        </Link>

        {/* Lock */}
        <Link href="/en/tools/lock" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-rose-500 transition-colors">Lock & Unlock PDF</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Set a secure password to protect personal PDFs or quickly remove document protection with a single click.</p>
        </Link>

        {/* Remove Pages */}
        <Link href="/en/tools/remove-pages" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Cut & Remove PDF Pages</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Easily select and remove unnecessary PDF pages from your document to reduce file size and optimize content.</p>
        </Link>

        {/* Merge Files */}
        <Link href="/en/tools/merge-files" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Merge PDF Files</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Combine multiple PDF documents or images into a single file. You can simply drag and drop to reorder files.</p>
        </Link>
      </div>
      
      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Free PDF & Educational Utility Tools at VNDocs</h2>
          
          <p className="mb-4">
            Alongside our vast repository of exams and study materials, <strong>VNDocs</strong> has developed a <strong>completely free utility toolset</strong> to fully support students and office workers. 
            All file processing operations are executed directly within your browser (Client-side), ensuring <strong>absolute safety and data privacy</strong> as your documents are never uploaded to any servers.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Service Purpose & Value Provided</h3>
          <p className="mb-4">
            We understand that during work and study, you often have to handle PDF documents, requiring merging, page removal, data extraction, or using an emulator calculator for math. Specialized software often requires installation and expensive fees. Therefore, VNDocs brings a comprehensive online toolset, helping save time, optimize workflow, and providing <strong>maximum convenience</strong> without requiring any software installation.
          </p>
          
          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Powerful PDF Processing Features</h3>
          <p className="mb-4">
            Our toolset provides in-depth features to manipulate PDF files such as:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Merge PDF:</strong> Allows you to select multiple individual PDF files or images and combine them into a single file. Ordering pages requires just a simple drag and drop.</li>
            <li><strong>Remove PDF Pages:</strong> Have a long document and only want to extract important pages? The page removal feature helps you strip away redundant pages to optimize file size.</li>
            <li><strong>PDF Converter:</strong> Convert PDF formats to extremely sharp images (JPG, PNG) for easy sharing, or compress high-size PDF files.</li>
            <li><strong>Protect PDF:</strong> Encrypt files with a password against copying and printing, or unlock restricted documents (requires original password).</li>
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Complete Online Scientific Calculator</h3>
          <p className="mb-4">
            Especially for students, the system integrates a super powerful <strong>Scientific & Graphing Calculator Emulator</strong>. 
            Fully supporting trigonometric functions, equation solving, matrices, statistics... allowing you to study and calculate anytime, anywhere right on your browser without installing any complex software.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Operating Mechanism & Security</h3>
          <p>
            All of our PDF processing tools operate via direct processing on your device (Local processing). This means your documents <strong>never leave your computer</strong> and are not uploaded to any servers. Data privacy is our top priority, giving you peace of mind when handling important documents, contracts, or confidential exams.
          </p>
        </article>
      </section>
    </div>
  )
}
