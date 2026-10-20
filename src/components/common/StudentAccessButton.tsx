'use client'

import { Loader2, Users } from 'lucide-react'

type Props = {
  onClick: () => void
  isEn?: boolean
  loading?: boolean
  disabled?: boolean
  count?: number
}

export function StudentAccessButton({ onClick, isEn = false, loading = false, disabled = false, count }: Props) {
  return <button type="button" onClick={onClick} disabled={disabled || loading} aria-label={isEn ? 'Manage students' : 'Quản lý học viên'} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500">
    {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true"/> : <Users size={15} className="text-blue-600" aria-hidden="true"/>}
    <span>{isEn ? 'Students' : 'Học viên'}</span>
    {typeof count === 'number' && count > 0 && <span className="border-l border-slate-200 pl-2 text-[11px] tabular-nums text-slate-500">{count}</span>}
    <span className="hidden border-l border-slate-200 pl-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:inline">Plus / Pro</span>
  </button>
}
