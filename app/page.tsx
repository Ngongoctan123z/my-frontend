import React from 'react'
import { Metadata } from 'next'
import { HomeClient } from './HomeClient'

export const metadata: Metadata = {
  title: 'VNDocs | Nền tảng Giáo dục & Trợ lý Chấm điểm AI 24/7',
  description: 'Kho tàng tài liệu, đề thi THPT Quốc gia, vào 10, công cụ PDF tiện ích, và hệ thống chấm thi Writing chuẩn Rubric quốc tế.',
  keywords: 'đề thi vào 10, đề thi thpt quốc gia, công cụ pdf, gộp pdf, cắt pdf, chấm thi toeic, chấm thi ielts writing, tài liệu học tập',
  openGraph: {
    title: 'VNDocs | Nền tảng Giáo dục & Trợ lý Chấm điểm AI',
    description: 'Kho tàng đề thi THPT Quốc gia, vào 10, tiện ích PDF, và hệ thống chấm thi AI hàng đầu.',
    url: 'https://www.vndocs.net',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.vndocs.net',
    name: 'VNDocs',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.vndocs.net/tai-lieu?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <div className="w-full flex flex-col items-center min-h-screen bg-[#FAFAFA]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient />
    </div>
  )
}
