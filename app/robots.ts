import { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/quan-tri-he-thong-123/', '/api/'],
    },
    sitemap: `${FRONTEND_URL}/sitemap.xml`,
  }
}
