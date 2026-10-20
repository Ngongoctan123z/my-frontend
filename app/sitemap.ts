import type { MetadataRoute } from 'next'
import { PAGE_SEO, pageUrl, languageAlternates } from '../src/lib/pageSeo'

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.keys(PAGE_SEO).filter(path => PAGE_SEO[path].index !== false).map(path => ({
    url: pageUrl(path),
    alternates: { languages: languageAlternates(path) },
  }))
}

