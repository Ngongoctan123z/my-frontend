'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Mic, PenTool, Check } from 'lucide-react'

export function HomeClient() {
  const pathname = usePathname()
  const en = pathname === '/en' || pathname.startsWith('/en/')
  const sections = [
    { href: en ? '/en/ai-grader' : '/ai-grader', title: en ? 'Writing Practice' : 'Luyện Writing', icon: PenTool, detail: 'IELTS · TOEIC · TOPIK · HSK', description: en ? 'Write, submit and learn from detailed grammar, vocabulary and task feedback.' : 'Viết bài, nộp chấm và cải thiện ngữ pháp, từ vựng qua nhận xét chi tiết.', color: 'text-blue-600 bg-blue-50' },
    { href: '/speaking', title: en ? 'Speaking Practice' : 'Luyện Speaking', icon: Mic, detail: 'IELTS · TOEIC', description: en ? 'Record your answer, listen again, review the recognized transcript and receive feedback.' : 'Ghi âm, nghe lại, xem lời nói máy nhận được và nhận góp ý để nói tốt hơn.', color: 'text-emerald-600 bg-emerald-50' },
  ]
  return <div className="mx-auto w-full max-w-5xl px-1 py-12 sm:px-4 md:py-20">
    <section className="mx-auto max-w-2xl text-center">
      <p className="mb-4 text-sm font-bold text-blue-600">VNDocs</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">{en ? 'Practice Writing and Speaking' : 'Luyện Writing và Speaking'}</h1>
      <p className="mt-5 text-base leading-7 text-slate-500">{en ? 'Choose a skill, practice and improve with detailed feedback after every submission.' : 'Chọn kỹ năng, bắt đầu luyện tập và tiến bộ qua nhận xét chi tiết sau mỗi bài làm.'}</p>
    </section>
    <section aria-label={en ? 'Choose a skill' : 'Chọn kỹ năng luyện tập'} className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
      {sections.map(({ href, title, icon: Icon, detail, description, color }) => <Link key={href} href={href} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <span className={'inline-flex h-12 w-12 items-center justify-center rounded-xl ' + color}><Icon size={24} /></span>
        <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600">{en ? 'Start practice' : 'Bắt đầu luyện tập'} <ArrowRight size={17} /></span>
      </Link>)}
    </section>
    <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">{(en ? ['Detailed corrections', 'Your practice history', 'Recordings and transcripts'] : ['Sửa lỗi chi tiết', 'Lưu lịch sử luyện tập', 'Ghi âm và bản chép lời']).map(text => <span key={text} className="inline-flex items-center gap-2"><Check size={16} className="shrink-0 text-emerald-600" />{text}</span>)}</div>
  </div>
}
