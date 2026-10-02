import { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'
import { getExams } from '../src/services/examService'
import { examPath } from '../src/utils/slug'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: FRONTEND_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  try {
    // Fetch latest exams to include in sitemap
    const result = await getExams({ limit: 5000 })
    
    if (result && result.data) {
      const examRoutes = result.data
        .filter((exam) => exam.status !== 'DRAFT' && exam.status !== 'NEEDS_REVIEW')
        .map((exam) => ({
          url: `${FRONTEND_URL}${examPath(exam as any)}`,
          lastModified: new Date(exam.updatedAt || exam.createdAt || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      routes.push(...examRoutes)
    }
  } catch (error) {
    console.error('Error generating sitemap for exams', error)
  }

  return routes
}
