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
    title: 'Đề Thi IELTS',
    description: 'Kho đề thi thực tế IELTS Academic & General kèm đáp án chi tiết.',
    icon: <Globe className="w-5 h-5" />,
    href: '/ai-grader/ielts',
    color: 'text-cyan-600',
    borderHover: 'hover:border-cyan-400',
  },
  {
    title: 'Đề Thi TOEIC',
    description: 'Đề thi TOEIC định dạng mới nhất (Reading & Listening).',
    icon: <FileText className="w-5 h-5" />,
    href: '/ai-grader/toeic',
    color: 'text-teal-600',
    borderHover: 'hover:border-teal-400',
  },
  {
    title: 'Flashcard IELTS',
    description: 'Học từ vựng IELTS theo phương pháp lặp lại ngắt quãng (Spaced Repetition).',
    icon: <Layers className="w-5 h-5" />,
    href: '/flashcard/ielts',
    color: 'text-purple-600',
    borderHover: 'hover:border-purple-400',
    isNew: true
  },
  {
    title: 'Flashcard TOEIC',
    description: 'Ghi nhớ nhanh các chủ đề từ vựng TOEIC thường gặp với Anki flashcards.',
    icon: <Layers className="w-5 h-5" />,
    href: '/flashcard/toeic',
    color: 'text-fuchsia-600',
    borderHover: 'hover:border-fuchsia-400',
    isNew: true
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
    description: 'Gộp, cắt trang, chuyển đổi, khóa PDF và máy tính Casio ảo.',
    icon: <PenTool className="w-5 h-5" />,
    href: '/tools',
    color: 'text-orange-600',
    borderHover: 'hover:border-orange-400',
  },
]

export function HomeClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
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
                  is for you 🎁
                </span>
              </p>
            </Reveal>

            <Reveal animation="fade-up" delay={300} duration={600}>
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
            </Reveal>
          </div>

          {/* Hero image with floating animation */}
          <Reveal animation="slide-right" delay={200} duration={800}>
            <div className="hidden md:block ai-loader hero-float ml-8 mr-4"></div>
          </Reveal>
        </div>
      </section>

      {/* Categories — staggered card entrance */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h2 className="sr-only">Các công cụ và tính năng chính</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StaggerReveal animation="zoom-in" stagger={60} baseDelay={0} duration={300} className="h-full">
            {portalCategories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                prefetch={false}
                className={`group relative flex flex-col h-full p-4 md:p-5 rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-blue-400 active:bg-gray-50`}
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
                <p className="text-slate-500 text-xs leading-snug line-clamp-2 hidden md:block">
                  {cat.description}
                </p>
              </Link>
            ))}
          </StaggerReveal>
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
                  Sợ viết Tiếng Anh? <span className="text-emerald-400">Đã có giám khảo ảo 24/7.</span>
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
                  Dùng thử <FileText className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </section>

      {/* SEO Content Section - Enhanced UI */}
      <section className="w-full max-w-4xl mx-auto px-4 pb-12">
        <Reveal animation="fade-up" duration={700}>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">VNDocs - Nền tảng Đề Thi, Tài Liệu & Công Cụ Miễn Phí</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">
              Giải pháp toàn diện đồng hành cùng học sinh, sinh viên và giáo viên trên toàn quốc với phương châm <em>"Học cho vui, điểm tới lui"</em>.
            </p>
          </div>
        </Reveal>

        <StaggerReveal animation="fade-up" stagger={150} duration={600} className="space-y-6">
          {/* Card 1: Kho Tài Liệu */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <article className="prose prose-sm md:prose-base prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-800 mt-0 mb-2">Kho Tàng Đề Thi & Tài Liệu Khổng Lồ</h3>
                <p className="m-0 text-justify leading-relaxed">
                  Chúng tôi cung cấp hàng ngàn <Link href="/tai-lieu" className="font-semibold text-blue-600 no-underline hover:underline">đề thi vào lớp 10</Link>, <strong>đề thi THPT Quốc Gia</strong> chính thức và thi thử từ các trường chuyên trên cả nước.
                  Tất cả tài liệu đều được chọn lọc kỹ lưỡng, bám sát cấu trúc đề thi mới nhất của Bộ Giáo dục và Đào tạo, kèm theo đáp án chi tiết giúp học sinh dễ dàng tự học và đánh giá năng lực.
                </p>
              </article>
            </div>
          </div>

          {/* Card 2: Công nghệ AI */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <article className="prose prose-sm md:prose-base prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-800 mt-0 mb-2">Tiên Phong Ứng Dụng Trí Tuệ Nhân Tạo (AI)</h3>
                <p className="m-0 text-justify leading-relaxed">
                  Tính năng <Link href="/ai-grader" className="font-semibold text-emerald-600 no-underline hover:underline">Chấm Writing AI</Link> đột phá giúp các sĩ tử ôn luyện <strong>IELTS</strong> và <strong>TOEIC</strong> nhận được những đánh giá, phân tích và sửa lỗi ngữ pháp một cách khắt khe, chính xác như một giám khảo bản xứ.
                  Bên cạnh đó, bạn có thể dễ dàng nạp từ vựng hiệu quả qua hệ thống <Link href="/flashcard/ielts" className="font-semibold text-emerald-600 no-underline hover:underline">Flashcard Spaced Repetition</Link> độc quyền được tích hợp sẵn.
                </p>
              </article>
            </div>
          </div>

          {/* Card 3: Công cụ PDF */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <article className="prose prose-sm md:prose-base prose-slate max-w-none">
                <h3 className="text-lg font-bold text-slate-800 mt-0 mb-2">Bộ Công Cụ Tiện Ích Đa Năng</h3>
                <p className="m-0 text-justify leading-relaxed">
                  Không chỉ dừng lại ở mảng giáo dục, nền tảng còn cung cấp bộ <Link href="/tools" className="font-semibold text-purple-600 no-underline hover:underline">Công cụ xử lý File PDF</Link> mạnh mẽ hoàn toàn miễn phí.
                  Người dùng có thể gộp file, cắt trang, chuyển đổi định dạng hay khóa bảo mật PDF chỉ với vài thao tác cơ bản ngay trên trình duyệt mà không cần cài đặt phần mềm nặng nề.
                </p>
              </article>
            </div>
          </div>
        </StaggerReveal>
      </section>
    </>
  )
}
