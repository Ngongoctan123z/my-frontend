import Link from 'next/link'
import { FileText, Calculator, Layers, Lock, PenTool, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'VNDocs - AI Grader & PDF Tools',
  description: 'Free AI-powered grading tools for IELTS, TOEIC, TOPIK, HSK, and comprehensive PDF utilities.',
}

export default function EnHomePage() {
  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
          Welcome to <span className="text-blue-600">VNDocs</span>
        </h1>
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">
          Your ultimate destination for AI-powered essay grading and essential productivity tools. Completely free and secure.
        </p>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <PenTool className="w-6 h-6 text-blue-600" />
          AI Writing Grader
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/en/ai-grader/ielts" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-2">IELTS Writing</h3>
            <p className="text-slate-500 text-sm">Detailed grading on 4 standard criteria (TR, CC, LR, GRA) with vocabulary & grammar corrections.</p>
          </Link>
          <Link href="/en/ai-grader/toeic" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-2">TOEIC Writing</h3>
            <p className="text-slate-500 text-sm">Evaluate respond to a written request and write an opinion essay accurately.</p>
          </Link>
          <Link href="/en/ai-grader/topik" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-2">TOPIK Writing</h3>
            <p className="text-slate-500 text-sm">Grade TOPIK II (Questions 51-54) essays with advanced grammar and vocabulary suggestions.</p>
          </Link>
          <Link href="/en/ai-grader/hsk" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 mb-2">HSK Writing</h3>
            <p className="text-slate-500 text-sm">Improve your Chinese writing skills with detailed syntax and vocabulary feedback.</p>
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          Productivity Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/en/tools/casio" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600">Scientific Calculator</h3>
            </div>
            <p className="text-slate-500 text-sm">Powerful online calculator for complex mathematical expressions and equations.</p>
          </Link>

          <Link href="/en/tools/convert" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-500">Image Converter</h3>
            </div>
            <p className="text-slate-500 text-sm">Convert flexibly between various image formats (JPG, PNG, WEBP, etc.) securely on your browser.</p>
          </Link>

          <Link href="/en/tools/compress" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-500">Compress & ZIP</h3>
            </div>
            <p className="text-slate-500 text-sm">Reduce image file sizes instantly or package multiple files into a single ZIP archive.</p>
          </Link>

          <Link href="/en/tools/lock" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-rose-500">Lock/Unlock PDF</h3>
            </div>
            <p className="text-slate-500 text-sm">Secure your personal PDF files with a password or easily remove restrictions in one click.</p>
          </Link>

          <Link href="/en/tools/remove-pages" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-600">Remove PDF Pages</h3>
            </div>
            <p className="text-slate-500 text-sm">Easily select and remove unnecessary pages from your PDF documents to optimize the file.</p>
          </Link>

          <Link href="/en/tools/merge-files" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600">Merge Files</h3>
            </div>
            <p className="text-slate-500 text-sm">Combine multiple PDF documents or images into a single file with drag-and-drop reordering.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
