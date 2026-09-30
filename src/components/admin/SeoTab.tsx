import React, { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle, Search, Globe, FileText, Layers, PenTool, LayoutTemplate, Map, X } from 'lucide-react'

const SEO_ROUTES = [
  { 
    path: 'GLOBAL', 
    name: 'SEO Toàn Trang (Mặc định)', 
    icon: Globe,
    defaultTitle: 'VNDocs - Kho tài liệu miễn phí',
    defaultDesc: 'Mô tả ngắn gọn về trang web...'
  },
  { 
    path: '/', 
    name: 'Trang Chủ', 
    icon: LayoutTemplate,
    defaultTitle: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
    defaultDesc: 'Nền tảng học tập trực tuyến cung cấp kho đề thi vào 10, đề thi THPT, luyện writing IELTS, TOEIC, cùng bộ công cụ xử lý file hoàn toàn miễn phí.'
  },
  { 
    path: '/tai-lieu', 
    name: 'Trang Tài Liệu & Đề Thi', 
    icon: FileText,
    defaultTitle: 'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
    defaultDesc: 'Tải miễn phí hàng ngàn tài liệu luyện thi, đề thi vào 10, đề thi THPT Quốc gia (Toán, Văn, Anh), PDF ôn thi IELTS, TOEIC cập nhật mới nhất có đáp án.'
  },
  { 
    path: '/ai-grader', 
    name: 'Trang Chấm Điểm AI', 
    icon: PenTool,
    defaultTitle: 'Luyện Writing IELTS Bằng AI & Chấm Điểm Chuẩn Band | VNDocs',
    defaultDesc: 'Trải nghiệm hệ thống luyện Writing IELTS bằng AI miễn phí tốt nhất. Chấm điểm chi tiết 4 tiêu chí (TR, CC, LR, GRA), sửa lỗi ngữ pháp, từ vựng và gợi ý nâng band điểm tự động.'
  },
  { 
    path: '/flashcard', 
    name: 'Trang Học Flashcard', 
    icon: Layers,
    defaultTitle: 'Học Từ Vựng Flashcard Thông Minh | VNDocs',
    defaultDesc: 'Bộ flashcard học từ vựng IELTS, TOEIC, tiếng Anh giao tiếp với thuật toán lặp lại ngắt quãng (Spaced Repetition).'
  },
  { 
    path: '/tools', 
    name: 'Trang Tiện Ích PDF & Casio', 
    icon: Layers,
    defaultTitle: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
    defaultDesc: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng, và máy tính khoa học ảo miễn phí 100%.'
  },
]

