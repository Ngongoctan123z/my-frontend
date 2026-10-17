import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | VNDocs',
  description: 'Terms and conditions for using the VNDocs platform. Please read carefully before registering and using our services.',
  robots: { index: false, follow: false }
}

export default function TermsPageEn() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Terms of Service</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">Last updated: September, 2026</p>
      <p className="text-[var(--text-secondary)] text-base">By accessing and using <strong>VNDocs.net</strong>, you agree to comply with the following terms and conditions. Please read them carefully before using our services.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">1. Acceptance of Terms</h2>
      <p className="text-[var(--text-secondary)] text-base">By using VNDocs, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please stop using the website immediately.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">2. Intellectual Property</h2>
      <p className="text-[var(--text-secondary)] text-base">All content, tools, interfaces, logos, and source code on VNDocs are owned by VNDocs. Except for user-contributed materials (which remain property of their original authors), you may not copy, modify, or distribute any website content for commercial purposes without written permission.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">3. Acceptable Use</h2>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li>You agree not to use VNDocs for any unlawful or illegal purpose.</li>
        <li>You must not attempt to disrupt or interfere with the proper functioning of the website.</li>
        <li>You agree to use the writing grader and learning tools solely for personal educational purposes.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">4. Disclaimer</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs provides services and materials for reference purposes. We do not guarantee 100% accuracy of all community-contributed content. The AI grading feature provides academic suggestions and does not fully replace official examinations. VNDocs is not liable for any losses arising from the use of information on the website.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">5. Changes to Terms</h2>
      <p className="text-[var(--text-secondary)] text-base">We reserve the right to modify these Terms at any time. Changes take effect immediately upon being posted on the website. Continued use of VNDocs constitutes your acceptance of those changes.</p>
    </div>
  )
}
