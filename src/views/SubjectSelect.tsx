'use client'

import { BookOpen, Calculator, Globe } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { SUBJECTS } from '../utils/constants'
import { examTypeLabel, pathToExamType, slugify } from '../utils/slug'

const SUBJECT_CONFIG: Record<
  string,
  { icon: typeof Calculator; gradient: string; accent: string; desc: string }
> = {
  Toán: {
    icon: Calculator,
    gradient: 'from-blue-500 to-indigo-600',
    accent: 'text-blue-400',
    desc: 'Đại số, hình học, giải tích',
  },
  'Ngữ văn': {
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-400',
    desc: 'Đọc hiểu, nghị luận, tác phẩm văn học',
  },
  'Tiếng Anh': {
    icon: Globe,
    gradient: 'from-violet-500 to-purple-600',
    accent: 'text-violet-400',
    desc: 'Reading, Writing, Listening, Speaking',
  },
}

export function SubjectSelect() {
  const params = useParams() as { examType?: string; subject?: string; province?: string; year?: string };
  const examType = params?.examType || 'vao-10';
  const subject = params?.subject || 'toan';
  const province = params?.province || 'nam-dinh';
  const type = pathToExamType(examType)

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: examTypeLabel(type), to: '/category' },
          { label: 'Chọn môn' },
        ]}
      />
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">{examTypeLabel(type)}</h1>
      <p className="text-ink-muted mb-8 text-base">Chọn môn học để xem danh sách đề theo tỉnh</p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {SUBJECTS.map((subject) => {
          const cfg = SUBJECT_CONFIG[subject]
          const Icon = cfg?.icon ?? BookOpen
          return (
            <Link prefetch={false} href={`/exams/${examType}/${slugify(subject)}`}
              className="subject-card group relative overflow-hidden rounded-2xl"
            >
              {/* Gradient top band */}
              <div
                className={`h-32 w-full bg-gradient-to-br ${cfg?.gradient ?? 'from-gray-500 to-gray-600'} flex items-center justify-center`}
              >
                <Icon
                  size={52}
                  className="text-white opacity-80 transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Content */}
              <div className="bg-surface border-line border border-t-0 rounded-b-2xl p-5">
                <h2 className="text-xl font-bold">{subject}</h2>
                <p className="text-ink-muted mt-1 text-sm">{cfg?.desc}</p>
                <p className="mt-3 text-[0.8rem] font-semibold text-[var(--color-primary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Xem đề → 
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
