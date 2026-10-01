import React, { useState } from 'react'
import { apiFetch } from '@/src/utils/api'
import { Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react'

const AVAILABLE_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-pro'
]

export function AiConfigAdminTab() {
  const [model, setModel] = useState('gemini-1.5-flash')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string, data?: any } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      const response = await apiFetch(`/admin/ai/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Lỗi HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult({ type: 'success', message: 'Test thành công! Model đang hoạt động rất tốt.', data: data.result })
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Có lỗi xảy ra khi gọi AI' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-line p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <Sparkles className="text-purple-600" />
          Kiểm tra & Cấu hình Gemini AI
        </h2>
        <p className="text-sm text-ink-muted">
          Chọn một mô hình từ danh sách (Dropdown) và bấm Test để xem AI có kết nối thành công không. 
          Lưu ý: Hệ thống đã được lập trình để tự động xoay vòng qua tất cả các mô hình này nếu có lỗi khi đọc đề thi thực tế!
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chọn Model để Test (Dropdown):</label>
          <select 
            value={model} 
            onChange={e => setModel(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-line focus:ring-2 focus:ring-primary outline-none"
          >
            {AVAILABLE_MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleTest}
          disabled={testing}
          className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          {testing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Test kết nối API
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${result.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              {result.type === 'success' ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />}
              <span className={result.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </span>
            </div>
            {result.data && (
              <div className="mt-2 text-sm bg-white/50 p-3 rounded text-slate-700 font-mono">
                Kết quả trả về: {result.data}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
