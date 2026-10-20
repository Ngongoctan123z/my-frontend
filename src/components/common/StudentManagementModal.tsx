'use client'

import React, { useState, useMemo, useEffect, useId, useRef } from 'react'
import { 
  X, Search, FileText, ChevronDown, ChevronUp, Mail, Phone, 
  Users, Award, Calendar, Sparkles, Copy, Check, BookOpen, 
  Briefcase, Globe, Maximize2, Minimize2, Share2, Image as ImageIcon
} from 'lucide-react'
import { usePathname } from 'next/navigation'

interface StudentManagementModalProps {
  isOpen: boolean
  onClose: () => void
  loading: boolean
  studentsData: any[]
  expandedStudentId?: string | null
  setExpandedStudentId?: (id: string | null) => void
  onCreateShare?: () => void
  shareUnavailableReason?: string
  examTypePrefix?: 'IELTS' | 'TOEIC' | 'TOPIK' | 'HSK' | 'ALL' | string
}

export function StudentManagementModal({ 
  isOpen, 
  onClose, 
  loading, 
  studentsData = [], 
  expandedStudentId: externalExpandedId, 
  setExpandedStudentId: setExternalExpandedId,
  onCreateShare,
  shareUnavailableReason,
  examTypePrefix = 'ALL'
}: StudentManagementModalProps) {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  // Internal expanded state fallback
  const [internalExpandedId, setInternalExpandedId] = useState<string | null>(null)
  const expandedId = externalExpandedId !== undefined ? externalExpandedId : internalExpandedId
  const setExpandedId = setExternalExpandedId || setInternalExpandedId

  // Tab filter: ALL, IELTS, TOEIC, TOPIK, HSK
  const initialTab = useMemo(() => {
    const p = (examTypePrefix || '').toUpperCase()
    if (p.includes('TOEIC')) return 'TOEIC'
    if (p.includes('IELTS')) return 'IELTS'
    if (p.includes('TOPIK')) return 'TOPIK'
    if (p.includes('HSK')) return 'HSK'
    return 'ALL'
  }, [examTypePrefix])

  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isMaximized, setIsMaximized] = useState<boolean>(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
  const [copyError, setCopyError] = useState('')
  const titleId = useId(), dialogRef = useRef<HTMLDivElement>(null), closeRef = useRef<HTMLButtonElement>(null), imageRef = useRef<HTMLDivElement>(null)
  const close = useRef(onClose); close.current = onClose
  const zoom = useRef(zoomImageUrl); zoom.current = zoomImageUrl
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(initialTab); setSearchTerm(''); setCopyError(''); setZoomImageUrl(null)
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (zoom.current) setZoomImageUrl(null); else close.current(); return }
      if (event.key !== 'Tab') return
      const root = zoom.current ? imageRef.current : dialogRef.current
      const items = Array.from(root?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') || []).filter(el => el.getClientRects().length)
      const first = items[0], last = items[items.length - 1]
      if (!first) { event.preventDefault(); root?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !root?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !root?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keyboard, true)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard, true); previousFocus?.focus(); if (copyTimer.current) clearTimeout(copyTimer.current) }
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!zoomImageUrl) return
    const previousFocus = document.activeElement as HTMLElement | null
    imageRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { if (previousFocus?.isConnected) previousFocus.focus() }
  }, [zoomImageUrl])


  const handleCopy = async (text: string, id: string) => {
    if (!text) return
    setCopyError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopiedId(null), 2000)
    } catch { setCopyError(isEn ? 'Could not copy. Select the text and copy it manually.' : 'Chưa sao chép được. Bạn có thể chọn nội dung và sao chép thủ công.') }
  }

  // Helper: Trích xuất link ảnh biểu đồ/hình vẽ của đề thi
  const extractImageUrl = (sub: any): string | null => {
    if (sub.imageUrl && typeof sub.imageUrl === 'string' && sub.imageUrl.trim()) {
      return sub.imageUrl.trim()
    }
    if (sub.exam?.imageUrl && typeof sub.exam.imageUrl === 'string' && sub.exam.imageUrl.trim()) {
      return sub.exam.imageUrl.trim()
    }

    const content = sub.examContent || sub.exam?.content || ''
    if (typeof content === 'string') {
      // 1. Markdown image ![alt](url)
      const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/)
      if (mdMatch) return mdMatch[1]

      // 2. Data URI
      if (content.startsWith('data:image/')) return content

      // 3. Direct image link trong content
      const urlMatch = content.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif|svg)(?:\?[^\s]*)?)/i)
      if (urlMatch) return urlMatch[1]

      // 4. Local path /uploads/...png
      const localMatch = content.match(/^(\/[^\s]+\.(?:png|jpg|jpeg|webp|gif|svg))$/i)
      if (localMatch) return localMatch[1]
    }

    return null
  }

  // Helper: Làm sạch text đề bài (không hiển thị lại link ảnh thô)
  const cleanPromptText = (sub: any, extractedImg: string | null): string => {
    let content = (sub.examContent || sub.exam?.content || '').trim()
    if (!content) return ''
    if (extractedImg) {
      if (content === extractedImg) return ''
      content = content.replace(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g, '').trim()
      if (content === extractedImg) return ''
    }
    return content
  }

  // Helper: Phân loại chứng chỉ từ examType
  const getCategory = (examType: string = ''): 'IELTS' | 'TOEIC' | 'TOPIK' | 'HSK' | 'OTHER' => {
    const t = examType.toUpperCase()
    if (t.includes('IELTS')) return 'IELTS'
    if (t.includes('TOEIC')) return 'TOEIC'
    if (t.includes('TOPIK')) return 'TOPIK'
    if (t.includes('HSK')) return 'HSK'
    return 'OTHER'
  }

  // Helper: Phân tích & format điểm số gọn gàng (Band điểm)
  const parseSubmissionScore = (sub: any) => {
    const eType = (sub.examType || sub.exam?.examType || '').toUpperCase()
    let res = sub.gradingResult
    if (typeof res === 'string') {
      try { res = JSON.parse(res) } catch (e) { res = {} }
    }
    if (!res || typeof res !== 'object') {
      return { scoreText: 'N/A', numScore: null, maxScale: 100, isIelts: eType.includes('IELTS'), res: {} }
    }

    const rawScore = res.overallBandFormatted ?? res.overallBand ?? res.overall_band ?? res.band_score ?? res.holisticScore ?? res.total_score ?? res.score

    let maxScale = res.scoreScale
    if (!maxScale) {
      if (eType.includes('IELTS')) maxScale = 9
      else if (eType === 'TOEIC_ESSAY') maxScale = 5
      else if (eType === 'TOPIK_51_52' || eType === 'TOPIK_51' || eType === 'TOPIK_52') maxScale = 10
      else if (eType === 'TOPIK_53') maxScale = 30
      else if (eType === 'TOPIK_54') maxScale = 50
      else if (eType.includes('TOPIK') || eType.includes('HSK')) maxScale = 100
      else maxScale = 100
    }

    const isIelts = eType.includes('IELTS')

    if (rawScore === undefined || rawScore === null || rawScore === 'N/A') {
      return { scoreText: 'N/A', numScore: null, maxScale, isIelts, res }
    }

    const scoreStr = String(rawScore).trim()
    let numScore: number | null = null

    if (scoreStr.includes('/')) {
      const parts = scoreStr.split('/')
      numScore = parseFloat(parts[0])
      if (parts[1]) maxScale = parseFloat(parts[1]) || maxScale
    } else {
      numScore = parseFloat(scoreStr)
    }

    let scoreText = scoreStr
    if (isIelts) {
      // Hiển thị band điểm chuẩn IELTS: ví dụ "Band 8.0/9" hoặc "Band 8/9"
      if (!scoreText.toLowerCase().includes('band')) {
        scoreText = `Band ${scoreText}`
      }
      if (!scoreText.includes('/')) {
        scoreText = `${scoreText}/${maxScale}`
      }
    } else {
      if (!scoreText.includes('/')) {
        scoreText = `${scoreText}/${maxScale}`
      }
    }

    return { scoreText, numScore, maxScale, isIelts, res }
  }

  // Đếm số lượng bài theo từng chứng chỉ
  const counts = useMemo(() => {
    const c: Record<'ALL' | 'IELTS' | 'TOEIC' | 'TOPIK' | 'HSK', number> = { 
      ALL: studentsData.length, 
      IELTS: 0, 
      TOEIC: 0, 
      TOPIK: 0, 
      HSK: 0 
    }
    studentsData.forEach(s => {
      const cat = getCategory(s.examType || s.exam?.examType)
      if (cat !== 'OTHER' && cat in c) {
        c[cat]++
      }
    })
    return c
  }, [studentsData])

  // Lọc dữ liệu theo tab & từ khóa tìm kiếm
  const filteredSubmissions = useMemo(() => {
    return studentsData.filter(s => {
      const eType = s.examType || s.exam?.examType || ''
      const cat = getCategory(eType)
      
      // Lọc tab
      if (activeTab !== 'ALL' && cat !== activeTab) return false

      // Lọc search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const name = (s.studentName || '').toLowerCase()
        const phone = (s.studentPhone || '').toLowerCase()
        const email = (s.studentEmail || '').toLowerCase()
        const essay = (s.studentEssay || '').toLowerCase()
        const typeStr = eType.toLowerCase()
        return name.includes(term) || phone.includes(term) || email.includes(term) || essay.includes(term) || typeStr.includes(term)
      }
      return true
    })
  }, [studentsData, activeTab, searchTerm])

  if (!isOpen) return null

  const getExamBadge = (eType: string = '') => {
    const t = eType.toUpperCase()
    if (t.includes('IELTS')) {
      return { 
        name: t === 'IELTS_TASK_1' ? 'IELTS Task 1' : (t === 'IELTS_TASK_2' ? 'IELTS Task 2' : 'IELTS Writing'),
        bg: 'bg-blue-50 text-blue-700 border-blue-200' 
      }
    }
    if (t.includes('TOEIC')) {
      return { 
        name: t === 'TOEIC_RESPOND' ? 'TOEIC Q6-7 (Email)' : (t === 'TOEIC_ESSAY' ? 'TOEIC Q8 (Essay)' : 'TOEIC Writing'),
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
      }
    }
    if (t.includes('TOPIK')) {
      return { 
        name: t === 'TOPIK_51' ? 'TOPIK Câu 51' : (t === 'TOPIK_52' ? 'TOPIK Câu 52' : (t === 'TOPIK_51_52' ? 'TOPIK Câu 51-52' : (t === 'TOPIK_53' ? 'TOPIK Câu 53' : (t === 'TOPIK_54' ? 'TOPIK Câu 54' : 'TOPIK II')))),
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      }
    }
    if (t.includes('HSK')) {
      return { 
        name: t === 'HSK_5' ? 'HSK 5 (Viết đoạn)' : (t === 'HSK_6' ? 'HSK 6 (Tóm tắt)' : 'HSK Writing'),
        bg: 'bg-rose-50 text-rose-700 border-rose-200' 
      }
    }
    return { name: eType || 'Bài thi', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
  }

  const tabsConfig = [
    { id: 'ALL', label: isEn ? 'All Exams' : 'Tất cả bài thi', icon: Globe, count: counts.ALL },
    { id: 'IELTS', label: 'IELTS Writing', icon: BookOpen, count: counts.IELTS },
    { id: 'TOEIC', label: 'TOEIC Writing', icon: Briefcase, count: counts.TOEIC },
    { id: 'TOPIK', label: 'TOPIK II', icon: Award, count: counts.TOPIK },
    { id: 'HSK', label: 'HSK 5 & 6', icon: FileText, count: counts.HSK },
  ]

  return (
    <>
      <div className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-200 bg-slate-900/50 backdrop-blur-sm animate-in fade-in ${
        isMaximized ? 'p-0 sm:p-2' : 'p-2 sm:p-6'
      }`} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative transition-all duration-200 ${
          isMaximized 
            ? 'w-full h-full max-w-none max-h-none rounded-none sm:rounded-2xl' 
            : 'w-full max-w-6xl h-[92dvh] rounded-2xl'
        }`}>
          
          {/* Header - Thiết kế nhẹ nhàng, đồng bộ màu sắc với web */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 bg-white border-b border-slate-200 text-slate-800 flex justify-between items-start gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="w-10 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="min-w-0">
                  <h3 id={titleId} className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                    {isEn ? 'Students & submissions' : 'Học viên & bài nộp'}
                  </h3>
                  <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Pro & Plus
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEn ? 'Assign a shared exam and review each student’s response in one place.' : 'Giao bài bằng liên kết và xem từng bài làm, điểm luyện tập của học viên.'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <button 
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={isMaximized ? (isEn ? 'Restore down' : 'Thu nhỏ lại') : (isEn ? 'Maximize full screen' : 'Phóng to toàn màn hình')}
                aria-label={isMaximized ? (isEn ? 'Restore student management' : 'Thu nhỏ quản lý học viên') : (isEn ? 'Expand student management' : 'Phóng to quản lý học viên')}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button 
                type="button"
                ref={closeRef}
                aria-label={isEn ? 'Close student management' : 'Đóng quản lý học viên'}
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={isEn ? 'Close' : 'Đóng'}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-6">
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-[11px] font-medium text-slate-500">{isEn ? 'Student submissions' : 'Bài nộp đã nhận'}</p><p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{studentsData.length}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-[11px] font-medium text-slate-500">{isEn ? 'With feedback' : 'Đã có nhận xét'}</p><p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{studentsData.filter(sub => !!sub.gradingResult).length}</p></div>
            </div>
            <div className="min-w-0 sm:max-w-xs"><p className="text-xs leading-6 text-slate-500">{isEn ? 'Students use the shared link without signing in. Their grading uses your plan allowance.' : 'Học viên mở liên kết để làm bài, không cần đăng nhập. Lượt chấm sử dụng hạn mức của tài khoản giao bài.'}</p>{onCreateShare ? <button type="button" onClick={() => { onClose(); onCreateShare() }} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Share2 size={15} />{isEn ? 'Create assignment link' : 'Tạo liên kết giao bài'}</button> : shareUnavailableReason && <p className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-6 text-slate-600">{shareUnavailableReason}</p>}</div>
          </div>

          {/* Tab Selector Bar - Màu sắc hài hòa theo tone xanh web */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {tabsConfig.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 snap-start min-h-10 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search & Tổng số bài (Đã bỏ các thông số thừa, chỉ giữ ô tìm kiếm & tổng bài) */}
          <div className="px-4 py-2.5 sm:px-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="search" 
                aria-label={isEn ? 'Search student submissions' : 'Tìm bài nộp học viên'}
                placeholder={isEn ? "Search by Name, Phone, Email..." : "Tìm theo Tên, SĐT, Email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 text-xs transition-all font-medium text-slate-800"
              />
              {searchTerm && (
                <button 
                  type="button"
                  aria-label={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tổng số bài nộp */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium">
                {isEn ? 'Total submissions:' : 'Tổng bài nộp:'} <strong className="text-slate-900 ml-1">{filteredSubmissions.length}</strong>
              </span>
            </div>
          </div>

          {copyError && <p role="alert" className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">{copyError}</p>}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/60 custom-scrollbar">
            {loading ? (
              <div className="min-h-[350px] flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-slate-700 font-semibold text-sm">{isEn ? 'Loading student submissions...' : 'Đang tải danh sách bài làm của học viên...'}</p>
                <p className="text-xs text-slate-400 mt-1">{isEn ? 'Your students’ latest submissions will appear here.' : 'Các bài học viên đã nộp sẽ hiển thị tại đây.'}</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3 border border-blue-100">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">
                  {isEn ? `No submissions found for ${activeTab}` : `Chưa có bài nộp nào cho phần thi ${activeTab}`}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
                  {searchTerm 
                    ? (isEn ? 'Try adjusting your search keywords.' : 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm của bạn.')
                    : (isEn ? 'Share the exam link with your students so they can take the test and see results here!' : 'Hãy dùng nút "Chia sẻ đề thi" để gửi link cho học viên làm bài, kết quả sẽ tự động lưu về đây.')
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                  >
                    {isEn ? 'Clear Search Filter' : 'Xóa bộ lọc tìm kiếm'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub) => {
                  const isExpanded = expandedId === sub.id
                  const eType = sub.examType || sub.exam?.examType || ''
                  const badge = getExamBadge(eType)
                  const scoreInfo = parseSubmissionScore(sub)
                  
                  // Trích xuất biểu đồ dạng ảnh và text đề bài
                  const chartImageUrl = extractImageUrl(sub)
                  const cleanedPrompt = cleanPromptText(sub, chartImageUrl)
                  const essayWordCount = (sub.studentEssay || '').trim().split(/\s+/).filter(Boolean).length

                  // First letter avatar
                  const initials = (sub.studentName || 'U').trim().split(/\s+/).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div 
                      key={sub.id} 
                      className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden shadow-xs hover:shadow-sm ${
                        isExpanded ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Header Row: Chỉ hiển thị Band điểm và Nút Xem bài chi tiết */}
                      <div 
                        className="px-4 py-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        {/* Left: Student Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <h4 className="min-w-0 font-semibold text-slate-900 text-sm leading-6 truncate">
                                {sub.studentName}
                              </h4>
                              <span className={`shrink-0 text-[10px] font-semibold ${badge.bg}`}>
                                {badge.name}
                              </span>
                            </div>
                            
                            {/* Contact Info Pills */}
                            <div className="mt-1 grid min-w-0 gap-1 text-[11px] text-slate-500">
                              {sub.studentPhone && (
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleCopy(sub.studentPhone, `phone-${sub.id}`); }}
                                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors bg-slate-100/70 hover:bg-blue-50 px-1.5 py-0.2 rounded"
                                  aria-label={isEn ? `Copy phone number ${sub.studentPhone}` : `Sao chép số điện thoại ${sub.studentPhone}`}
                                >
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span className="break-all text-left font-medium text-[11px]">{sub.studentPhone}</span>
                                  {copiedId === `phone-${sub.id}` && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                                </button>
                              )}
                              {sub.studentEmail && (
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); handleCopy(sub.studentEmail, `email-${sub.id}`); }}
                                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors bg-slate-100/70 hover:bg-blue-50 px-1.5 py-0.2 rounded"
                                  aria-label={isEn ? `Copy email ${sub.studentEmail}` : `Sao chép email ${sub.studentEmail}`}
                                >
                                  <Mail className="w-2.5 h-2.5 text-slate-400" />
                                  <span className="break-all text-left font-medium text-[11px]">{sub.studentEmail}</span>
                                  {copiedId === `email-${sub.id}` && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                                </button>
                              )}
                              <span className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(sub.createdAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Band điểm & Nút Xem bài chi tiết (Đã lược bỏ các tag Xuất sắc/Khá/Tốt rườm rà) */}
                        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
                          {/* Band Score Pill */}
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm">
                            <Award className="w-3.5 h-3.5 text-blue-600" />
                            <span>{scoreInfo.scoreText}</span>
                          </div>

                          {/* Nút Xem bài chi tiết */}
                          <button 
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={`${titleId}-${sub.id}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(isExpanded ? null : sub.id)
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs border ${
                              isExpanded 
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                            }`}
                          >
                            <span>{isExpanded ? (isEn ? 'Close' : 'Thu gọn') : (isEn ? 'View Essay' : 'Xem bài chi tiết')}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Detail Section */}
                      {isExpanded && (
                        <div id={`${titleId}-${sub.id}`} className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200 space-y-4 animate-in slide-in-from-top-2 duration-150">
                          
                          {/* Two Column: Prompt (Biểu đồ / Ảnh nếu có) & Student Essay */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Cột Đề bài / Biểu đồ */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  {chartImageUrl ? <ImageIcon className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
                                  {chartImageUrl ? (isEn ? 'Chart / Exam Prompt' : 'Biểu đồ & Đề bài') : (isEn ? 'Exam Prompt' : 'Đề bài (Prompt)')}
                                </span>
                                {cleanedPrompt && (
                                  <button 
                                    onClick={() => handleCopy(cleanedPrompt, `prompt-${sub.id}`)}
                                    className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                  >
                                    {copiedId === `prompt-${sub.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    {copiedId === `prompt-${sub.id}` ? 'Đã copy' : 'Copy đề'}
                                  </button>
                                )}
                              </div>

                              {/* Hiển thị ảnh biểu đồ nếu có */}
                              {chartImageUrl && (
                                <div className="mb-3">
                                  <button type="button"
                                    onClick={() => setZoomImageUrl(chartImageUrl)}
                                    aria-label={isEn ? 'Enlarge exam image' : 'Phóng to ảnh đề bài'}
                                    className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50/70 flex items-center justify-center cursor-zoom-in hover:border-blue-300 transition-all max-h-64"
                                  >
                                    <img 
                                      src={chartImageUrl} 
                                      alt="Biểu đồ đề thi" 
                                      className="w-full max-h-64 object-contain transition-transform group-hover:scale-[1.01]" 
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <div className="bg-white/95 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5">
                                        <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                                        <span>{isEn ? 'Click to zoom' : 'Bấm để phóng to biểu đồ'}</span>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              )}

                              {/* Nội dung chữ của đề bài (nếu có) */}
                              {cleanedPrompt && (
                                <div className="break-words text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-normal">
                                  {cleanedPrompt}
                                </div>
                              )}

                              {!chartImageUrl && !cleanedPrompt && (
                                <p className="text-xs text-slate-400 italic">
                                  {isEn ? 'No prompt text or chart recorded.' : 'Không có nội dung đề bài.'}
                                </p>
                              )}
                            </div>

                            {/* Cột Bài làm học viên */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  {isEn ? 'Student Submission' : 'Bài làm học viên'}
                                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full normal-case">
                                    {essayWordCount} {isEn ? 'words' : 'từ'}
                                  </span>
                                </span>
                                <button 
                                  onClick={() => handleCopy(sub.studentEssay, `essay-${sub.id}`)}
                                  className="text-[11px] font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                                >
                                  {copiedId === `essay-${sub.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === `essay-${sub.id}` ? 'Đã copy' : 'Copy bài'}
                                </button>
                              </div>
                              <div className="break-words text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar font-normal">
                                {sub.studentEssay}
                              </div>
                            </div>
                          </div>

                          {/* Điểm thành phần theo tiêu chí (nếu có) */}
                          {scoreInfo.res?.criteria && typeof scoreInfo.res.criteria === 'object' && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                                <span className="w-2.5 h-1 bg-blue-600 rounded-full"></span>
                                {isEn ? 'Criteria Breakdown' : 'Điểm thành phần theo tiêu chí'}
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {Object.entries(scoreInfo.res.criteria).map(([cKey, cVal]: [string, any]) => {
                                  let label = cKey
                                  if (cKey === 'taskFulfillment') label = isEn ? 'Task Fulfillment' : 'Đáp ứng yêu cầu đề'
                                  else if (cKey === 'reasonsAndExamples') label = isEn ? 'Reasons & Examples' : 'Lập luận & Dẫn chứng'
                                  else if (cKey === 'organization') label = isEn ? 'Organization' : 'Bố cục & Liên kết'
                                  else if (cKey === 'grammar') label = isEn ? 'Grammar' : 'Cấu trúc & Ngữ pháp'
                                  else if (cKey === 'vocabulary') label = isEn ? 'Vocabulary' : 'Vốn từ vựng'
                                  else if (cKey === 'taskResponse') label = isEn ? 'Task Response' : 'Hoàn thành yêu cầu (TR)'
                                  else if (cKey === 'taskAchievement') label = isEn ? 'Task Achievement' : 'Hoàn thành nhiệm vụ (TA)'
                                  else if (cKey === 'coherenceCohesion') label = isEn ? 'Coherence' : 'Mạch lạc & Liên kết (CC)'
                                  else if (cKey === 'lexicalResource') label = isEn ? 'Lexical' : 'Vốn từ vựng (LR)'
                                  else if (cKey === 'grammaticalRange') label = isEn ? 'Grammar' : 'Ngữ pháp (GRA)'

                                  const cScore = typeof cVal === 'object' && cVal !== null ? cVal.score : cVal

                                  return (
                                    <div key={cKey} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate mb-1">
                                        {label}
                                      </div>
                                      <div className="text-xl font-bold text-blue-600">
                                        {cScore !== undefined && cScore !== null ? cScore : '—'}
                                        <span className="text-xs font-normal text-slate-400 ml-1">/{scoreInfo.maxScale}</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Nhận xét tổng quan từ giám khảo */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2.5 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              {isEn ? 'AI practice feedback' : 'Nhận xét AI cho bài luyện'}
                            </h5>
                            <div className="break-words text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-normal bg-blue-50/40 p-3.5 rounded-lg border border-blue-100">
                              {scoreInfo.res?.detailedFeedback || scoreInfo.res?.feedback || (isEn ? 'No feedback recorded.' : 'Không có nhận xét chi tiết.')}
                            </div>
                          </div>

                          {/* Các lỗi sai & Đề xuất sửa (nếu có) */}
                          {scoreInfo.res?.corrections && Array.isArray(scoreInfo.res.corrections) && scoreInfo.res.corrections.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                                <span className="w-2.5 h-1 bg-amber-500 rounded-full"></span>
                                {isEn ? 'Suggested Corrections' : 'Các lỗi sai & Đề xuất sửa'} ({scoreInfo.res.corrections.length})
                              </h5>
                              <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                                {scoreInfo.res.corrections.map((corr: any, idx: number) => {
                                  const t = (corr.type || '').trim().toLowerCase()
                                  const isError = t.includes('lỗi') || t.includes('error')
                                  const isAdvanced = t.includes('nâng cao') || t.includes('advanced')

                                  const badgeClass = isError
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : isAdvanced
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'

                                  const originalBox = isError
                                    ? 'bg-rose-50 text-rose-800 border-rose-100 line-through decoration-rose-300'
                                    : isAdvanced
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                      : 'bg-amber-50 text-amber-900 border-amber-200'

                                  const correctedBox = isError
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                    : isAdvanced
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200 font-semibold'
                                      : 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'

                                  return (
                                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                          {isError ? '❌ Lỗi' : isAdvanced ? '⭐ Nâng cao' : '💡 Gợi ý'}
                                        </span>
                                        {corr.impact && <span className="text-[10px] text-slate-400">{corr.impact}</span>}
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <div className={`flex-1 p-2 rounded-md border ${originalBox}`}>
                                          <strong className="block text-[10px] uppercase font-bold opacity-80">Gốc:</strong>
                                          {corr.original}
                                        </div>
                                        <div className={`flex-1 p-2 rounded-md border ${correctedBox}`}>
                                          <strong className="block text-[10px] uppercase font-bold opacity-80">Sửa:</strong>
                                          {corr.corrected}
                                        </div>
                                      </div>
                                      {corr.explanation && (
                                        <p className="text-slate-600 text-[11px] font-medium pt-0.5">
                                          💡 {corr.explanation}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer - Màu sắc thanh lịch, nút đóng gọn gàng */}
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
            <p className="font-medium text-center sm:text-left text-[11px] sm:text-xs">
              {isEn ? 'Showing submissions created via shared exam links' : 'Danh sách bài làm của học viên nộp qua liên kết chia sẻ'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors"
            >
              {isEn ? 'Close' : 'Đóng danh sách'}
            </button>
          </div>

        </div>
      </div>

      {/* Lightbox Modal để phóng to biểu đồ */}
      {zoomImageUrl && (
        <div 
          ref={imageRef} role="dialog" aria-modal="true" aria-label={isEn ? 'Exam image' : 'Ảnh đề bài'} tabIndex={-1} className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-200" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              aria-label={isEn ? 'Close exam image' : 'Đóng ảnh đề bài'}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors shadow-lg"
              title="Đóng ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomImageUrl} 
              alt="Biểu đồ phóng to" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  )
}

