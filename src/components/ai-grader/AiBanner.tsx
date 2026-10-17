'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, PenTool, Home } from 'lucide-react'

export function AiBanner() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const vnLinks = [
    { href: '/ai-grader', shortLabel: 'Tất cả', fullLabel: 'Tất cả phòng viết', icon: null },
    { href: '/ai-grader/ielts', shortLabel: 'IELTS', fullLabel: 'Luyện IELTS', icon: <PenTool size={13} /> },
    { href: '/ai-grader/toeic', shortLabel: 'TOEIC', fullLabel: 'Luyện TOEIC', icon: <PenTool size={13} /> },
    { href: '/ai-grader/topik', shortLabel: 'TOPIK', fullLabel: 'Luyện TOPIK', icon: <PenTool size={13} /> },
    { href: '/ai-grader/hsk', shortLabel: 'HSK', fullLabel: 'Luyện HSK', icon: <PenTool size={13} /> },
  ]

  const enLinks = [
    { href: '/en/ai-grader', shortLabel: 'All', fullLabel: 'All Studios', icon: null },
    { href: '/en/ai-grader/ielts', shortLabel: 'IELTS', fullLabel: 'IELTS Writing', icon: <PenTool size={13} /> },
    { href: '/en/ai-grader/toeic', shortLabel: 'TOEIC', fullLabel: 'TOEIC Writing', icon: <PenTool size={13} /> },
    { href: '/en/ai-grader/topik', shortLabel: 'TOPIK', fullLabel: 'TOPIK Writing', icon: <PenTool size={13} /> },
    { href: '/en/ai-grader/hsk', shortLabel: 'HSK', fullLabel: 'HSK Writing', icon: <PenTool size={13} /> },
  ]

  const links = isEn ? enLinks : vnLinks

  const normalize = (p: string) => p.replace(/\/+$/, '') || '/'
  const currentPath = normalize(pathname || '')

  return (
    <section className="sticky top-[66px] z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 mb-5 bg-white/95 dark:bg-[#0D1117]/95 py-2.5 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="mx-auto max-w-6xl relative flex items-center justify-between gap-4">
        {/* Scrolling Fade Hint for Mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0D1117] to-transparent pointer-events-none z-20 md:hidden flex items-center justify-end pr-1">
          <ChevronRight size={14} className="text-slate-400" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative z-10 overflow-x-auto pb-1 -mb-1 md:pb-0 md:mb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x min-w-0">
          <Link
            prefetch={true}
            href={isEn ? "/en" : "/"}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all active:scale-95 duration-75 snap-start shadow-2xs"
            title={isEn ? "Home" : "Trang chủ"}
          >
            <Home size={13} className="text-slate-500" />
            <span className="hidden sm:inline">{isEn ? 'Home' : 'Trang chủ'}</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0 hidden sm:block" />

          {links.map((link) => {
            const isActive = currentPath === normalize(link.href)
            return (
              <Link
                key={link.href}
                prefetch={true}
                href={link.href}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] font-semibold transition-all active:scale-95 duration-75 snap-start ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200'
                }`}
              >
                {link.icon}
                <span className="md:hidden">{link.shortLabel}</span>
                <span className="hidden md:inline">{link.fullLabel}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
