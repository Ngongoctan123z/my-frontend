import { headers } from 'next/headers'
import { PAGE_SEO } from '@/src/lib/pageSeo'
import type { Metadata } from 'next'
import { hasRetiredSeo } from '@/src/lib/siteSections'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../src/components/Providers'
import { Layout as AppLayout } from '../src/components/common/Layout'
import { ChatWidget } from '../src/components/chat/ChatWidget'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

import { getOptionalDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { inArray } from 'drizzle-orm'

export async function generateMetadata(): Promise<Metadata> {
  const language = (await headers()).get('x-vndocs-language') === 'en' ? 'en' : 'vi'
  const copy = PAGE_SEO[language === 'en' ? '/en' : '/']
  let title = copy.title;
  let description = copy.description;
  let ogImage = '';
  
  try {
    const db = await getOptionalDb()
    if (db) {
      // Chỉ lấy 3 key cần thiết thay vì full table scan
      const SEO_KEYS = ['SEO_TITLE', 'SEO_DESCRIPTION', 'SEO_OG_IMAGE'] as const
      const rows = await db
        .select()
        .from(systemConfigs)
        .where(inArray(systemConfigs.key, SEO_KEYS as unknown as string[]))
      const configMap: Record<string, string> = {}
      for (const row of rows) configMap[row.key] = row.value

      if (language === 'vi' && !hasRetiredSeo(configMap.SEO_TITLE) && !hasRetiredSeo(configMap.SEO_DESCRIPTION)) {
        if (configMap.SEO_TITLE) title = configMap.SEO_TITLE;
        if (configMap.SEO_DESCRIPTION) description = configMap.SEO_DESCRIPTION;
        if (configMap.SEO_OG_IMAGE && !hasRetiredSeo(configMap.SEO_OG_IMAGE)) ogImage = configMap.SEO_OG_IMAGE;
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
    // LƯU Ý CHO AI/DEV: KHÔNG XÓA PHẦN NÀY.
    // Phải khai báo tường minh 'icons' ở đây để đảm bảo thẻ <link rel="icon">
    // luôn được render ra HTML cho Googlebot nhận diện được logo trên kết quả tìm kiếm.
    icons: {
      icon: [
        { url: '/icon.png', type: 'image/png', sizes: '192x192' },
        { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      ],
      shortcut: '/icon.png',
      apple: [{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    },
    openGraph: {
      title: title,
      description: description,
      url: 'https://vndocs.net',
      siteName: 'VNDocs',
      images: [{ url: finalOgImage, width: 1200, height: 630, alt: title }],
      locale: language === 'en' ? 'en_US' : 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [finalOgImage],
    },

    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const language = (await headers()).get('x-vndocs-language') === 'en' ? 'en' : 'vi'
  return (
    <html lang={language} suppressHydrationWarning className={`scroll-smooth ${inter.variable}`}>
      <head>
        {/* Preconnect đến Google Fonts CDN để giảm DNS lookup time */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7200108977294233"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <Providers>
          <AppLayout>{children}</AppLayout>
          <ChatWidget />
        </Providers>
      </body>
    </html>
  )
}

