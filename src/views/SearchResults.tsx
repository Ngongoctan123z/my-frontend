'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
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

export function SearchResults({ initialExams }: { initialExams?: import('../types/exam').ExamListResponse }) {
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
    initialData: (!q && !examType && !subject && !province && !year && sort === 'recent' && page === 0) ? initialExams : undefined
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

  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)
  const [toolkitDropdownOpen, setToolkitDropdownOpen] = useState(false)
  const subjectDropdownRef = useRef<HTMLDivElement>(null)
  const toolkitDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setSubjectDropdownOpen(false)
      }
      if (toolkitDropdownRef.current && !toolkitDropdownRef.current.contains(event.target as Node)) {
        setToolkitDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-6">
      {/* Quick Filters Banner */}
      <section className="sticky top-[73px] z-30 -mx-6 mb-6 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Main Quick Actions Row */}
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
            
            {/* Subject Dropdown */}
            <div className="relative shrink-0" ref={subjectDropdownRef}>
              <button
                type="button"
                onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  subject ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'border-line bg-page text-ink hover:bg-surface border'
                }`}
              >
                Môn: {subject || 'Tất cả'}
                <svg className={`w-3 h-3 transition-transform ${subjectDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {subjectDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 bg-surface border border-line rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    onClick={() => { updateParam('subject', undefined); setSubjectDropdownOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-page transition-colors ${!subject ? 'font-bold text-[var(--color-primary)]' : 'text-ink'}`}
                  >
                    Tất cả các môn
                  </button>
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { updateParam('subject', s); setSubjectDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-page transition-colors ${subject === s ? 'font-bold text-[var(--color-primary)]' : 'text-ink'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toolkit Dropdown */}
            <div className="relative shrink-0" ref={toolkitDropdownRef}>
              <button
                type="button"
                onClick={() => setToolkitDropdownOpen(!toolkitDropdownOpen)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-page px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-all"
              >
                <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Bộ công cụ
                <svg className={`w-3 h-3 transition-transform ${toolkitDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {toolkitDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-surface border border-line rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">Tiện ích học tập</div>
                  <button type="button" onClick={() => setToolkitDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-page transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    Tính điểm GPA
                  </button>
                  <button type="button" onClick={() => setToolkitDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-page transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    Máy tính Casio
                  </button>
                  <div className="my-1 border-t border-line"></div>
                  <div className="px-4 py-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">Xử lý tài liệu</div>
                  <button type="button" onClick={() => setToolkitDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-page transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    Chuyển đổi File
                  </button>
                  <button type="button" onClick={() => setToolkitDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-page transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Khóa File (Bảo mật)
                  </button>
                  <button type="button" onClick={() => setToolkitDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-page transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path></svg>
                    Cắt / Gộp File
                  </button>
                </div>
              )}
            </div>
            
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
        </div>
      </section>

      {/* Filter Toggle Button (Mobile & Desktop) */}
      <div className="flex items-center justify-between pt-8 md:pt-10 pb-2">
        <div className="text-sm font-medium text-ink md:hidden">
          Tìm thấy <strong className="text-[var(--color-primary)]">{totalCount}</strong> đề thi
        </div>
        <div className="hidden md:flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            Danh sách đề thi
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-page border border-line text-ink-muted">
              {totalCount} kết quả
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="hidden md:block text-xs text-ink-muted hover:text-[var(--color-primary)] underline"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-xl text-xs py-2 px-3 border border-line"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Filter size={14} />
            {filtersOpen ? 'Ẩn bộ lọc' : 'Lọc đề thi'}
          </Button>
        </div>
      </div>

      {/* Main Content Layout: Filters + Results */}
      <div className={`grid grid-cols-1 gap-6 ${filtersOpen ? 'md:grid-cols-[280px_1fr]' : ''} pb-12 md:pb-16`}>
        {/* Sidebar Filters */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} md:sticky md:top-24 h-max`}>
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
