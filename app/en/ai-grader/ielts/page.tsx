import { Metadata } from 'next'
import Script from 'next/script'
import { AiGraderClient } from '@/app/ai-grader/ielts/AiGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/ai-grader/ielts',
    'AI IELTS Writing Grader & Band Score | VNDocs',
    'Experience the best free AI IELTS Writing practice system. Detailed grading on 4 criteria (TR, CC, LR, GRA), automatic grammar and vocabulary corrections, and band score improvement tips.'
  )
}

export default function EnIeltsGraderPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI IELTS Writing Grader Tool',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Experience the best free AI IELTS Writing practice system. Detailed grading on 4 criteria (TR, CC, LR, GRA), automatic grammar and vocabulary corrections.',
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
        name: 'AI Grader',
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

  return (
    <div className="py-8">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">IELTS Writing Online Grader by AI</h1>
        <p className="text-slate-600 font-medium mb-2">Lightning-fast detailed grading on 4 standard IELTS criteria, automatically detecting and correcting grammar and vocabulary errors to help you efficiently raise your band score every day, completely free.</p>
        <p className="text-slate-600 font-medium">Applying advanced AI technology to check grammar and improve your IELTS Writing Task 1 & 2 band score. Optimize your practice process, receive detailed feedback, and accurately assess your actual capability.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <AiGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How to use the AI IELTS Writing Grader</h2>
          <p>To get the most accurate grading results and optimize your process of <strong>improving your IELTS Writing Task 1 & 2 band score</strong>, simply follow these simple steps:</p>
          <ul>
            <li><strong>Step 1:</strong> Select the essay type (Task 1 or Task 2) and enter the Prompt in the corresponding box.</li>
            <li><strong>Step 2:</strong> Paste your essay into the text box. Be sure to keep the paragraph structure intact so the AI can easily recognize it.</li>
            <li><strong>Step 3:</strong> Click the "Submit & Grade" button. The AI system will analyze and return the results immediately, including the overall score, scores for each criterion, and detailed feedback.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">4 Standard IELTS Grading Criteria</h3>
          <p>The AI system is fine-tuned according to the exact grading rubric of native examiners, based on 4 core criteria:</p>
          <ul>
            <li><strong>Task Response (TR) / Task Achievement (TA):</strong> Evaluates the extent to which you answer correctly and fully address the prompt requirements, and the logic of your arguments.</li>
            <li><strong>Coherence and Cohesion (CC):</strong> Evaluates the clarity and connection between sentences, paragraphs, and the overall structure of the essay.</li>
            <li><strong>Lexical Resource (LR):</strong> Analyzes vocabulary, the level of diversity, word difficulty, and <strong>automatically corrects vocabulary errors</strong> if any.</li>
            <li><strong>Grammatical Range and Accuracy (GRA):</strong> <strong>Detailed grammar check</strong>, detecting syntax errors, punctuation, and encouraging the use of a variety of complex grammatical structures.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">Service Purpose & Value Provided</h3>
          <p>With the goal of maximizing support for the international student community, this AI grading tool offers a comprehensive self-study solution. You no longer have to wait days to get feedback from a teacher; instead, you can practice continuously and correct mistakes immediately. This is an indispensable tool to <strong>rapidly improve your IELTS Writing band score</strong> while saving costs.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">Operating Mechanism & Security</h3>
          <p>The system uses the most advanced Large Language Models (LLMs), combined with in-depth semantic analysis algorithms. We are absolutely committed to protecting your privacy. All essays after analysis will not be stored or used for other commercial purposes. Exchanged data is encrypted, providing the highest level of <strong>security</strong> for your learning process.</p>
        </article>
      </div>
    </div>
  )
}
