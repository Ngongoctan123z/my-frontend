import React, { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle, Search } from 'lucide-react'

export function SeoTab() {
  const [configs, setConfigs] = useState({
    SEO_TITLE: '',
    SEO_DESCRIPTION: '',
    SEO_KEYWORDS: '',
    SEO_OG_IMAGE: '',
    SEO_ROBOTS: 'index, follow'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin?type=configs')
      .then(res => res.json())
      .then(data => {
        setConfigs({
          SEO_TITLE: data.SEO_TITLE || 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
          SEO_DESCRIPTION: data.SEO_DESCRIPTION || 'Kho đề thi vào 10, đề thi THPT Quốc Gia, luyện Writing IELTS, TOEIC và công cụ xử lý file PDF miễn phí.',
          SEO_KEYWORDS: data.SEO_KEYWORDS || 'đề thi, tài liệu, pdf, ielts, toeic',
          SEO_OG_IMAGE: data.SEO_OG_IMAGE || '',
          SEO_ROBOTS: data.SEO_ROBOTS || 'index, follow'
        })
        setLoading(false)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfigs({ ...configs, [e.target.name]: e.target.value })
  }

  const saveConfig = async () => {
    setSaving(true)
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_configs',
        payload: configs
      })
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shadow-inner">
          <Search size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quản Lý SEO Tổng Thể (Global SEO)</h2>
          <p className="text-sm text-gray-500 font-medium">Các thẻ Meta này sẽ được tự động gắn vào &lt;head&gt; của toàn bộ trang web để Google lập chỉ mục.</p>
        </div>
      </div>
      
      <div className="space-y-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <label className="block font-bold text-slate-700 mb-2">Meta Title (Tiêu đề chính)</label>
          <input 
            type="text"
            name="SEO_TITLE"
            value={configs.SEO_TITLE}
            onChange={handleChange}
            placeholder="Ví dụ: VNDocs - Kho tài liệu miễn phí"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800"
          />
          <p className="text-xs text-gray-500 mt-1.5 font-medium">Nên giữ dưới 60 ký tự để hiển thị tốt nhất trên Google.</p>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-2">Meta Description (Mô tả nội dung)</label>
          <textarea 
            name="SEO_DESCRIPTION"
            value={configs.SEO_DESCRIPTION}
            onChange={handleChange}
            rows={3}
            placeholder="Mô tả ngắn gọn về trang web..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800"
          />
          <p className="text-xs text-gray-500 mt-1.5 font-medium">Nên giữ dưới 160 ký tự. Đây là phần text hiển thị dưới tiêu đề khi tìm kiếm.</p>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-2">Meta Keywords (Từ khóa)</label>
          <input 
            type="text"
            name="SEO_KEYWORDS"
            value={configs.SEO_KEYWORDS}
            onChange={handleChange}
            placeholder="đề thi, tài liệu, ielts..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800"
          />
          <p className="text-xs text-gray-500 mt-1.5 font-medium">Phân cách bằng dấu phẩy.</p>
        </div>
        
        <div>
          <label className="block font-bold text-slate-700 mb-2">OpenGraph Image URL (Ảnh Thumbnail khi Share)</label>
          <input 
            type="text"
            name="SEO_OG_IMAGE"
            value={configs.SEO_OG_IMAGE}
            onChange={handleChange}
            placeholder="https://.../banner.png"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800"
          />
          <p className="text-xs text-gray-500 mt-1.5 font-medium">Ảnh này sẽ hiện lên khi bạn chia sẻ link web qua Facebook, Zalo, Telegram.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Lưu Cấu Hình SEO
        </button>
        {saved && (
          <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg animate-pulse">
            <CheckCircle className="w-5 h-5" /> Cập nhật thành công!
          </span>
        )}
      </div>
      
      {/* Preview Section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          👀 Google Search Preview (Mô phỏng xem trước)
        </h3>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl hover:shadow-md transition-shadow">
          <div className="text-sm text-slate-800 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">G</div>
            <div>
              <div className="font-medium text-sm leading-none">VNDocs</div>
              <div className="text-xs text-gray-500 mt-0.5">https://vndocs.net</div>
            </div>
          </div>
          <div className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer mb-1 truncate leading-tight">
            {configs.SEO_TITLE || 'Chưa có tiêu đề'}
          </div>
          <div className="text-[14px] text-[#4d5156] line-clamp-2 leading-snug">
            {configs.SEO_DESCRIPTION || 'Chưa có mô tả'}
          </div>
        </div>
      </div>
    </div>
  )
}
