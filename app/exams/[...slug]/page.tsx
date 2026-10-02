import { cache } from 'react'
import { Metadata } from 'next'
import Script from 'next/script'
import { notFound, permanentRedirect } from 'next/navigation'
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
  const typeText = isVao10 ? 'vào 10' : 'THPT'
  const yearString = `${exam.year}-${exam.year + 1}`
  const hasAnswers = exam.hasAnswers

  // Step 2: Auto Title
  let defaultTitle = `Đề thi ${typeText} môn ${exam.subject} ${exam.province} ${yearString}`
  if (hasAnswers) defaultTitle += ' có đáp án'
  defaultTitle += ' | VNDocs'
  
  if (defaultTitle.length > 60) {
     defaultTitle = `Đề thi ${typeText} ${exam.subject} ${exam.province} ${exam.year} | VNDocs`
  }

  // Step 2: Auto Description
  const defaultDesc = `Tải miễn phí đề thi ${typeText} môn ${exam.subject} ${exam.province} ${yearString}${hasAnswers ? ' kèm đáp án' : ''}. Xem online hoặc tải ${exam.fileUrl?.endsWith('.pdf') ? 'PDF' : 'DOCX'} tại VNDocs.`

  const pathName = examPath(exam as any)
  const canonical = `${FRONTEND_URL}${pathName}`

  let finalTitle = defaultTitle
  let finalDesc = defaultDesc
  let finalKeywords = ''
  let ogImage = `${FRONTEND_URL}/api/og?slug=${slug.join('/')}`

  const customSeo = await getCustomRouteSeo(pathName)
  if (customSeo) {
    if (customSeo.title) finalTitle = customSeo.title
    if (customSeo.description) finalDesc = customSeo.description
    if (customSeo.keywords) finalKeywords = customSeo.keywords
    if (customSeo.ogImage) ogImage = customSeo.ogImage
  }

  const isIndexable = exam.fileUrl && exam.fileUrl.trim() !== ''

  return { 
    title: finalTitle, 
    description: finalDesc, 
    keywords: finalKeywords,
    alternates: { canonical },
    robots: { index: !!isIndexable, follow: true },
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
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDesc,
      images: [ogImage],
    }
  }
}

