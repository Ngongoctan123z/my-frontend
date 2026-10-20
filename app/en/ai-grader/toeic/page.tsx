import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { ToeicGraderClient } from '@/app/ai-grader/toeic/ToeicGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/en/ai-grader/toeic')
}

export default async function EnToeicPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader/toeic')
  const h1Title = customSeo?.h1 || PAGE_SEO["/en/ai-grader/toeic"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TOEIC Writing Practice & Evaluation Tool VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'en',
    applicationCategory: 'EducationalApplication',
    description: PAGE_SEO["/en/ai-grader/toeic"].description,
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
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Which TOEIC Writing tasks are covered?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Practise all 8 questions: five picture sentences using both given words, two separate email responses, and one opinion essay. ETS says an effective essay typically has at least 300 words, with 30 minutes to plan, write and revise."
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
          "text": "For picture sentences, check both required words and only describe visible details. For email tasks, match each request in the incoming message to your reply. For the essay, find a point that lacks support and add a concrete explanation or example."
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
        id="software-jsonld-ToeicGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-ToeicGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
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
          Practise all 8 TOEIC Writing questions: five picture sentences, two separate email responses and an opinion essay. Review AI corrections and estimated practice scores.
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
          <ul className="text-slate-600 space-y-2 mb-6"><li><strong>Picture sentences (Questions 1–5):</strong> Write one sentence for each photograph using both given words. You have 8 minutes for all five questions. Questions 6 and 7 are separate email tasks; question 8 is an opinion essay.</li>
            <li>
              <strong>Email Responses (Questions 6-7):</strong> Read incoming inquiries from colleagues or clients and compose professional replies within 10 minutes per task. Address all required points with appropriate business register.
            </li>
            <li>
              <strong>Opinion Essay (Question 8):</strong> Formulate an opinion essay, typically at least 300 words, in 30 minutes, presenting logical justifications and concrete workplace examples.
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
            When logged in, your submissions and suggested example responses are organized in your private <strong>Essay History</strong>. You can review past feedback, avoid recurring errors, and witness measurable improvements across your practice sessions.
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

          <aside aria-label="Check the test provider’s guidance" className="mt-8 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-7 text-slate-600">
            <p>AI feedback is a practice estimate; VNDocs does not issue official exam scores.</p>
            <p><a href="https://www.ets.org/pdfs/toeic/toeic-speaking-writing-sample-tests.pdf" className="font-semibold text-blue-600 hover:underline">ETS TOEIC Speaking and Writing Sample Tests</a> · <Link href="/en/privacy" className="text-blue-600 hover:underline">Privacy policy</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


