import type { MetadataRoute } from 'next'
import { FRONTEND_URL } from '../src/utils/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Public and noindex pages remain crawlable so crawlers can read their status and metadata.
          '/quan-ly-de-thi-123',
          '/quan-ly-he-thong-123',
        ],
      },
    ],
    sitemap: `${FRONTEND_URL}/sitemap.xml`,
  }
}

