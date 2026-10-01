import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { useNotify } from '../../context/NotificationContext'
import apiClient from '../../services/adminApi'
import { DOCUMENT_CATEGORIES, DOCUMENT_LEVELS } from '../../services/documentService'
import type { DocumentItem } from '../../services/documentService'

export function DocumentAdminTab() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list')
  const { notify } = useNotify()

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/documents')
      setDocuments(res.data.data)
    } catch (e) {
      notify('Lỗi tải danh sách tài liệu', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'list') {
      fetchDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return
    try {
      await apiClient.delete(`/admin/documents/${id}`)
      notify('Xóa thành công', 'success')
      fetchDocuments()
    } catch (e) {
      notify('Xóa thất bại', 'danger')
    }
  }

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`font-medium pb-2 ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-ink-muted'}`}
        >
          Danh sách tài liệu
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`font-medium pb-2 ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-ink-muted'}`}
        >
          Thêm tài liệu mới
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-line">
                <thead>
                  <tr className="bg-surface">
                    <th className="p-3 border border-line text-sm">ID</th>
                    <th className="p-3 border border-line text-sm">Tên</th>
                    <th className="p-3 border border-line text-sm">Tác giả</th>
                    <th className="p-3 border border-line text-sm">Môn/Cấp</th>
                    <th className="p-3 border border-line text-sm w-32 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="p-3 border border-line text-sm">{doc.id}</td>
                      <td className="p-3 border border-line text-sm font-medium">{doc.title}</td>
                      <td className="p-3 border border-line text-sm">{doc.author}</td>
                      <td className="p-3 border border-line text-sm">
                        {DOCUMENT_CATEGORIES[doc.category || ''] || doc.category} / {DOCUMENT_LEVELS[doc.level || ''] || doc.level}
                      </td>
                      <td className="p-3 border border-line text-sm text-center">
                        <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:underline">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <UploadDocumentForm onSuccess={() => setActiveTab('list')} />
      )}
    </div>
  )
}

function UploadDocumentForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const { notify } = useNotify()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await apiClient.post('/admin/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      notify('Tải lên thành công', 'success')
      onSuccess()
    } catch (error: any) {
      notify('Lỗi tải lên: ' + (error.response?.data?.message || error.message), 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-surface p-6 rounded-2xl border border-line">
      <div>
        <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
        <input name="title" required className="w-full border border-line rounded-xl px-3 py-2 bg-page" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tác giả / Nguồn</label>
        <input name="author" className="w-full border border-line rounded-xl px-3 py-2 bg-page" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mô tả</label>
        <textarea name="description" className="w-full border border-line rounded-xl px-3 py-2 bg-page" rows={3}></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Môn học</label>
          <select name="category" className="w-full border border-line rounded-xl px-3 py-2 bg-page">
            <option value="">-- Chọn --</option>
            {Object.entries(DOCUMENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cấp học</label>
          <select name="level" className="w-full border border-line rounded-xl px-3 py-2 bg-page">
            <option value="">-- Chọn --</option>
            {Object.entries(DOCUMENT_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">File Tài liệu (PDF/DOCX) *</label>
        <input type="file" name="file" required className="w-full border border-line rounded-xl px-3 py-2 bg-page" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ảnh bìa (Thumbnail)</label>
        <input type="file" name="thumbnailFile" accept="image/*" className="w-full border border-line rounded-xl px-3 py-2 bg-page" />
      </div>
      <div className="flex items-center gap-2 mt-4">
        <input type="checkbox" name="isFeatured" id="isFeatured" value="true" className="w-4 h-4" />
        <label htmlFor="isFeatured" className="text-sm">Đánh dấu nổi bật</label>
      </div>
      <Button type="submit" disabled={submitting} className="w-full mt-4">
        {submitting ? 'Đang tải lên...' : 'Đăng tài liệu'}
      </Button>
    </form>
  )
}
