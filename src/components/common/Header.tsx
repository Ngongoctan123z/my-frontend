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
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] dark:from-[#0f172a] dark:to-[#1e3a8a] shadow-md transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:gap-8 md:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-3 font-bold text-white transition-all duration-300 hover:opacity-90">
          <Image 
            src="/logo.jpg" 
            alt="VNDocs Logo" 
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:-rotate-2" 
          />
          <span className="hidden sm:inline text-lg tracking-wide">VNDocs</span>
        </Link>
        <div className="min-w-0 flex-1 flex items-center justify-end md:justify-center">
          {isHomePage ? (
            <nav className="hidden md:flex items-center gap-8 text-white font-semibold tracking-wide">
              <Link href="/" className="hover:text-blue-200 transition-colors py-2">Đề thi</Link>
              <Link href="/tools" className="hover:text-blue-200 transition-colors py-2">Công cụ</Link>
              <Link href="/ai-grader" className="hover:text-blue-200 transition-colors py-2">Luyện IELTS/TOEIC</Link>
            </nav>
          ) : (
            <div className="w-full max-w-2xl mx-auto">
              <SearchBar />
            </div>
          )}
        </div>
        <Link href="/favorites"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg active:scale-95"
          aria-label="Đề yêu thích"
        >
          <Star size={18} className="transition-transform duration-300 group-hover:rotate-12" />
        </Link>
        <ThemeToggle className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg active:scale-95" />
      </div>
    </header>
  )
}
