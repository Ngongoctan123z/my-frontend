import type { Exam, ExamFilters, ExamListResponse } from '../types/exam'
import { apiFetch } from './api'
import { archivedExam2026, archivedExamByPath, archiveExamPage, filterArchivedExams, compareExams } from '../lib/exams2026'

function toQuery(filters: ExamFilters): string {
  const params = new URLSearchParams()
  if (filters.examType) params.set('examType', filters.examType)
  if (filters.subject) params.set('subject', filters.subject)
  if (filters.province) params.set('province', filters.province)
  if (filters.year) params.set('year', String(filters.year))
  if (filters.q) params.set('q', filters.q)
  if (filters.sort) params.set('sort', filters.sort)
  params.set('page', String(filters.page ?? 0))
  params.set('limit', String(filters.limit ?? 12))
  return params.toString()
}

export async function getExams(filters: ExamFilters = {}): Promise<ExamListResponse> {
  const local = archiveExamPage(filters)
  if (filters.year === 2026) return local
  const page = Math.max(0, filters.page || 0), limit = Math.max(1, filters.limit || 12), needed = (page + 1) * limit
  try {
    const remote = await apiFetch<ExamListResponse>('/exams?' + toQuery({ ...filters, page: 0, limit: needed }), { signal: AbortSignal.timeout(4000) })
    const legacy = [...remote.data]
    // Some upstream deployments cap the requested page size. Fetch the next
    // real pages rather than leaving holes after merging the archive.
    const legacyPageSize = remote.data.length || needed
    for (let nextPage = 1; legacy.length < Math.min(needed, remote.total) && nextPage <= 20; nextPage++) {
      const more = await apiFetch<ExamListResponse>('/exams?' + toQuery({ ...filters, page: nextPage, limit: legacyPageSize }), { signal: AbortSignal.timeout(4000) })
      if (!more.data.length) break
      legacy.push(...more.data)
    }
    const merged = [...filterArchivedExams(filters), ...legacy].sort(compareExams(filters.sort))
    return { data: merged.slice(page * limit, needed), total: local.total + remote.total, page, limit }
  } catch (error) {
    if (!local.total) throw error
    return local
  }
}

export async function getExamsByIds(ids: number[]): Promise<Exam[]> {
  if (ids.length === 0) return []
  const local = ids.map(archivedExam2026).filter((row): row is Exam => !!row)
  const otherIds = ids.filter(id => !archivedExam2026(id))
  const result = otherIds.length ? await apiFetch<ExamListResponse>('/exams?ids=' + otherIds.join(',') + '&limit=' + otherIds.length + '&page=0') : { data: [] }
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...local, ...result.data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export async function getRelatedExams(id: number): Promise<Exam[]> {
  const local = archivedExam2026(id)
  if (local) return filterArchivedExams({ examType: local.examType, subject: local.subject }).filter(row => row.id !== id).slice(0, 6)
  return await apiFetch<Exam[]>('/exams/' + id + '/related')
}

export async function getExamById(id: number): Promise<Exam> {
  const local = archivedExam2026(id)
  if (local) return local
  return await apiFetch<Exam>('/exams/' + id)
}

export async function getExamByPath(params: {
  examType: string
  subject: string
  province: string
  year: number
  slugIdentifier?: string
}): Promise<Exam | undefined> {
  const local = archivedExamByPath(params)
  if (local) return local
  const query = new URLSearchParams({
    examType: params.examType,
    subject: params.subject,
    province: params.province,
    year: String(params.year),
  })
  if (params.slugIdentifier) {
    query.set('slugIdentifier', params.slugIdentifier)
  }
  return await apiFetch<Exam>('/exams/lookup?' + query.toString())
}

export async function getPopularExams(): Promise<Exam[]> {
  const result = await getExams({ sort: 'popular', limit: 4 })
  return result.data
}

export async function getRecentExams(): Promise<Exam[]> {
  const result = await getExams({ sort: 'recent', limit: 3 })
  return result.data
}

export async function recordView(id: number): Promise<void> {
  if (archivedExam2026(id)) return
  await apiFetch('/exams/' + id + '/view', { method: 'POST' }).catch(() => {})
}

export async function requestDownload(examId: number, bulk = false): Promise<{ paymentLink?: string; fileUrl: string }> {
  const local = archivedExam2026(examId)
  if (local) return { fileUrl: local.fileUrl }
  return await apiFetch('/downloads/' + examId + '/request' + (bulk ? '-bulk' : ''), { method: 'POST' })
}

export type ProvinceSummary = {
  province: string
  yearCount: number
}

export async function getProvinces(examType: string, subject: string): Promise<ProvinceSummary[]> {
  return await apiFetch('/exams/provinces?examType=' + examType + '&subject=' + subject)
}
