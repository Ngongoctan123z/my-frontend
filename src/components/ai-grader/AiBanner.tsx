'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, PenTool, RefreshCw, Languages, SearchCode, Layers, Globe, FileText, Key, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'

export function AiBanner() {
  const pathname = usePathname()
  const { apiKey, setApiKey } = useAiKey()
  const [showKey, setShowKey] = useState(false)

  const links = [
    { href: '/ai-grader', label: 'Chấm Writing', icon: <PenTool size={14} /> },
    { href: '/ai-grader/paraphrase', label: 'Diễn Đạt Lại Câu', icon: <RefreshCw size={14} /> },
    { href: '/ai-grader/translate', label: 'Dịch Nhanh', icon: <Languages size={14} /> },
    { href: '/ai-grader/grammar', label: 'Soi Lỗi Gắt', icon: <SearchCode size={14} /> },
  ]

  return (
    <>
      <section className="sticky top-[76px] z-30 -mx-6 mb-4 bg-surface/95 px-6 pb-2 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
        <div className="mx-auto max-w-5xl relative">
          {/* Scrolling Fade Hint */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface/95 to-transparent pointer-events-none z-20 md:hidden flex items-center justify-end pr-1">
            <ChevronRight size={16} className="text-ink-muted/50" />
          </div>

          {/* Navigation Tabs */}
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

      {/* API Key Row — Non-sticky, part of content, stacks on mobile */}
      <div className="mx-auto max-w-5xl mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface rounded-2xl border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <Key className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
          <span className="text-[13px] font-semibold text-ink shrink-0">API Key Gemini</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[var(--color-primary)] hover:underline shrink-0"
          >
            Lấy key miễn phí →
          </a>
        </div>
        <div className="relative flex-1 w-full sm:ml-auto">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Dán API Key vào đây..."
            className="w-full h-9 px-3 pr-8 rounded-xl border border-line bg-page text-[13px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-shadow"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  )
}
