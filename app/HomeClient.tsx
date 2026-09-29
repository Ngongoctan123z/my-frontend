'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, BookOpen, PenTool, GraduationCap, FileText, Check, ChevronRight, Sparkles, Layers, Globe } from 'lucide-react'
import { Reveal, StaggerReveal } from '@/src/components/ui/Reveal'

const portalCategories = [
  {
    title: 'Đề Thi Vào Lớp 10',
    description: 'Đề thi chính thức và đề thi thử Toán, Văn, Anh bám sát cấu trúc.',
    icon: <GraduationCap className="w-5 h-5" />,
    href: '/tai-lieu?examType=VAO_10',
    color: 'text-blue-600',
    borderHover: 'hover:border-blue-400',
    isNew: false,
  },
  {
    title: 'Đề Thi THPT Quốc Gia',
    description: 'Bộ đề ôn luyện Tốt nghiệp và Đại học từ các năm trước',
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
  },
  {
    title: 'Công Cụ File',
    description: 'Gộp, cắt trang, chuyển đổi, khóa PDF và máy tính Casio ảo,chuyển định dạng ảnh',
    icon: <PenTool className="w-5 h-5" />,
    href: '/tools',
    color: 'text-orange-600',
    borderHover: 'hover:border-orange-400',
  },
]

