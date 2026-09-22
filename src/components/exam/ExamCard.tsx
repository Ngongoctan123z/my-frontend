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
      <div className={`shrink-0 hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon size={26} className={`${iconColor}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-center w-full md:w-auto md:pr-4">
        <h3 className="text-[1rem] font-bold text-ink leading-snug line-clamp-1 mb-1.5" title={exam.title || exam.subject}>
          {exam.title || exam.subject}
        </h3>
        
        <div className="flex items-center gap-2 text-[0.8125rem] text-ink-muted flex-wrap">
          <Badge className="px-2 py-0.5 text-[0.65rem] uppercase tracking-wider font-bold bg-page border border-line text-ink-muted shadow-sm">{examTypeLabel(exam.examType)}</Badge>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-line mx-0.5"></span>
          <span className="truncate max-w-[200px] lg:max-w-[300px]">
            {exam.schoolName ? `${exam.schoolName} · ` : ''}{exam.province}
          </span>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-line mx-0.5"></span>
          <strong className="text-[var(--color-primary)] font-bold text-[0.85rem] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md shadow-sm">{exam.year}</strong>
        </div>
      </div>

      {/* Stats and Tags */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 w-full md:w-auto shrink-0 md:pr-4 md:border-r border-line md:mr-2">
        <div className="flex items-center gap-1.5">
          {exam.isOfficial && <span className="inline-flex shrink-0 rounded-md bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[0.65rem] font-bold border border-emerald-500/20 uppercase tracking-wide">CHÍNH THỨC</span>}
          {exam.hasAnswers && <span className="inline-flex shrink-0 rounded-md bg-blue-500/10 text-blue-600 px-2 py-0.5 text-[0.65rem] font-bold border border-blue-500/20 uppercase tracking-wide">CÓ ĐÁP ÁN</span>}
        </div>
        <div className="flex items-center gap-3 text-[0.75rem] text-ink-muted font-medium">
          <span className="flex items-center gap-1" title="Lượt tải">
            <Download size={14} className="opacity-70" />
            {formatNumber(exam.downloadCount)}
          </span>
          <span className="flex items-center gap-1" title="Lượt xem">
            <Eye size={14} className="opacity-70" />
            {formatNumber(exam.viewCount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0 sm:mt-0 w-full sm:w-auto">
        <Link href={examPath(exam)}
          className="btn-press bg-[var(--color-primary)] inline-flex min-h-[36px] flex-1 sm:flex-none items-center justify-center rounded-xl px-4 py-1.5 text-[0.875rem] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Xem đề thi
        </Link>
        <Button
          className="min-h-[36px] min-w-[36px] flex-shrink-0"
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
    </article>
  )
}
