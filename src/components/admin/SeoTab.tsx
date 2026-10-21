import { PAGE_SEO, upgradeSavedPageSeo } from '@/src/lib/pageSeo'
import { isRetiredPath, hasRetiredSeo, SITE_TITLE, SITE_DESCRIPTION } from '@/src/lib/siteSections'
import React, { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle, Search, Globe, FileText, Layers, PenTool, LayoutTemplate, Map, X } from 'lucide-react'

const SEO_ROUTES = [
  { path: '/speaking', name: 'Luyện Speaking IELTS & TOEIC', category: 'Luyện Speaking', icon: PenTool, defaultTitle: 'Luyện IELTS & TOEIC Speaking Online | VNDocs', defaultDesc: 'Ghi âm, nghe lại, xem bản chép lời và nhận góp ý cho bài nói IELTS, TOEIC.' },
  // 1. Cơ bản & Hệ thống
  { 
    path: 'GLOBAL', 
    name: 'SEO tiếng Việt (Mặc định)', 
    category: 'Cơ bản & Hệ thống',
    icon: Globe,
    defaultTitle: SITE_TITLE,
    defaultDesc: SITE_DESCRIPTION
  },
  { 
    path: '/', 
    name: 'Trang Chủ', 
    category: 'Cơ bản & Hệ thống',
    icon: LayoutTemplate,
    defaultTitle: SITE_TITLE,
    defaultDesc: SITE_DESCRIPTION
  },
  { 
    path: '/premium', 
    name: 'Nâng Cấp Premium', 
    category: 'Cơ bản & Hệ thống',
    icon: Layers,
    defaultTitle: 'Nâng cấp Premium — Chấm bài Writing không giới hạn | VNDocs',
    defaultDesc: 'Nâng cấp VNDocs Premium để chấm bài IELTS, TOEIC, TOPIK, HSK không giới hạn, phân tích chi tiết tiêu chí và công cụ học tập cao cấp.'
  },

  // 2. Luyện Writing Online
  { 
    path: '/ai-grader', 
    name: 'Luyện Writing (Tổng quan)', 
    category: 'Luyện Writing Online',
    icon: PenTool,
    defaultTitle: 'Phòng Luyện Writing Online Chuẩn Barem Quốc Tế | VNDocs',
    defaultDesc: 'Nền tảng luyện viết trực tuyến cho IELTS, TOEIC, TOPIK và HSK. Đánh giá chi tiết theo tiêu chí chính thức, chỉ ra lỗi ngữ pháp và lưu lịch sử bài viết.',
    defaultH1: 'Trung Tâm Luyện Viết & Chấm Điểm Writing Online'
  },
  { 
    path: '/ai-grader/ielts', 
    name: 'Writing IELTS (Task 1 & 2)', 
    category: 'Luyện Writing Online',
    icon: PenTool,
    defaultTitle: 'Luyện Viết IELTS Writing Online Chuẩn Barem | VNDocs',
    defaultDesc: 'Phòng luyện IELTS Writing Task 1 & 2 trực tuyến. Đánh giá chi tiết 4 tiêu chí chuẩn giám khảo, phát hiện lỗi ngữ pháp, từ vựng và lưu bài làm an toàn.',
    defaultH1: 'Phòng Luyện IELTS Writing Online'
  },
  { 
    path: '/ai-grader/toeic', 
    name: 'Writing TOEIC', 
    category: 'Luyện Writing Online',
    icon: PenTool,
    defaultTitle: 'Luyện Viết TOEIC Writing Online Chuẩn ETS | VNDocs',
    defaultDesc: 'Thực hành TOEIC Writing dạng phản hồi email và viết luận quan điểm. Chấm điểm chi tiết, gợi ý từ vựng công sở và sửa lỗi ngữ pháp chuẩn cấu trúc ETS.',
    defaultH1: 'Luyện Thi TOEIC Writing Online Chuẩn ETS'
  },
  { 
    path: '/ai-grader/topik', 
    name: 'Writing TOPIK II (Câu 51-54)', 
    category: 'Luyện Writing Online',
    icon: PenTool,
    defaultTitle: 'Luyện Viết TOPIK II 쓰기 (Câu 51-54) Online | VNDocs',
    defaultDesc: 'Luyện thi phần viết TOPIK II câu 51, 52, 53, 54. Nhận xét ngữ pháp, chính tả tiếng Hàn, gợi ý từ vựng nâng cao và tham khảo bài viết mẫu điểm cao.',
    defaultH1: 'Luyện Viết TOPIK II 쓰기 Trực Tuyến'
  },
  { 
    path: '/ai-grader/hsk', 
    name: 'Writing HSK (HSK 5 & 6)', 
    category: 'Luyện Writing Online',
    icon: PenTool,
    defaultTitle: 'Luyện Viết Tiếng Trung HSK 5 & HSK 6 Online | VNDocs',
    defaultDesc: 'Luyện viết phần thi HSK 5 đoạn văn 80 chữ và HSK 6 tóm tắt 400 chữ. Rà soát ngữ pháp, lỗi dùng từ và gợi ý diễn đạt tự nhiên chuẩn bản xứ.',
    defaultH1: 'Phòng Luyện HSK Writing Online'
  },

  // 3. Công Cụ & Tiện Ích

  // 4. Quốc Tế & Tiếng Anh (/en)
  { 
    path: '/en', 
    name: 'EN: Homepage', 
    category: 'English Pages (/en)',
    icon: Globe,
    defaultTitle: 'VNDocs — Writing and Speaking Practice',
    defaultDesc: 'Practice Writing and Speaking with detailed feedback, recordings, transcripts and learning history.'
  },
  { 
    path: '/en/ai-grader', 
    name: 'EN: Writing Grader Hub', 
    category: 'English Pages (/en)',
    icon: PenTool,
    defaultTitle: 'Writing Grader & Practice Hub — IELTS, TOEIC, TOPIK, HSK | VNDocs',
    defaultDesc: 'Free online writing practice platform for IELTS, TOEIC, TOPIK, and HSK. Receive rubric feedback, grammar corrections, and keep your history private.',
    defaultH1: 'Writing Grader & Practice Hub'
  },
  { 
    path: '/en/ai-grader/ielts', 
    name: 'EN: IELTS Writing Practice', 
    category: 'English Pages (/en)',
    icon: PenTool,
    defaultTitle: 'IELTS Writing Practice & Rubric Scoring | VNDocs',
    defaultDesc: 'Practice IELTS Writing Academic & General online with instant scoring across 4 official criteria: TR, CC, LR, and GRA with comprehensive feedback.',
    defaultH1: 'IELTS Writing Practice & Instant Scoring'
  },
  { 
    path: '/en/ai-grader/toeic', 
    name: 'EN: TOEIC Writing Practice', 
    category: 'English Pages (/en)',
    icon: PenTool,
    defaultTitle: 'TOEIC Writing Practice & Evaluation Online | VNDocs',
    defaultDesc: 'Practice TOEIC Writing (Email responses & Opinion essays) online with rubric evaluation. Detect grammar errors and score high-level business vocabulary.',
    defaultH1: 'TOEIC Writing Online Practice'
  },
  { 
    path: '/en/ai-grader/topik', 
    name: 'EN: TOPIK II Writing Practice', 
    category: 'English Pages (/en)',
    icon: PenTool,
    defaultTitle: 'TOPIK II Writing Practice & Correction (Questions 51-54) | VNDocs',
    defaultDesc: 'Practice TOPIK II 쓰기 (Questions 51, 52, 53, 54) online. Automated scoring, Korean grammar corrections, spelling feedback, and advanced expressions.',
    defaultH1: 'TOPIK II Writing Practice (쓰기)'
  },
  { 
    path: '/en/ai-grader/hsk', 
    name: 'EN: HSK Writing Practice', 
    category: 'English Pages (/en)',
    icon: PenTool,
    defaultTitle: 'HSK 5 & HSK 6 Writing Practice & Essay Scoring | VNDocs',
    defaultDesc: 'Practice HSK 5 (80 chars) & HSK 6 (400 chars) Writing online. Automatic scoring, Chinese grammar correction, and vocabulary suggestions based on HSK standards.',
    defaultH1: 'HSK Online Writing Practice'
  },
  { 
    path: '/en/premium', 
    name: 'EN: Premium Upgrade', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'VNDocs Premium — Unlimited Essay Grading & Advanced Features | VNDocs',
    defaultDesc: 'Upgrade to VNDocs Premium for unlimited essay submissions, comprehensive band score analytics, priority processing, and ad-free educational tools.'
  },
  { 
    path: '/en/profile', 
    name: 'EN: Account & Profile', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Personal Profile & Submission History | VNDocs',
    defaultDesc: 'Manage your profile, view saved essays, track writing test scores over time, and manage subscription settings.'
  },
].map(route => {
  const copy = PAGE_SEO[route.path === 'GLOBAL' ? '/' : route.path]
  return copy ? { ...route, defaultTitle: copy.title, defaultDesc: copy.description, defaultH1: copy.h1 } : route
})

