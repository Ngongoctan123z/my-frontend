'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'

import { SearchBar } from '../search/SearchBar'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] dark:from-[#0f172a] dark:to-[#1e3a8a] shadow-md transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:gap-8 md:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-3 font-bold text-white transition-all duration-300 hover:opacity-90">
          <img 
            src="/logo.jpg" 
            alt="VNDocs Logo" 
            className="h-10 w-10 rounded-[10px] object-cover shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:-rotate-2" 
          />
          <span className="hidden sm:inline text-lg tracking-wide">VNDocs</span>
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar />
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
