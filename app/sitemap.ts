import { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'
import { getExams } from '../src/services/examService'
import { examPath } from '../src/utils/slug'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: FRONTEND_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${FRONTEND_URL}/tai-lieu`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${FRONTEND_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${FRONTEND_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${FRONTEND_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${FRONTEND_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${FRONTEND_URL}/tools/casio`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FRONTEND_URL}/tools/convert`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FRONTEND_URL}/tools/lock`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FRONTEND_URL}/tools/merge-files`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FRONTEND_URL}/tools/remove-pages`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${FRONTEND_URL}/ai-grader/ielts`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${FRONTEND_URL}/ai-grader/toeic`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${FRONTEND_URL}/ai-grader/topik`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${FRONTEND_URL}/ai-grader/hsk`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${FRONTEND_URL}/ai-grader/tai-lieu-tong-hop`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  try {
    // Fetch latest exams to include in sitemap
    const result = await getExams({ limit: 5000 })
    
    if (result && result.data) {
      const exams = result.data
        .filter((exam) => exam.fileUrl && exam.fileUrl.trim() !== '')

      const examRoutes = exams.map((exam) => ({
        url: `${FRONTEND_URL}${examPath(exam as any)}`,
        lastModified: new Date(exam.updatedAt || exam.createdAt || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
      routes.push(...examRoutes)

      const categoryMap = new Map<string, Date>()
      exams.forEach(exam => {
        const typePart = examPath(exam as any).split('/')[2]
        const subjPart = examPath(exam as any).split('/')[3]
        const provPart = examPath(exam as any).split('/')[4]

        const typeUrl = `${FRONTEND_URL}/tai-lieu?examType=${typePart}`
        const subjUrl = `${FRONTEND_URL}/tai-lieu?examType=${typePart}&subject=${subjPart}`
        const provUrl = `${FRONTEND_URL}/tai-lieu?examType=${typePart}&subject=${subjPart}&province=${provPart}`
        
        const date = new Date(exam.updatedAt || exam.createdAt || new Date())
        if (!categoryMap.has(typeUrl) || date > categoryMap.get(typeUrl)!) categoryMap.set(typeUrl, date)
        if (!categoryMap.has(subjUrl) || date > categoryMap.get(subjUrl)!) categoryMap.set(subjUrl, date)
        if (!categoryMap.has(provUrl) || date > categoryMap.get(provUrl)!) categoryMap.set(provUrl, date)
      })

      categoryMap.forEach((date, url) => {
        routes.push({ url, lastModified: date, changeFrequency: 'daily', priority: 0.8 })
      })
    }
  } catch (error) {
    console.error('Error generating sitemap for exams', error)
  }

  return routes
}
