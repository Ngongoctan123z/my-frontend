import { MetadataRoute } from 'next'
import { PAGE_SEO, pageUrl, languageAlternates } from '../src/lib/pageSeo'

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.keys(PAGE_SEO).map(path => ({
    url: pageUrl(path), changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.9,
    alternates: { languages: languageAlternates(path) },
  }))
}
