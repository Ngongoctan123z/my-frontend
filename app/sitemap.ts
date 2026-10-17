import { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'
import { getExams } from '../src/services/examService'
import { examPath } from '../src/utils/slug'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    // ===== TRANG CHỦ =====
    {
      url: FRONTEND_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // ===== AI GRADER (ưu tiên cao — core feature) =====
    {
      url: `${FRONTEND_URL}/ai-grader`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${FRONTEND_URL}/ai-grader/ielts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${FRONTEND_URL}/ai-grader/toeic`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${FRONTEND_URL}/ai-grader/topik`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${FRONTEND_URL}/ai-grader/hsk`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // ===== KHO TÀI LIỆU (ưu tiên cao) =====
    {
      url: `${FRONTEND_URL}/tai-lieu`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },

    // ===== CÔNG CỤ PDF (ưu tiên cao) =====
    {
      url: `${FRONTEND_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${FRONTEND_URL}/tools/merge-files`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/tools/compress`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/tools/convert`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/tools/remove-pages`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/tools/lock`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/tools/casio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },

    // ===== PREMIUM =====
    {
      url: `${FRONTEND_URL}/premium`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // ===== ENGLISH PAGES (/en) =====
    {
      url: `${FRONTEND_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${FRONTEND_URL}/en/ai-grader`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/en/ai-grader/ielts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${FRONTEND_URL}/en/ai-grader/toeic`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${FRONTEND_URL}/en/ai-grader/topik`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/en/ai-grader/hsk`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/en/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${FRONTEND_URL}/en/tools/merge-files`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/en/tools/remove-pages`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/en/tools/compress`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/en/tools/convert`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/en/tools/lock`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${FRONTEND_URL}/en/tools/casio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${FRONTEND_URL}/en/premium`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },

    // ===== TRANG PHỤ — ưu tiên THẤP (không muốn hiển thị sitelinks) =====
    {
      url: `${FRONTEND_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${FRONTEND_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${FRONTEND_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${FRONTEND_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
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

