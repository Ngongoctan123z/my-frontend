import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../search/SearchBar'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-line bg-surface/90 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4 md:gap-8 md:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-3 font-bold">
          <img src="/logo.jpg" alt="Kho Đề Thi Logo" className="h-10 w-10 rounded-[10px] object-cover shadow-sm" />
          <span className="hidden sm:inline">Kho Đề Thi</span>
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>
        <Link
          to="/favorites"
          className="border-line bg-page inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border"
          aria-label="Đề yêu thích"
        >
          <Star size={18} />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
