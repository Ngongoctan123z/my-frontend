'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Filter, GraduationCap, X } from 'lucide-react'
import { ExamFilter } from '../components/exam/ExamFilter'
import { ExamList } from '../components/exam/ExamList'
import { Button } from '../components/ui/Button'
import { getExams } from '../services/examService'
import type { ExamType } from '../types/exam'
import { SUBJECTS, YEARS } from '../utils/constants'
import { useSeo } from '../utils/seo'

export function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const q = searchParams?.get('q') ?? ''
  const examType = (searchParams?.get('examType') as ExamType | '') || ''
  const subject = searchParams?.get('subject') ?? ''
  const province = searchParams?.get('province') ?? ''
  const year = searchParams?.get('year') ?? ''
  const sort = (searchParams?.get('sort') as 'recent' | 'popular' | 'name') || 'recent'

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)

  useSeo(
    q
      ? `Tìm đề thi: ${q} | Kho Đề Thi Online`
      : 'Kho Đề Thi Online - Tuyển Sinh Vào 10 & THPT Quốc Gia',
    q
      ? `Kết quả tìm kiếm đề thi cho “${q}”. Xem online và tải PDF miễn phí.`
      : 'Kho đề thi tuyển sinh vào lớp 10 và thi tốt nghiệp THPT của các tỉnh thành. Tải đề và xem online.',
  )

  const filters = useMemo(
    () => ({
      q: q.trim() || undefined,
      examType: examType || undefined,
      subject: subject || undefined,
      province: province || undefined,
      year: year ? Number(year) : undefined,
      page,
      limit: 12,
      sort,
    }),
    [q, examType, subject, province, year, page, sort],
  )

  const results = useQuery({
    queryKey: ['exams-search', filters],
    queryFn: () => getExams(filters),
  })

  const totalCount = results.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 12))

  const updateParam = (key: string, value: string | undefined) => {
    const nextParams = new URLSearchParams((searchParams?.toString() || ''))
    if (value) {
      nextParams.set(key, value)
    } else {
      nextParams.delete(key)
    }
    setPage(0)
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  const applyFilters = (next: {
    examType: ExamType | ''
    subject: string
    province: string
    year: string
    sort?: 'recent' | 'popular' | 'name'
  }) => {
    const nextParams = new URLSearchParams((searchParams?.toString() || ''))
    if (next.examType) nextParams.set('examType', next.examType)
    else nextParams.delete('examType')

    if (next.subject) nextParams.set('subject', next.subject)
    else nextParams.delete('subject')

    if (next.province) nextParams.set('province', next.province)
    else nextParams.delete('province')

    if (next.year) nextParams.set('year', next.year)
    else nextParams.delete('year')

    if (next.sort && next.sort !== 'recent') nextParams.set('sort', next.sort)
    else nextParams.delete('sort')

    setPage(0)
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  const handleResetFilters = () => {
    setPage(0)
    router.push(pathname || '/')
  }

  const hasActiveFilters = Boolean(q || examType || subject || province || year || sort !== 'recent')

  return (
    <div className="space-y-6">
      {/* Quick Filters Banner */}
      <section className="sticky top-[73px] z-30 -mx-6 mb-6 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Quick Exam Type Pills */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 pt-1 [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => updateParam('examType', undefined)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                !examType
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-page text-ink hover:bg-surface border border-line'
              }`}
            >
              Tất cả đề
            </button>
            <button
              type="button"
              onClick={() => updateParam('examType', examType === 'VAO_10' ? undefined : 'VAO_10')}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                examType === 'VAO_10'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-page text-ink hover:bg-surface border border-line'
              }`}
            >
              <GraduationCap size={14} />
              Tuyển sinh Vào 10
            </button>
            <button
              type="button"
              onClick={() => updateParam('examType', examType === 'THPT' ? undefined : 'THPT')}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                examType === 'THPT'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-page text-ink hover:bg-surface border border-line'
              }`}
            >
              <BookOpen size={14} />
              Tốt nghiệp THPT
            </button>
            
            <div className="mx-1 h-5 w-px bg-line/50 shrink-0"></div>
            
            <select
              value={year || ''}
              onChange={(e) => updateParam('year', e.target.value || undefined)}
              className="shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold border-line bg-page text-ink hover:bg-surface border outline-none"
            >
              <option value="">Năm: Tất cả</option>
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>Năm {y}</option>
              ))}
            </select>
          </div>

          {/* Quick Subjects Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 pt-2 [&::-webkit-scrollbar]:hidden">
            <span className="text-xs text-ink-muted mr-1 font-medium shrink-0">Môn:</span>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateParam('subject', subject === s ? undefined : s)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  subject === s
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-page border border-transparent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Layout: Filters + Results */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] pt-8 md:pt-10 pb-12 md:pb-16">
        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center justify-between md:hidden">
          <div className="text-sm font-medium text-ink">
            Tìm thấy <strong className="text-[var(--color-primary)]">{totalCount}</strong> đề thi
          </div>
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-xl text-xs py-2 px-3 border border-line"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Filter size={14} />
            {filtersOpen ? 'Ẩn bộ lọc' : 'Lọc đề thi'}
          </Button>
        </div>

        {/* Sidebar Filters */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:block md:sticky md:top-24 h-max`}>
          <ExamFilter
            examType={examType}
            subject={subject}
            province={province}
            year={year}
            sort={sort}
            onChange={applyFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Results Column */}
        <div className="space-y-4">
          {/* Status and Active Filter Chips */}
          <div className="hidden md:flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              Danh sách đề thi
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-page border border-line text-ink-muted">
                {totalCount} kết quả
              </span>
            </h2>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-ink-muted hover:text-[var(--color-primary)] underline"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {q && (
                <span className="inline-flex items-center gap-1 text-xs bg-page border border-line px-2.5 py-1 rounded-lg text-ink">
                  Tìm: “{q}”
                  <button type="button" onClick={() => updateParam('q', undefined)}>
                    <X size={12} className="hover:text-red-500" />
                  </button>
                </span>
              )}
              {examType && (
                <span className="inline-flex items-center gap-1 text-xs bg-page border border-line px-2.5 py-1 rounded-lg text-ink">
                  {examType === 'VAO_10' ? 'Vào 10' : 'THPT'}
                  <button type="button" onClick={() => updateParam('examType', undefined)}>
                    <X size={12} className="hover:text-red-500" />
                  </button>
                </span>
              )}
              {subject && (
                <span className="inline-flex items-center gap-1 text-xs bg-page border border-line px-2.5 py-1 rounded-lg text-ink">
                  Môn: {subject}
                  <button type="button" onClick={() => updateParam('subject', undefined)}>
                    <X size={12} className="hover:text-red-500" />
                  </button>
                </span>
              )}
              {province && (
                <span className="inline-flex items-center gap-1 text-xs bg-page border border-line px-2.5 py-1 rounded-lg text-ink">
                  Tỉnh: {province}
                  <button type="button" onClick={() => updateParam('province', undefined)}>
                    <X size={12} className="hover:text-red-500" />
                  </button>
                </span>
              )}
              {year && (
                <span className="inline-flex items-center gap-1 text-xs bg-page border border-line px-2.5 py-1 rounded-lg text-ink">
                  Năm: {year}
                  <button type="button" onClick={() => updateParam('year', undefined)}>
                    <X size={12} className="hover:text-red-500" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Exam Grid */}
          <ExamList
            exams={results.data?.data ?? []}
            highlightQuery={q}
            isLoading={results.isLoading}
            skeletonCount={12}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => {
                  setPage((p) => Math.max(0, p - 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="min-h-10 rounded-xl px-3 border border-line bg-surface text-xs font-medium disabled:opacity-40"
              >
                Trước
              </button>

              {Array.from({ length: Math.min(totalPages, 8) }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setPage(index)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`min-h-10 min-w-10 rounded-xl px-3 text-xs font-semibold transition-colors ${
                    page === index
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border-line bg-surface hover:bg-page border text-ink'
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => {
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="min-h-10 rounded-xl px-3 border border-line bg-surface text-xs font-medium disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
