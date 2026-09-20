import type { Exam } from '../../types/exam'
import { ExamCard } from './ExamCard'

function SkeletonCard() {
  return (
    <div className="bg-surface border-line overflow-hidden rounded-2xl border">
      <div className="skeleton h-28 rounded-none" />
      <div className="space-y-2 p-4">
        <div className="space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ExamList({
  exams,
  highlightQuery,
  isLoading = false,
  skeletonCount = 6,
}: {
  exams: Exam[]
  highlightQuery?: string
  isLoading?: boolean
  skeletonCount?: number
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {exams.map((exam, index) => (
        <div key={exam.id} className="fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <ExamCard
            exam={exam}
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
