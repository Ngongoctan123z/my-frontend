import type { Metadata } from 'next'
import { getDb } from '@/src/db'
import { isStaticBuild } from '@/src/lib/buildPhase'
import { systemConfigs } from '@/src/db/schema'
import { inArray, eq } from 'drizzle-orm'

export async function getRouteMetadata(path: string, fallbackTitle: string, fallbackDesc: string): Promise<Metadata> {
  let title = fallbackTitle;
  let description = fallbackDesc;
  let ogImage = '';
  
  try {
    const db = isStaticBuild() ? null : await getDb()
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
      if (path === '/' || path === 'GLOBAL') {
        title = configMap.SEO_TITLE || title;
        description = configMap.SEO_DESCRIPTION || description;
      }
      ogImage = configMap.SEO_OG_IMAGE || ogImage;

      // 2. Ghi đè bằng cấu hình riêng của từng trang (nếu có)
      if (configMap[routeKey]) {
        try {
          const routeSeo = JSON.parse(configMap[routeKey])
          if (routeSeo.title) title = routeSeo.title
          if (routeSeo.description) description = routeSeo.description
          if (routeSeo.ogImage) ogImage = routeSeo.ogImage
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
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [finalOgImage],
    },
    alternates: {
      canonical: `https://vndocs.net${path === '/' ? '' : path}`,
      languages: {
        'vi-VN': `https://vndocs.net${path.startsWith('/en') ? path.replace('/en', '') || '/' : path}`,
        'en-US': `https://vndocs.net${path.startsWith('/en') ? path : (path === '/' ? '/en' : `/en${path}`)}`,
        'x-default': `https://vndocs.net${path.startsWith('/en') ? path.replace('/en', '') || '/' : path}`,
      }
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export async function getCustomRouteSeo(path: string) {
  try {
    const db = isStaticBuild() ? null : await getDb()
    if (db) {
      // Chỉ fetch đúng 1 key thay vì toàn bộ bảng
      const routeKey = `SEO_ROUTE_${path}`
      const rows = await db
        .select()
        .from(systemConfigs)
        .where(eq(systemConfigs.key, routeKey))
        .limit(1)
      if (rows[0]?.value) {
        return JSON.parse(rows[0].value)
      }
    }
  } catch (e) {}
  return null;
}

