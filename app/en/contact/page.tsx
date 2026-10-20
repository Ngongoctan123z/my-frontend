import { getCoreMetadata } from '@/src/utils/serverSeo'
import React from 'react'

export async function generateMetadata() { return getCoreMetadata('/en/contact') }

export default function ContactPageEn() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Contact & Partnership</h1>
      <p className="text-[var(--text-secondary)] text-base">VNDocs is always eager to connect with users, teachers, training centers, and partners who share our vision of advancing accessible education.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Feedback & Support</h2>
      <p className="text-[var(--text-secondary)] text-base">If you encounter a technical issue, discover a bug, or have ideas for new features, don&apos;t hesitate to reach out. Every piece of feedback is invaluable in helping VNDocs improve every day.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Partnership & Advertising</h2>
      <p className="text-[var(--text-secondary)] text-base">We welcome collaboration opportunities with educational organizations, language schools, or partners looking to promote their educational products to VNDocs&apos;s engaged community of students and learners.</p>

      <div className="mt-10 p-6 bg-[var(--bg-secondary)] rounded-[12px] border border-[var(--border-color)] not-prose">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Direct Contact Information:</h3>
        <ul className="space-y-4 text-[var(--text-secondary)] text-base">
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span><strong>Email:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vndocsnet@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">vndocsnet@gmail.com</a></span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span><strong>Social:</strong> <a href="https://www.facebook.com/people/Vndocsnet/61595105977293/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-medium hover:underline">VNDocs Facebook Page</a></span>
          </li>
        </ul>
      </div>
    </div>
  )
}

