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

  const navLinks = [
    { href: '/', label: 'Đề thi' },
    { href: '/tools', label: 'Công cụ' },
    { href: '/ai-grader', label: 'Luyện IELTS/TOEIC' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1117] border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 md:px-10 h-[60px]">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.jpg"
            alt="VNDocs Logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-[6px] object-cover"
          />
          <span className="hidden sm:inline text-[15px] font-[800] text-[var(--text-primary)] tracking-tight">VNDocs</span>
        </Link>

        {/* Center: nav (home) or search (inner pages) */}
        <div className="min-w-0 flex-1 flex items-center justify-center">
          {isHomePage ? (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-[600] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors tracking-wide uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="w-full max-w-xl">
              <SearchBar />
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/favorites"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all"
            aria-label="Đề yêu thích"
          >
            <Star size={16} />
          </Link>
          <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all" />
        </div>
      </div>
    </header>
  )
}
