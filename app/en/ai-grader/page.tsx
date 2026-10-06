import { Metadata } from 'next'
import Link from 'next/link'
import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/ai-grader',
    'AI Language Grader | IELTS, TOEIC, TOPIK, HSK | VNDocs',
    'Free AI grading tool for IELTS, TOEIC, TOPIK, and HSK Writing. Receive instant detailed feedback, grammar corrections, and scoring based on official standards.'
  )
}

export default function EnAiGraderIndexPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">AI Language Grader</h1>
        <p className="text-ink-muted text-lg">
          Master your language exams with our advanced AI writing evaluator. Completely free.
        </p>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Practice writing for IELTS, TOEIC, TOPIK, and HSK. Get instant feedback on grammar, vocabulary, and structure directly aligned with official grading criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* IELTS */}
        <Link href="/en/ai-grader/ielts" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">IELTS Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Practice IELTS Academic & General Training Writing Tasks 1 and 2. Get detailed analysis on TR, CC, LR, and GRA criteria with a predicted band score.</p>
        </Link>

        {/* TOEIC */}
        <Link href="/en/ai-grader/toeic" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">TOEIC Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Master TOEIC Writing parts: Respond to a written request and Write an opinion essay. Enhance your Business English and structure for high scores.</p>
        </Link>

        {/* TOPIK */}
        <Link href="/en/ai-grader/topik" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">TOPIK II Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Conquer TOPIK II (Questions 51-54). Receive detailed spelling checks, particle corrections, and suggestions for advanced Korean expressions.</p>
        </Link>

        {/* HSK */}
        <Link href="/en/ai-grader/hsk" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">HSK Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Practice HSK 5 (Paragraph Writing) and HSK 6 (Summary Writing). Correct Chinese grammatical structures and improve character usage effectively.</p>
        </Link>

      </div>
      
      {/* SEO Content Box */}
      <section className="mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-sm md:prose-base prose-slate max-w-none text-justify">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Elevate Your Language Skills with AI</h2>
          
          <p className="mb-4">
            Preparing for international language proficiency exams like <strong>IELTS, TOEIC, TOPIK, or HSK</strong> requires consistent practice and expert guidance. 
            VNDocs provides an advanced AI-powered grading assistant that offers personalized feedback 24/7, ensuring you understand your mistakes and how to fix them.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Why Use Our AI Grader?</h3>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Instant Feedback:</strong> No more waiting for a teacher to mark your essays. Get your results in seconds.</li>
            <li><strong>Detailed Analysis:</strong> Every sentence is analyzed for grammatical correctness, vocabulary richness, and coherence.</li>
            <li><strong>Official Criteria:</strong> The AI is calibrated to evaluate your writing based on the official rubrics of each specific exam.</li>
            <li><strong>100% Privacy:</strong> We do not store your essays for any commercial purposes. Your practice sessions remain entirely private.</li>
          </ul>
        </article>
      </section>
    </div>
  )
}
