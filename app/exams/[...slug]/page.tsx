import { cache } from 'react'
import { Metadata } from 'next'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { ExamDetail } from '../../../src/views/ExamDetail'
import { examTypeLabel, pathToExamType, slugify, examPath } from '../../../src/utils/slug'
import { getCustomRouteSeo } from '../../../src/utils/serverSeo'
import { SUBJECTS, PROVINCES, FRONTEND_URL } from '../../../src/utils/constants'
import { getExamById, getExamByPath, getExams, getRelatedExams } from '../../../src/services/examService'

type Props = {
  params: Promise<{ slug: string[] }>
}

// Wrapped with React cache() to deduplicate the fetch between
// generateMetadata() and ExamPage() within the same request cycle.
const fetchExamData = cache(async (slug: string[]) => {
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
    const [examType, subject, province, year, slugIdentifier] = slug
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
        slugIdentifier: slugIdentifier || undefined,
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
      if (match) return await getExamById(match.id)
    } catch (err) {}
  }
  return null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  const exam = await fetchExamData(slug)
  if (!exam) return {}
  
  const isVao10 = examTypeLabel(exam.examType) === 'Vào 10'
  const prefix = `Đề thi ${exam.subject} ${isVao10 ? 'vào 10' : 'THPT'} ${exam.province} ${exam.year}`
  const titleText = `${prefix}${exam.hasAnswers ? ' (có đáp án)' : ''}`
  // Truncate if too long
  const title = titleText.length <= 45 ? `${titleText} | VNDocs` : titleText
  
  let desc = `${prefix}. Tải tài liệu định dạng ${exam.fileUrl?.endsWith('.pdf') ? 'PDF' : 'DOCX'} hoàn toàn miễn phí.`
  if (exam.seoStructure) {
    const stripped = exam.seoStructure.replace(/<[^>]+>/g, '').trim()
    if (stripped) {
      const firstSentenceMatch = stripped.match(/^.*?[.!?](?=\s|$)/)
      if (firstSentenceMatch && firstSentenceMatch[0].length > 50 && firstSentenceMatch[0].length < 180) {
        desc = firstSentenceMatch[0].trim()
      } else {
        desc = stripped.length > 155 ? stripped.substring(0, 155).replace(/\s+\S*$/, '') + '...' : stripped
      }
    }
  }
  
  const pathName = examPath(exam as any)
  const canonical = `${FRONTEND_URL}${pathName}`

  let finalTitle = title
  let finalDesc = desc
  let ogImage = `${FRONTEND_URL}/api/og?slug=${slug.join('/')}`

  const customSeo = await getCustomRouteSeo(pathName)
  if (customSeo) {
    if (customSeo.title) finalTitle = customSeo.title
    if (customSeo.description) finalDesc = customSeo.description
    if (customSeo.ogImage) ogImage = customSeo.ogImage
  }

  return { 
    title: finalTitle, 
    description: finalDesc, 
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { 
      type: 'article', 
      locale: 'vi_VN', 
      siteName: 'VNDocs',
      title: finalTitle, 
      description: finalDesc, 
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: finalTitle,
        }
      ],
      publishedTime: exam.createdAt,
      modifiedTime: exam.updatedAt || exam.createdAt
    }
  }
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params
  const exam = await fetchExamData(slug)

  if (!exam) {
    notFound()
  }

  const isVao10 = examTypeLabel(exam.examType) === 'Vào 10'
  const prefix = `Đề thi ${exam.subject} ${isVao10 ? 'vào 10' : 'THPT'} ${exam.province} ${exam.year}`
  const titleText = `${prefix}${exam.hasAnswers ? ' (có đáp án)' : ''}`
  
  let relatedExams: import('../../../src/types/exam').Exam[] = []
  try {
    const p1 = await getExams({ examType: exam.examType, subject: exam.subject, year: exam.year, limit: 5 });
    const p2 = await getExams({ examType: exam.examType, year: exam.year, limit: 5 });
    const p3 = await getExams({ examType: exam.examType, limit: 5 });
    
    const combined = [...p1.data, ...p2.data, ...p3.data].filter(e => e.id !== exam.id);
    const seen = new Set();
    relatedExams = combined.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    }).slice(0, 6);
  } catch (e) {}

  let desc = `${prefix}. Tải tài liệu định dạng ${exam.fileUrl?.endsWith('.pdf') ? 'PDF' : 'DOCX'} hoàn toàn miễn phí.`
  if (exam.seoStructure) {
    const stripped = exam.seoStructure.replace(/<[^>]+>/g, '').trim()
    if (stripped) {
      const firstSentenceMatch = stripped.match(/^.*?[.!?](?=\s|$)/)
      if (firstSentenceMatch && firstSentenceMatch[0].length > 50 && firstSentenceMatch[0].length < 180) {
        desc = firstSentenceMatch[0].trim()
      } else {
        desc = stripped.length > 155 ? stripped.substring(0, 155).replace(/\s+\S*$/, '') + '...' : stripped
      }
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': `${FRONTEND_URL}${examPath(exam as any)}#resource`,
        name: exam.title || titleText,
        description: desc,
        inLanguage: 'vi',
        educationalLevel: examTypeLabel(exam.examType),
        learningResourceType: 'Đề thi',
        about: exam.subject,
        isAccessibleForFree: true,
        datePublished: exam.createdAt,
        dateModified: exam.updatedAt || exam.createdAt,
        provider: {
          '@type': 'Organization',
          name: 'VNDocs',
          url: FRONTEND_URL
        },
        publisher: {
          '@type': 'Organization',
          name: 'VNDocs',
          url: FRONTEND_URL
        },
        encodingFormat: exam.fileUrl?.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        contentUrl: `${FRONTEND_URL}/files/${exam.slugIdentifier || exam.examCode}`
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${FRONTEND_URL}${examPath(exam as any)}#breadcrumb`,
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
          }
        ]
      }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Script
        id="mathjax-config"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                packages: {'[+]': ['ams']},
                tags: 'ams'
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
              },
              startup: {
                typeset: true,
                ready() {
                  MathJax.startup.defaultReady();
                }
              }
            };
          `,
        }}
      />
      <Script
        id="mathjax-script"
        strategy="lazyOnload"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      />
      <ExamDetail initialExam={exam} initialRelated={relatedExams} slug={slug} />
    </>
  )
}
