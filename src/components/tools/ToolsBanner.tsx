'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Calculator, FileText, Lock, Layers } from 'lucide-react'

export function ToolsBanner() {
  const pathname = usePathname()

  const links = [
    { href: '/tools', label: 'Tất cả công cụ', icon: null },
    { href: '/tools/convert', label: 'Chuyển đổi File', icon: <FileText size={14} /> },
    { href: '/tools/lock', label: 'Khóa File', icon: <Lock size={14} /> },
    { href: '/tools/remove-pages', label: 'Xóa Trang', icon: <Layers size={14} /> },
    { href: '/tools/merge-files', label: 'Gộp File', icon: <Layers size={14} /> },
    { href: '/tools/casio', label: 'Máy tính Casio', icon: <Calculator size={14} /> },
  ]

  return (
    <section className="sticky top-[72px] z-30 -mx-6 mb-6 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
      <div className="mx-auto max-w-5xl relative">
        {/* Scrolling Fade Hint */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface/95 to-transparent pointer-events-none z-20 md:hidden flex items-center justify-end pr-1">
          <ChevronRight size={16} className="text-ink-muted/50" />
        </div>

        {/* Main Quick Actions Row */}
        <div className="flex items-center gap-2 pt-1 relative z-10 overflow-x-auto pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-line bg-page px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all snap-start"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Trang chủ
          </Link>
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
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
