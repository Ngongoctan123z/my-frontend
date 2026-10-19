import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
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
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice IELTS Writing Academic & General online with instant scoring across 4 official criteria: TR, CC, LR, and GRA.',
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
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which official criteria are evaluated for IELTS Writing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The evaluator analyzes essays across all 4 official IELTS criteria: Task Response / Task Achievement (addressing the prompt), Coherence and Cohesion (logical flow and paragraph transitions), Lexical Resource (vocabulary range and precision), and Grammatical Range and Accuracy (sentence structures and syntax correctness).'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I practice both Task 1 and Task 2?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can switch between Task 1 (Academic visual data reports & General letters) and Task 2 (Discursive opinion essays). You can generate random prompts or enter your own custom question.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are my essays saved for future review?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Once logged in with your account, all submitted essays along with predicted band scores and detailed feedback are securely stored in your personal Essay History tab.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my submitted writing private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All data is encrypted in transit and securely held only within your personal account. We do not share your essays with third parties.'
        }
      }
    ]
  }

  return (
    <div className="py-8 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <Script
        id="software-jsonld-AiGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-AiGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
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
          Comprehensive evaluation based on 4 official IELTS criteria (TR, CC, LR, GRA), detecting grammar and vocabulary improvements to raise your band score effectively.
        </p>
        <p className="text-slate-600 font-medium">
          Automated evaluation to refine grammar and elevate your IELTS Writing Task 1 & 2 band score with benchmark feedback and sample answers.
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
              <strong>Step 1 - Task Selection:</strong> Choose Task 1 or Task 2 and generate an authentic Cambridge-style prompt or paste your own question.
            </li>
            <li>
              <strong>Step 2 - Draft Your Essay:</strong> Compose your response keeping appropriate word counts in mind (minimum 150 words for Task 1, 250 words for Task 2).
            </li>
            <li>
              <strong>Step 3 - Evaluate & Review:</strong> Submit your essay to receive an instant breakdown of your performance across each official criterion and compare with high-scoring sample responses.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            The 4 Core IELTS Grading Criteria
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Each essay is examined under the official band descriptors used by certified examiners:
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
            When signed in, all your essays and rubric feedback are automatically saved in your personal <strong>Essay History</strong>. This enables you to track your trajectory over time, revisit grammar suggestions, and reinforce your writing strengths. All practice data is encrypted and strictly kept private.
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
        </article>
      </div>
    </div>
  )
}
