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
      <div className="flex-1 min-w-0 flex flex-col justify-center w-full sm:w-auto">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Badge className="px-1.5 py-0 text-[0.7rem]">{examTypeLabel(exam.examType)}</Badge>
          <h3 className="text-[0.95rem] font-semibold leading-snug line-clamp-1 flex-1 min-w-[200px]" title={exam.title || exam.subject}>
            {exam.title || exam.subject}
          </h3>
          {exam.isOfficial && <span className="inline-flex shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[0.65rem] font-bold text-emerald-600 border border-emerald-500/20">CHÍNH THỨC</span>}
          {exam.hasAnswers && <span className="inline-flex shrink-0 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[0.65rem] font-bold text-blue-600 border border-blue-500/20">CÓ ĐÁP ÁN</span>}
        </div>

        <div className="flex items-center gap-3 text-[0.8rem] text-ink-muted">
          <span className="truncate">{exam.schoolName ? `${exam.schoolName} · ` : ''}{exam.province} · {exam.year}</span>
          <div className="hidden sm:flex items-center gap-3 ml-2 border-l border-line pl-3">
            <span className="flex items-center gap-1" title="Lượt tải">
              <Download size={13} className="opacity-70" />
              {formatNumber(exam.downloadCount)}
            </span>
            <span className="flex items-center gap-1" title="Lượt xem">
              <Eye size={13} className="opacity-70" />
              {formatNumber(exam.viewCount)}
            </span>
          </div>
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
