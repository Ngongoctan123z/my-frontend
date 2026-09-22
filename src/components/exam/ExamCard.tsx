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
  'toan':     'text-blue-500',
  'ngu-van':  'text-emerald-500',
  'tieng-anh':'text-violet-500',
}

export function ExamCard({ exam, highlight = false }: { exam: Exam; highlight?: boolean }) {
  const subjectSlug = slugify(exam.subject)
  const iconColor = SUBJECT_ICON_COLOR[subjectSlug] ?? 'text-[var(--color-primary)]'
  const Icon = SUBJECT_ICONS[subjectSlug] ?? BookOpen
  
  // Create a display date (dd/MM/yyyy)
  const displayDate = exam.createdAt 
    ? new Date(exam.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : 'Đang cập nhật'

  return (
    <article
      className={`group flex items-start gap-4 py-5 border-b border-line border-dashed last:border-b-0 ${
        highlight ? 'bg-[var(--color-primary)]/5 -mx-4 px-4' : ''
      }`}
    >
      {/* Thumbnail */}
      <Link href={examPath(exam)} className="shrink-0 block w-[90px] h-[127px] md:w-[130px] md:h-[184px] border border-line bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        {exam.thumbnailUrl ? (
          <img 
            src={exam.thumbnailUrl.startsWith('http') ? exam.thumbnailUrl : `${BASE_URL}${exam.thumbnailUrl}`} 
            alt={exam.title || exam.subject} 
            className="w-full h-full object-cover object-top" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-page">
            <Icon size={32} className={`${iconColor} opacity-50`} />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-start pt-1 md:pt-2">
        <h3 className="text-[1.05rem] md:text-[1.2rem] font-bold text-[#1a2b49] leading-snug mb-3">
          <Link href={examPath(exam)} className="hover:text-[var(--color-primary)] transition-colors line-clamp-3 md:line-clamp-none">
            {exam.title || `Đề thi ${exam.subject} - ${exam.province} - ${exam.year}`}
          </Link>
        </h3>
        
        <div className="flex items-center gap-1.5 text-[0.875rem] text-[#888] font-medium">
          <Clock size={16} />
          <span>{displayDate}</span>
        </div>
      </div>
    </article>
  )
}
