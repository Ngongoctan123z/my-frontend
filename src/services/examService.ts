import type { Exam, ExamFilters, ExamListResponse } from '../types/exam'
import { apiFetch } from './api'

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
  return await apiFetch<ExamListResponse>('/exams?' + toQuery(filters))
}

export async function getExamsByIds(ids: number[]): Promise<Exam[]> {
  if (ids.length === 0) return []
  const result = await apiFetch<ExamListResponse>('/exams?ids=' + ids.join(',') + '&limit=' + ids.length + '&page=0')
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...result.data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export async function getRelatedExams(id: number): Promise<Exam[]> {
  return await apiFetch<Exam[]>('/exams/' + id + '/related')
}

export async function getExamById(id: number): Promise<Exam> {
  return await apiFetch<Exam>('/exams/' + id)
}

export async function getExamByPath(params: {
  examType: string
  subject: string
  province: string
  year: number
}): Promise<Exam | undefined> {
  const query = new URLSearchParams({
    examType: params.examType,
    subject: params.subject,
    province: params.province,
    year: String(params.year),
  })
  return await apiFetch<Exam>('/exams/lookup?' + query.toString())
}

export async function getPopularExams(): Promise<Exam[]> {
  const result = await apiFetch<ExamListResponse>('/exams?sort=popular&limit=4&page=0')
  return result.data
}

export async function getRecentExams(): Promise<Exam[]> {
  const result = await apiFetch<ExamListResponse>('/exams?sort=recent&limit=3&page=0')
  return result.data
}

export async function recordView(id: number): Promise<void> {
  await apiFetch('/exams/' + id + '/view', { method: 'POST' }).catch(() => {})
}

export async function requestDownload(examId: number, bulk = false): Promise<{ paymentLink?: string; fileUrl: string }> {
  return await apiFetch('/downloads/' + examId + '/request' + (bulk ? '-bulk' : ''), { method: 'POST' })
}

export type ProvinceSummary = {
  province: string
  yearCount: number
}

export async function getProvinces(examType: string, subject: string): Promise<ProvinceSummary[]> {
  return await apiFetch('/exams/provinces?examType=' + examType + '&subject=' + subject)
}
