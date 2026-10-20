import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { AiGraderClient } from '@/app/ai-grader/ielts/AiGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/en/ai-grader/ielts')
}

export default async function EnIeltsGraderPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader/ielts')
  const h1Title = customSeo?.h1 || PAGE_SEO["/en/ai-grader/ielts"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'IELTS Writing Practice & Scoring Tool VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'en',
    applicationCategory: 'EducationalApplication',
    description: 'Practise IELTS Academic Writing Task 1 and Task 2 with estimated bands and feedback on task fulfilment, coherence, vocabulary and grammar.',
    url: `${FRONTEND_URL}/en/ai-grader/ielts`
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
        name: 'IELTS Writing',
        item: `${FRONTEND_URL}/en/ai-grader/ielts`,
      }
    ]
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which IELTS Writing tasks can I practise?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Practise Task 1 descriptions of charts, maps or processes, and Task 2 essays. IELTS Academic requires at least 150 words for Task 1 and 250 words for Task 2. Select the matching task before you write."
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
          "text": "After feedback, check that Task 1 has a clear overview and relevant comparisons. For Task 2, check that each main point has a reason and a relevant example. Rewrite one weak paragraph and compare it with your first draft instead of tracking the band alone."
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
        id="software-jsonld-AiGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-AiGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-AiGraderClient-en"
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
            <li className="text-slate-900 font-semibold" aria-current="page">IELTS Writing</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium mb-2">
          Comprehensive evaluation based on 4 official IELTS criteria (TR, CC, LR, GRA), detecting grammar and vocabulary improvements to help you identify revisions to try.
        </p>
        <p className="text-slate-600 font-medium">
          Use suggested corrections to revise IELTS Writing Task 1 and Task 2. Check each suggestion against the question and keep the meaning you intended.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <AiGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Mastering IELTS Writing Task 1 & Task 2 Online
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Achieving a high band score in IELTS Writing requires balanced proficiency in logical argument development, lexical variety, and grammatical accuracy. Follow these straightforward steps to get the most out of your practice sessions:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Step 1 - Task Selection:</strong> Choose Task 1 or Task 2 and generate an practice prompt or paste your own question.
            </li>
            <li>
              <strong>Step 2 - Draft Your Essay:</strong> Compose your response keeping appropriate word counts in mind (minimum 150 words for Task 1, 250 words for Task 2).
            </li>
            <li>
              <strong>Step 3 - Evaluate & Review:</strong> Submit your essay to receive a breakdown of your performance across each official criterion and compare with suggested example responses.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            The 4 Core IELTS Grading Criteria
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Feedback considers the published Writing criteria. AI estimates are not examiner decisions:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Task Response (TR) / Task Achievement (TA):</strong> Examines how thoroughly you address all aspects of the task with clear supporting arguments.
            </li>
            <li>
              <strong>Coherence and Cohesion (CC):</strong> Assesses paragraph progression, logical structuring, and cohesive device usage without over-repetition.
            </li>
            <li>
              <strong>Lexical Resource (LR):</strong> Evaluates vocabulary range, idiomatic expressions, academic collocations, and spelling precision.
            </li>
            <li>
              <strong>Grammatical Range and Accuracy (GRA):</strong> Gauges the complexity and correctness of sentence constructions, punctuation, and clause structures.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Secure Account History & Privacy
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            When signed in, all your essays and rubric feedback are automatically saved in your personal <strong>Essay History</strong>. This enables you to track your trajectory over time, revisit grammar suggestions, and reinforce your writing strengths. Submitted content is processed by AI services to create feedback; avoid including sensitive information.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Explore Other Writing Studios
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Expand your language proficiency across multiple official exam formats:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
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
            <li>
              Enhance Chinese writing skills with{' '}
              <Link href="/en/ai-grader/hsk" className="text-blue-600 font-semibold hover:underline">
                HSK Writing Studio
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
            <p><a href="https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf" className="font-semibold text-blue-600 hover:underline">IELTS Writing Key Assessment Criteria</a> · <Link href="/en/privacy" className="text-blue-600 hover:underline">Privacy policy</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


