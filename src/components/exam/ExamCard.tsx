'use client'

import { BookOpen, Download, Eye, Star } from 'lucide-react'
import Link from 'next/link'

import { useNotify } from '../../context/NotificationContext'
import { useUser } from '../../context/UserContext'
import type { Exam } from '../../types/exam'
import { formatNumber } from '../../utils/dateFormat'
import { examPath, examTypeLabel, slugify } from '../../utils/slug'
import { BASE_URL } from '../../utils/constants'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  'toan': Star,
  'ngu-van': BookOpen,
  'tieng-anh': BookOpen,
}

const SUBJECT_GRADIENT: Record<string, string> = {
  'toan':     'from-blue-500/20 to-indigo-500/20 group-hover:from-blue-500/35 group-hover:to-indigo-500/35',
  'ngu-van':  'from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/35 group-hover:to-teal-500/35',
  'tieng-anh':'from-violet-500/20 to-purple-500/20 group-hover:from-violet-500/35 group-hover:to-purple-500/35',
}

const SUBJECT_ICON_COLOR: Record<string, string> = {
  'toan':     'text-blue-500',
  'ngu-van':  'text-emerald-500',
  'tieng-anh':'text-violet-500',
}

export function ExamCard({ exam, highlight = false }: { exam: Exam; highlight?: boolean }) {
  const { isFavorite, toggleFavorite } = useUser()
  const { notify } = useNotify()
  const favorite = isFavorite(exam.id)
  const subjectSlug = slugify(exam.subject)
  const gradient = SUBJECT_GRADIENT[subjectSlug] ?? 'from-[var(--color-primary)]/15 to-[var(--color-accent)]/15 group-hover:from-[var(--color-primary)]/25 group-hover:to-[var(--color-accent)]/25'
  const iconColor = SUBJECT_ICON_COLOR[subjectSlug] ?? 'text-[var(--color-primary)]'
  const Icon = SUBJECT_ICONS[subjectSlug] ?? BookOpen

  return (
    <article
      className={`exam-card group bg-surface border-line overflow-hidden rounded-2xl border flex flex-col sm:flex-row items-center p-3 gap-4 transition-colors hover:bg-page/50 ${
        highlight ? 'ring-2 ring-[var(--color-accent)]' : ''
      }`}
    >
      {/* Icon */}
      <div className={`shrink-0 hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon size={24} className={`${iconColor}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-start md:items-center gap-2 mb-1 flex-col md:flex-row">
          <h3 className="text-[1rem] font-bold text-ink leading-snug line-clamp-2 md:line-clamp-none" title={exam.title || exam.subject}>
            {exam.title || exam.subject}
          </h3>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 mt-0.5 md:mt-0">
            {exam.isOfficial && <span className="inline-flex rounded-md bg-emerald-50 text-emerald-600 px-1.5 py-0.5 text-[0.65rem] font-bold border border-emerald-200 uppercase tracking-wide">CHÍNH THỨC</span>}
            {exam.hasAnswers && <span className="inline-flex rounded-md bg-blue-50 text-blue-600 px-1.5 py-0.5 text-[0.65rem] font-bold border border-blue-200 uppercase tracking-wide">CÓ ĐÁP ÁN</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[0.8rem] text-ink-muted flex-wrap">
          <span className="font-semibold text-[var(--color-primary)]">{examTypeLabel(exam.examType)}</span>
          <span className="w-1 h-1 rounded-full bg-line mx-0.5 hidden sm:inline-block"></span>
          <span className="truncate max-w-[200px] lg:max-w-[300px]">
            {exam.schoolName ? `${exam.schoolName} · ` : ''}{exam.province}
          </span>
          <span className="w-1 h-1 rounded-full bg-line mx-0.5 hidden sm:inline-block"></span>
          <strong className="text-ink font-bold">{exam.year}</strong>
        </div>

        {/* Mobile Tags & Stats */}
        <div className="flex md:hidden items-center justify-between gap-3 mt-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
             {exam.isOfficial && <span className="inline-flex rounded-md bg-emerald-50 text-emerald-600 px-1.5 py-0.5 text-[0.65rem] font-bold border border-emerald-200 uppercase tracking-wide">CHÍNH THỨC</span>}
             {exam.hasAnswers && <span className="inline-flex rounded-md bg-blue-50 text-blue-600 px-1.5 py-0.5 text-[0.65rem] font-bold border border-blue-200 uppercase tracking-wide">CÓ ĐÁP ÁN</span>}
          </div>
          <div className="flex items-center gap-3 text-[0.75rem] text-ink-muted font-medium">
            <span className="flex items-center gap-1">
              <Download size={13} className="opacity-70" />
              {formatNumber(exam.downloadCount)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={13} className="opacity-70" />
              {formatNumber(exam.viewCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats and Actions (Desktop) */}
      <div className="flex items-center gap-4 shrink-0 mt-3 md:mt-0 w-full md:w-auto">
        <div className="hidden md:flex items-center gap-4 text-[0.8rem] text-ink-muted font-medium pr-4 border-r border-line">
          <span className="flex items-center gap-1.5" title="Lượt tải">
            <Download size={14} className="opacity-70" />
            {formatNumber(exam.downloadCount)}
          </span>
          <span className="flex items-center gap-1.5" title="Lượt xem">
            <Eye size={14} className="opacity-70" />
            {formatNumber(exam.viewCount)}
          </span>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Link href={examPath(exam)}
            className="btn-press bg-[var(--color-primary)] inline-flex min-h-[36px] flex-1 md:flex-none items-center justify-center rounded-xl px-4 py-1.5 text-[0.875rem] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Xem đề thi
          </Link>
          <Button
            className="min-h-[36px] min-w-[36px] shrink-0"
            variant={favorite ? 'accent' : 'ghost'}
            aria-label={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            onClick={() => {
              const next = toggleFavorite(exam.id)
              notify(next ? 'Đã thêm vào yêu thích ⭐' : 'Đã bỏ yêu thích', next ? 'success' : 'info')
            }}
          >
            <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
          </Button>
        </div>
      </div>
    </article>
  )
}
