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
      description: 'Tổng hợp đề thi chính thức và đề thi thử các môn Toán, Văn, Anh bám sát cấu trúc thi.',
      icon: <GraduationCap className="w-5 h-5" />,
      href: '/tai-lieu?examType=vao-10',
      color: 'text-blue-600',
      borderHover: 'hover:border-blue-400',
    },
    {
      title: 'Đề Thi THPT Quốc Gia',
      description: 'Bộ đề ôn luyện thi Tốt nghiệp và Đại học chuẩn xác từ các trường chuyên trên cả nước.',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/tai-lieu?examType=thpt-qg',
      color: 'text-indigo-600',
      borderHover: 'hover:border-indigo-400',
    },
    {
      title: 'Chấm Thi Tiếng Anh Tự Động',
      description: 'Chấm điểm chi tiết và sửa lỗi ngữ pháp bài thi Writing IELTS & TOEIC siêu khắt khe.',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/ai-grader',
      color: 'text-emerald-600',
      borderHover: 'hover:border-emerald-400',
      isNew: true
    },
    {
      title: 'Bộ Công Cụ Tiện Ích',
      description: 'Gộp/Cắt trang PDF, Chuyển đổi định dạng, Khóa bảo mật và Máy tính Casio ảo cực xịn.',
      icon: <PenTool className="w-5 h-5" />,
      href: '/tools',
      color: 'text-orange-600',
      borderHover: 'hover:border-orange-400',
    },
    {
      title: 'Sách Giáo Khoa',
      description: 'Kho sách điện tử bản chuẩn, độ phân giải cao phục vụ tra cứu nhanh cho mọi cấp học.',
      icon: <Library className="w-5 h-5" />,
      href: '/tai-lieu?subject=sgk',
      color: 'text-teal-600',
      borderHover: 'hover:border-teal-400',
    },
    {
      title: 'Tài Liệu Chuyên Sâu',
      description: 'Đề cương, giáo án, chuyên đề luyện thi độc quyền từ các lò luyện nổi tiếng nhất.',
      icon: <Star className="w-5 h-5" />,
      href: '/tai-lieu?subject=chuyen-sau',
      color: 'text-rose-600',
      borderHover: 'hover:border-rose-400',
    }
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
      
      {/* Hero Section — compact, no heavy animations */}
      <section className="relative w-full overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.05),_transparent_50%)]" />
        
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Tính năng mới: Chấm chữa Writing chuẩn quốc tế
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Tri Thức <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Nằm Trong</span> <br className="hidden md:block"/>Tầm Tay Bạn
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            VNDocs mang đến hệ sinh thái toàn diện với hàng ngàn đề thi chuẩn, bộ tiện ích PDF mạnh mẽ và tính năng chấm chữa bài viết thông minh 24/7.
          </p>
          
          <div className="pt-6 w-full max-w-xl mx-auto">
            <form action="/tai-lieu" method="GET" className="relative group">
              <input 
                type="text" 
                name="q"
                placeholder="Tìm đề thi Toán 10, văn mẫu, tài liệu học tập..." 
                className="w-full py-4 pl-12 pr-28 md:pr-32 bg-white border border-gray-200 rounded-xl text-base shadow-sm focus:border-blue-500 focus:shadow-md focus:ring-0 outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm rounded-lg transition-colors z-10">
                Tìm Ngay
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Categories — tighter spacing, compact cards */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Khám Phá VNDocs</h2>
          <p className="text-slate-500 text-base">Tất cả những gì bạn cần cho hành trình học tập xuất sắc</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {portalCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={cat.href}
              className={`group relative flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cat.borderHover}`}
            >
              {cat.isNew && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                  Mới
                </span>
              )}
              <div className={`shrink-0 mt-0.5 ${cat.color}`}>
                {cat.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                <p className="text-slate-500 text-sm leading-snug line-clamp-2">
                  {cat.description}
                </p>
                <span className="inline-flex items-center text-blue-600 font-medium text-xs mt-2 group-hover:gap-1 transition-all">
                  Truy cập <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner — brand-color, reduced border-radius, no dark gradient */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-12 md:pb-16">
        <div className="bg-slate-900 rounded-xl p-8 md:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
          {/* Subtle decorative — small, not overwhelming */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4" />
          
          <div className="z-10 space-y-4 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
              Sợ viết Tiếng Anh? <br/>
              <span className="text-emerald-400">Đã có giám khảo ảo 24/7.</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Tự động ra đề thi IELTS Task 2 & TOEIC Writing. Hệ thống sẽ phân tích ngữ pháp, chỉ ra lỗi sai và chấm điểm trực tiếp theo tiêu chuẩn quốc tế một cách gắt gao nhất.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-slate-300 gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Sửa chi tiết từng lỗi sai cấu trúc
              </li>
              <li className="flex items-center text-slate-300 gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Chấm điểm 4 tiêu chí rõ ràng (TR, CC, LR, GRA)
              </li>
            </ul>
          </div>
          <div className="z-10 shrink-0 w-full lg:w-auto">
            <Link href="/ai-grader" className="inline-flex items-center justify-center w-full lg:w-auto px-8 py-3.5 bg-white text-slate-900 font-bold rounded-lg text-sm transition-all hover:bg-blue-50 hover:shadow-lg">
              Trải nghiệm Miễn Phí <FileText className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
