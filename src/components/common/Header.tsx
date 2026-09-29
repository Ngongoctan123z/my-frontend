'use client'

import { useState, useRef, useEffect } from 'react'
import { Star, Info } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { SearchBar } from '../search/SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { AuthButton } from '../auth/AuthButton'

export function Header() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  const [supportOpen, setSupportOpen] = useState(false)
  const supportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: '/tai-lieu', label: 'Đề thi' },
    { href: '/tools', label: 'Công cụ' },
    { href: '/ai-grader', label: 'Luyện IELTS/TOEIC' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1117] border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 md:px-10 h-[66px]">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.jpg"
            alt="VNDocs Logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-[6px] object-cover"
          />
          <span className="hidden sm:inline text-[18px] font-[900] text-[var(--text-primary)] tracking-tight">VNDocs</span>
        </Link>

        {/* Center: nav (home) or search (inner pages) */}
        <div className="min-w-0 flex-1 flex items-center justify-center">
          {isHomePage ? (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[15px] font-[800] text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors tracking-wide uppercase"
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
          <div className="relative hidden sm:block" ref={supportRef}>
            <button
              onClick={() => setSupportOpen(!supportOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all"
              aria-label="Hỗ trợ"
            >
              <Info size={16} />
            </button>
            {supportOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#161B22] border border-[var(--border-color)] rounded-[8px] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-1.5 text-[11px] font-[700] text-[var(--text-muted)] uppercase tracking-wider">Hỗ trợ</div>
                <Link href="/about" onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">Về chúng tôi</Link>
                <Link href="/terms" onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">Điều khoản sử dụng</Link>
                <Link href="/privacy" onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">Chính sách bảo mật</Link>
                <Link href="/contact" onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">Liên hệ hợp tác</Link>
              </div>
            )}
          </div>
          <Link
            href="/favorites"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all"
            aria-label="Đề yêu thích"
          >
            <Star size={16} />
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all" />
          </div>
          <div className="ml-0 sm:ml-2 sm:pl-2 sm:border-l border-[var(--border-color)]">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}
