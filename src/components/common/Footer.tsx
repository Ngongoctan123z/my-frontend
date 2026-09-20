import { Link } from 'react-router-dom'
import { Heart, Code2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-12 w-full border-t border-line/40 bg-surface/30 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h3 className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-xl font-extrabold text-transparent">
              Kho Đề Thi
            </h3>
            <p className="mt-2 text-sm text-ink-muted/80">
              © {new Date().getFullYear()} Nền tảng chia sẻ đề thi trực tuyến.
              <br className="hidden md:block" /> Hành trang vững bước cho tương lai.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex gap-8 text-sm font-medium">
            <Link to="/" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Trang chủ
            </Link>
            <Link to="/search" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Tìm kiếm
            </Link>
            <Link to="/favorites" className="text-ink-muted transition-colors hover:text-[var(--color-primary)]">
              Yêu thích
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-line/60 to-transparent"></div>

        {/* The "Easter Egg" / Fun text */}
        <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-ink-muted/60 sm:flex-row sm:gap-1.5">
          <span className="flex items-center gap-1.5">
            Phát triển với <Heart size={12} className="text-red-500/70" /> bởi
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-muted/80">
            <Code2 size={14} className="text-[var(--color-accent)]/80" />
            <span className="italic">Đặc vụ "Cú Đêm" (Sinh viên CNTT năm cuối)</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
