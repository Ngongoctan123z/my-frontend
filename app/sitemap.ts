import { MetadataRoute } from 'next'
import { BASE_URL } from '../src/utils/constants'
import { getExams } from '../src/services/examService'
import { examPath } from '../src/utils/slug'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  try {
    // Fetch latest exams to include in sitemap
    const result = await getExams({ limit: 1000 })
    
    if (result && result.data) {
      const examRoutes = result.data.map((exam) => ({
        url: `${BASE_URL}${examPath(exam)}`,
        lastModified: new Date(exam.createdAt || new Date()),
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