export function SeoTab() {
  const [activeRoute, setActiveRoute] = useState('GLOBAL')
  
  // Custom paths created by user
  const [customRoutes, setCustomRoutes] = useState<string[]>([])
  
  // Lưu state cho toàn bộ routes
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPathInput, setModalPathInput] = useState('')

  useEffect(() => {
    fetch('/api/admin?type=configs')
      .then(res => res.json())
      .then(data => {
        const loadedConfigs: Record<string, any> = {
          GLOBAL: {
            SEO_TITLE: data.SEO_TITLE || '',
            SEO_DESCRIPTION: data.SEO_DESCRIPTION || '',
            SEO_KEYWORDS: data.SEO_KEYWORDS || '',
            SEO_OG_IMAGE: data.SEO_OG_IMAGE || ''
          }
        }
        
        const extractedCustomRoutes: string[] = []

        // Parse ALL route configs
        Object.keys(data).forEach(key => {
          if (key.startsWith('SEO_ROUTE_')) {
            const path = key.replace('SEO_ROUTE_', '')
            try {
              const parsed = JSON.parse(data[key])
              loadedConfigs[path] = {
                SEO_TITLE: parsed.title || '',
                SEO_DESCRIPTION: parsed.description || '',
                SEO_KEYWORDS: parsed.keywords || '',
                SEO_OG_IMAGE: parsed.ogImage || ''
              }
              if (!SEO_ROUTES.some(r => r.path === path)) {
                extractedCustomRoutes.push(path)
              }
            } catch(e) {}
          }
        })
        
        // Ensure static routes exist in loadedConfigs
        SEO_ROUTES.filter(r => r.path !== 'GLOBAL').forEach(r => {
          if (!loadedConfigs[r.path]) {
            loadedConfigs[r.path] = { SEO_TITLE: '', SEO_DESCRIPTION: '', SEO_KEYWORDS: '', SEO_OG_IMAGE: '' }
          }
        })
        
        setCustomRoutes(extractedCustomRoutes)
        setConfigs(loadedConfigs)
        setLoading(false)
      })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfigs({
      ...configs,
      [activeRoute]: {
        ...configs[activeRoute],
        [e.target.name]: e.target.value
      }
    })
  }
  
  const openAddCustomRouteModal = () => {
    setModalPathInput('')
    setIsModalOpen(true)
  }

  const handleConfirmCustomRoute = () => {
    let path = modalPathInput.trim()
    if (!path) return
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    
    if (SEO_ROUTES.some(r => r.path === path) || customRoutes.includes(path)) {
      alert('Đường dẫn này đã tồn tại trong danh sách!')
      return
    }
    
    setCustomRoutes([...customRoutes, path])
    setConfigs({
      ...configs,
      [path]: { SEO_TITLE: '', SEO_DESCRIPTION: '', SEO_KEYWORDS: '', SEO_OG_IMAGE: '' }
    })
    setActiveRoute(path)
    setIsModalOpen(false)
  }

  const saveConfig = async () => {
    setSaving(true)
    
    // Đóng gói payload
    const payload: Record<string, string> = {
      SEO_TITLE: configs.GLOBAL.SEO_TITLE,
      SEO_DESCRIPTION: configs.GLOBAL.SEO_DESCRIPTION,
      SEO_KEYWORDS: configs.GLOBAL.SEO_KEYWORDS,
      SEO_OG_IMAGE: configs.GLOBAL.SEO_OG_IMAGE,
    }

    const allPaths = [...SEO_ROUTES.map(r => r.path).filter(p => p !== 'GLOBAL'), ...customRoutes]

    allPaths.forEach(path => {
      const rConf = configs[path]
      if (rConf && (rConf.SEO_TITLE || rConf.SEO_DESCRIPTION || rConf.SEO_KEYWORDS || rConf.SEO_OG_IMAGE)) {
        payload[`SEO_ROUTE_${path}`] = JSON.stringify({
          title: rConf.SEO_TITLE,
          description: rConf.SEO_DESCRIPTION,
          keywords: rConf.SEO_KEYWORDS,
          ogImage: rConf.SEO_OG_IMAGE
        })
      } else {
        payload[`SEO_ROUTE_${path}`] = '' // Xóa nếu rỗng
      }
    })

    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_configs', payload })
    })
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>

  const currentConf = configs[activeRoute] || {}

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar chọn trang */}
      <div className="lg:w-64 flex-shrink-0 border-r border-gray-100 pr-4">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Map size={18} className="text-emerald-600" /> Chọn Trang SEO
        </h3>
        <div className="flex flex-col gap-1.5 mb-6">
          {SEO_ROUTES.map(route => (
            <button
              key={route.path}
              onClick={() => setActiveRoute(route.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeRoute === route.path ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
            >
              <route.icon size={16} />
              {route.name}
            </button>
          ))}
          
          {customRoutes.length > 0 && (
            <>
              <div className="h-px bg-gray-200 my-2"></div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Đường dẫn tùy chỉnh</p>
              {customRoutes.map(path => (
                <button
                  key={path}
                  onClick={() => setActiveRoute(path)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all truncate ${activeRoute === path ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                  title={path}
                >
                  <FileText size={16} className="flex-shrink-0" />
                  <span className="truncate">{path}</span>
                </button>
              ))}
            </>
          )}
        </div>
        
        <button 
          onClick={openAddCustomRouteModal}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-sm rounded-lg border border-dashed border-gray-300 transition-colors"
        >
          + Thêm link tùy chỉnh
        </button>
      </div>

      {/* Vùng chỉnh sửa */}
      <div className="flex-1 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shadow-inner flex-shrink-0">
            <Search size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              {activeRoute === 'GLOBAL' ? 'Cấu hình SEO Toàn Trang' : `Cấu hình SEO: ${SEO_ROUTES.find(r => r.path === activeRoute)?.name}`}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {activeRoute === 'GLOBAL' 
                ? 'Được dùng làm thẻ Meta mặc định cho mọi trang chưa được cấu hình riêng.' 
                : `Thẻ Meta riêng biệt chỉ hiển thị trên đường dẫn ${activeRoute}. Ghi đè cấu hình toàn trang.`}
            </p>
          </div>
        </div>
        
        <div className="space-y-5 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Meta Title (Tiêu đề chính)</label>
            <input 
              type="text"
              name="SEO_TITLE"
              value={currentConf.SEO_TITLE || ''}
              onChange={handleChange}
              placeholder={activeRoute === 'GLOBAL' 
                ? 'VNDocs - Kho tài liệu miễn phí' 
                : (SEO_ROUTES.find(r => r.path === activeRoute)?.defaultTitle || 'Để trống sẽ lấy theo SEO Toàn Trang')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">Meta Description (Mô tả nội dung)</label>
            <textarea 
              name="SEO_DESCRIPTION"
              value={currentConf.SEO_DESCRIPTION || ''}
              onChange={handleChange}
              rows={3}
              placeholder={activeRoute === 'GLOBAL' 
                ? 'Mô tả ngắn gọn về trang web...' 
                : (SEO_ROUTES.find(r => r.path === activeRoute)?.defaultDesc || 'Để trống sẽ lấy theo SEO Toàn Trang')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">Meta Keywords (Từ khóa)</label>
            <input 
              type="text"
              name="SEO_KEYWORDS"
              value={currentConf.SEO_KEYWORDS || ''}
              onChange={handleChange}
              placeholder="đề thi, tài liệu, ielts..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
            />
          </div>
          
          <div>
            <label className="block font-bold text-slate-700 mb-2">OpenGraph Image URL (Ảnh Thumbnail)</label>
            <input 
              type="text"
              name="SEO_OG_IMAGE"
              value={currentConf.SEO_OG_IMAGE || ''}
              onChange={handleChange}
              placeholder="https://.../banner.png"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            Lưu Toàn Bộ Cấu Hình SEO
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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-xl hover:shadow-md transition-shadow">
            <div className="text-sm text-slate-800 mb-2 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">G</div>
              <div>
                <div className="font-medium text-sm leading-none">VNDocs</div>
                <div className="text-xs text-gray-500 mt-0.5">https://vndocs.net{activeRoute !== 'GLOBAL' ? activeRoute : ''}</div>
              </div>
            </div>
            <div className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer mb-1 truncate leading-tight">
              {currentConf.SEO_TITLE || (activeRoute !== 'GLOBAL' ? configs.GLOBAL?.SEO_TITLE : '') || 'Chưa có tiêu đề'}
            </div>
            <div className="text-[14px] text-[#4d5156] line-clamp-2 leading-snug">
              {currentConf.SEO_DESCRIPTION || (activeRoute !== 'GLOBAL' ? configs.GLOBAL?.SEO_DESCRIPTION : '') || 'Chưa có mô tả'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Thêm Modal Tùy Chỉnh Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Thêm Đường Dẫn Tùy Chỉnh</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nhập đường link bạn muốn cấu hình SEO:
              </label>
              <input 
                type="text"
                autoFocus
                placeholder="VD: /exams/de-thi-toan-10-ha-noi-2023"
                value={modalPathInput}
                onChange={(e) => setModalPathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCustomRoute()}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-slate-800 font-medium"
              />
              <p className="text-xs text-gray-500 mt-3 flex gap-2">
                <span className="text-amber-500 font-bold">Lưu ý:</span> 
                Chỉ nhập phần đuôi sau tên miền. Ví dụ nếu link là 
                https://vndocs.net/bai-viet-1 thì bạn chỉ nhập /bai-viet-1
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmCustomRoute}
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
              >
                Thêm Đường Dẫn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
