export type ExamType = 'VAO_10' | 'THPT' | 'IELTS' | 'TOEIC'

export type Exam = {
  id: number
  examType: ExamType
  subject: string
  province: string
  year: number
  title: string | null
  schoolName: string | null
  isOfficial: boolean
  hasAnswers: boolean
  answerFileUrl: string | null
  description: string | null
  fileUrl: string
  fileSize: number
  thumbnailUrl: string | null
  downloadCount: number
  viewCount: number
  examCode: string
  status?: string
  contentHtml?: string
  answerHtml?: string
  plainText?: string
  pdfUrl?: string
  slugIdentifier?: string
  seoStructure?: string
  createdAt?: string
  updatedAt?: string
}

export type ExamListResponse = {
  data: Exam[]
  total: number
  page: number
  limit: number
}

export type ExamFilters = {
  examType?: ExamType | ''
  subject?: string
  province?: string
  year?: number
  q?: string
  page?: number
  limit?: number
  sort?: 'popular' | 'recent' | 'name'
}
