import type { Exam } from '../../types/exam'
import { ExamCard } from './ExamCard'

function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-start ${compact ? 'gap-3 p-3' : 'gap-4 p-4'} border border-line rounded-xl bg-surface h-full`}>
      <div className={`skeleton shrink-0 ${compact ? 'w-[80px] h-[113px]' : 'w-[100px] h-[141px]'} rounded-lg bg-page`} />
      <div className="flex-1 space-y-3 pt-1 w-full">
        <div className="skeleton h-4 w-16 rounded-md bg-page mb-2" />
        <div className="skeleton h-5 md:h-6 w-full rounded-md bg-page" />
        <div className="skeleton h-5 md:h-6 w-3/4 rounded-md bg-page" />
        <div className="skeleton h-4 w-32 rounded-md bg-page mt-4" />
      </div>
    </div>
  )
}

export function ExamList({
  exams,
  highlightQuery,
  isLoading = false,
  skeletonCount = 6,
  compact = false,
}: {
  exams: Exam[]
  highlightQuery?: string
  isLoading?: boolean
  skeletonCount?: number
  compact?: boolean
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} compact={compact} />
        ))}
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-5xl">📭</span>
        <p className="text-xl font-semibold">Không tìm thấy đề phù hợp</p>
        <p className="text-ink-muted text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {exams.map((exam, index) => (
        <div key={exam.id} className="fade-in flex flex-col h-full" style={{ animationDelay: `${index * 50}ms` }}>
          <ExamCard
            exam={exam}
            compact={compact}
            highlight={Boolean(
              highlightQuery &&
                `${exam.subject} ${exam.province}`.toLowerCase().includes(highlightQuery.toLowerCase()),
            )}
          />
        </div>
      ))}
    </div>
  )
}
