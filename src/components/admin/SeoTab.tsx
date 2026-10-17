import React, { useEffect, useState } from 'react'
import { Loader2, Save, CheckCircle, Search, Globe, FileText, Layers, PenTool, LayoutTemplate, Map, X } from 'lucide-react'

const SEO_ROUTES = [
  // 1. Cơ bản & Hệ thống
  { 
    path: 'GLOBAL', 
    name: 'SEO Toàn Trang (Mặc định)', 
    category: 'Cơ bản & Hệ thống',
    icon: Globe,
    defaultTitle: 'VNDocs - Kho tài liệu miễn phí',
    defaultDesc: 'Mô tả ngắn gọn về trang web...'
  },
  { 
    path: '/', 
    name: 'Trang Chủ', 
    category: 'Cơ bản & Hệ thống',
    icon: LayoutTemplate,
    defaultTitle: 'VNDocs - Trang đề thi, công cụ học tập và làm việc miễn phí',
    defaultDesc: 'Nền tảng học tập trực tuyến cung cấp kho đề thi vào 10, đề thi THPT, luyện writing IELTS, TOEIC, cùng bộ công cụ xử lý file hoàn toàn miễn phí.'
  },
  { 
    path: '/tai-lieu', 
    name: 'Kho Đề Thi & Tài Liệu', 
    category: 'Cơ bản & Hệ thống',
    icon: FileText,
    defaultTitle: 'Thư Viện Đề Thi & Tài Liệu Miễn Phí (PDF) | VNDocs',
    defaultDesc: 'Tải miễn phí hàng ngàn tài liệu luyện thi, đề thi vào 10, đề thi THPT Quốc gia (Toán, Văn, Anh), PDF ôn thi IELTS, TOEIC cập nhật mới nhất có đáp án.'
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
  { 
    path: '/tools', 
    name: 'Công Cụ Tiện Ích (Tổng hợp)', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Bộ Công Cụ Tiện Ích PDF & Giáo Dục | VNDocs',
    defaultDesc: 'Công cụ gộp PDF, cắt PDF, khóa PDF, chuyển đổi định dạng, và máy tính khoa học ảo miễn phí 100%.'
  },
  { 
    path: '/tools/merge-files', 
    name: 'Gộp File PDF Online', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Gộp File PDF Trực Tuyến Miễn Phí | VNDocs',
    defaultDesc: 'Ghép nhiều file PDF hoặc ảnh thành một tài liệu duy nhất. Kéo thả sắp xếp thứ tự trang nhanh chóng, bảo mật tuyệt đối trên trình duyệt.'
  },
  { 
    path: '/tools/remove-pages', 
    name: 'Tách & Xóa Trang PDF', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Xóa Trang PDF & Cắt File PDF Trực Tuyến | VNDocs',
    defaultDesc: 'Tách trang, xóa trang thừa hoặc trích xuất trang cần thiết từ tài liệu PDF dễ dàng, bảo mật và hoàn toàn miễn phí.'
  },
  { 
    path: '/tools/lock', 
    name: 'Khóa / Mở Khóa PDF', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Đặt Mật Khẩu & Mở Khóa File PDF | VNDocs',
    defaultDesc: 'Mã hóa tài liệu PDF bằng mật khẩu chống sao chép in ấn, hoặc mở khóa bảo vệ file PDF nhanh chóng ngay trên trình duyệt.'
  },
  { 
    path: '/tools/compress', 
    name: 'Nén Ảnh & File ZIP', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Nén Ảnh & Đóng Gói File ZIP Trực Tuyến | VNDocs',
    defaultDesc: 'Giảm dung lượng ảnh JPG, PNG và nén nhiều file vào tập tin .zip an toàn, xử lý 100% trên trình duyệt không tải lên máy chủ.'
  },
  { 
    path: '/tools/convert', 
    name: 'Chuyển Đổi Định Dạng Ảnh', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Chuyển Đổi Định Dạng Ảnh Trực Tuyến | VNDocs',
    defaultDesc: 'Chuyển đổi linh hoạt giữa các định dạng ảnh JPG, PNG, WEBP, BMP, GIF, ICO hoàn toàn miễn phí với chất lượng cao.'
  },
  { 
    path: '/tools/casio', 
    name: 'Máy Tính Casio 580 Online', 
    category: 'Công Cụ & Tiện Ích',
    icon: Layers,
    defaultTitle: 'Giả Lập Máy Tính Casio Fx-580VN X Online | VNDocs',
    defaultDesc: 'Trình giả lập máy tính khoa học Casio fx-580VN X và fx-570VN Plus trực tuyến, giải toán nhanh, tính phương trình, ma trận miễn phí.'
  },

  // 4. Quốc Tế & Tiếng Anh (/en)
  { 
    path: '/en', 
    name: 'EN: Homepage', 
    category: 'English Pages (/en)',
    icon: Globe,
    defaultTitle: 'VNDocs — Free Online Exam Prep, Writing Practice & PDF Utilities',
    defaultDesc: 'All-in-one learning and productivity platform: free exam preparation, automated writing evaluation for IELTS, TOEIC, TOPIK, HSK, and essential PDF utilities.'
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
    path: '/en/tools', 
    name: 'EN: PDF & Productivity Tools', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Free PDF & Productivity Tools Online | VNDocs',
    defaultDesc: '100% Free browser-based tools: merge PDF, remove PDF pages, protect PDF, compress images, and use the online scientific calculator emulator.'
  },
  { 
    path: '/en/tools/merge-files', 
    name: 'EN: Merge PDF Online', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Merge PDF Online — Combine PDF Files & Images Free | VNDocs',
    defaultDesc: 'Combine multiple PDF documents and images into a single file easily. Reorder pages with intuitive drag-and-drop. 100% private, processed directly in your browser.'
  },
  { 
    path: '/en/tools/remove-pages', 
    name: 'EN: Remove PDF Pages', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Remove PDF Pages — Split & Delete Pages Online Free | VNDocs',
    defaultDesc: 'Easily delete unwanted pages, extract specific pages, or split PDF documents online. Fast, secure, and entirely processed client-side without server uploads.'
  },
  { 
    path: '/en/tools/lock', 
    name: 'EN: Protect & Lock PDF', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Protect PDF — Encrypt & Password Protect PDF Files | VNDocs',
    defaultDesc: 'Secure sensitive PDF documents with strong AES encryption and password protection. Prevent unauthorized viewing or printing directly in your browser.'
  },
  { 
    path: '/en/tools/compress', 
    name: 'EN: Compress Images & ZIP', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Compress Images & Create ZIP Archives Online Free | VNDocs',
    defaultDesc: 'Reduce JPG, PNG, and WebP image file sizes without quality loss. Compress multiple files into .zip directly in your browser with zero server uploads.'
  },
  { 
    path: '/en/tools/convert', 
    name: 'EN: Image Format Converter', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Image Format Converter — Convert JPG, PNG, WEBP, GIF Online | VNDocs',
    defaultDesc: 'Quickly convert images between JPG, PNG, WEBP, BMP, GIF, and ICO formats in high quality. Free batch conversion processed securely in your browser.'
  },
  { 
    path: '/en/tools/casio', 
    name: 'EN: Casio Calculator Emulator', 
    category: 'English Pages (/en)',
    icon: Layers,
    defaultTitle: 'Online Scientific Calculator (Casio Fx-580VN X Emulator) | VNDocs',
    defaultDesc: 'Free online scientific calculator simulator compatible with Casio fx-580VN X and fx-570VN Plus. Solve equations, fractions, matrices, and statistics instantly in browser.'
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
