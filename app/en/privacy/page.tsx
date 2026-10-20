import Link from 'next/link'
import { getCoreMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() { return getCoreMetadata('/en/privacy') }

export default function PrivacyPageEn() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Privacy Policy</h1>
      <p>This page describes how VNDocs processes account information, writing and recordings when you use Writing and Speaking practice features.</p>

      <h2>1. Your account and practice history</h2>
      <p>VNDocs uses Google sign-in for account features. Sign-in profile information such as your name, email and profile picture identifies your account. Submissions, recognised text, feedback, practice scores and plan information are stored under your account so you can review your work and manage your usage allowance.</p>

      <h2>2. Writing and audio processing</h2>
      <p>When you request grading, the task, your answer and the necessary task information are sent to external AI providers for processing. In Speaking, audio is sent when you choose to transcribe a recording or submit an answer. Speech recognition and AI services may process the recording, transcript and delivery measurements to produce the result.</p>
      <p>Live text while speaking may use the browser&apos;s speech recognition service. External processing is subject to the relevant provider&apos;s policies. Avoid including passwords, financial details or unnecessary sensitive information in practice submissions.</p>

      <h2>3. Drafts, recordings and device storage</h2>
      <p>Your browser may store drafts, Speaking recordings and interface preferences on your device, including through browser storage and IndexedDB. Submitted Speaking recordings are stored for processing and account-based playback. Local drafts are not guaranteed to appear on another device, and clearing browser data may remove them.</p>

      <h2>4. Cookies and external services</h2>
      <p>Sign-in and interface features may use cookies or browser storage. The website also loads Google advertising services; external providers may use cookies and similar technologies under their own policies. Links to publisher materials, social networks or other websites lead to services with their own data practices.</p>

      <h2>5. Contact</h2>
      <p>For questions about data processing, use the details on the <Link href="/en/contact">VNDocs contact page</Link>.</p>
    </article>
  )
}

