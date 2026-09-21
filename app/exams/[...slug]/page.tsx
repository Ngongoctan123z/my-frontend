import { ExamDetail } from '../../../src/views/ExamDetail'
import { Metadata } from 'next'
import { examTypeLabel, pathToExamType, slugify } from '../../../src/utils/slug'
import { SUBJECTS, PROVINCES } from '../../../src/utils/constants'

type Props = {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  if (slug.length === 1) {
    const id = slug[0]
    try {
      const res = await fetch(`${process.env.API_URL}/api/v1/exams/${id}`, {
        next: { revalidate: 3600 }
      })
      if (!res.ok) return { title: 'Đề thi không tồn tại' }
      const exam = await res.json()
      const title = exam.title || `Đề thi ${exam.subject} ${examTypeLabel(exam.examType)} ${exam.province} ${exam.year}`
      const desc = `${title}. Xem online và tải PDF hoàn toàn miễn phí.`
      return { title, description: desc, openGraph: { title, description: desc, type: 'article' } }
    } catch (e) {
      return { title: 'Kho Đề Thi' }
    }
  }

  if (slug.length >= 4) {
    const [examType, subject, province, year] = slug
    const parsedType = pathToExamType(examType)
    const fallbackSubject = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
    const fallbackProvince = PROVINCES.find((item) => slugify(item) === province) ?? province
    const fallbackYear = Number(year)

    const title = `Đề thi ${fallbackSubject} ${examTypeLabel(parsedType) === 'Vào 10' ? 'vào 10' : 'THPT'} ${fallbackProvince} ${fallbackYear}`
    const desc = `${title}. Xem online và tải PDF hoàn toàn miễn phí.`
    return { title, description: desc, openGraph: { title, description: desc, type: 'article' } }
  }

  return { title: 'Kho Đề Thi' }
}

export default function ExamPage() {
  return <ExamDetail />
}
