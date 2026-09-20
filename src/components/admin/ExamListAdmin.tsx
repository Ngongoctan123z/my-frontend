import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '../../services/api'
import { API_BASE } from '../../utils/constants'
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

export default function ExamListAdmin({ 
  onEdit 
}: ExamListAdminProps) {
  const [page, setPage] = useState(0)
  const [limit] = useState(20)

  const { data, isLoading, error, refetch } = useQuery<ExamListResponse>({
    queryKey: ['admin-exams', page, limit],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken')
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
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      alert('Xóa thành công')
      setPage(0)
      refetch()
    } catch (err) {
      alert('Lỗi xóa: ' + (err as Error).message)
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
