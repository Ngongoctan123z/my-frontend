import React from 'react'
import Link from 'next/link'
import { Search, BookOpen, PenTool, GraduationCap, FileText, Library, Star, BrainCircuit } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VNDocs | Nền tảng Tài Liệu, Đề Thi & Công Cụ Giáo Dục',
  description: 'Kho tàng đề thi vào 10, THPT Quốc gia, công cụ tiện ích PDF, và hệ thống chấm thi AI IELTS/TOEIC hàng đầu.'
}

export default function HomePage() {
  const portalCategories = [
    {
      title: 'Đề Thi Vào Lớp 10',
      description: 'Tổng hợp đề thi chính thức và đề thi thử vào lớp 10 các môn Toán, Văn, Anh.',
      icon: <GraduationCap className="w-8 h-8 text-blue-500" />,
      href: '/tai-lieu?examType=vao-10',
      bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Đề Thi THPT Quốc Gia',
      description: 'Bộ đề ôn luyện thi Tốt nghiệp THPT và Đại học bám sát cấu trúc Bộ GD&ĐT.',
      icon: <BookOpen className="w-8 h-8 text-indigo-500" />,
      href: '/tai-lieu?examType=thpt-qg',
      bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
    },
    {
      title: 'Chấm Chữa IELTS/TOEIC AI',
      description: 'Hệ thống AI tự động tạo đề và chấm điểm Writing chi tiết theo tiêu chuẩn quốc tế.',
      icon: <BrainCircuit className="w-8 h-8 text-emerald-500" />,
      href: '/ai-grader',
      bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
      isNew: true
    },
    {
      title: 'Bộ Công Cụ Tiện Ích',
      description: 'Gộp/Cắt PDF, Đổi định dạng, Khóa bảo mật tài liệu và Máy tính Casio ảo.',
      icon: <PenTool className="w-8 h-8 text-orange-500" />,
      href: '/tools',
      bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      title: 'Sách Giáo Khoa & Tham Khảo',
      description: 'Kho sách điện tử bản chuẩn phục vụ tra cứu nhanh cho mọi cấp học.',
      icon: <Library className="w-8 h-8 text-teal-500" />,
      href: '/tai-lieu?subject=sgk',
      bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200'
    },
    {
      title: 'Tài Liệu Chuyên Sâu',
      description: 'Đề cương, giáo án, chuyên đề luyện thi từ các lò luyện nổi tiếng (Cô Mai Phương, The Forum...).',
      icon: <Star className="w-8 h-8 text-rose-500" />,
      href: '/tai-lieu?subject=chuyen-sau',
      bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200'
    }
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.vndocs.net',
    name: 'VNDocs',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.vndocs.net'}/tai-lieu?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-primary/10 via-surface to-blue-500/10 py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm mb-4 shadow-sm animate-pulse">
            <BrainCircuit className="w-4 h-4" /> Mới: Tích hợp AI Chấm Thi Writing IELTS/TOEIC
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-ink tracking-tight">
            Nền tảng Giáo dục <span className="text-primary">Thông minh</span>
          </h1>
          <p className="text-lg md:text-xl text-ink-muted max-w-3xl mx-auto">
            Hệ sinh thái cung cấp hàng ngàn Đề thi, Sách giáo khoa, Tiện ích xử lý tài liệu và Trợ lý AI chấm chữa bài thi chuẩn quốc tế.
          </p>
          
          <div className="pt-8 w-full max-w-2xl mx-auto">
            <form action="/tai-lieu" method="GET" className="relative group">
              <input 
                type="text" 
                name="q"
                placeholder="Nhập tên đề thi, tài liệu hoặc môn học..." 
                className="w-full py-4 pl-12 pr-4 bg-white border-2 border-line rounded-2xl text-lg shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-ink"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-ink-muted group-focus-within:text-primary transition-colors" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors">
                Tìm Kiếm
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Categories */}
      <section className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={cat.href}
              className={`group relative flex flex-col items-start p-8 rounded-3xl border ${cat.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
            >
              {cat.isNew && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-sm">
                  Mới
                </span>
              )}
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-5 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">{cat.title}</h3>
              <p className="text-ink-muted text-sm leading-relaxed">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12 mb-12">
        <div className="bg-ink text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="z-10 space-y-4 max-w-xl">
            <h2 className="text-3xl font-extrabold flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-primary" /> Trợ lý AI Chấm Thi Writing
            </h2>
            <p className="text-white/80 text-lg">
              Đập tan nỗi lo tự học IELTS và TOEIC. Hệ thống AI tự động ra đề và chấm chữa bài viết của bạn theo chuẩn khung điểm rubric quốc tế cực kỳ gắt gao.
            </p>
          </div>
          <div className="z-10 shrink-0">
            <Link href="/ai-grader" className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-lg transition-all shadow-[0_0_20px_rgba(42,133,255,0.4)] hover:shadow-[0_0_30px_rgba(42,133,255,0.6)] inline-flex items-center gap-2">
              Trải nghiệm ngay <FileText className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
