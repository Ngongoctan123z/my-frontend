import React, { useState } from 'react'
import { X } from 'lucide-react'
import { apiFetch } from '../../services/api'
import type { Exam } from '../../types/exam'
import { Button } from '../ui/Button'

interface EditExamModalProps {
  exam: Exam
  onClose: () => void
  onSuccess: () => void
}

export default function EditExamModal({
  exam,
  onClose,
  onSuccess
}: EditExamModalProps) {
  const [formData, setFormData] = useState({
    examType: exam.examType,
    subject: exam.subject,
    province: exam.province,
    year: exam.year,
    title: exam.title || '',
    schoolName: exam.schoolName || '',
    isOfficial: exam.isOfficial,
    hasAnswers: exam.hasAnswers,
    note: exam.description || ''
  })

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await apiFetch(`/admin/exams/${exam.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (thumbnailFile) {
        const thumbForm = new FormData()
        thumbForm.append('thumbnailFile', thumbnailFile)
        await apiFetch(`/admin/exams/${exam.id}/thumbnail`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: thumbForm
        })
      }

      alert('Cập nhật thành công')
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-page rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line sticky top-0 bg-page z-10">
          <h2 className="text-xl font-bold">Chỉnh sửa đề thi</h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Exam Type */}
          <div>
            <label className="block text-sm font-bold mb-2">Loại kỳ thi</label>
            <select
              name="examType"
              value={formData.examType}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
            >
              <option value="VAO_10">Vào 10</option>
              <option value="THPT">THPT</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-bold mb-2">Môn học</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-bold mb-2">Tỉnh/Thành phố</label>
            <input
              type="text"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-bold mb-2">Năm</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
              min="2000"
              max={new Date().getFullYear()}
            />
          </div>

          {/* School Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Tên trường/Trung tâm</label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-2">Tiêu đề đề thi</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Đề thi thử trường KHTN - Lần 1"
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
            />
            <p className="text-xs text-ink-muted mt-1">Bỏ trống hệ thống sẽ tự động tạo tên chuẩn.</p>
          </div>

          {/* Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-line py-4">
            <div>
              <label className="block text-sm font-bold mb-2">Tính chất đề thi</label>
              <div className="flex flex-col gap-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isOfficial"
                    checked={formData.isOfficial === true}
                    onChange={() => setFormData(prev => ({ ...prev, isOfficial: true }))}
                    className="border-line"
                  />
                  <span className="text-sm">Đề chính thức</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isOfficial"
                    checked={formData.isOfficial === false}
                    onChange={() => setFormData(prev => ({ ...prev, isOfficial: false }))}
                    className="border-line"
                  />
                  <span className="text-sm">Đề thi thử</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Tùy chọn khác</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  name="hasAnswers"
                  checked={formData.hasAnswers}
                  onChange={handleChange}
                  className="rounded border-line"
                />
                <span className="text-sm">Đề thi có đáp án</span>
              </label>
            </div>
          </div>

          {/* Thumbnail File */}
          <div>
            <label className="block text-sm font-bold mb-2">Cập nhật ảnh bìa mới (Tùy chọn)</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="w-full border border-line bg-page rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-xs text-ink-muted mt-1">Bỏ trống nếu không muốn thay đổi ảnh bìa hiện tại.</p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold mb-2">Ghi chú</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full border border-line bg-page rounded-xl px-3 py-2"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface text-ink py-2 rounded-xl border border-line font-medium hover:bg-line transition"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
