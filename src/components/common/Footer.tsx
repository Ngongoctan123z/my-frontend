'use client'

import Link from 'next/link'


export function Footer() {
  return (
    <footer className="mt-12 w-full border-t border-line/40 bg-surface/30 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h3 className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-lg font-extrabold text-transparent">
              VNDocs
            </h3>
            <p className="mt-1 text-sm text-ink-muted/80">
              © {new Date().getFullYear()} Nền tảng chia sẻ đề thi trực tuyến. Hành trang vững bước cho tương lai.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Trang chủ
            </Link>
            <Link href="/search" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Tìm kiếm
            </Link>
            <Link href="/favorites" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Yêu thích
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

