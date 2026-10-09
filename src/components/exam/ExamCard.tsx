'use client'

import { BookOpen, Clock, Star } from 'lucide-react'
import Link from 'next/link'

import type { Exam } from '../../types/exam'
import { examPath, slugify } from '../../utils/slug'
import { BASE_URL } from '../../utils/constants'

const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  'toan': Star,
  'ngu-van': BookOpen,
  'tieng-anh': BookOpen,
}

const SUBJECT_ICON_COLOR: Record<string, string> = {
  'toan': 'text-blue-500',
  'ngu-van': 'text-emerald-500',
  'tieng-anh': 'text-violet-500',
}

export function ExamCard({ exam, highlight = false, compact = false }: { exam: Exam; highlight?: boolean; compact?: boolean }) {
  const subjectSlug = slugify(exam.subject)
  const iconColor = SUBJECT_ICON_COLOR[subjectSlug] ?? 'text-[var(--color-primary)]'
  const Icon = SUBJECT_ICONS[subjectSlug] ?? BookOpen

  const displayDate = exam.createdAt
    ? new Date(exam.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Đang cập nhật'

  const path = examPath(exam)

  return (
    <article
      className={`group flex items-start ${compact ? 'gap-3 p-3' : 'gap-4 p-4'} border border-[var(--border-color)] bg-surface rounded-xl transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-md hover:-translate-y-0.5 h-full ${
        highlight ? 'ring-2 ring-[var(--color-primary)]/50 bg-[var(--color-primary)]/5' : ''
      }`}
    >
      {/* Thumbnail */}
        <Link prefetch={false} href={path}
        className={`shrink-0 block ${compact ? 'w-[80px] h-[113px]' : 'w-[100px] h-[141px]'} border border-[var(--border-color)] bg-[var(--bg-primary)] transition-all duration-200 overflow-hidden rounded-[6px] cursor-pointer group-hover:border-[var(--border-color-hover)] group-hover:shadow-[var(--shadow-sm)]`}
        aria-label={`Xem chi tiết ${exam.title || exam.subject}`}
      >
        {exam.thumbnailUrl ? (
          <img
            src={exam.thumbnailUrl.startsWith('http') ? exam.thumbnailUrl : `${BASE_URL}${exam.thumbnailUrl}`}
            alt={exam.title || exam.subject}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top transition-transform duration-400 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon size={24} className={`${iconColor} opacity-40`} />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-start pt-0.5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="inline-flex items-center rounded-[4px] bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[11px] font-[700] text-blue-600 dark:text-blue-400 tracking-wide">
            {exam.year}
          </span>
          {exam.isOfficial ? (
            <span className="inline-flex items-center rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[11px] font-[500] text-emerald-700 dark:text-emerald-400">
              Chính thức
            </span>
          ) : (
            <span className="inline-flex items-center rounded-[4px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[11px] font-[500] text-amber-700 dark:text-amber-400">
              Thi thử
            </span>
          )}
        </div>

        <h3 className={`${compact ? 'text-[13px] line-clamp-3' : 'text-[14px] line-clamp-3'} font-[600] text-[var(--text-primary)] leading-[1.4] mb-2`}>
          <Link prefetch={false} href={path}
            className="hover:text-[var(--color-primary)] transition-colors duration-200"
          >
            {exam.title || `Đề thi ${exam.subject} - ${exam.province} - ${exam.year}`}
          </Link>
        </h3>

        <div className="flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
          <Clock size={11} className="shrink-0" />
          <span>{displayDate}</span>
        </div>
      </div>
    </article>
  )
}
