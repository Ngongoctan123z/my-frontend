import { RotateCcw } from 'lucide-react'
import type { ExamType } from '../../types/exam'
import { PROVINCES, SUBJECTS, YEARS } from '../../utils/constants'

type FilterState = {
  examType: ExamType | ''
  subject: string
  province: string
  year: string
  sort?: 'recent' | 'popular' | 'name'
}

type Props = FilterState & {
  onChange: (next: FilterState) => void
  onReset?: () => void
}

export function ExamFilter({ examType, subject, province, year, sort = 'recent', onChange, onReset }: Props) {
  const update = (patch: Partial<FilterState>) => {
    onChange({
      examType: patch.examType !== undefined ? patch.examType : examType,
      subject: patch.subject !== undefined ? patch.subject : subject,
      province: patch.province !== undefined ? patch.province : province,
      year: patch.year !== undefined ? patch.year : year,
      sort: patch.sort !== undefined ? patch.sort : sort,
    })
  }

  const hasFilters = Boolean(examType || subject || province || year || sort !== 'recent')

  return (
    <aside className="bg-surface border-line space-y-5 rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Bộ lọc tìm kiếm</h2>
        {hasFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw size={12} />
            Đặt lại
          </button>
        )}
      </div>

      <div className="space-y-4">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1.5 block font-medium">Kỳ thi</span>
          <select
            className="border-line bg-page text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={examType}
            onChange={(event) => update({ examType: event.target.value as ExamType | '' })}
          >
            <option value="">Tất cả kỳ thi</option>
            <option value="VAO_10">Tuyển sinh Vào 10</option>
            <option value="THPT">Tốt nghiệp THPT</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted mb-1.5 block font-medium">Môn thi</span>
          <select
            className="border-line bg-page text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={subject}
            onChange={(event) => update({ subject: event.target.value })}
          >
            <option value="">Tất cả các môn</option>
            {SUBJECTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted mb-1.5 block font-medium">Tỉnh / Thành phố</span>
          <select
            className="border-line bg-page text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={province}
            onChange={(event) => update({ province: event.target.value })}
          >
            <option value="">Tất cả tỉnh thành ({PROVINCES.length})</option>
            {PROVINCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted mb-1.5 block font-medium">Năm ra đề</span>
          <select
            className="border-line bg-page text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={year}
            onChange={(event) => update({ year: event.target.value })}
          >
            <option value="">Tất cả các năm ({YEARS[YEARS.length - 1]} – {YEARS[0]})</option>
            {YEARS.map((y) => (
              <option key={y} value={String(y)}>
                Năm {y}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-muted mb-1.5 block font-medium">Sắp xếp theo</span>
          <select
            className="border-line bg-page text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            value={sort}
            onChange={(event) => update({ sort: event.target.value as 'recent' | 'popular' | 'name' })}
          >
            <option value="recent">Mới cập nhật</option>
            <option value="popular">Xem nhiều nhất</option>
            <option value="name">Tên môn học</option>
          </select>
        </label>
      </div>
    </aside>
  )
}
