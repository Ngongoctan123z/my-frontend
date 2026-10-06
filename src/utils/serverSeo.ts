import { Metadata } from 'next'
import { getDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'

export async function getRouteMetadata(path: string, fallbackTitle: string, fallbackDesc: string): Promise<Metadata> {
  let title = fallbackTitle;
  let description = fallbackDesc;
  let ogImage = '';
  
  try {
    const db = await getDb()
    if (db) {
      // 1. Lấy cấu hình Global trước làm mặc định
      const configs = await db.select().from(systemConfigs)
      const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
      
      title = configMap.SEO_TITLE || title;
      description = configMap.SEO_DESCRIPTION || description;
      ogImage = configMap.SEO_OG_IMAGE || ogImage;

      // 2. Ghi đè bằng cấu hình riêng của từng trang (nếu có)
      const routeKey = `SEO_ROUTE_${path}`
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
    const db = await getDb()
    if (db) {
      const configs = await db.select().from(systemConfigs)
      const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
      const routeKey = `SEO_ROUTE_${path}`
      if (configMap[routeKey]) {
        return JSON.parse(configMap[routeKey])
      }
    }
  } catch (e) {}
  return null;
}
