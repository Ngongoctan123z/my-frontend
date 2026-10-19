'use client'

import { useState } from 'react'
import Link from 'next/link'

import { useQuery } from '@tanstack/react-query'
import { Eye, Pencil, Trash2, Sparkles } from 'lucide-react'
import { apiFetch } from '../../services/api'
import { API_BASE } from '../../utils/constants'
import { ExamArchive2026Tab } from './ExamArchive2026Tab'
import { archivedExams2026 } from '../../lib/exams2026'
import type { Exam } from '../../types/exam'

interface ExamListAdminProps {
  onEdit: (exam: Exam) => void
}

interface ExamListResponse {
  data: Exam[];
  total: number;
  page: number;
  limit: number;
}

export default function ExamListAdmin(props: ExamListAdminProps) {
  const [source, setSource] = useState(archivedExams2026.length ? 'archive' : 'legacy')
  return <div className="min-w-0 space-y-4">
    <div aria-label="Kho đề trong danh sách đề" className="flex gap-2 overflow-x-auto pb-1"><button type="button" onClick={() => setSource('archive')} aria-pressed={source === 'archive'} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${source === 'archive' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600'}`}>Đề 2026 ({archivedExams2026.length})</button><button type="button" onClick={() => setSource('legacy')} aria-pressed={source === 'legacy'} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${source === 'legacy' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600'}`}>Đề tải lên trước đây</button></div>
    {source === 'archive' ? <ExamArchive2026Tab /> : <LegacyExamListAdmin {...props} />}
  </div>
}

function LegacyExamListAdmin({
  onEdit 
}: ExamListAdminProps) {
  const [page, setPage] = useState(0)
  const [limit] = useState(20)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useQuery<ExamListResponse>({
    queryKey: ['admin-exams', page, limit],
    queryFn: async () => {
      const token = (typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('adminToken')
      if (!token) {
        throw new Error('Token không tồn tại')
      }

      console.log('Fetching from:', `${API_BASE}/admin/exams?page=${page}&limit=${limit}`)

      const response = await fetch(`${API_BASE}/admin/exams?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Fetch response status:', response.status)

      if (!response.ok) {
        let errorMsg = 'Lỗi tải dữ liệu'
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorData.error || errorMsg
        } catch (e) {
          errorMsg = `Lỗi ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      const result = await response.json()
      console.log('Fetch success:', result)
      return result
    }
  })

  // Watch for external refresh trigger if we had one, but we can just expose refetch
  // Wait, onRefresh is actually a prop passed to trigger a refresh of this component?
  // Actually, Admin component changes a state `refreshTrigger` and we can useEffect on it.
  // We'll just pass refetch up if needed, or rely on query invalidation.

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đề thi này?')) {
      return
    }

    try {
      await apiFetch(`/admin/exams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('adminToken')}`
        }
      })
      
      alert('Xóa thành công')
      setPage(0)
      refetch()
    } catch (err) {
      alert('Lỗi xóa: ' + (err as Error).message)
    }
  }

  const handleGenerateSeo = async (id: number) => {
    if (generatingId) return
    
    setGeneratingId(id)
    try {
      await apiFetch(`/admin/exams/${id}/generate-seo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(typeof window !== 'undefined' ? localStorage.getItem.bind(localStorage) : () => null)('adminToken')}`
        }
      })
      alert('Tạo cấu trúc đề thi thành công!')
      refetch()
    } catch (err) {
      alert('Lỗi khi gọi AI: ' + (err as Error).message)
    } finally {
      setGeneratingId(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  if (error) {
    return <div className="text-color-danger py-8">Lỗi: {(error as Error).message}</div>
  }

  const exams = Array.isArray(data?.data) ? data.data : []
  const totalElements = data?.total || 0
  const totalPages = Math.ceil(totalElements / limit) || 1

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-line text-sm">
          <thead className="bg-page text-ink-muted">
            <tr>
              <th className="border border-line p-3 text-left">Môn</th>
              <th className="border border-line p-3 text-left">Tỉnh</th>
              <th className="border border-line p-3 text-center">Năm</th>
              <th className="border border-line p-3 text-center">Xem</th>
              <th className="border border-line p-3 text-center">Tải</th>
              <th className="border border-line p-3 text-center">Chính thức</th>
              <th className="border border-line p-3 text-center">Có ĐA</th>
              <th className="border border-line p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-page transition-colors">
                <td className="border border-line p-3">{exam.subject}</td>
                <td className="border border-line p-3">{exam.province}</td>
                <td className="border border-line p-3 text-center">{exam.year}</td>
                <td className="border border-line p-3 text-center">{exam.viewCount}</td>
                <td className="border border-line p-3 text-center">{exam.downloadCount}</td>
                <td className="border border-line p-3 text-center">
                  {exam.isOfficial ? '✓' : ''}
                </td>
                <td className="border border-line p-3 text-center">
                  {exam.hasAnswers ? '✓' : ''}
                </td>
                <td className="border border-line p-3">
                  <div className="flex gap-2 justify-center">
                    <Link prefetch={false} href={`/exams/${exam.id}`}
                      target="_blank"
                      className="text-emerald-600 hover:text-emerald-700 p-1 rounded"
                      title="Xem đề thi"
                    >
                      <Eye size={18} />
                    </Link>
                    <button
                      onClick={() => onEdit(exam)}
                      className="text-color-primary hover:text-blue-700 p-1 rounded"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-color-danger hover:text-red-700 p-1 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleGenerateSeo(exam.id)}
                      disabled={generatingId === exam.id}
                      className={`${generatingId === exam.id ? 'text-gray-400' : 'text-purple-600 hover:text-purple-800'} p-1 rounded font-bold text-xs flex items-center gap-1`}
                      title="AI tạo cấu trúc đề"
                    >
                      {generatingId === exam.id ? '...' : <><Sparkles size={16} /> AI</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-3 py-1 rounded border ${
                page === i
                  ? 'bg-primary text-white border-primary'
                  : 'bg-page border-line hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
