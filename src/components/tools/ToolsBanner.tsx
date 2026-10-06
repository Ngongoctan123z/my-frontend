'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Calculator, FileText, Lock, Layers } from 'lucide-react'

export function ToolsBanner() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const vnLinks = [
    { href: '/tools', label: 'Tất cả công cụ', icon: null },
    { href: '/tools/convert', label: 'Chuyển đổi định dạng ảnh', icon: <FileText size={14} /> },
    { href: '/tools/compress', label: 'Nén Ảnh/File', icon: <Layers size={14} /> },
    { href: '/tools/lock', label: 'Khóa File', icon: <Lock size={14} /> },
    { href: '/tools/remove-pages', label: 'Xóa Trang', icon: <Layers size={14} /> },
    { href: '/tools/merge-files', label: 'Gộp File', icon: <Layers size={14} /> },
    { href: '/tools/casio', label: 'Máy Tính Khoa Học', icon: <Calculator size={14} /> },
  ]

  const enLinks = [
    { href: '/en/tools', label: 'All Tools', icon: null },
    { href: '/en/tools/convert', label: 'Image Converter', icon: <FileText size={14} /> },
    { href: '/en/tools/compress', label: 'Compress Files', icon: <Layers size={14} /> },
    { href: '/en/tools/lock', label: 'Lock/Unlock PDF', icon: <Lock size={14} /> },
    { href: '/en/tools/remove-pages', label: 'Remove Pages', icon: <Layers size={14} /> },
    { href: '/en/tools/merge-files', label: 'Merge Files', icon: <Layers size={14} /> },
    { href: '/en/tools/casio', label: 'Calculator', icon: <Calculator size={14} /> },
  ]

  const links = isEn ? enLinks : vnLinks

  return (
    <section className="sticky top-[76px] z-30 -mx-6 mb-6 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
      <div className="mx-auto max-w-5xl relative">
        {/* Scrolling Fade Hint */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface/95 to-transparent pointer-events-none z-20 md:hidden flex items-center justify-end pr-1">
          <ChevronRight size={16} className="text-ink-muted/50" />
        </div>

        {/* Main Quick Actions Row */}
        <div className="flex items-center gap-2 pt-1 relative z-10 overflow-x-auto pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
          <Link prefetch={false} href={isEn ? "/en" : "/"}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-line bg-page px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all snap-start"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            {isEn ? 'Home' : 'Trang chủ'}
          </Link>
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} prefetch={false} href={link.href}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all snap-start ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-page text-ink hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] border border-line'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
