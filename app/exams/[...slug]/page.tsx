import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExamDetail } from '../../../src/views/ExamDetail'
import { examTypeLabel, pathToExamType, slugify, examPath } from '../../../src/utils/slug'
import { SUBJECTS, PROVINCES, FRONTEND_URL } from '../../../src/utils/constants'
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
  
  let title = 'Kho Đề Thi'
  let desc = 'Kho đề thi tuyển sinh vào lớp 10 và thi tốt nghiệp THPT của các tỉnh thành. Tải đề và xem online.'
  let canonical = FRONTEND_URL
  
  if (slug.length === 1) {
    const exam = await fetchExamData(slug)
    if (exam) {
      title = exam.title || `Đề thi ${exam.subject} ${examTypeLabel(exam.examType)} ${exam.province} ${exam.year}`
      desc = `${title}. Xem online và tải tài liệu hoàn toàn miễn phí.`
      canonical = `${FRONTEND_URL}${examPath({ examType: exam.examType, subject: exam.subject, province: exam.province, year: exam.year })}`
    } else {
      title = 'Đề thi không tồn tại'
    }
  } else if (slug.length >= 4) {
    const [examType, subject, province, year] = slug
    const parsedType = pathToExamType(examType)
    const fallbackSubject = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
    const fallbackProvince = PROVINCES.find((item) => slugify(item) === province) ?? province
    const fallbackYear = Number(year)

    title = `Đề thi ${fallbackSubject} ${examTypeLabel(parsedType) === 'Vào 10' ? 'vào 10' : 'THPT'} ${fallbackProvince} ${fallbackYear}`
    desc = `${title}. Xem online và tải tài liệu hoàn toàn miễn phí.`
    canonical = `${FRONTEND_URL}/exams/${examType}/${subject}/${province}/${year}`
  }

  return { 
    title, 
    description: desc, 
    openGraph: { 
      title, 
      description: desc, 
      type: 'article', 
      url: canonical,
      images: [
        {
          url: `${FRONTEND_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        }
      ]
    },
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

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: FRONTEND_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: examTypeLabel(exam.examType),
        item: `${FRONTEND_URL}/category/${slug[0]}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: exam.subject,
        item: `${FRONTEND_URL}/exams/${slug[0]}/${slug[1]}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: exam.province,
        item: `${FRONTEND_URL}/exams/${slug[0]}/${slug[1]}/${slug[2]}`,
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: String(exam.year),
        item: `${FRONTEND_URL}/exams/${slug[0]}/${slug[1]}/${slug[2]}/${slug[3]}`,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <ExamDetail initialExam={exam} initialRelated={relatedExams} slug={slug} />
    </>
  )
}
