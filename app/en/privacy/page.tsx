import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | VNDocs',
  description: 'VNDocs is committed to protecting your personal information. Read our privacy policy to understand how we handle and safeguard your data.',
  robots: { index: false, follow: false }
}

export default function PrivacyPageEn() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Privacy Policy</h1>
      <p className="text-[var(--text-secondary)] text-base">At <strong>VNDocs</strong>, we take your privacy seriously and are committed to protecting your personal data. This policy explains how we handle and safeguard your information when you use our services.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">1. Data We Collect</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs is designed with maximum privacy in mind:</p>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li><strong>No mandatory registration:</strong> You can use most features (writing graders, PDF tools) without creating an account.</li>
        <li><strong>Secure storage:</strong> If you sign in, your grading history and scores are stored securely under your account so you can review them at any time.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">2. Writing Grader & Essay Evaluation</h2>
      <p className="text-[var(--text-secondary)] text-base">In the writing grader rooms, your essays are automatically analyzed based on internationally recognized academic criteria. VNDocs commits to:</p>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li>Keeping your essay content and scores completely confidential.</li>
        <li>We <strong>NEVER</strong> share or sell your essay data to any third party.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">3. PDF File Processing</h2>
      <p className="text-[var(--text-secondary)] text-base">When you use our PDF tools (Merge, Remove Pages, Lock/Unlock PDF), all processing happens locally in your browser. Your documents are <strong>never uploaded to any server</strong>. This ensures absolute security for your sensitive files.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">4. Cookies & Analytics</h2>
      <p className="text-[var(--text-secondary)] text-base">We may use cookies to store your interface preferences (such as Dark Mode) and use anonymous traffic analysis tools (e.g., Google Analytics) to better understand user needs and improve the website. No personally identifiable information is collected through this process.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">5. Contact</h2>
      <p className="text-[var(--text-secondary)] text-base">If you have any questions about this Privacy Policy, please reach out to us via our <a href="/en/contact" className="text-[var(--color-primary)] hover:underline">Contact page</a>.</p>
    </div>
  )
}
