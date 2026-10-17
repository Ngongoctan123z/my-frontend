import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { ToeicGraderClient } from '@/app/ai-grader/toeic/ToeicGraderClient'
import { getRouteMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(
    '/en/ai-grader/toeic',
    'TOEIC Writing Practice & Evaluation Online | VNDocs',
    'Practice TOEIC Writing (Email responses & Opinion essays) online with rubric evaluation. Detect grammar errors and score high-level business vocabulary.'
  )
}

export default async function EnToeicPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader/toeic')
  const h1Title = customSeo?.h1 || 'TOEIC Writing Online Practice'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TOEIC Writing Practice & Evaluation Tool VNDocs',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice TOEIC Writing online with instant evaluation. Refine sentence structures and expand business vocabulary.',
    url: `${FRONTEND_URL}/en/ai-grader/toeic`
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
        name: 'TOEIC Writing',
        item: `${FRONTEND_URL}/en/ai-grader/toeic`,
      }
    ]
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which tasks are covered in the TOEIC Writing studio?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The studio covers official ETS task types: Respond to a Written Request (Email questions 6-7) and Write an Opinion Essay (Question 8).'
        }
      },
      {
        '@type': 'Question',
        name: 'How does the system grade my TOEIC essay?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Your response is scored against ETS criteria: relevance to the prompt, logical reasoning, diversity of Business English vocabulary, and grammatical accuracy.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are my practice responses saved?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Once logged into your account, all submitted writing tasks and feedback are automatically saved in your personal history for convenient revision.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my workplace writing secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All responses are encrypted in transit and stored privately within your account without third-party sharing.'
        }
      }
    ]
  }

  return (
    <div className="py-8 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <Script
        id="software-jsonld-ToeicGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-ToeicGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="faq-jsonld-ToeicGraderClient-en"
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
            <li className="text-slate-900 font-semibold" aria-current="page">TOEIC Writing</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium">
          Practice official ETS tasks: Respond to written requests (Email Q6-7) and Opinion essays (Q8). Detect grammatical slips, learn business expressions, and improve workplace communication skills.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            How to Master TOEIC Writing Online
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The TOEIC Writing section evaluates functional, communicative English required in international corporate environments. Follow this structured approach to prepare effectively:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Core Test Components
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Email Responses (Questions 6-7):</strong> Read incoming inquiries from colleagues or clients and compose professional replies within 10 minutes per task. Address all required points with appropriate business register.
            </li>
            <li>
              <strong>Opinion Essay (Question 8):</strong> Formulate a 300-word persuasive essay in 30 minutes, presenting logical justifications and concrete workplace examples.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Official ETS Scoring Rubric
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Responses are assessed on communicative competence and structural precision:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Prompt Fulfillment:</strong> Did you address all questions with relevant supporting reasons?
            </li>
            <li>
              <strong>Business Lexicon:</strong> Appropriate use of formal collocations, industry terms, and clear phrasing.
            </li>
            <li>
              <strong>Grammatical Accuracy:</strong> Sound control over complex sentence patterns, conditionals, and transitions.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Account History & Progress Tracking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            When logged in, your submissions and benchmark sample responses are organized in your private <strong>Essay History</strong>. You can review past feedback, avoid recurring errors, and witness measurable improvements across your practice sessions.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Explore Other Writing Studios
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Prepare for other official certification exams:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li>
              Practice academic writing at{' '}
              <Link href="/en/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                IELTS Writing Studio
              </Link>.
            </li>
            <li>
              Prepare for Korean proficiency at{' '}
              <Link href="/en/ai-grader/topik" className="text-blue-600 font-semibold hover:underline">
                TOPIK II Writing Studio (쓰기)
              </Link>.
            </li>
            <li>
              Practice Chinese composition at{' '}
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