export default async function ExamPage({ params, searchParams }: Props & { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { slug } = await params
  const exam = await fetchExamData(slug)

  if (!exam) {
    notFound()
  }

  const expectedPath = examPath(exam as any)
  const currentSlugStr = slug.join('/')
  const expectedSlugStr = expectedPath.replace(/^\/exams\//, '')
  
  const search = await searchParams
  const hasQueryParams = search && Object.keys(search).length > 0
  
  if (currentSlugStr !== expectedSlugStr || hasQueryParams) {
    permanentRedirect(expectedPath)
  }

  const isVao10 = examTypeLabel(exam.examType) === 'Vào 10'
  const typeText = isVao10 ? 'vào 10' : 'THPT'
  const yearString = `${exam.year}-${exam.year + 1}`
  const hasAnswers = exam.hasAnswers
  
  let relatedExams: import('../../../src/types/exam').Exam[] = []
  try {
    relatedExams = await getRelatedExams(exam.id)
    if (!relatedExams || relatedExams.length === 0) {
      const fallback = await getExams({ examType: exam.examType, subject: exam.subject, limit: 4 })
      relatedExams = fallback.data.filter(e => e.id !== exam.id).slice(0, 3)
    }
  } catch (e) {}

  // Deduplicate and filter current exam
  const seenIds = new Set<number>([exam.id])
  relatedExams = relatedExams.filter(e => {
    if (seenIds.has(e.id)) return false
    seenIds.add(e.id)
    return true
  })

  // Calculate same SEO values for JSON-LD
  let defaultTitle = `Đề thi ${typeText} môn ${exam.subject} ${exam.province} ${yearString}`
  if (hasAnswers) defaultTitle += ' có đáp án'
  defaultTitle += ' | VNDocs'
  if (defaultTitle.length > 60) {
     defaultTitle = `Đề thi ${typeText} ${exam.subject} ${exam.province} ${exam.year} | VNDocs`
  }
  const defaultDesc = `Tải miễn phí đề thi ${typeText} môn ${exam.subject} ${exam.province} ${yearString}${hasAnswers ? ' kèm đáp án' : ''}. Xem online hoặc tải ${exam.fileUrl?.endsWith('.pdf') ? 'PDF' : 'DOCX'} tại VNDocs.`

  const pathName = examPath(exam as any)
  let finalTitle = defaultTitle
  let finalDesc = defaultDesc
  let ogImage = `${FRONTEND_URL}/api/og?slug=${slug.join('/')}`

  const customSeo = await getCustomRouteSeo(pathName)
  if (customSeo) {
    if (customSeo.title) finalTitle = customSeo.title
    if (customSeo.description) finalDesc = customSeo.description
    if (customSeo.ogImage) ogImage = customSeo.ogImage
  }

  const truePdfUrl = exam.fileUrl?.startsWith('http') ? exam.fileUrl : `${FRONTEND_URL}${exam.fileUrl}`
  const shortTitle = `Đề thi ${exam.subject} ${typeText} ${exam.province} ${exam.year}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        '@id': `${FRONTEND_URL}${pathName}#resource`,
        name: finalTitle,
        description: finalDesc,
        image: ogImage,
        inLanguage: 'vi',
        educationalLevel: examTypeLabel(exam.examType),
        learningResourceType: 'Đề thi',
        about: exam.subject,
        isAccessibleForFree: true,
        datePublished: exam.createdAt,
        dateModified: exam.updatedAt || exam.createdAt,
        author: {
          '@type': 'Organization',
          name: 'VNDocs'
        },
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
        isBasedOn: exam.province.toLowerCase().includes('sở') ? exam.province : `Sở GD&ĐT ${exam.province}`,
        encodingFormat: exam.fileUrl?.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        contentUrl: truePdfUrl
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${FRONTEND_URL}${pathName}#breadcrumb`,
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
            item: `${FRONTEND_URL}/tai-lieu?examType=${slug[0]}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: exam.subject,
            item: `${FRONTEND_URL}/tai-lieu?examType=${slug[0]}&subject=${slug[1]}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: exam.province,
            item: `${FRONTEND_URL}/tai-lieu?examType=${slug[0]}&subject=${slug[1]}&province=${slug[2]}`,
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: shortTitle,
            item: `${FRONTEND_URL}/exams/${slug[0]}/${slug[1]}/${slug[2]}/${slug[3]}`,
          }
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': `${FRONTEND_URL}${pathName}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `Đề thi ${typeText} môn ${exam.subject} ${exam.province} ${exam.year} có đáp án không?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: hasAnswers 
                ? `Có, đề thi ${typeText} môn ${exam.subject} ${exam.province} năm ${yearString} được cung cấp kèm theo đáp án và hướng dẫn giải chi tiết để bạn tự đối chiếu kết quả.` 
                : `Hiện tại đề thi ${typeText} môn ${exam.subject} ${exam.province} năm ${yearString} chưa có đáp án. Chúng tôi sẽ cố gắng cập nhật sớm nhất có thể.`
            }
          },
          {
            '@type': 'Question',
            name: `Tải đề thi ${typeText} môn ${exam.subject} ${exam.province} ${exam.year} định dạng gốc ở đâu?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Bạn có thể xem online trực tiếp hoặc tải miễn phí định dạng ${exam.fileUrl?.endsWith('.pdf') ? 'PDF' : 'tài liệu'} của đề thi này ngay tại trang web VNDocs bằng cách ấn vào nút Tải đề thi ở phần dưới cùng của trang.`
            }
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
