import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExamDetail } from '../../../src/views/ExamDetail'
import { examTypeLabel, pathToExamType, slugify, examPath } from '../../../src/utils/slug'
import { SUBJECTS, PROVINCES, BASE_URL } from '../../../src/utils/constants'
import { getExamById, getExamByPath, getExams, getRelatedExams } from '../../../src/services/examService'

type Props = {
  params: Promise<{ slug: string[] }>
}

async function fetchExamData(slug: string[]) {
  if (slug.length === 1) {
    const id = Number(slug[0])
    if (!isNaN(id)) {
      try {
        return await getExamById(id)
      } catch (e) {
        return null
      }
    }
  }

  if (slug.length >= 4) {
    const [examType, subject, province, year] = slug
    const parsedType = pathToExamType(examType)
    const fallbackSubject = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
    const fallbackProvince = PROVINCES.find((item) => slugify(item) === province) ?? province
    const fallbackYear = Number(year)

    try {
      const found = await getExamByPath({
        examType,
        subject: fallbackSubject,
        province: fallbackProvince,
        year: fallbackYear,
      })
      if (found) return found
    } catch (e) {}

    try {
      const res = await getExams({
        examType: parsedType,
        year: fallbackYear,
        limit: 50,
      })
      const match = res.data.find(
        (e) =>
          slugify(e.subject) === subject &&
          slugify(e.province) === province &&
          e.year === fallbackYear,
      )
      if (match) return match
    } catch (err) {}
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const exam = await fetchExamData(slug)
  
  if (!exam) {
    return { title: 'Đề thi không tồn tại' }
  }

  const title = exam.title || `Đề thi ${exam.subject} ${examTypeLabel(exam.examType)} ${exam.province} ${exam.year}`
  const desc = `${title}. Xem online và tải PDF hoàn toàn miễn phí.`
  const canonical = `${BASE_URL}${examPath({ examType: exam.examType, subject: exam.subject, province: exam.province, year: exam.year })}`

  return { 
    title, 
    description: desc, 
    openGraph: { title, description: desc, type: 'article', url: canonical },
    alternates: { canonical }
  }
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params
  const exam = await fetchExamData(slug)

  if (!exam) {
    notFound()
  }

  let relatedExams: import('../../../src/types/exam').Exam[] = []
  try {
    relatedExams = await getRelatedExams(exam.id)
  } catch (e) {}

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: exam.title || `Đề thi ${exam.subject} ${examTypeLabel(exam.examType)} ${exam.province} ${exam.year}`,
    identifier: exam.examCode,
    educationalLevel: examTypeLabel(exam.examType),
    about: exam.subject,
    spatialCoverage: exam.province,
    datePublished: String(exam.year),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExamDetail initialExam={exam} initialRelated={relatedExams} slug={slug} />
    </>
  )
}
