import { PAGE_SEO, upgradeSavedPageSeo, pageLanguage, pageUrl, languageAlternates } from '@/src/lib/pageSeo'
import { isRetiredPath, hasRetiredSeo } from '@/src/lib/siteSections'
import type { Metadata } from 'next'
import { getOptionalDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { inArray, eq } from 'drizzle-orm'

export async function getRouteMetadata(path: string, fallbackTitle: string, fallbackDesc: string): Promise<Metadata> {
  if (isRetiredPath(path)) return { title: 'Nội dung đã được gỡ | VNDocs', robots: { index: false, follow: false, noarchive: true } }
  let title = fallbackTitle;
  let description = fallbackDesc;
  let ogImage = '';
  
  try {
    const db = await getOptionalDb()
    if (db) {
      // Chỉ fetch đúng các key cần thiết thay vì full table scan
      const routeKey = `SEO_ROUTE_${path}`
      const keysToFetch = ['SEO_TITLE', 'SEO_DESCRIPTION', 'SEO_OG_IMAGE', routeKey]
      const rows = await db
        .select()
        .from(systemConfigs)
        .where(inArray(systemConfigs.key, keysToFetch))
      const configMap: Record<string, string> = {}
      for (const row of rows) configMap[row.key] = row.value

      // 1. Lấy cấu hình Global trước làm mặc định
      if ((path === '/' || path === 'GLOBAL') && !hasRetiredSeo(configMap.SEO_TITLE) && !hasRetiredSeo(configMap.SEO_DESCRIPTION)) {
        title = configMap.SEO_TITLE || title;
        description = configMap.SEO_DESCRIPTION || description;
      }
      if (!hasRetiredSeo(configMap.SEO_TITLE) && !hasRetiredSeo(configMap.SEO_DESCRIPTION) && !hasRetiredSeo(configMap.SEO_OG_IMAGE)) ogImage = configMap.SEO_OG_IMAGE || ogImage;

      // 2. Ghi đè bằng cấu hình riêng của từng trang (nếu có)
      if (configMap[routeKey]) {
        try {
          const routeSeo = upgradeSavedPageSeo(path, JSON.parse(configMap[routeKey]))
          if (!routeSeo || typeof routeSeo !== 'object' || Array.isArray(routeSeo)) throw new Error('Invalid saved SEO object')
          if (!hasRetiredSeo(routeSeo.title) && !hasRetiredSeo(routeSeo.description)) {
            if (typeof routeSeo.title === 'string' && routeSeo.title) title = routeSeo.title
            if (typeof routeSeo.description === 'string' && routeSeo.description) description = routeSeo.description
            if (typeof routeSeo.ogImage === 'string' && routeSeo.ogImage && !hasRetiredSeo(routeSeo.ogImage)) ogImage = routeSeo.ogImage
          }
        } catch(e) {}
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
      url: `https://vndocs.net${path}`,
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
      index: true,
      follow: true,
    },
  }
}

export async function getCustomRouteSeo(path: string) {
  if (isRetiredPath(path)) return null
  try {
    const db = await getOptionalDb()
    if (db) {
      // Chỉ fetch đúng 1 key thay vì toàn bộ bảng
      const routeKey = `SEO_ROUTE_${path}`
      const rows = await db
        .select()
        .from(systemConfigs)
        .where(eq(systemConfigs.key, routeKey))
        .limit(1)
      if (rows[0]?.value) {
        const saved = upgradeSavedPageSeo(path, JSON.parse(rows[0].value))
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null
        return hasRetiredSeo(saved.title) || hasRetiredSeo(saved.description) || hasRetiredSeo(saved.h1) ? null : saved
      }
    }
  } catch (e) {}
  return null;
}


export async function getCoreMetadata(path: string): Promise<Metadata> {
  const copy = PAGE_SEO[path]
  if (!copy) throw new Error('Missing SEO copy for ' + path)
  return getRouteMetadata(path, copy.title, copy.description)
}

