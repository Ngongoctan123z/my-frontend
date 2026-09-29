import React, { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'

export function PromptsTab() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [type, setType] = useState('IELTS_TASK_2')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const loadPrompts = () => {
    fetch('/api/admin?type=prompts')
      .then(res => res.json())
      .then(data => {
        setPrompts(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 800 * 1024) {
      alert('Vui lòng chọn ảnh có kích thước dưới 800KB để tiết kiệm dung lượng cơ sở dữ liệu.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAdd = async () => {
    if (!content.trim()) return
    setAdding(true)
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_prompt',
        payload: { type, content, imageUrl }
      })
    })
    setContent('')
    setImageUrl('')
    setAdding(false)
    loadPrompts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá đề này?')) return
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_prompt',
        payload: { id }
      })
    })
    loadPrompts()
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Quản Lý Đề Writing (Thực Tế)</h2>
      
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="font-bold mb-4">Thêm đề mới</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Loại đề</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full md:w-64 p-2 border border-gray-300 rounded outline-none focus:border-blue-500 bg-white text-sm"
            >
              <option value="IELTS_TASK_1">IELTS Task 1</option>
              <option value="IELTS_TASK_2">IELTS Task 2</option>
              <option value="TOEIC_RESPOND">TOEIC Writing Q6-7</option>
              <option value="TOEIC_ESSAY">TOEIC Writing Q8</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Nội dung đề (Tiếng Anh)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung đề thi..."
              className="w-full h-24 p-3 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm resize-none"
            />
          </div>

          {['IELTS_TASK_1', 'TOEIC_RESPOND'].includes(type) && (
            <div>
              <label className="block text-sm font-medium mb-1">Ảnh đính kèm (URL hoặc File - Tùy chọn)</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/chart.png hoặc chọn file bên dưới..."
                  className="w-full p-2 border border-gray-300 rounded outline-none focus:border-blue-500 text-sm"
                />
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border border-gray-200 w-fit">
                  <span className="text-sm text-gray-700 font-medium">Tải ảnh từ máy tính (Tối đa 800KB):</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Ảnh xem trước:</p>
                    <img src={imageUrl} alt="Preview" className="h-40 object-contain border border-gray-300 rounded bg-white shadow-sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={adding || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Thêm đề
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-4">Danh sách đề đã lưu ({prompts.length})</h3>
        <div className="space-y-4">
          {prompts.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between gap-4">
              <div className="flex-1">
                <span className={`inline-block px-2 py-1 text-xs font-bold rounded mb-2 ${p.type === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {p.type.replace('_', ' ')}
                </span>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{p.content}</p>
                {p.imageUrl && (
                  <a href={p.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline block mt-2">
                    Xem ảnh đính kèm
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded shrink-0 h-fit"
                title="Xoá đề"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {prompts.length === 0 && <p className="text-gray-500 text-center py-4">Chưa có đề nào.</p>}
        </div>
      </div>
    </div>
  )
}
