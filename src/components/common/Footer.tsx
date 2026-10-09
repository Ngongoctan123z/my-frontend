'use client'

import Link from 'next/link'
import { BookOpen, Sparkles, Shield, Mail } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const vnContent = {
    desc: 'Nền tảng đề thi & công cụ học tập miễn phí. Kho tài liệu phong phú cùng AI và bộ công cụ PDF mạnh mẽ.',
    col1: {
      title: 'Học Tập',
      links: [
        { href: '/tai-lieu?examType=VAO_10', label: 'Đề thi vào lớp 10' },
        { href: '/tai-lieu?examType=THPT', label: 'Đề thi THPT Quốc Gia' },
        { href: '/tai-lieu', label: 'Tất cả tài liệu' },
        { href: '/ai-grader/tai-lieu-tong-hop', label: 'Tài liệu miễn phí' },
      ]
    },
    col2: {
      title: 'Tiện Ích & AI',
      links: [
        { href: '/ai-grader', label: 'Chấm Writing IELTS/TOEIC' },
        { href: '/tools/merge-files', label: 'Gộp file PDF' },
        { href: '/tools/remove-pages', label: 'Xóa trang PDF' },
        { href: '/tools/lock', label: 'Đặt mật khẩu PDF' },
        { href: '/tools/casio', label: 'Máy tính Casio online' },
      ]
    },
    col3: {
      title: 'Hỗ Trợ',
      links: [
        { href: '/about', label: 'Về chúng tôi' },
        { href: '/terms', label: 'Điều khoản sử dụng' },
        { href: '/privacy', label: 'Chính sách bảo mật' },
        { href: '/contact', label: 'Liên hệ hợp tác' },
      ]
    },
    bottom: [
      { href: '/', label: 'Trang chủ' },
      { href: '/tai-lieu', label: 'Tài liệu' },
    ]
  }

  const enContent = {
    desc: 'Free learning tools platform. Enhance your language skills with powerful AI and streamline your workflow with our PDF toolset.',
    col1: {
      title: 'AI Language Grader',
      links: [
        { href: '/en/ai-grader/ielts', label: 'IELTS Writing Grader' },
        { href: '/en/ai-grader/toeic', label: 'TOEIC Writing Grader' },
        { href: '/en/ai-grader/hsk', label: 'HSK Writing Grader' },
        { href: '/en/ai-grader/topik', label: 'TOPIK Writing Grader' },
      ]
    },
    col2: {
      title: 'PDF Tools',
      links: [
        { href: '/en/tools/merge-files', label: 'Merge PDF' },
        { href: '/en/tools/remove-pages', label: 'Remove PDF Pages' },
        { href: '/en/tools/lock', label: 'Lock/Unlock PDF' },
        { href: '/en/tools/convert', label: 'Image to PDF' },
        { href: '/en/tools/compress', label: 'Compress PDF' },
      ]
    },
    col3: {
      title: 'Support',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '/terms', label: 'Terms of Use' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/contact', label: 'Contact Us' },
      ]
    },
    bottom: [
      { href: '/en', label: 'Home' },
    ]
  }

  const content = isEn ? enContent : vnContent

  return (
    <footer className="w-full bg-[var(--bg-secondary)] border-t border-[var(--border-color)] mt-16 pt-14 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-10">

          {/* Brand col */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link prefetch={false} href={isEn ? "/en" : "/"} className="inline-block mb-3">
              <span className="text-[22px] font-[900] text-[var(--text-primary)] tracking-tight">VNDocs.net</span>
            </Link>
            <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed mb-6 max-w-xs">
              {content.desc}
            </p>
            <div className="flex items-center gap-2">
              {[
                {
                  label: 'Facebook',
                  href: 'https://www.facebook.com/people/Vndocsnet/61595105977293/',
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  )
                },
                {
                  label: 'YouTube',
                  href: 'https://youtube.com/@vndocs-net?si=RtRoOT__R4Bc1C0m',
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  )
                },
                { label: 'Email', href: 'vndocsnet@gmail.com', icon: <Mail className="w-3.5 h-3.5" /> }
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-[6px] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-[12px] font-[700] uppercase tracking-widest text-[var(--text-tertiary)] mb-4">{content.col1.title}</h4>
            <ul className="space-y-2.5">
              {content.col1.links.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-[12px] font-[700] uppercase tracking-widest text-[var(--text-tertiary)] mb-4">{content.col2.title}</h4>
            <ul className="space-y-2.5">
              {content.col2.links.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="text-[12px] font-[700] uppercase tracking-widest text-[var(--text-tertiary)] mb-4">{content.col3.title}</h4>
            <ul className="space-y-2.5">
              {content.col3.links.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[var(--text-tertiary)] text-[12px]">
            © {new Date().getFullYear()} <span className="font-semibold text-[var(--text-secondary)]">VNDocs</span>. All rights reserved.
          </p>
          <div className="flex gap-5 text-[12px]">
            {content.bottom.map((l) => (
              <Link key={l.href} prefetch={false} href={l.href} className="text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
