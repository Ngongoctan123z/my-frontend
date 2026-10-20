import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { TopikGraderClient } from '@/app/ai-grader/topik/TopikGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/en/ai-grader/topik')
}

export default async function EnTopikPage() {
  const customSeo = await getCustomRouteSeo('/en/ai-grader/topik')
  const h1Title = customSeo?.h1 || PAGE_SEO["/en/ai-grader/topik"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TOPIK II Writing Practice & Correction Tool VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'en',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice TOPIK II writing online with instant feedback on Korean grammar, spacing rules, and sentence endings.',
    url: `${FRONTEND_URL}/en/ai-grader/topik`
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
        name: 'TOPIK Writing',
        item: `${FRONTEND_URL}/en/ai-grader/topik`,
      }
    ]
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which TOPIK II questions are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The studio supports all 4 writing tasks of TOPIK II: Sentence completion (Questions 51 & 52), Chart analysis (Question 53: 200-300 words), and Discursive essay (Question 54: 600-700 words).'
        }
      },
      {
        '@type': 'Question',
        name: 'What Korean grammar elements are verified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The system examines Korean spacing rules (띄어쓰기), particle accuracy (은/는, 이/가, 을/를), formal written style consistency (-ㄴ/는다), and suggests higher-level idiomatic grammar patterns.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are my practice writings saved?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Once logged into your account, all submitted essays along with detailed explanations and benchmark sample responses are saved in your personal Essay History.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Your submissions are encrypted and kept strictly private within your account without third-party sharing.'
        }
      }
    ]
  }

  return (
    <div className="py-8 md:px-8 max-w-[1312px] mx-auto">
      <script
        id="software-jsonld-TopikGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-TopikGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-TopikGraderClient-en"
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
            <li className="text-slate-900 font-semibold" aria-current="page">TOPIK II Writing</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium">
          Practice questions 51, 52, 53, and 54 in the TOPIK II exam. Refine Korean grammar, spacing rules (띄어쓰기), formal writing style, and discover advanced grammatical expressions.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <TopikGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-slate-200">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Mastering the TOPIK II Writing Section (쓰기)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The Writing section in TOPIK II tests both grammatical precision and logical Korean composition. Follow these targeted strategies for each task type:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Core Task Strategies
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Questions 51 & 52 (Sentence Fill-ins):</strong> Identify the register (notices or informative texts) and apply the correct formal written verb forms (-ㅂ/습니다 or -ㄴ/는다) along with appropriate conditional connectors.
            </li>
            <li>
              <strong>Question 53 (Visual Data Description):</strong> Focus on trends (increases, decreases, comparisons) and avoid injecting personal opinions. Maintain objective, logical transitional phrases.
            </li>
            <li>
              <strong>Question 54 (Social Discursive Essay):</strong> Structure a 600-700 word essay covering all 3 guiding questions with high-level Sino-Korean vocabulary and Level 4-6 grammatical patterns.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Official NIIED Evaluation Standards
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Submissions are evaluated against official National Institute for International Education (NIIED) rubrics:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Task Fulfillment:</strong> Addressing all guiding requirements clearly and maintaining balanced paragraph structure.
            </li>
            <li>
              <strong>Coherence and Logic:</strong> Effective use of formal conjunctions (반면에, 그럼에도 불구하고, 이와 같이) for natural flow.
            </li>
            <li>
              <strong>Language Competence:</strong> Mastery over word spacing (띄어쓰기), particles, and advanced syntactic constructions.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Account History & Progress Tracking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            When logged in, your submissions, rubric analysis, and high-scoring sample essays are archived in your private <strong>Essay History</strong>. Review earlier corrections and compare your improvement across test sessions.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Explore Other Writing Studios
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Prepare for other official international examinations:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li>
              Practice academic English writing at{' '}
              <Link href="/en/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                IELTS Writing Studio
              </Link>.
            </li>
            <li>
              Prepare for business English communication with{' '}
              <Link href="/en/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                TOEIC Writing Studio
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

