import { MetadataRoute } from 'next'
import { BASE_URL } from '../src/utils/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/quan-tri-he-thong-123/', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
