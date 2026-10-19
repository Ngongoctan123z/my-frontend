import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About VNDocs — Writing and Speaking Practice',
  description: 'VNDocs provides free AI-powered writing graders for IELTS, TOEIC, TOPIK, HSK, plus IELTS and TOEIC Speaking practice. Learn about our mission and team.',
  robots: { index: false, follow: false }
}

export default function AboutPageEn() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">About VNDocs — Free Online Learning Platform</h1>
      <p className="text-[var(--text-secondary)] text-base">Welcome to <strong>VNDocs</strong> — a Writing and Speaking practice platform designed for students, language learners, and educators worldwide.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Our Mission</h2>
      <p className="text-[var(--text-secondary)] text-base">We believe education is the key to a better future, and everyone deserves access to high-quality learning resources without financial barriers. VNDocs&apos;s mission is to build a comprehensive learning ecosystem where knowledge is freely shared, transparent, and accessible to all.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">What We Offer</h2>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li><strong>AI Writing Graders:</strong> Instantly grade IELTS, TOEIC, TOPIK, and HSK writing essays with detailed feedback on grammar, vocabulary, structure, and task achievement — completely free.</li>
        <li><strong>Speaking Practice:</strong> Record IELTS and TOEIC answers, listen again and review recognized transcripts and feedback.</li>
        <li><strong>Learning History:</strong> Revisit your submissions and feedback to track improvement.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Join the VNDocs Community</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs is more than a website — it&apos;s a community. We continuously listen to user feedback to improve and deliver the most useful features. Thank you for choosing VNDocs as your learning companion!</p>
    </div>
  )
}
