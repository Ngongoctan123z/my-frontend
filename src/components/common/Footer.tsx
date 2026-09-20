import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-line mt-12 border-t">
      <div className="text-ink-muted mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Kho Đề Thi Online</p>
        <div className="flex gap-4">
          <Link to="/search">Tìm kiếm</Link>
          <Link to="/favorites">Yêu thích</Link>
        </div>
      </div>
    </footer>
  )
}