export function HomeClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Rotation logic for mobile 2x2 grid (Absolute Positioning for smooth transition)
  const [rotationOffset, setRotationOffset] = useState(0)
  
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const mobileInterval = setInterval(() => {
      if (!mobileQuery.matches) return // dùng matchMedia thay window.innerWidth để tránh forced layout
      setRotationOffset((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(mobileInterval)
  }, [])

  // Absolute positioning classes for the 4 slots:
  const posClasses = [
    "top-0 left-0",                           // Slot 0 (TL)
    "top-0 left-[calc(50%+6px)]",             // Slot 1 (TR)
    "top-[calc(50%+6px)] left-[calc(50%+6px)]", // Slot 2 (BR)
    "top-[calc(50%+6px)] left-0"              // Slot 3 (BL)
  ]

  const getPosClass = (itemIndex: number) => {
    const basePos = [0, 1, 3, 2][itemIndex]
    const currentPos = (basePos + rotationOffset) % 4
    return posClasses[currentPos]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.5rem)); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
      {/* Hero */}
      <section className="relative w-full bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-center md:text-left">
            <Reveal animation="fade-up" duration={700}>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-snug">
                Học cho vui điểm tới lui<br />
                <span className="text-blue-600">VNDocs không học thì đừng khóc</span>
              </h1>
            </Reveal>
            <Reveal animation="fade-up" delay={150} duration={600}>
              <p className="text-slate-500 text-sm mb-5">
                Đề thi vào 10, THPT Quốc Gia, luyện Writing IELTS/TOEIC — tất cả miễn phí{' '}
                <span className="text-blue-600 text-lg md:text-xl font-bold inline-flex items-center gap-1">
               
                </span>
              </p>
            </Reveal>

            <Reveal animation="fade-up" delay={300} duration={600}>
              <form action="/tai-lieu" method="GET" className="relative group max-w-md mx-auto md:mx-0">
                <input
                  type="text"
                  name="q"
                  placeholder="Nhập thứ bạn muốn tìm ở đây"
                  className="w-full py-3 pl-10 pr-20 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:border-blue-500 focus:shadow-md focus:ring-0 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-md transition-colors z-10">
                  Tìm
                </button>
              </form>
            </Reveal>
          </div>

          {/* Hero image with floating animation */}
          <Reveal animation="slide-right" delay={200} duration={800}>
            <div className="hidden md:block ai-loader hero-float ml-8 mr-4"></div>
          </Reveal>
        </div>
      </section>

      {/* Categories */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 overflow-hidden">
        <h2 className="sr-only">Các công cụ và tính năng chính</h2>
        
        {/* Mobile Rotating 2x2 Grid */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[3/2] md:hidden">
          {portalCategories.map((cat, idx) => (
            <div 
              key={`${cat.title}-mobile`} 
              className={`absolute w-[calc(50%-6px)] h-[calc(50%-6px)] transition-all duration-700 ease-in-out ${getPosClass(idx)}`}
            >
              <Link
                href={cat.href}
                prefetch={false}
                className="group relative flex flex-col h-full p-4 rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-blue-400 active:bg-gray-50"
              >
                {cat.isNew && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded badge-pulse">
                    Mới
                  </span>
                )}
                <div className={`mb-2 ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight">{cat.title}</h3>
                <p className="text-slate-500 text-xs leading-snug line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop CSS Marquee (Robust and jitter-free on resize) */}
        <div className="hidden md:block relative w-full">
          <div className="flex gap-4 animate-marquee w-max">
            {[...portalCategories, ...portalCategories].map((cat, idx) => (
              <div 
                key={`${cat.title}-desktop-${idx}`} 
                className="shrink-0 w-[240px] lg:w-[260px]"
              >
                <Link
                  href={cat.href}
                  prefetch={false}
                  className="group relative flex flex-col h-full p-5 rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-blue-400 active:bg-gray-50"
                >
                  {cat.isNew && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded badge-pulse">
                      Mới
                    </span>
                  )}
                  <div className={`mb-2 ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight">{cat.title}</h3>
                  <p className="text-slate-500 text-xs leading-snug line-clamp-2">
                    {cat.description}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner — slide up */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-8 md:pb-12">
        <Reveal animation="fade-up" duration={700}>
          <div className="bg-slate-900 rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden cta-shimmer">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full translate-x-1/4 -translate-y-1/4" />

            <div className="z-10 space-y-3 flex-1 min-w-0">
              <Reveal animation="slide-left" delay={200} duration={600}>
                <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                  Luyện writing ở đâu ? <span className="text-emerald-400"> Ở VNdocs.net</span>
                </h2>
              </Reveal>
              <Reveal animation="fade-up" delay={400} duration={500}>
                <ul className="space-y-1.5">
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sửa chi tiết từng lỗi sai cấu trúc
                  </li>
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Chấm điểm 4 tiêu chí (TR, CC, LR, GRA)
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal animation="zoom-in" delay={500} duration={500}>
              <div className="z-10 shrink-0 w-full md:w-auto">
                <Link href="/ai-grader" className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-white text-slate-900 font-bold rounded-md text-sm transition-all hover:bg-blue-50 hover:scale-105 active:scale-95">
                  Truy cập nhanh <FileText className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </section>

      {/* SEO Content Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 border-t border-[var(--border-color)]">
        <Reveal animation="fade-up" duration={700}>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">VNDocs - Nền Tảng Đề Thi & Tiện Ích Miễn Phí</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-base">
              Giải pháp toàn diện hỗ trợ học tập và làm việc. Kho tài liệu phong phú kết hợp cùng trí tuệ nhân tạo (AI) và bộ công cụ văn phòng mạnh mẽ.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Block 1: Kho Tài Liệu */}
          <Reveal animation="fade-up" duration={600} delay={100}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Tài Liệu Ôn Thi Chuyên Sâu</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">
                Hệ thống lưu trữ hàng nghìn <Link href="/tai-lieu" className="text-[var(--text-primary)] font-semibold hover:underline">đề thi vào lớp 10</Link> và <strong>THPT Quốc Gia</strong>. Tất cả tài liệu đều đi kèm đáp án chi tiết, bám sát cấu trúc đề minh họa mới nhất.
              </p>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Tối ưu hóa thời gian tra cứu với công cụ tìm kiếm thông minh dành riêng cho học sinh và giáo viên.
              </p>
            </div>
          </Reveal>

          {/* Block 2: AI Grader */}
          <Reveal animation="fade-up" duration={600} delay={200}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">AI Chấm Điểm Writing</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Tự động đánh giá 4 tiêu chí khắt khe (TR, CC, LR, GRA) bằng mô hình ngôn ngữ lớn. <Link href="/ai-grader" className="text-[var(--text-primary)] font-semibold hover:underline">Phân tích lỗi sai</Link> và đề xuất từ vựng cao cấp, giúp bứt phá điểm số IELTS & TOEIC.
              </p>
            </div>
          </Reveal>

          {/* Block 3: PDF Tools */}
          <Reveal animation="fade-up" duration={600} delay={300}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Xử Lý PDF Đa Tiện Ích</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                Giải pháp <Link href="/tools" className="text-[var(--text-primary)] font-semibold hover:underline">công cụ PDF toàn diện</Link> hoạt động trực tiếp trên trình duyệt. Dễ dàng gộp, tách, xóa trang hoặc thiết lập mật khẩu bảo vệ tài liệu mà không cần tải lên máy chủ.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
