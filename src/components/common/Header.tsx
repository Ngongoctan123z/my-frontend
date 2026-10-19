'use client'

import { useState, useRef, useEffect } from 'react'
import { Star, Info, Menu, X, Crown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'


import { AuthButton } from '../auth/AuthButton'

export function Header() {
  const pathname = usePathname()
  const isEnRoute = pathname.startsWith('/en/') || pathname === '/en'
  useEffect(() => {
    document.documentElement.lang = isEnRoute ? 'en' : 'vi'
  }, [isEnRoute])
  const { data: session } = useSession()

  const [userPlan, setUserPlan] = useState<string>('free')

  const [supportOpen, setSupportOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data && data.plan) {
            setUserPlan(data.plan)
          }
        })
        .catch(() => {})
    } else {
      setUserPlan('free')
    }
  }, [session])

  const vnNavLinks = [
    { href: '/speaking', label: 'Luyện Speaking', dropdown: [{ href: '/speaking', label: 'IELTS & TOEIC Speaking' }] },
    { href: '/ai-grader', label: 'Luyện Writing', dropdown: [
      { href: '/ai-grader/ielts', label: 'Luyện IELTS' }, { href: '/ai-grader/toeic', label: 'Luyện TOEIC' },
      { href: '/ai-grader/hsk', label: 'Luyện HSK' }, { href: '/ai-grader/topik', label: 'Luyện TOPIK' },
    ] },
  ]
  const enNavLinks = [
    { href: '/speaking', label: 'Speaking Practice', dropdown: [{ href: '/speaking', label: 'IELTS & TOEIC Speaking' }] },
    { href: '/en/ai-grader', label: 'Writing Practice', dropdown: [
      { href: '/en/ai-grader/ielts', label: 'IELTS Writing' }, { href: '/en/ai-grader/toeic', label: 'TOEIC Writing' },
      { href: '/en/ai-grader/hsk', label: 'HSK Writing' }, { href: '/en/ai-grader/topik', label: 'TOPIK Writing' },
    ] },
  ]

  const navLinks = isEnRoute ? enNavLinks : vnNavLinks

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1117] border-b border-[var(--border-color)] transition-colors duration-300">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 sm:gap-6 px-3 sm:px-6 md:px-8 h-[66px]">

        {/* Hamburger Menu (Visible on all screens) */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link prefetch={false} href={isEnRoute ? "/en" : "/"} className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.jpg"
            alt="VNDocs Logo"
            width={40}
            height={40}
            priority
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-[6px] object-cover"
          />
          <span className="hidden sm:inline text-[18px] font-[900] text-[var(--text-primary)] tracking-tight">VNDocs</span>
        </Link>

        {/* Center: nav (visible on all pages) */}
        <div className="min-w-0 flex-1 flex items-center justify-center">
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link prefetch={false} href={link.href}
                  className="flex items-center gap-1 text-[15px] font-[800] text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors tracking-wide uppercase py-2"
                >
                  {link.label}
                </Link>
                {link.dropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white dark:bg-[#161B22] border border-[var(--border-color)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <div className="py-2">
                      {link.dropdown.map((subItem) => (
                        <Link key={subItem.href} prefetch={false} href={subItem.href}
                          className="block px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {userPlan === 'free' ? (
            <Link prefetch={false} href={isEnRoute ? '/en/premium' : '/premium'}
              className="inline-flex h-9 items-center justify-center rounded-[6px] bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 px-3 hover:opacity-90 transition-all font-bold text-sm shadow-sm gap-1 mr-1"
              aria-label="Premium"
            >
              <Crown size={16} className="text-yellow-900 fill-yellow-900/20" />
              <span className="hidden sm:inline">{isEnRoute ? 'Upgrade' : 'Nâng cấp'}</span>
            </Link>
          ) : userPlan === 'plus' ? (
            <Link prefetch={false} href={isEnRoute ? '/en/profile' : '/profile'}
              className="inline-flex h-9 items-center justify-center rounded-[6px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 hover:opacity-90 transition-all font-bold text-sm shadow-sm gap-1 mr-1"
              aria-label="Plus"
            >
              <Crown size={16} className="text-white fill-white/20" />
              <span className="hidden sm:inline">PLUS</span>
            </Link>
          ) : (
            <Link prefetch={false} href={isEnRoute ? '/en/profile' : '/profile'}
              className="inline-flex h-9 items-center justify-center rounded-[6px] bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 hover:opacity-90 transition-all font-bold text-sm shadow-sm gap-1 mr-1"
              aria-label="Pro"
            >
              <Crown size={16} className="text-white fill-white/20" />
              <span className="hidden sm:inline">PRO</span>
            </Link>
          )}
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
                <div className="px-4 py-1.5 text-[11px] font-[700] text-[var(--text-muted)] uppercase tracking-wider">{isEnRoute ? 'Support' : 'Hỗ trợ'}</div>
                <Link prefetch={false} href={isEnRoute ? '/en/about' : '/about'} onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">{isEnRoute ? 'About Us' : 'Về chúng tôi'}</Link>
                <Link prefetch={false} href={isEnRoute ? '/en/terms' : '/terms'} onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">{isEnRoute ? 'Terms of Use' : 'Điều khoản sử dụng'}</Link>
                <Link prefetch={false} href={isEnRoute ? '/en/privacy' : '/privacy'} onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">{isEnRoute ? 'Privacy Policy' : 'Chính sách bảo mật'}</Link>
                <Link prefetch={false} href={isEnRoute ? '/en/contact' : '/contact'} onClick={() => setSupportOpen(false)} className="block px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">{isEnRoute ? 'Contact Us' : 'Liên hệ hợp tác'}</Link>
              </div>
            )}
          </div>

          <Link 
            prefetch={false}
            href={pathname === '/speaking' ? '/en' : isEnRoute ? (pathname.replace(/^\/en/, '') || '/') : (`/en${pathname === '/' ? '' : pathname}`)}
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-[6px] border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-all"
            aria-label="Toggle Language"
            title={isEnRoute ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
          >
            <span className="text-[13px] font-bold tracking-tight">{isEnRoute ? 'VN' : 'EN'}</span>
          </Link>
          <div className="ml-0 sm:ml-2 sm:pl-2 sm:border-l border-[var(--border-color)]">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Sidebar Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 z-[110] w-[300px] max-w-[85vw] bg-white dark:bg-[#0D1117] border-r border-[var(--border-color)] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
              <Link prefetch={false} href={isEnRoute ? "/en" : "/"} className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <Image src="/logo.jpg" alt="VNDocs" width={36} height={36} className="rounded-md" />
                <span className="text-xl font-[900] tracking-tight text-[var(--text-primary)]">VNDocs</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-5 px-4 space-y-8">
              {navLinks.map((section) => (
                <div key={section.href}>
                  <h3 className="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {section.dropdown?.map((item) => (
                      <Link key={item.href} prefetch={false} href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="pt-6 border-t border-[var(--border-color)]">
                <h3 className="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {isEnRoute ? 'Settings & Support' : 'Cài đặt & Hỗ trợ'}
                </h3>
                <div className="space-y-1">
                  {userPlan === 'free' ? (
                    <Link prefetch={false} href={isEnRoute ? '/en/premium' : '/premium'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                      <Crown size={18} /> {isEnRoute ? 'Upgrade Premium' : 'Nâng cấp Premium'}
                    </Link>
                  ) : userPlan === 'plus' ? (
                    <Link prefetch={false} href={isEnRoute ? '/en/profile' : '/profile'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Crown size={18} /> {isEnRoute ? 'Your plan: PLUS' : 'Gói của bạn: PLUS'}
                    </Link>
                  ) : (
                    <Link prefetch={false} href={isEnRoute ? '/en/profile' : '/profile'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                      <Crown size={18} /> {isEnRoute ? 'Your plan: PRO' : 'Gói của bạn: PRO'}
                    </Link>
                  )}
                  <Link prefetch={false} href={isEnRoute ? '/en/profile' : '/profile'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Star size={18} /> {isEnRoute ? 'Profile' : 'Hồ sơ cá nhân'}
                  </Link>

                  <Link prefetch={false} href={isEnRoute ? '/en/about' : '/about'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Info size={18} /> {isEnRoute ? 'About Us' : 'Về chúng tôi'}
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
