import React from 'react'
import Link from 'next/link'
import { Search, BookOpen, PenTool, GraduationCap, FileText, Library, Star, CheckCircle, ChevronRight, Sparkles } from 'lucide-react'
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
      icon: <GraduationCap className="w-8 h-8 text-blue-500" />,
      href: '/tai-lieu?examType=vao-10',
      bg: 'bg-white/80 backdrop-blur-xl border-blue-100 hover:border-blue-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]'
    },
    {
      title: 'Đề Thi THPT Quốc Gia',
      description: 'Bộ đề ôn luyện thi Tốt nghiệp và Đại học chuẩn xác từ các trường chuyên trên cả nước.',
      icon: <BookOpen className="w-8 h-8 text-indigo-500" />,
      href: '/tai-lieu?examType=thpt-qg',
      bg: 'bg-white/80 backdrop-blur-xl border-indigo-100 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]'
    },
    {
      title: 'Chấm Thi Tiếng Anh Tự Động',
      description: 'Chấm điểm chi tiết và sửa lỗi ngữ pháp bài thi Writing IELTS & TOEIC siêu khắt khe.',
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      href: '/ai-grader',
      bg: 'bg-white/80 backdrop-blur-xl border-emerald-100 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
      isNew: true
    },
    {
      title: 'Bộ Công Cụ Tiện Ích',
      description: 'Gộp/Cắt trang PDF, Chuyển đổi định dạng, Khóa bảo mật và Máy tính Casio ảo cực xịn.',
      icon: <PenTool className="w-8 h-8 text-orange-500" />,
      href: '/tools',
      bg: 'bg-white/80 backdrop-blur-xl border-orange-100 hover:border-orange-300 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)]'
    },
    {
      title: 'Sách Giáo Khoa',
      description: 'Kho sách điện tử bản chuẩn, độ phân giải cao phục vụ tra cứu nhanh cho mọi cấp học.',
      icon: <Library className="w-8 h-8 text-teal-500" />,
      href: '/tai-lieu?subject=sgk',
      bg: 'bg-white/80 backdrop-blur-xl border-teal-100 hover:border-teal-300 hover:shadow-[0_8px_30px_rgba(20,184,166,0.15)]'
    },
    {
      title: 'Tài Liệu Chuyên Sâu',
      description: 'Đề cương, giáo án, chuyên đề luyện thi độc quyền từ các lò luyện nổi tiếng nhất.',
      icon: <Star className="w-8 h-8 text-rose-500" />,
      href: '/tai-lieu?subject=chuyen-sau',
      bg: 'bg-white/80 backdrop-blur-xl border-rose-100 hover:border-rose-300 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]'
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
      
      {/* Premium Hero Section */}
      <section className="relative w-full overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.05),_transparent_50%)]" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50/80 border border-emerald-100 text-emerald-700 font-medium text-sm mb-2 shadow-[0_2px_10px_rgba(16,185,129,0.1)] backdrop-blur-sm animate-fade-in-up">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Tính năng mới: Chấm chữa Writing chuẩn quốc tế
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Tri Thức <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Nằm Trong</span> <br className="hidden md:block"/> Tầm Tay Bạn
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            VNDocs mang đến hệ sinh thái toàn diện với hàng ngàn đề thi chuẩn, bộ tiện ích PDF mạnh mẽ và tính năng chấm chữa bài viết thông minh 24/7.
          </p>
          
          <div className="pt-10 w-full max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <form action="/tai-lieu" method="GET" className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <input 
                type="text" 
                name="q"
                placeholder="Tìm đề thi Toán 10, văn mẫu, tài liệu học tập..." 
                className="relative w-full py-5 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl text-lg shadow-xl focus:border-blue-500 focus:ring-0 outline-none transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-md z-10">
                Tìm Ngay
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Khám Phá VNDocs</h2>
          <p className="text-slate-500 text-lg">Tất cả những gì bạn cần cho hành trình học tập xuất sắc</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portalCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={cat.href}
              className={`group relative flex flex-col items-start p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 bg-white ${cat.bg}`}
            >
              {cat.isNew && (
                <span className="absolute top-6 right-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md shadow-rose-500/20">
                  Mới nhất
                </span>
              )}
              <div className="bg-slate-50 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500 ease-out border border-slate-100">
                {cat.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                {cat.description}
              </p>
              <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                Truy cập ngay <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium Highlight CTA */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
          
          <div className="z-10 space-y-6 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Sợ viết Tiếng Anh? <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Đã có giám khảo ảo 24/7.</span>
            </h2>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium">
              Tự động ra đề thi IELTS Task 2 & TOEIC Writing. Hệ thống sẽ phân tích ngữ pháp, chỉ ra lỗi sai và chấm điểm trực tiếp theo tiêu chuẩn quốc tế một cách gắt gao nhất.
            </p>
            <ul className="space-y-3 pt-2">
              <li className="flex items-center text-slate-200 gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Sửa chi tiết từng lỗi sai cấu trúc
              </li>
              <li className="flex items-center text-slate-200 gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> Chấm điểm 4 tiêu chí rõ ràng (TR, CC, LR, GRA)
              </li>
            </ul>
          </div>
          <div className="z-10 shrink-0 w-full lg:w-auto">
            <Link href="/ai-grader" className="group relative inline-flex items-center justify-center w-full lg:w-auto px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <span className="relative z-10 flex items-center gap-2">
                Trải nghiệm Miễn Phí <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
