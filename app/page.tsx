import React from 'react'
import Link from 'next/link'
import { Search, BookOpen, PenTool, GraduationCap, FileText, Library, Star, Check, ChevronRight, Sparkles } from 'lucide-react'
import { Metadata } from 'next'

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
  const portalCategories = [
    {
      title: 'Đề Thi Vào Lớp 10',
      description: 'Đề thi chính thức và đề thi thử Toán, Văn, Anh bám sát cấu trúc.',
      icon: <GraduationCap className="w-5 h-5" />,
      href: '/tai-lieu?examType=VAO_10',
      color: 'text-blue-600',
      borderHover: 'hover:border-blue-400',
    },
    {
      title: 'Đề Thi THPT Quốc Gia',
      description: 'Bộ đề ôn luyện Tốt nghiệp và Đại học từ các trường chuyên.',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/tai-lieu?examType=THPT',
      color: 'text-indigo-600',
      borderHover: 'hover:border-indigo-400',
    },
    {
      title: 'Chấm Writing AI',
      description: 'Chấm điểm và sửa lỗi ngữ pháp bài Writing IELTS & TOEIC.',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/ai-grader',
      color: 'text-emerald-600',
      borderHover: 'hover:border-emerald-400',
      isNew: true
    },
    {
      title: 'Công Cụ PDF',
      description: 'Gộp, cắt trang, chuyển đổi, khóa PDF và máy tính Casio ảo.',
      icon: <PenTool className="w-5 h-5" />,
      href: '/tools',
      color: 'text-orange-600',
      borderHover: 'hover:border-orange-400',
    },
  ]

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
      
      {/* Hero */}
      <section className="relative w-full bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-snug">
              Việc gì cũng có <span className="text-blue-600">VNDocs</span> lo
            </h1>
            <p className="text-slate-500 text-sm mb-5">Đề thi, công cụ PDF, chấm Writing AI — tất cả miễn phí.</p>
            
            <form action="/tai-lieu" method="GET" className="relative group max-w-md mx-auto md:mx-0">
              <input 
                type="text" 
                name="q"
                placeholder="Tìm đề thi, tài liệu..." 
                className="w-full py-3 pl-10 pr-20 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:border-blue-500 focus:shadow-md focus:ring-0 outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-md transition-colors z-10">
                Tìm
              </button>
            </form>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero.jpg" alt="VNDocs - Đề thi, công cụ PDF và AI" className="hidden md:block w-72 lg:w-80 rounded-lg" />
        </div>
      </section>

      {/* Danh mục chính — 2 cột mobile, 4 cột desktop */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {portalCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={cat.href}
              className={`group relative flex flex-col p-4 md:p-5 rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md ${cat.borderHover}`}
            >
              {cat.isNew && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                  Mới
                </span>
              )}
              <div className={`mb-2 ${cat.color}`}>
                {cat.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight">{cat.title}</h3>
              <p className="text-slate-500 text-xs leading-snug line-clamp-2 hidden md:block">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner — compact */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-8 md:pb-12">
        <div className="bg-slate-900 rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full translate-x-1/4 -translate-y-1/4" />
          
          <div className="z-10 space-y-3 flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
              Sợ viết Tiếng Anh? <span className="text-emerald-400">Đã có giám khảo ảo 24/7.</span>
            </h2>
            <ul className="space-y-1.5">
              <li className="flex items-center text-slate-300 gap-2 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sửa chi tiết từng lỗi sai cấu trúc
              </li>
              <li className="flex items-center text-slate-300 gap-2 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Chấm điểm 4 tiêu chí (TR, CC, LR, GRA)
              </li>
            </ul>
          </div>
          <div className="z-10 shrink-0 w-full md:w-auto">
            <Link href="/ai-grader" className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-white text-slate-900 font-bold rounded-md text-sm transition-all hover:bg-blue-50">
              Dùng thử <FileText className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
