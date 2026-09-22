import type { Exam } from '../../types/exam'
import { ExamCard } from './ExamCard'

function SkeletonCard() {
  return (
    <div className="bg-surface border-line overflow-hidden rounded-2xl border flex flex-row p-3 gap-4 items-center">
      <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 hidden sm:flex">
        <div className="skeleton h-10 w-28 rounded-xl" />
        <div className="skeleton h-10 w-10 rounded-xl" />
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
      <div className="grid grid-cols-1 gap-3">
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
    <div className="grid grid-cols-1 gap-3">
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
