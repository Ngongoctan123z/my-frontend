'use client'

import { BookOpen, Clock, Star } from 'lucide-react'

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

export function ExamCard({ exam, highlight = false }: { exam: Exam; highlight?: boolean }) {
  const subjectSlug = slugify(exam.subject)
  const iconColor = SUBJECT_ICON_COLOR[subjectSlug] ?? 'text-[var(--color-primary)]'
  const Icon = SUBJECT_ICONS[subjectSlug] ?? BookOpen

  // Create a display date (dd/MM/yyyy)
  const displayDate = exam.createdAt
    ? new Date(exam.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Đang cập nhật'

  const path = examPath(exam)

  return (
    <article
      className={`relative group flex items-start gap-4 py-5 border-b border-line border-dashed last:border-b-0 transition-all duration-300 ease-out ${
        highlight ? 'bg-[var(--color-primary)]/5 -mx-4 px-4' : ''
      }`}
    >
      {/* Thumbnail */}
      <a
        href={path}
        className="shrink-0 block w-[90px] h-[127px] md:w-[130px] md:h-[184px] border border-line bg-white shadow-sm transition-all duration-300 ease-out group-hover:shadow-lg group-hover:-translate-y-1 relative overflow-hidden rounded-md cursor-pointer"
        aria-label={`Xem chi tiết ${exam.title || exam.subject}`}
      >
        {exam.thumbnailUrl ? (
          <img
            src={exam.thumbnailUrl.startsWith('http') ? exam.thumbnailUrl : `${BASE_URL}${exam.thumbnailUrl}`}
            alt={exam.title || exam.subject}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-page transition-transform duration-500 group-hover:scale-105">
            <Icon size={32} className={`${iconColor} opacity-50`} />
          </div>
        )}
      </a>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-start pt-1 md:pt-2">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Year Badge (Bold Blue as requested) */}
          <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] uppercase tracking-wide font-bold text-blue-700 border border-blue-200">
            Năm {exam.year}
          </span>

          {/* Official vs Mock Badge */}
          {exam.isOfficial ? (
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
              Đề chính thức
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
              Đề thi thử
            </span>
          )}
        </div>

        <h3 className="text-[1.05rem] md:text-[1.2rem] font-bold text-[#1a2b49] leading-snug mb-3 mt-1 line-clamp-3 md:line-clamp-none">
          <a
            href={path}
            className="hover:text-[var(--color-primary)] transition-colors duration-300 block cursor-pointer"
          >
            {exam.title || `Đề thi ${exam.subject} - ${exam.province} - ${exam.year}`}
          </a>
        </h3>

        <div className="flex items-center gap-1.5 text-[0.875rem] text-[#888] font-medium transition-opacity duration-300 group-hover:opacity-80">
          <Clock size={16} />
          <span>{displayDate}</span>
        </div>
      </div>
    </article>
  )
}
