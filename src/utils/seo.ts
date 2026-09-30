import { useEffect } from 'react'
import { Metadata } from 'next'
import { getDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'

export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (!description) return
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }, [title, description])
}

export function setJsonLd(id: string, data: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(id)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.text = JSON.stringify(data)
  document.head.appendChild(script)
}

export async function getRouteMetadata(path: string, fallbackTitle: string, fallbackDesc: string): Promise<Metadata> {
  let title = fallbackTitle;
  let description = fallbackDesc;
  let keywords = 'đề thi, tài liệu, pdf, ielts, toeic';
  let ogImage = '';
  
  try {
    const db = await getDb()
    if (db) {
      // 1. Lấy cấu hình Global trước làm mặc định
      const configs = await db.select().from(systemConfigs)
      const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as any)
      
      title = configMap.SEO_TITLE || title;
      description = configMap.SEO_DESCRIPTION || description;
      keywords = configMap.SEO_KEYWORDS || keywords;
      ogImage = configMap.SEO_OG_IMAGE || ogImage;

      // 2. Ghi đè bằng cấu hình riêng của từng trang (nếu có)
      const routeKey = `SEO_ROUTE_${path}`
      if (configMap[routeKey]) {
        try {
          const routeSeo = JSON.parse(configMap[routeKey])
          if (routeSeo.title) title = routeSeo.title
          if (routeSeo.description) description = routeSeo.description
          if (routeSeo.keywords) keywords = routeSeo.keywords
          if (routeSeo.ogImage) ogImage = routeSeo.ogImage
        } catch(e) {}
      }
    }
  } catch (e) {
    console.error("Lỗi khi lấy SEO từ D1:", e)
  }

  return {
    metadataBase: new URL('https://vndocs.net'),
    title: title,
    description: description,
    keywords: keywords,
    openGraph: {
      title: title,
      description: description,
      url: `https://vndocs.net${path}`,
      siteName: 'VNDocs',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : [],
      locale: 'vi_VN',
      type: 'website',
    },
    alternates: {
      canonical: path === '/' ? '/' : path,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
