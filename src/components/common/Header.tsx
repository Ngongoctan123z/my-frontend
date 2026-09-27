'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { SearchBar } from '../search/SearchBar'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3 md:gap-8 md:px-10 h-[64px]">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 transition-all duration-300 hover:opacity-90">
          <Image 
            src="/logo.jpg" 
            alt="VNDocs Logo" 
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" 
          />
          <span className="hidden sm:inline text-[22px] font-[900] tracking-tight text-gray-950 dark:text-white uppercase">VNDocs</span>
        </Link>
        <div className="min-w-0 flex-1 flex items-center justify-end md:justify-center">
          {isHomePage ? (
            <nav className="hidden md:flex items-center gap-7">
              <Link href="/" className="text-[13px] font-[600] uppercase tracking-[0.05em] text-gray-700 dark:text-gray-300 hover:text-[var(--color-primary)] transition-colors py-2">Đề thi</Link>
              <Link href="/tools" className="text-[13px] font-[600] uppercase tracking-[0.05em] text-gray-700 dark:text-gray-300 hover:text-[var(--color-primary)] transition-colors py-2">Công cụ</Link>
              <Link href="/ai-grader" className="text-[13px] font-[600] uppercase tracking-[0.05em] text-gray-700 dark:text-gray-300 hover:text-[var(--color-primary)] transition-colors py-2">Luyện IELTS/TOEIC</Link>
            </nav>
          ) : (
            <div className="w-full max-w-2xl mx-auto">
              <SearchBar />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Link href="/favorites"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95"
            aria-label="Đề yêu thích"
          >
            <Star size={18} className="transition-transform duration-300 group-hover:rotate-12" />
          </Link>
          <ThemeToggle className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95" />
        </div>
      </div>
    </header>
  )
}
