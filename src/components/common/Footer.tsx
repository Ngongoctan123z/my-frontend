'use client'

import Link from 'next/link'
import { BookOpen, Sparkles, Shield, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 mt-16 pt-16 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          
          {/* Brand & Description (Span 2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col items-start text-left">
            <Link href="/" className="inline-block mb-4">
              <h3 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-black text-transparent tracking-tight">
                VNDocs.net
              </h3>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">
              Nền tảng giáo dục trực tuyến hàng đầu cung cấp kho đề thi miễn phí, tài liệu học tập chuẩn xác và bộ công cụ AI thông minh giúp tối ưu hóa việc học và làm việc của bạn.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:shadow-md transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-500 hover:shadow-md transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-900 hover:shadow-md transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Tài liệu */}
          <div>
            <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Học Tập
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/tai-lieu" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Đề thi vào lớp 10
                </Link>
              </li>
              <li>
                <Link href="/tai-lieu" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Đề thi THPT Quốc Gia
                </Link>
              </li>
              <li>
                <Link href="/tai-lieu" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Đề thi Giữa kì & Cuối kì
                </Link>
              </li>
              <li>
                <Link href="/tai-lieu" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Tài liệu Tiếng Anh chuyên sâu
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tiện ích */}
          <div>
            <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Tiện Ích & AI
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/ai-grader" className="text-slate-500 hover:text-emerald-600 hover:translate-x-1 inline-block transition-all">
                  Chấm Writing AI (IELTS/TOEIC)
                </Link>
              </li>
              <li>
                <Link href="/tools/merge-files" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Công cụ gộp file PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/remove-pages" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Công cụ xóa trang PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/lock" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Đặt mật khẩu PDF bảo mật
                </Link>
              </li>
              <li>
                <Link href="/tools/casio" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Máy tính Casio Online
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hỗ trợ */}
          <div>
            <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" /> Hỗ Trợ
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="#" className="text-slate-500 hover:text-blue-600 hover:translate-x-1 inline-block transition-all">
                  Liên hệ hợp tác
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700">VNDocs</span>. All rights reserved. Hành trang vững bước cho tương lai.
          </p>
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/" className="text-slate-400 transition-colors hover:text-blue-600">Trang chủ</Link>
            <span className="text-slate-300">•</span>
            <Link href="/search" className="text-slate-400 transition-colors hover:text-blue-600">Tìm kiếm</Link>
            <span className="text-slate-300">•</span>
            <Link href="/favorites" className="text-slate-400 transition-colors hover:text-blue-600">Yêu thích</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

