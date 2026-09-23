export function slugify(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function examTypeToPath(examType: string): string {
  return examType === 'THPT' ? 'thpt' : 'vao-10'
}

export function pathToExamType(path: string): 'VAO_10' | 'THPT' {
  return path === 'thpt' ? 'THPT' : 'VAO_10'
}

export function examTypeLabel(examType: string): string {
  return examType === 'THPT' ? 'THPT' : 'Vào 10'
}

export function examPath(exam: {
  examType: string
  subject: string
  province: string
  year: number
  slugIdentifier?: string
}): string {
  let path = `/exams/${examTypeToPath(exam.examType)}/${slugify(exam.subject)}/${slugify(exam.province)}/${exam.year}`
  if (exam.slugIdentifier && exam.slugIdentifier.trim() !== '') {
    path += `/${slugify(exam.slugIdentifier)}`
  }
  return path
}
