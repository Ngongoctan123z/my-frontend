import { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'

// Only the active Writing/Speaking pages belong in the public sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/ai-grader', '/ai-grader/ielts', '/ai-grader/toeic', '/ai-grader/topik', '/ai-grader/hsk', '/speaking', '/en', '/en/ai-grader', '/en/ai-grader/ielts', '/en/ai-grader/toeic', '/en/ai-grader/topik', '/en/ai-grader/hsk']
  return paths.map(path => ({ url: FRONTEND_URL + (path === '/' ? '' : path), changeFrequency: 'weekly' as const, priority: path === '/' ? 1 : 0.9 }))
}
