import { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Fira_Code } from 'next/font/google'
import './globals.css'
import { Providers } from '../src/components/Providers'
import { Layout as AppLayout } from '../src/components/common/Layout'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-fira-code',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://vndocs.net'),
  title: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
  description: 'Kho đề thi vào 10, đề thi THPT Quốc Gia, luyện Writing IELTS, TOEIC và công cụ xử lý file PDF miễn phí.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${firaCode.variable}`}>
      <head>
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7200108977294233"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}

