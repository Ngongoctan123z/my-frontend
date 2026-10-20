import { Metadata } from 'next'
import Link from 'next/link'
import { PAGE_SEO, pageUrl } from '@/src/lib/pageSeo'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/en/ai-grader')
}

export default async function EnAiGraderIndexPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader')
  const h1Title = customSeo?.h1 || PAGE_SEO['/en/ai-grader'].h1
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: PAGE_SEO['/en/ai-grader'].h1,
        description: PAGE_SEO['/en/ai-grader'].description,
        url: pageUrl('/en/ai-grader'),
        operatingSystem: 'Web',
        applicationCategory: 'EducationalApplication',
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: pageUrl('/en') },
          { '@type': 'ListItem', position: 2, name: 'Writing Practice', item: pageUrl('/en/ai-grader') },
        ],
      },
    ],
  }
  return (
    <div className="py-12 max-w-4xl mx-auto space-y-12">
      <script id="writing-hub-jsonld-en" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{h1Title}</h1>
        <p className="text-ink-muted text-lg">
          Build your writing skills with focused tasks and clear AI feedback.
        </p>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Practice writing for IELTS, TOEIC, TOPIK, and HSK. Get practice feedback on task fulfilment, grammar, vocabulary and structure.
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
          <p className="text-slate-500 text-sm leading-relaxed">Practise IELTS Academic Writing Task 1 and Task 2, then review task fulfilment, coherence, vocabulary and grammar with an estimated practice band.</p>
        </Link>

        {/* TOEIC */}
        <Link href="/en/ai-grader/toeic" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">TOEIC Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Practise five picture sentences, two separate email responses and one opinion essay, covering all 8 TOEIC Writing questions.</p>
        </Link>

        {/* TOPIK */}
        <Link href="/en/ai-grader/topik" className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-xl hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-[background-color,color,transform] duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">TOPIK II Writing</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">Practise TOPIK II PBT questions 51–54: sentence completion, 200–300-character writing and 600–700-character essays. Review spacing, grammar and written register.</p>
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">Use each round of feedback to revise one clear goal</h2>
          
          <p className="mb-4">
            Choose the task that matches your exam, write your own answer and review the feedback. Pick one or two recurring errors, revise the relevant paragraph and compare both versions. Track what changed as well as the estimated score.
          </p>

          <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3">Why Use Our AI Grader?</h3>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Actionable feedback:</strong> Review suggested corrections, then check that they preserve your intended meaning.</li>
            <li><strong>Focused revision:</strong> Work on task fulfilment, grammar, vocabulary and organization one area at a time.</li>
            <li><strong>Independent practice:</strong> VNDocs is a practice tool and does not issue results on behalf of test providers.</li>
            <li><strong>Practice scores:</strong> AI scores are estimates for learning and do not replace an official exam result.</li>
          </ul>
          <p className="mb-4">Usage depends on your account and current plan. AI feedback can be wrong; check suggestions against the prompt and seek a teacher’s guidance when needed.</p>
          <p>Combine writing with <Link href="/speaking" className="font-semibold text-blue-600 hover:underline">IELTS and TOEIC Speaking practice (Vietnamese interface)</Link> to explain the same idea in a written answer and a recording.</p>
        </article>
      </section>
    </div>
  )
}


