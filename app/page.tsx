import React from 'react'
import { Metadata } from 'next'
import { HomeClient } from './HomeClient'

export const metadata: Metadata = {
  title: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
  description: 'Nền tảng học tập trực tuyến cung cấp kho đề thi vào 10, đề thi THPT, luyện writing IELTS, TOEIC, cùng bộ công cụ xử lý file (gộp, xóa trang PDF, máy tính Casio) hoàn toàn miễn phí.',
  keywords: 'đề thi vào 10, đề thi thpt,công cụ học tiếng Anh ,công cụ gộp file, xóa trang pdf, máy tính casio online',
  openGraph: {
    title: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
    description: 'Kho đề thi vào 10, đề thi THPT, luyện writing IELTS/TOEIC, công cụ gộp/xóa trang PDF và máy tính Casio hoàn toàn miễn phí.',
    url: 'https://vndocs.net',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://vndocs.net'
  }
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://vndocs.net',
    name: 'VNDocs',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://vndocs.net/tai-lieu?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  // Khai báo cấu trúc điều hướng để gợi ý Google tạo Sitelinks (các mục nhỏ bên dưới kết quả tìm kiếm)
  const sitelinksJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'Đề thi vào 10',
        description: 'Kho đề thi Toán, Văn, Anh vào lớp 10 chính thức và thi thử.',
        url: 'https://vndocs.net/tai-lieu?examType=VAO_10'
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'Đề thi THPT Quốc Gia',
        description: 'Bộ đề ôn luyện thi Tốt nghiệp THPT và Đại học.',
        url: 'https://vndocs.net/tai-lieu?examType=THPT'
      },
      {
        '@type': 'SiteNavigationElement',
        position: 3,
        name: 'Luyện Writing IELTS, TOEIC',
        description: 'Chấm điểm và sửa lỗi ngữ pháp bài Writing IELTS, TOEIC bằng AI.',
        url: 'https://vndocs.net/ai-grader'
      },
      {
        '@type': 'SiteNavigationElement',
        position: 4,
        name: 'Công cụ gộp file, xóa trang, máy tính',
        description: 'Công cụ xử lý PDF miễn phí và máy tính Casio ảo online.',
        url: 'https://vndocs.net/tools'
      }
    ]
  }

  return (
    <div suppressHydrationWarning className="w-full flex flex-col items-center min-h-screen bg-[#FAFAFA]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksJsonLd) }} />
      <HomeClient />
    </div>
  )
}
