import { Metadata } from 'next'
import Script from 'next/script'
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

import { getDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { inArray } from 'drizzle-orm'

export async function generateMetadata(): Promise<Metadata> {
  let title = 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí';
  let description = 'Kho đề thi vào 10, đề thi THPT Quốc Gia, luyện Writing IELTS, TOEIC và công cụ xử lý file PDF miễn phí.';
  let ogImage = '';
  
  try {
    const db = await getDb()
    if (db) {
      // Chỉ lấy 3 key cần thiết thay vì full table scan
      const SEO_KEYS = ['SEO_TITLE', 'SEO_DESCRIPTION', 'SEO_OG_IMAGE'] as const
      const rows = await db
        .select()
        .from(systemConfigs)
        .where(inArray(systemConfigs.key, SEO_KEYS as unknown as string[]))
      const configMap: Record<string, string> = {}
      for (const row of rows) configMap[row.key] = row.value

      if (configMap.SEO_TITLE) title = configMap.SEO_TITLE;
      if (configMap.SEO_DESCRIPTION) description = configMap.SEO_DESCRIPTION;
      if (configMap.SEO_OG_IMAGE) ogImage = configMap.SEO_OG_IMAGE;
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
      locale: 'vi_VN',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`scroll-smooth ${inter.variable}`}>
      <head>
        {/* Preconnect đến Google Fonts CDN để giảm DNS lookup time */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        {/* lazyOnload: chỉ tải AdSense sau khi trang đã interactive — không block LCP */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7200108977294233"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Providers>
          <AppLayout>{children}</AppLayout>
          <ChatWidget />
        </Providers>
      </body>
    </html>
  )
}

