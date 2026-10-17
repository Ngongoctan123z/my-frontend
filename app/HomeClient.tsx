'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, BookOpen, PenTool, GraduationCap, FileText, Check, ChevronRight, Sparkles, Layers, Globe } from 'lucide-react'
import { Reveal, StaggerReveal } from '@/src/components/ui/Reveal'
import { getSmartRoute } from '@/src/utils/searchRouting'

export function HomeClient() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'
  const [searchQuery, setSearchQuery] = useState('')

  const portalCategories = [
    {
      title: isEn ? 'Grade 10 Entrance Exams' : 'Đề Thi Vào Lớp 10',
      description: isEn ? 'Official & mock tests for Math, Literature, English.' : 'Đề thi chính thức và đề thi thử Toán, Văn, Anh bám sát cấu trúc.',
      icon: <GraduationCap className="w-5 h-5" />,
      href: '/tai-lieu?examType=VAO_10',
      color: 'text-blue-600',
      borderHover: 'hover:border-blue-400',
      isNew: false,
    },
    {
      title: isEn ? 'High School Exams (THPT)' : 'Đề Thi THPT Quốc Gia',
      description: isEn ? 'Comprehensive past exams for graduation & university entrance.' : 'Bộ đề ôn luyện Tốt nghiệp và Đại học từ các năm trước',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/tai-lieu?examType=THPT',
      color: 'text-indigo-600',
      borderHover: 'hover:border-indigo-400',
    },
    {
      title: isEn ? 'Online Writing Grader' : 'Luyện Writing Online',
      description: isEn ? 'Instant rubric feedback for IELTS, TOEIC, HSK & TOPIK.' : 'Chấm điểm và sửa lỗi chi tiết bài Writing IELTS, TOEIC, HSK & TOPIK.',
      icon: <Sparkles className="w-5 h-5" />,
      href: isEn ? '/en/ai-grader' : '/ai-grader',
      color: 'text-emerald-600',
      borderHover: 'hover:border-emerald-400',
    },
    {
      title: isEn ? 'File Productivity Tools' : 'Công Cụ File',
      description: isEn ? 'Merge, split, convert, lock PDFs, Casio calculator & image converter.' : 'Gộp, cắt trang, chuyển đổi, khóa PDF và máy tính Casio ảo, chuyển định dạng ảnh',
      icon: <PenTool className="w-5 h-5" />,
      href: isEn ? '/en/tools' : '/tools',
      color: 'text-orange-600',
      borderHover: 'hover:border-orange-400',
    },
  ]

  useEffect(() => setMounted(true), [])

  // Rotation logic for mobile 2x2 grid (Absolute Positioning for smooth transition)
  const [rotationOffset, setRotationOffset] = useState(0)
  
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const mobileInterval = setInterval(() => {
      if (!mobileQuery.matches) return
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
                {isEn ? (
                  <>
                    VNDocs: Online Exam Prep, Writing Grader<br />
                    <span className="text-blue-600">& Free Learning Utilities</span>
                  </>
                ) : (
                  <>
                    VNDocs: Kho Đề Thi, Luyện Writing Chuẩn Khảo Thí<br />
                    <span className="text-blue-600">& Tiện Ích Học Tập Miễn Phí</span>
                  </>
                )}
              </h1>
            </Reveal>
            <Reveal animation="fade-up" delay={150} duration={600}>
              <p className="text-slate-500 text-sm mb-5">
                {isEn
                  ? 'High School exams, IELTS, TOEIC, HSK & TOPIK Writing Evaluation — 100% Free'
                  : 'Đề thi vào 10, THPT Quốc Gia, luyện Writing IELTS, TOEIC, HSK & TOPIK — tất cả miễn phí'}
              </p>
            </Reveal>

            <Reveal animation="fade-up" delay={300} duration={600}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    router.push(getSmartRoute(searchQuery))
                  }
                }}
                className="relative group max-w-md mx-auto md:mx-0"
              >
                <input
                  type="text"
                  name="q"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? "Search exams, tools, writing practice..." : "Nhập thứ bạn muốn tìm ở đây"}
                  className="w-full py-3 pl-10 pr-20 bg-white border border-gray-200 rounded-lg text-sm shadow-sm focus:border-blue-500 focus:shadow-md focus:ring-0 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-md transition-colors z-10">
                  {isEn ? 'Search' : 'Tìm'}
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
        <h2 className="sr-only">{isEn ? 'Main tools and features' : 'Các công cụ và tính năng chính'}</h2>
        
        {/* Mobile Rotating 2x2 Grid */}
        <div className="block md:hidden">
          <div className="relative w-full h-[220px]">
            {portalCategories.map((cat, idx) => (
              <div 
                key={cat.href}
                className={`absolute w-[calc(50%-6px)] h-[104px] transition-all duration-700 ease-in-out ${getPosClass(idx)}`}
              >
                <Link
                  href={cat.href}
                  className={`flex flex-col justify-center h-full p-2.5 sm:p-3 bg-white rounded-lg border border-gray-200 shadow-sm ${cat.borderHover} group active:scale-95 transition-transform overflow-hidden`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cat.color}>{cat.icon}</span>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">{cat.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {cat.description}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {portalCategories.map((cat) => (
              <div key={cat.href}>
                <Link
                  href={cat.href}
                  className={`flex flex-col h-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm ${cat.borderHover} hover:shadow-md transition-all group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-md bg-gray-50 group-hover:bg-blue-50 transition-colors ${cat.color}`}>
                      {cat.icon}
                    </div>
                    {cat.isNew && (
                      <span className="text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">NEW</span>
                    )}
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

      {/* CTA Banner */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-8 md:pb-12">
        <Reveal animation="fade-up" duration={700}>
          <div className="bg-slate-900 rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden cta-shimmer">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full translate-x-1/4 -translate-y-1/4" />

            <div className="z-10 space-y-3 flex-1 min-w-0">
              <Reveal animation="slide-left" delay={200} duration={600}>
                <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
                  {isEn ? (
                    <>Where to practice writing? <span className="text-emerald-400">At VNDocs.net</span></>
                  ) : (
                    <>Luyện writing ở đâu ? <span className="text-emerald-400"> Ở VNdocs.net</span></>
                  )}
                </h2>
              </Reveal>
              <Reveal animation="fade-up" delay={400} duration={500}>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 mt-3">
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {isEn ? '3 languages: English, Chinese, Korean' : '3 ngôn ngữ: Anh, Trung, Hàn'}
                  </li>
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {isEn ? 'In-depth grammar & vocabulary analysis' : 'Sửa lỗi chi tiết ngữ pháp, từ vựng'}
                  </li>
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {isEn ? '4 certifications: IELTS, TOEIC, HSK, TOPIK' : '4 chứng chỉ: IELTS, TOEIC, HSK, TOPIK'}
                  </li>
                  <li className="flex items-center text-slate-300 gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {isEn ? 'Aligned with official scoring rubrics' : 'Chấm sát barem thi thực tế'}
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal animation="zoom-in" delay={500} duration={500}>
              <div className="z-10 shrink-0 w-full md:w-auto">
                <Link href={isEn ? "/en/ai-grader" : "/ai-grader"} className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-white text-slate-900 font-bold rounded-md text-sm transition-all hover:bg-blue-50 hover:scale-105 active:scale-95">
                  {isEn ? 'Start Practice' : 'Truy cập nhanh'} <FileText className="w-4 h-4 ml-1.5" />
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
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
              {isEn ? 'VNDocs — Free Online Exam Prep & Productivity Platform' : 'VNDocs - Nền Tảng Đề Thi & Tiện Ích Miễn Phí'}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-base">
              {isEn 
                ? 'All-in-one platform for learning and productivity. Rich repository of study materials, automated evaluation, and powerful browser-based tools.' 
                : 'Giải pháp toàn diện hỗ trợ học tập và làm việc. Kho tài liệu phong phú kết hợp cùng hệ thống luyện thi thông minh và bộ công cụ văn phòng mạnh mẽ.'}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Block 1 */}
          <Reveal animation="fade-up" duration={600} delay={100}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {isEn ? 'Specialized Exam Repository' : 'Tài Liệu Ôn Thi Chuyên Sâu'}
                </h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">
                {isEn 
                  ? 'Access thousands of Grade 10 entrance exams and National High School tests with official answer keys and step-by-step explanations.' 
                  : 'Hệ thống lưu trữ hàng nghìn đề thi vào lớp 10 và THPT Quốc Gia. Tất cả tài liệu đều đi kèm đáp án chi tiết, bám sát cấu trúc đề minh họa mới nhất.'}
              </p>
            </div>
          </Reveal>

          {/* Block 2 */}
          <Reveal animation="fade-up" duration={600} delay={200}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {isEn ? 'AI Writing Evaluation' : 'Chấm & Chữa Bài Writing'}
                </h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {isEn 
                  ? 'Rigorous evaluation according to international criteria. Error analysis and high-band vocabulary suggestions for IELTS, TOEIC, HSK & TOPIK.' 
                  : 'Tự động đánh giá khắt khe theo khung tiêu chuẩn quốc tế. Phân tích lỗi sai và đề xuất từ vựng cao cấp, giúp bứt phá điểm số IELTS, TOEIC, HSK & TOPIK.'}
              </p>
            </div>
          </Reveal>

          {/* Block 3 */}
          <Reveal animation="fade-up" duration={600} delay={300}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-[var(--text-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {isEn ? 'Browser File Utilities' : 'Xử Lý PDF Đa Tiện Ích'}
                </h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {isEn 
                  ? 'All-in-one PDF utilities running 100% locally in your browser. Merge, split, compress, or password-protect files securely without server uploads.' 
                  : 'Giải pháp công cụ PDF toàn diện hoạt động trực tiếp trên trình duyệt. Dễ dàng gộp, tách, xóa trang hoặc thiết lập mật khẩu bảo vệ tài liệu mà không cần tải lên máy chủ.'}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
