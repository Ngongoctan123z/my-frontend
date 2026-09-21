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
      className={`exam-card group bg-surface border-line overflow-hidden rounded-2xl border ${
        highlight ? 'ring-2 ring-[var(--color-accent)]' : ''
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`relative flex h-28 items-end bg-gradient-to-br ${gradient} p-4 overflow-hidden transition-all duration-300`}
      >
        {exam.thumbnailUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={exam.thumbnailUrl.startsWith('http') ? exam.thumbnailUrl : `${BASE_URL}${exam.thumbnailUrl}`} 
              alt="Thumbnail" 
              className="w-full h-full object-cover object-top opacity-50 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-80" 
            />
            {/* Gradient overlay to ensure text is readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}
        <div className="relative z-10 flex w-full items-start justify-between">
          <div className="flex flex-col items-start gap-1.5">
            <Badge>{examTypeLabel(exam.examType)}</Badge>
            {exam.isOfficial && <span className="inline-flex rounded-md bg-emerald-500/90 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-sm border border-emerald-400">CHÍNH THỨC</span>}
            {exam.hasAnswers && <span className="inline-flex rounded-md bg-blue-500/90 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-sm border border-blue-400">CÓ ĐÁP ÁN</span>}
          </div>
          <Icon size={28} className={`${iconColor} opacity-70 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100 self-end drop-shadow-sm`} />
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 p-4">
        <div>
          <h3 className="text-[0.95rem] font-semibold leading-snug line-clamp-2" title={exam.title || exam.subject}>
            {exam.title || exam.subject}
          </h3>
          <p className="text-ink-muted mt-1.5 text-[0.875rem] line-clamp-1">
            {exam.schoolName ? `${exam.schoolName} · ` : ''}{exam.province} · {exam.year}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[0.8rem] text-ink-muted">
          <span className="flex items-center gap-1">
            <Download size={13} className="opacity-70" />
            {formatNumber(exam.downloadCount)}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={13} className="opacity-70" />
            {formatNumber(exam.viewCount)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Link href={examPath(exam)}
            className="btn-press bg-[var(--color-primary)] inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl px-3 py-1.5 text-[0.875rem] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Xem đề thi
          </Link>
          <Button
            className="min-h-[40px] min-w-[40px]"
            variant={favorite ? 'accent' : 'ghost'}
            aria-label={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            onClick={() => {
              const next = toggleFavorite(exam.id)
              notify(next ? 'Đã thêm vào yêu thích ⭐' : 'Đã bỏ yêu thích', next ? 'success' : 'info')
            }}
          >
            <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
          </Button>
        </div>
      </div>
    </article>
  )
}
