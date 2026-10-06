import { Metadata } from 'next'
import Script from 'next/script'
import { ToeicGraderClient } from '@/app/ai-grader/toeic/ToeicGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/ai-grader/toeic',
    'AI TOEIC Writing Grader & Practice Online | VNDocs',
    'Practice TOEIC Writing (Respond to a written request, Write an opinion essay) with an instant AI grading system. Detect errors, suggest sentence structures, and score high vocabulary.'
  )
}

export default function EnToeicPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI TOEIC Writing Grader Tool',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice TOEIC Writing with instant AI grading. Detect errors, suggest structures and vocabulary to achieve high scores.',
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
        name: 'AI Grader',
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

  return (
    <div className="py-8">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">TOEIC Writing Online Grader by AI</h1>
        <p className="text-slate-600 font-medium">Practice TOEIC Writing formats (Respond, Essay) with lightning-fast AI grading. Analyze errors and suggest high-scoring vocabulary and structures to optimize your test time.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How to self-study & Grade TOEIC Writing with AI</h2>
          <p>The Writing section in the TOEIC test (TOEIC Writing) often confuses many candidates because of its high practicality in the workplace environment. VNDocs's <strong>AI TOEIC Writing grading tool</strong> is specifically designed to help you conquer this test format easily.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Evaluation criteria close to the real test</h3>
          <p>The AI system evaluates your essay based on the standard criteria of ETS (the TOEIC test creator):</p>
          <ul>
            <li><strong>Quality and logic of the answer:</strong> Did you answer the question directly? Do the arguments provided strongly support your opinion?</li>
            <li><strong>Vocabulary diversity:</strong> Checks the use of workplace vocabulary (Business English) and the richness of your vocabulary.</li>
            <li><strong>Grammar & Syntax:</strong> Ability to use complex sentence structures, conditional sentences, and accuracy in tenses and articles.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Benefits</h3>
          <p>Using the AI tool to practice TOEIC Writing helps you shorten your study time significantly. After submitting each essay, you will receive immediate results including: Estimated score, Grammar errors to fix, and a <strong>Sample Answer</strong> to reference for high-scoring writing styles.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Absolute Security</h3>
          <p>We understand that some of the exercises you do may relate to real work emails. Therefore, the system does not store any of your text after grading. End-to-end encryption ensures that 100% of your data is safe.</p>
        </article>
      </div>
    </div>
  )
}