export function SeoTab() {
  const [activeRoute, setActiveRoute] = useState('GLOBAL')
  
  // Custom paths created by user
  const [customRoutes, setCustomRoutes] = useState<string[]>([])
  const [retiredConfigKeys, setRetiredConfigKeys] = useState<string[]>([])
  
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
        const obsoleteGlobal = hasRetiredSeo(data.SEO_TITLE) || hasRetiredSeo(data.SEO_DESCRIPTION)
        setRetiredConfigKeys(Object.keys(data).filter(key => key.startsWith('SEO_ROUTE_') && isRetiredPath(key.slice(10))))
        const loadedConfigs: Record<string, any> = {
          GLOBAL: {
            SEO_TITLE: obsoleteGlobal ? '' : data.SEO_TITLE || '',
            SEO_DESCRIPTION: obsoleteGlobal ? '' : data.SEO_DESCRIPTION || '',
            SEO_OG_IMAGE: obsoleteGlobal ? '' : data.SEO_OG_IMAGE || ''
          }
        }
        
        const extractedCustomRoutes: string[] = []

        // Parse ALL route configs
        Object.keys(data).forEach(key => {
          if (key.startsWith('SEO_ROUTE_')) {
            const path = key.replace('SEO_ROUTE_', '')
            if (isRetiredPath(path)) return
            try {
              let parsed = upgradeSavedPageSeo(path, JSON.parse(data[key]))
              if (hasRetiredSeo(parsed.title) || hasRetiredSeo(parsed.description) || hasRetiredSeo(parsed.h1)) parsed = {}
              loadedConfigs[path] = {
                SEO_TITLE: parsed.title || '',
                SEO_DESCRIPTION: parsed.description || '',
                SEO_OG_IMAGE: parsed.ogImage || '',
                SEO_H1: parsed.h1 || ''
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
            loadedConfigs[r.path] = { SEO_TITLE: '', SEO_DESCRIPTION: '', SEO_OG_IMAGE: '', SEO_H1: '' }
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
    
    if (isRetiredPath(path)) { alert('Mục này đã được gỡ và không còn nhận cấu hình SEO.'); return }
    if (SEO_ROUTES.some(r => r.path === path) || customRoutes.includes(path)) {
      alert('Đường dẫn này đã tồn tại trong danh sách!')
      return
    }
    
    setCustomRoutes([...customRoutes, path])
    setConfigs({
      ...configs,
      [path]: { SEO_TITLE: '', SEO_DESCRIPTION: '', SEO_OG_IMAGE: '' }
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
      SEO_OG_IMAGE: configs.GLOBAL.SEO_OG_IMAGE,
    }

    for (const key of retiredConfigKeys) payload[key] = ''
    const allPaths = [...SEO_ROUTES.map(r => r.path).filter(p => p !== 'GLOBAL'), ...customRoutes]

    allPaths.forEach(path => {
      const rConf = configs[path]
      if (rConf && (rConf.SEO_TITLE || rConf.SEO_DESCRIPTION || rConf.SEO_OG_IMAGE || rConf.SEO_H1)) {
        payload[`SEO_ROUTE_${path}`] = JSON.stringify({
          title: rConf.SEO_TITLE || '',
          description: rConf.SEO_DESCRIPTION || '',
          ogImage: rConf.SEO_OG_IMAGE || '',
          h1: rConf.SEO_H1 || ''
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
  const defaults = SEO_ROUTES.find(route => route.path === activeRoute)
  const globalTitle = activeRoute === '/' ? configs.GLOBAL?.SEO_TITLE : ''
  const globalDescription = activeRoute === '/' ? configs.GLOBAL?.SEO_DESCRIPTION : ''

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar chọn trang */}
      <div className="lg:w-64 flex-shrink-0 border-r border-gray-100 pr-4">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Map size={18} className="text-emerald-600" /> Chọn Trang SEO
        </h3>
        <div className="flex flex-col gap-3 mb-6 max-h-[650px] overflow-y-auto pr-1">
          {Array.from(new Set(SEO_ROUTES.map(r => r.category || 'Mặc định'))).map(cat => (
            <div key={cat} className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">{cat}</p>
              {SEO_ROUTES.filter(r => (r.category || 'Mặc định') === cat).map(route => (
                <button
                  key={route.path}
                  onClick={() => setActiveRoute(route.path)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeRoute === route.path 
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <route.icon size={14} className="flex-shrink-0" />
                  <span className="truncate">{route.name}</span>
                </button>
              ))}
            </div>
          ))}
          
          {customRoutes.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-200">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">Đường dẫn tùy chỉnh</p>
              {customRoutes.map(path => (
                <button
                  key={path}
                  onClick={() => setActiveRoute(path)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all truncate ${
                    activeRoute === path 
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                  title={path}
                >
                  <FileText size={14} className="flex-shrink-0" />
                  <span className="truncate">{path}</span>
                </button>
              ))}
            </div>
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
              {activeRoute === 'GLOBAL' ? 'Cấu hình SEO mặc định tiếng Việt' : `Cấu hình SEO: ${SEO_ROUTES.find(r => r.path === activeRoute)?.name}`}
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
                ? SITE_TITLE
                : (SEO_ROUTES.find(r => r.path === activeRoute)?.defaultTitle || 'Để trống sẽ lấy theo SEO Toàn Trang')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
            />
          </div>

          {activeRoute !== 'GLOBAL' && (
            <div>
              <label className="block font-bold text-slate-700 mb-2">Tiêu đề H1 trên trang (Tùy chọn)</label>
              <input 
                type="text"
                name="SEO_H1"
                value={currentConf.SEO_H1 || ''}
                onChange={handleChange}
                placeholder={(SEO_ROUTES.find(r => r.path === activeRoute) as any)?.defaultH1 || 'Tiêu đề H1 mặc định của trang'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-medium text-slate-800 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Ghi đè tiêu đề H1 hiển thị trên giao diện trang này. Để trống sẽ dùng tiêu đề mặc định.</p>
            </div>
          )}

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
              {currentConf.SEO_TITLE || globalTitle || defaults?.defaultTitle || 'Chưa có tiêu đề'}
            </div>
            <div className="text-[14px] text-[#4d5156] line-clamp-2 leading-snug">
              {currentConf.SEO_DESCRIPTION || globalDescription || defaults?.defaultDesc || 'Chưa có mô tả'}
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
                placeholder="VD: /speaking"
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

