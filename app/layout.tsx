import { Metadata } from 'next'
import './globals.css'
import { Providers } from '../src/components/Providers'
import { Layout as AppLayout } from '../src/components/common/Layout'

export const metadata: Metadata = {
  metadataBase: new URL('https://vndocs.net'),
  title: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
  description: 'Kho đề thi vào 10, đề thi THPT Quốc Gia, luyện Writing IELTS, TOEIC và công cụ xử lý file PDF miễn phí.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
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
    <html lang="vi" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7200108977294233" crossOrigin="anonymous"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
              },
              startup: {
                typeset: false
              }
            };
          `
        }} />
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}

