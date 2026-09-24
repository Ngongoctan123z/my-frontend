'use client'

import { CalendarDays, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { getExams } from '../services/examService'
import { PROVINCES, SUBJECTS } from '../utils/constants'
import { formatNumber } from '../utils/dateFormat'
import { examTypeLabel, pathToExamType, slugify } from '../utils/slug'
import { useSeo } from '../utils/seo'

export function YearList() {
  const params = useParams() as { examType?: string; subject?: string; province?: string; year?: string };
  const examType = params?.examType || 'vao-10';
  const subject = params?.subject || 'toan';
  const province = params?.province || 'nam-dinh';
  const type = pathToExamType(examType)
  const subjectLabel = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
  const provinceLabel = PROVINCES.find((item) => slugify(item) === province) ?? province

  useSeo(
    `${subjectLabel} ${examTypeLabel(type)} ${provinceLabel} | VNDocs Online`,
    `Danh sách đề thi ${subjectLabel} ${examTypeLabel(type)} tỉnh ${provinceLabel} các năm. Xem và tải PDF miễn phí.`,
  )

  const exams = useQuery({
    queryKey: ['exams', type, subjectLabel, provinceLabel],
    queryFn: () =>
      getExams({
        examType: type,
        subject: subjectLabel,
        province: provinceLabel,
        sort: 'recent',
        limit: 20,
        page: 0,
      }),
  })

  const examList = exams.data?.data ?? []

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: examTypeLabel(type), to: `/category/${examType}` },
          { label: subjectLabel, to: `/exams/${examType}/${subject}` },
          { label: provinceLabel },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          {subjectLabel} · {provinceLabel}
        </h1>
        <p className="text-ink-muted mt-2">
          {examTypeLabel(type)} — {examList.length > 0 ? `${examList.length} năm có đề` : 'Đang tải...'}
        </p>
      </div>

      {exams.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : examList.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-xl font-semibold">Chưa có đề nào</p>
          <p className="text-ink-muted mt-2 text-sm">Tỉnh này chưa có đề môn {subjectLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {examList.map((exam, index) => (
            <Link href={`/exams/${examType}/${subject}/${province}/${exam.year}`}
              className="year-card bg-surface border-line fade-in group flex flex-col gap-4 rounded-2xl border p-5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Year badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-[var(--color-primary)] opacity-80" />
                  <span className="font-mono text-lg font-bold text-[var(--color-primary)]">
                    {exam.year}
                  </span>
                </div>
                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  PDF
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Download size={13} />
                  {formatNumber(exam.downloadCount)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={13} />
                  {formatNumber(exam.viewCount)}
                </span>
              </div>

              {/* CTA hint */}
              <p className="text-xs font-semibold text-[var(--color-primary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Xem đề →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

