import { Metadata } from 'next'
import Script from 'next/script'
import { TopikGraderClient } from '@/app/ai-grader/topik/TopikGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/ai-grader/topik',
    'AI TOPIK II Writing Grader (Q51-54) | Free Practice on VNDocs',
    'Practice TOPIK II 쓰기 (Questions 51, 52, 53, 54) effectively with AI. Automatic grading, Korean grammar correction, and advanced expressions suggestion.'
  )
}

export default function EnTopikPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI TOPIK Writing Grader Tool',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice TOPIK II 쓰기 with AI. Automatic grading, grammar correction, and advanced expressions suggestion.',
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
        name: 'AI Grader',
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

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-TopikGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-TopikGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Practice TOPIK II 쓰기 with AI Grader</h1>
        <p className="text-slate-600 font-medium">Detailed grading for questions 51, 52, 53, 54 in the TOPIK II exam. AI will correct your Korean grammar and spelling, and suggest advanced grammatical expressions to help you get the maximum score.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <TopikGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How to self-study & Grade TOPIK II (쓰기) with AI</h2>
          <p>The Writing section (쓰기) is always a major challenge for candidates taking the TOPIK II exam. However, with the support of <strong>VNDocs's AI TOPIK Assistant</strong>, achieving high scores in questions 51, 52, 53, and 54 is completely within reach.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. Detailed analysis of each question type</h3>
          <ul>
            <li><strong>Questions 51 & 52 (Fill in the blanks):</strong> AI will analyze the context to suggest suitable sentence endings (-ㅂ/습니다 or -ㄴ/는다).</li>
            <li><strong>Question 53 (Chart description):</strong> Automatically checks expressions for describing trends (increase, decrease, compare) and cohesive sentence linking.</li>
            <li><strong>Question 54 (Social essay):</strong> Graded based on logic, variety of advanced vocabulary (Sino-Korean), and advanced grammar structures (level 4-6).</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. Outstanding value and utility</h3>
          <p>You don't need to spend money hiring a Korean teacher to grade your essay. The AI works 24/7, providing lightning-fast and detailed feedback on spelling mistakes, and particle usage (은/는, 이/가, 을/를). Additionally, the system <strong>provides maximum-score sample essays</strong> for you to learn native-like thinking.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">3. Operating Mechanism & Security</h3>
          <p>Fine-tuned on a massive amount of real TOPIK exam data, the AI understands the grading criteria of NIIED perfectly. Your essays are only processed temporarily and deleted immediately after the results are returned, ensuring maximum privacy.</p>
        </article>
      </div>
    </div>
  )
}
