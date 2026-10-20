'use client'

import { type ReactNode } from 'react'
import { signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ArrowRight, FileText, Loader2, LockKeyhole } from 'lucide-react'

type Props = { authenticated: boolean; loading?: boolean; isEn?: boolean; children: ReactNode }

export function PracticeAccessGate({ authenticated, loading = false, isEn, children }: Props) {
  const pathname = usePathname()
  const english = isEn ?? (pathname.startsWith('/en/') || pathname === '/en')
  if (authenticated) return <>{children}</>
  return (
    <section data-practice-access-gate className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-9 text-center shadow-xs sm:px-8 sm:py-12" aria-busy={loading}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><LockKeyhole className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className="text-base font-bold text-slate-900">{english ? 'Sign in to start your response' : 'Đăng nhập để bắt đầu làm bài'}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{english ? 'Explore the prompt freely. Sign in to write or record your answer, receive AI feedback, and save your results.' : 'Bạn có thể xem đề trước. Đăng nhập để viết hoặc thu âm bài làm, nhận nhận xét từ AI và lưu kết quả học tập.'}</p>
      <button type="button" disabled={loading} onClick={() => void signIn('google', { callbackUrl: window.location.href })} className="mt-6 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        {loading ? (english ? 'Checking your account…' : 'Đang kiểm tra tài khoản…') : (english ? 'Continue with Google' : 'Tiếp tục với Google')}
      </button>
      <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{english ? 'View the prompt, then sign in to practise' : 'Xem đề trước · Đăng nhập để luyện tập'}</p>
    </section>
  )
}
