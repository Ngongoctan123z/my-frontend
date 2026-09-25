import { Metadata } from 'next'
import { getExams } from '@/src/services/examService'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Đề Thi IELTS | VNDocs',
}

export default async function IeltsExamPage() {
  let exams: import('@/src/types/exam').Exam[] = []
  try {
    const res = await getExams({ examType: 'IELTS', limit: 12, page: 0 })
    exams = res.data
  } catch (e) {}

  return (
    <div className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
          <FileText className="text-blue-600" /> Tổng hợp Đề Thi IELTS
        </h2>
        <p className="text-ink-muted mt-1 text-sm">Các đề thi IELTS Academic & General mới nhất được cập nhật liên tục.</p>
      </div>

      {exams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(exam => (
            <Link key={exam.id} href={`/exams/${exam.id}`} className="block p-4 border border-line rounded-lg hover:border-blue-500 transition-colors">
              <h3 className="font-semibold text-ink line-clamp-2">{exam.title || `${exam.subject} ${exam.year}`}</h3>
              <p className="text-xs text-ink-muted mt-2">{exam.province || 'IELTS'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-ink-muted bg-page rounded-lg border border-dashed border-line">
          Chưa có đề thi IELTS nào trong hệ thống.
        </div>
      )}
    </div>
  )
}
