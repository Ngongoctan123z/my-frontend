'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, PenTool, RefreshCw, Languages, SearchCode } from 'lucide-react'

export function AiBanner() {
  const pathname = usePathname()

  const links = [
    { href: '/ai-grader', label: 'Chấm Writing', icon: <PenTool size={14} /> },
    { href: '/ai-grader/paraphrase', label: 'Diễn Đạt Lại Câu', icon: <RefreshCw size={14} /> },
    { href: '/ai-grader/translate', label: 'Dịch Chuyên Sâu', icon: <Languages size={14} /> },
    { href: '/ai-grader/grammar', label: 'Soi Lỗi Gắt', icon: <SearchCode size={14} /> },
  ]

  return (
    <section className="sticky top-[73px] z-30 -mx-6 mb-6 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
      <div className="mx-auto max-w-5xl relative">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface/95 to-transparent pointer-events-none z-20 md:hidden flex items-center justify-end pr-1">
          <ChevronRight size={16} className="text-ink-muted/50" />
        </div>

        <div className="flex overflow-x-auto no-scrollbar items-start gap-2 pt-1 relative z-10 pb-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
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
