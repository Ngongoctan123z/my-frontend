import { PAGE_SEO, upgradeSavedPageSeo, pageLanguage, pageUrl, languageAlternates } from '@/src/lib/pageSeo'
import { cache } from 'react'
import { isRetiredPath, hasRetiredSeo } from '@/src/lib/siteSections'
import type { Metadata } from 'next'
import { getOptionalDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { inArray } from 'drizzle-orm'

// React cache is scoped to a server render/request, so saved admin edits remain
// fresh across Worker requests while metadata and visible H1 share one lookup.
const readSeoConfig = cache(async (path: string): Promise<Record<string, string>> => {
  const db = await getOptionalDb()
  if (!db) return {}
  const keys = ['SEO_TITLE', 'SEO_DESCRIPTION', 'SEO_OG_IMAGE', `SEO_ROUTE_${path}`]
  const rows = await db.select().from(systemConfigs).where(inArray(systemConfigs.key, keys))
  return Object.fromEntries(rows.map(row => [row.key, row.value]))
})

function savedRouteSeo(path: string, value?: string): Record<string, string> | null {
  if (!value) return null
  try {
    const saved = upgradeSavedPageSeo(path, JSON.parse(value))
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null
    const clean: Record<string, string> = {}
    for (const key of ['title', 'description', 'h1', 'ogImage']) {
      if (typeof saved[key] === 'string' && saved[key].trim()) clean[key] = saved[key].trim()
    }
    return hasRetiredSeo(clean.title) || hasRetiredSeo(clean.description) || hasRetiredSeo(clean.h1) ? null : clean
  } catch { return null }
}

export async function getRouteMetadata(path: string, fallbackTitle: string, fallbackDesc: string): Promise<Metadata> {
  if (isRetiredPath(path)) return { title: 'Nội dung đã được gỡ | VNDocs', robots: { index: false, follow: false, noarchive: true } }
  let title = fallbackTitle;
  let description = fallbackDesc;
  let ogImage = '';
  
  try {
    const configMap = await readSeoConfig(path)
    {
      const routeKey = `SEO_ROUTE_${path}`

      // 1. Lấy cấu hình Global trước làm mặc định
      if ((path === '/' || path === 'GLOBAL') && !hasRetiredSeo(configMap.SEO_TITLE) && !hasRetiredSeo(configMap.SEO_DESCRIPTION)) {
        title = configMap.SEO_TITLE || title;
        description = configMap.SEO_DESCRIPTION || description;
      }
      if (!hasRetiredSeo(configMap.SEO_TITLE) && !hasRetiredSeo(configMap.SEO_DESCRIPTION) && !hasRetiredSeo(configMap.SEO_OG_IMAGE)) ogImage = configMap.SEO_OG_IMAGE || ogImage;

      // 2. Ghi đè bằng cấu hình riêng của từng trang (nếu có)
      const routeSeo = savedRouteSeo(path, configMap[routeKey])
      if (routeSeo) {
        title = routeSeo.title || title
        description = routeSeo.description || description
        if (routeSeo.ogImage && !hasRetiredSeo(routeSeo.ogImage)) ogImage = routeSeo.ogImage
      }
    }
  } catch (e) {
    console.error("Lỗi khi lấy SEO từ D1:", e)
  }

  const finalOgImage = ogImage || `https://vndocs.net/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description || '')}`

  return {
    metadataBase: new URL('https://vndocs.net'),
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: pageUrl(path),
      siteName: 'VNDocs',
      images: [{ url: finalOgImage, width: 1200, height: 630, alt: title }],
      locale: pageLanguage(path) === 'en' ? 'en_US' : 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [finalOgImage],
    },
    alternates: { canonical: pageUrl(path), languages: languageAlternates(path) },
    robots: {
      index: PAGE_SEO[path]?.index !== false,
      follow: true,
    },
  }
}

export async function getCustomRouteSeo(path: string) {
  if (isRetiredPath(path)) return null
  try {
    const config = await readSeoConfig(path)
    return savedRouteSeo(path, config[`SEO_ROUTE_${path}`])
  } catch (e) {}
  return null;
}


export async function getCoreMetadata(path: string): Promise<Metadata> {
  const copy = PAGE_SEO[path]
  if (!copy) throw new Error('Missing SEO copy for ' + path)
  return getRouteMetadata(path, copy.title, copy.description)
}


