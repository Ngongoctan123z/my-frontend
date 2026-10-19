import rows from '../data/exams2026.json'
import type { Exam, ExamFilters, ExamListResponse } from '../types/exam'
import { pathToExamType, slugify } from '../utils/slug'

export const archivedExams2026: Exam[] = rows as Exam[]
export const archivedExam2026 = (id: number) => archivedExams2026.find(row => row.id === id)
export const archiveProvinces2026 = ['An Giang','Bắc Ninh','Cà Mau','Cao Bằng','Cần Thơ','Đà Nẵng','Đắk Lắk','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Nội','Hà Tĩnh','Hải Phòng','TP. Hồ Chí Minh','Huế','Hưng Yên','Khánh Hòa','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Nghệ An','Ninh Bình','Phú Thọ','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sơn La','Tây Ninh','Thái Nguyên','Thanh Hóa','Tuyên Quang','Vĩnh Long']
export const archiveThptSubjects2026 = ['Toán','Ngữ văn','Vật lý','Hóa học','Sinh học','Lịch sử','Địa lý','Giáo dục kinh tế và pháp luật','Tin học','Công nghệ Công nghiệp','Công nghệ Nông nghiệp','Tiếng Anh','Tiếng Nga','Tiếng Pháp','Tiếng Trung Quốc','Tiếng Đức','Tiếng Nhật','Tiếng Hàn']

export function compareExams(sort: ExamFilters['sort'] = 'recent') {
  return (a: Exam, b: Exam) => {
    if (sort === 'popular') return b.viewCount - a.viewCount
    if (sort === 'name') return a.subject.localeCompare(b.subject, 'vi')
    return (Date.parse(b.createdAt || '') || b.year) - (Date.parse(a.createdAt || '') || a.year)
  }
}

export function filterArchivedExams(filters: ExamFilters): Exam[] {
  const query = slugify(filters.q?.trim())
  return archivedExams2026.filter(row =>
    (!filters.examType || row.examType === filters.examType) &&
    (!filters.year || row.year === filters.year) &&
    (!filters.subject || slugify(row.subject) === slugify(filters.subject)) &&
    (!filters.province || slugify(row.province) === slugify(filters.province)) &&
    (!query || slugify([row.title, row.subject, row.province, row.schoolName].join(' ')).includes(query)),
  ).sort(compareExams(filters.sort))
}

export function archiveExamPage(filters: ExamFilters): ExamListResponse {
  const rows = filterArchivedExams(filters), page = Math.max(0, Math.trunc(filters.page || 0))
  const limit = Math.max(1, Math.min(5000, Math.trunc(filters.limit || 12)))
  return { data: rows.slice(page * limit, (page + 1) * limit), total: rows.length, page, limit }
}

export function archivedExamByPath(params: { examType: string; subject: string; province: string; year: number; slugIdentifier?: string }) {
  return archivedExams2026.find(row => row.examType === pathToExamType(params.examType) && row.year === params.year &&
    slugify(row.subject) === slugify(params.subject) && slugify(row.province) === slugify(params.province) &&
    (!params.slugIdentifier || slugify(row.slugIdentifier) === slugify(params.slugIdentifier)))
}
