import { getCoreMetadata } from '@/src/utils/serverSeo'
import React from 'react'

export async function generateMetadata() { return getCoreMetadata('/en/terms') }

export default function TermsPageEn() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Terms of Service</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">Last updated: 20 October 2026</p>
      <p className="text-[var(--text-secondary)] text-base">By accessing and using <strong>VNDocs.net</strong>, you agree to comply with the following terms and conditions. Please read them carefully before using our services.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">1. Acceptance of Terms</h2>
      <p className="text-[var(--text-secondary)] text-base">By using VNDocs, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please stop using the website immediately.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">2. Intellectual Property</h2>
      <p className="text-[var(--text-secondary)] text-base">Content, tools, interfaces, logos and source code created by VNDocs are owned by VNDocs. Exam trademarks, publisher sample materials and publisher PDFs belong to their respective owners. Citing these sources does not imply VNDocs owns them or is endorsed by their owners. You may not copy, modify or distribute VNDocs-owned content for commercial purposes without written permission.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">3. Acceptable Use</h2>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li>You agree not to use VNDocs for any unlawful or illegal purpose.</li>
        <li>You must not attempt to disrupt or interfere with the proper functioning of the website.</li>
        <li>You agree to use the writing grader and learning tools solely for personal educational purposes.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">4. Disclaimer</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs provides practice content and services for reference purposes. Tasks, recognised text and feedback may contain errors. The AI grading feature provides academic suggestions and does not fully replace official examinations. VNDocs is not liable for any losses arising from the use of information on the website.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">5. Changes to Terms</h2>
      <p className="text-[var(--text-secondary)] text-base">We reserve the right to modify these Terms at any time. Changes take effect immediately upon being posted on the website. Continued use of VNDocs constitutes your acceptance of those changes.</p>
    </div>
  )
}

