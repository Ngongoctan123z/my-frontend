import { Metadata } from 'next'
import Script from 'next/script'
import { HskGraderClient } from '@/app/ai-grader/hsk/HskGraderClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/ai-grader/hsk',
    'AI HSK 5 & HSK 6 Writing Grader Online | VNDocs',
    'Practice HSK 5 & HSK 6 Writing with an AI grading tool. Automatic scoring, Chinese grammar correction, vocabulary suggestions according to HSK standards.'
  )
}

export default function EnHskPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI HSK Writing Grader Tool',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Practice HSK 5 & HSK 6 Writing with AI. Automatic scoring, grammar correction, and vocabulary suggestions.',
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
        name: 'AI Grader',
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

  return (
    <div className="py-8">
      <Script
        id="software-jsonld-HskGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-HskGraderClient-en"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Practice HSK Writing Online with AI Grader</h1>
        <p className="text-slate-600 font-medium">Practice HSK 5 (80 characters) and HSK 6 (400 characters) writing formats. Instantly grade, correct Chinese grammar, and improve vocabulary according to standard HSK criteria.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <HskGraderClient />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-100">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How to self-study & Grade HSK Writing with AI</h2>
          <p>The <strong>AI HSK Writing grading tool</strong> from VNDocs is specifically designed to help you practice HSK 5 and HSK 6 writing sections efficiently. Get your essays evaluated accurately against HSK standards.</p>
          
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">1. HSK 5 Writing Structure</h3>
          <p>HSK 5 requires writing a short paragraph (about 80 characters). The prompt might provide 5 vocabulary words or a picture. You need to use logic and link them into a complete paragraph without grammatical errors, expressing yourself naturally.</p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">2. HSK 6 Writing Structure (Summary)</h3>
          <p>HSK 6 requires reading comprehension and summarizing skills. You will read a 1000-character article, then write a summary of about 400 characters, including a title. You must absolutely not add personal opinions.</p>

        </article>
      </div>
    </div>
  )
}
