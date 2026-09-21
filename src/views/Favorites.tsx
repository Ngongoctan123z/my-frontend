'use client'

import { Heart, Search } from 'lucide-react'
import Link from 'next/link'

import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { ExamList } from '../components/exam/ExamList'
import { useUser } from '../context/UserContext'
import { getExamsByIds } from '../services/examService'
import { useSeo } from '../utils/seo'

export function Favorites() {
  const { favorites } = useUser()
  useSeo('Đề yêu thích | Kho Đề Thi Online', 'Danh sách đề thi bạn đã đánh dấu yêu thích.')

  const exams = useQuery({
    queryKey: ['favorites', favorites],
    queryFn: () => getExamsByIds(favorites),
    enabled: favorites.length > 0,
  })

  return (
    <div className="space-y-8 py-12 md:py-16">
      <Breadcrumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Yêu thích' }]} />

      <div className="flex items-center gap-3">
        <Heart size={28} className="text-[var(--color-danger)]" fill="currentColor" />
        <h1 className="text-3xl font-bold">Đề yêu thích</h1>
        {favorites.length > 0 && (
          <span className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-full px-3 py-0.5 text-sm font-semibold">
            {favorites.length}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        /* Empty state */
        <div className="fade-in flex flex-col items-center gap-5 py-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
            <Heart size={40} className="text-ink-muted opacity-40" />
          </div>
          <div>
            <p className="text-xl font-semibold">Chưa có đề yêu thích</p>
            <p className="text-ink-muted mt-2 max-w-sm text-sm">
              Nhấn biểu tượng ⭐ trên thẻ đề thi để thêm vào danh sách yêu thích của bạn.
            </p>
          </div>
          <Link href="/search"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Search size={16} />
            Tìm đề thi
          </Link>
        </div>
      ) : (
        <ExamList
          exams={exams.data ?? []}
          isLoading={exams.isLoading}
          skeletonCount={favorites.length}
        />
      )}
    </div>
  )
}
