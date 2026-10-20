import Link from 'next/link'
import { getCoreMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() { return getCoreMetadata('/en/about') }

export default function AboutPageEn() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">About VNDocs — Writing and Speaking Practice</h1>
      <p>VNDocs helps language learners practise writing and speaking. Work on a specific task, review AI feedback, identify an error and try the skill again.</p>

      <h2>What you can practise</h2>
      <ul>
        <li><Link href="/en/ai-grader/ielts">IELTS Writing Task 1 and Task 2</Link>: practise writing and review task response, organisation, vocabulary and grammar.</li>
        <li><Link href="/en/ai-grader/toeic">TOEIC Writing questions 1–8</Link>: write picture sentences, reply to emails and develop an opinion essay.</li>
        <li><Link href="/en/ai-grader/topik">TOPIK II questions 51–54</Link> and <Link href="/en/ai-grader/hsk">HSK 5 and HSK 6</Link>: practise Korean and Chinese writing tasks.</li>
        <li><Link href="/speaking">IELTS and TOEIC Speaking</Link>: record, replay, review recognised text and receive practice feedback. The Speaking interface is currently in Vietnamese.</li>
      </ul>

      <h2>How to use AI feedback</h2>
      <p>AI scores and comments are practice estimates. They can be wrong and do not replace official exam results or a teacher&apos;s assessment. Compare suggestions with your original task and answer, choose an error to work on, then write or speak again. Speech recognition can also mishear words in a recording.</p>
      <p>VNDocs operates independently. It is not an exam organiser or a representative of the organisations that own IELTS, TOEIC, TOPIK or HSK. Publisher sample materials are attributed where they appear.</p>

      <h2>Your account and practice history</h2>
      <p>Sign in with Google to use account features and revisit your practice history. Grading allowances depend on your plan; check the <Link href="/en/premium">plan page</Link> and the remaining allowance shown in the practice room before submitting.</p>
      <p>The <Link href="/en/privacy">privacy policy</Link> explains how account data, writing and recordings are processed.</p>

      <h2>Feedback and support</h2>
      <p>Use the <Link href="/en/contact">VNDocs contact page</Link> to report a technical problem or an unhelpful assessment. Details about the task, recognised text or grading result help identify the issue.</p>
    </article>
  )
}

