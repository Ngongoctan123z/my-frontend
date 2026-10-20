import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { HskGraderClient } from '@/app/ai-grader/hsk/HskGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/en/ai-grader/hsk')
}

export default async function EnHskPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader/hsk')
  const h1Title = customSeo?.h1 || PAGE_SEO["/en/ai-grader/hsk"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HSK Writing Practice & Scoring Tool VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'en',
    applicationCategory: 'EducationalApplication',
    description: 'Practice HSK 5 & HSK 6 Writing online with rubric scoring, grammar correction, and vocabulary suggestions.',
    url: `${FRONTEND_URL}/en/ai-grader/hsk`
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${FRONTEND_URL}/en`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Writing Grader',
        item: `${FRONTEND_URL}/en/ai-grader`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'HSK Writing',
        item: `${FRONTEND_URL}/en/ai-grader/hsk`,
      }
    ]
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which HSK writing levels can I practise?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The studio focuses on HSK 5 and HSK 6 tasks from the published level 1–6 sample format: sentence ordering, HSK 5 passages of about 80 Chinese characters and HSK 6 summaries of about 400 characters. Check your test centre announcement for the format you have registered for."
        }
      },
      {
        "@type": "Question",
        "name": "Is the AI score an official exam result?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Scores and feedback are practice estimates and can miss errors or make incorrect suggestions. Check each explanation against the task and ask a teacher when needed. The result is not a certificate from the test provider."
        }
      },
      {
        "@type": "Question",
        "name": "How should I use the feedback to improve?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For HSK 5, check word order and use every required keyword in context rather than writing disconnected sentences. For HSK 6, compare your summary with the main events of the source, remove minor details and avoid adding your own opinion."
        }
      },
      {
        "@type": "Question",
        "name": "Can I review a previous submission?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "After signing in and submitting successfully, you can review the writing and result in your account history. Compare recurring errors across attempts and keep a separate copy of important drafts."
        }
      },
      {
        "@type": "Question",
        "name": "How is my writing processed for AI feedback?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Submitted content is sent to an AI service to generate feedback. Do not include passwords, customer records or sensitive personal information in practice responses. Read the privacy policy for more about data handling."
        }
      }
    ]
  }

  return (
    <div className="py-8 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <script
        id="software-jsonld-HskGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-HskGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-HskGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        {/* Breadcrumb Navigation UI */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 font-medium">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/en" className="hover:text-blue-600 transition-colors">Home</Link>
            </li>
            <li className="text-slate-300">/</li>
            <li>
              <Link href="/en/ai-grader" className="hover:text-blue-600 transition-colors">Writing Grader</Link>
            </li>
            <li className="text-slate-300">/</li>
            <li className="text-slate-900 font-semibold" aria-current="page">HSK Writing</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium">
          Practice HSK 5 (80 characters) and HSK 6 (400 characters) writing tasks. AI feedback, Chinese grammar correction, and vocabulary recommendations with estimated practice scores.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <HskGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            How to Master HSK Writing Online (书写)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The writing section of the HSK exam tests Chinese grammatical accuracy, idiomatic vocabulary, and coherent narrative structure. Follow these key principles when practicing:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Core Exam Structure
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>HSK 5 (Paragraph Composition ~80 chars):</strong> You are given either 5 keywords or a picture prompt. Connect the elements into a logically coherent paragraph using proper Chinese syntax and cohesive conjunctions.
            </li>
            <li>
              <strong>HSK 6 (Text Summary ~400 chars):</strong> You read a 1,000-character story in 10 minutes, and then summarize it into approximately 400 characters including a self-composed title without injecting personal commentary.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Standard Hanban Grading Rubrics
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Evaluations emphasize standard Chinese language conventions:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Hanzi Character Accuracy:</strong> Correct usage of homophones and avoidance of near-synonym misuse.
            </li>
            <li>
              <strong>Sentence Structure:</strong> Precision with pre-transitive 把 sentences, passive 被 patterns, and correct positioning of adverbs and complements.
            </li>
            <li>
              <strong>Text Cohesion:</strong> Proper application of formal transitional connectors (不但...而且..., 从而, 由此可见).
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Account History & Progress Tracking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            When logged into your account, your writing submissions and suggested example answers are automatically preserved in your private <strong>Essay History</strong>. Review earlier errors to build confidence and refine your writing before exam day.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Explore Other Writing Studios
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Practice other international language certifications:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li>
              Practice academic English at{' '}
              <Link href="/en/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                IELTS Writing Studio
              </Link>.
            </li>
            <li>
              Practice workplace communication with{' '}
              <Link href="/en/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                TOEIC Writing Studio
              </Link>.
            </li>
            <li>
              Prepare for Korean proficiency with{' '}
              <Link href="/en/ai-grader/topik" className="text-blue-600 font-semibold hover:underline">
                TOPIK II Writing Studio (쓰기)
              </Link>.
            </li>
          </ul>

          {/* Visible FAQ Section */}
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 not-prose">
            {faqJsonLd.mainEntity.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-1.5">
                  {item.name}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>

          <aside aria-label="Check the test provider’s guidance" className="mt-8 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-7 text-slate-600">
            <p>AI feedback is a practice estimate; VNDocs does not issue official exam scores.</p>
            <p><a href="https://www.chinesetest.cn/HSK/5" className="font-semibold text-blue-600 hover:underline">Chinese Testing International — HSK 5</a> · <a href="https://www.chinesetest.cn/HSK/6" className="font-semibold text-blue-600 hover:underline">HSK 6</a> · <Link href="/en/privacy" className="text-blue-600 hover:underline">Privacy policy</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


