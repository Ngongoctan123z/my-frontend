'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
  FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, 
  History, Users, Clock, ArrowRight, ArrowLeft, Share2, 
  Maximize2, Minimize2, Check, Info, Layers, Eye, EyeOff, Lock, LogIn
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import dynamic from 'next/dynamic'
import { AnswerInput, AnswerTextarea, GraderActions } from '@/src/components/common/GraderControls'


import { usePathname } from 'next/navigation'
import { HSK_5_FALLBACKS, HSK_6_FALLBACKS } from '@/src/data/fallbackPrompts'

const GradingResultModal = dynamic(() => import('@/src/components/common/GradingResultModal').then(module => module.GradingResultModal))
const ShareExamModal = dynamic(() => import('@/src/components/common/ShareExamModal').then(module => module.ShareExamModal))
const StudentManagementModal = dynamic(() => import('@/src/components/common/StudentManagementModal').then(module => module.StudentManagementModal))

type HskMode = 'HSK_5_FULL' | 'HSK_6'
type PromptObject = { content: string, imageUrl?: string | null }

export interface Hsk5PromptData {
  title?: string
  part1: { id: number, words: string }[]
  part2: { id: number, keywords: string[], requirement?: string }
  part3: { id: number, imageUrl: string, description?: string, requirement?: string }
}

function parseHsk5Prompt(content?: string | null, imgUrl?: string | null): Hsk5PromptData | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content)
    if (parsed.part1 || parsed.part2 || parsed.part3) {
      return {
        title: parsed.title || "Đề thi HSK 5",
        part1: Array.isArray(parsed.part1) ? parsed.part1 : [],
        part2: parsed.part2 && Array.isArray(parsed.part2.keywords) ? parsed.part2 : { id: 99, keywords: [] },
        part3: {
          id: 100,
          imageUrl: parsed.part3?.imageUrl || imgUrl || '',
          description: parsed.part3?.description || '',
          requirement: parsed.part3?.requirement || '请结合这张图片写一篇80字左右的短文。'
        }
      }
    }
  } catch (e) {}
  return null
}

function countHanzi(t: string): number {
  return (t.match(/[\u4e00-\u9fff]/g) || []).length
}

export function HskGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<HskMode>('HSK_5_FULL')
  const [hsk5Step, setHsk5Step] = useState<1 | 2 | 3>(1)
  const [feedbackLang, setFeedbackLang] = useState<string>(isEn ? 'English' : 'Tiếng Việt')

  // HSK 5 Prompts & Answers
  const [hsk5Prompt, setHsk5Prompt] = useState<PromptObject | null>(null)
  const [hsk5Part1Answers, setHsk5Part1Answers] = useState<Record<number, string>>({
    91: '', 92: '', 93: '', 94: '', 95: '', 96: '', 97: '', 98: ''
  })
  const [hsk5Part2Essay, setHsk5Part2Essay] = useState('')
  const [hsk5Part3Essay, setHsk5Part3Essay] = useState('')

  // HSK 6
  const [hsk6Prompt, setHsk6Prompt] = useState<PromptObject | null>(null)
  const [hsk6Essay, setHsk6Essay] = useState('')
  const [isHsk6TextHidden, setIsHsk6TextHidden] = useState(false)

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [resultExamType, setResultExamType] = useState<string>('HSK_5')
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [history, setHistory] = useState<GradedEssayHistory[]>([])
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(7)

  // Student & Share Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [studentsData, setStudentsData] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)

  const loadStudentsData = async () => {
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/shared-exams/submissions')
      const data = await res.json()
      setStudentsData(data.submissions || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Queues
  const hsk5Queue = useRef<PromptObject[]>([])
  const hsk6Queue = useRef<PromptObject[]>([])
  const isFetchingHsk = useRef<Record<string, boolean>>({})

  const hsk5Data = useMemo(() => {
    return parseHsk5Prompt(hsk5Prompt?.content, hsk5Prompt?.imageUrl)
  }, [hsk5Prompt])

  useEffect(() => {
    fetch('/api/ai-grader').then(r => r.json()).then(data => {
      setUsageCount(data.count || 0)
      setUsageLimit(data.limit || 7)
    }).catch(() => {})
  }, [session])

  const isPromptDone = (content?: string, historyList = history) => {
    if (!content) return false
    const snippet = content.slice(0, 50).trim().toLowerCase()
    const contentLower = content.toLowerCase()
    return historyList.some(h => {
      if (!h.prompt) return false
      const p = h.prompt.toLowerCase()
      return p === contentLower || p.includes(contentLower) || contentLower.includes(p) || (snippet.length >= 15 && p.includes(snippet))
    })
  }

  // Load history (Database for logged in, localStorage for guests)
  const loadHistory = async () => {
    const email = session?.user?.email || 'anonymous'
    const data = await getEssayHistory(email, 'HSK')
    setHistory(data)

    // Tự động kiểm tra: Nếu đề HSK đang hiển thị đã có trong lịch sử đã làm -> Đổi ngay sang đề chưa làm
    if (data.length > 0) {
      if (hsk5Prompt && isPromptDone(hsk5Prompt.content, data)) generatePrompt('HSK_5', data)
      if (hsk6Prompt && isPromptDone(hsk6Prompt.content, data)) generatePrompt('HSK_6', data)
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  // Call API with safe content-type checking to prevent HTML parsing errors
  const callApi = async (body: object) => {
    const res = await fetch('/api/ai-grader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      if (text.includes('1102') || text.includes('Worker exceeded CPU')) {
        throw new Error(isEn
          ? 'Cloudflare Worker exceeded CPU resources (Error 1102). Please slow down and try again shortly.'
          : 'Máy chủ Cloudflare tạm thời quá tải CPU (Error 1102). Vui lòng thao tác chậm lại một chút và thử lại.')
      }
      if (res.status === 403 || res.status === 429 || text.includes('Just a moment') || text.includes('<!DOCTYPE')) {
        throw new Error(isEn 
          ? 'AI Service is currently busy or rate-limited. Please try again shortly.' 
          : 'Dịch vụ AI đang tạm thời bận hoặc chạm giới hạn gọi. Vui lòng thử lại sau ít phút.')
      }
      throw new Error(isEn ? `Server error (${res.status}).` : `Máy chủ phản hồi mã lỗi (${res.status}).`)
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || (isEn ? 'An error occurred.' : 'Đã có lỗi xảy ra.'))
    return data
  }

  // Draw prompt without blocking between HSK 5 and HSK 6
  const generatePrompt = async (type: 'HSK_5' | 'HSK_6', customHistory?: GradedEssayHistory[], force = false) => {
    if (!force && (isFetchingHsk.current[type] || isGrading)) return
    isFetchingHsk.current[type] = true
    setIsGenerating(true)
    setError(null)

    const qRef = type === 'HSK_5' ? hsk5Queue : hsk6Queue
    const hList = customHistory || history
    const pastPrompts = hList.map(h => h.prompt)

    try {
      if (qRef.current.length === 0) {
        const data = await callApi({ action: 'generate_prompt_batch', type, donePrompts: pastPrompts })
        if (Array.isArray(data.prompts) && data.prompts.length > 0) {
          qRef.current = data.prompts
        }
      }

      // Bỏ qua đề đã làm nếu còn đề chưa làm trong queue
      while (qRef.current.length > 1 && isPromptDone(qRef.current[0].content, hList)) {
        qRef.current.shift()
      }

      const nextPrompt = qRef.current.shift()
      if (nextPrompt) {
        if (type === 'HSK_5') setHsk5Prompt(nextPrompt)
        else setHsk6Prompt(nextPrompt)
      } else {
        const fb = type === 'HSK_5' ? HSK_5_FALLBACKS[0] : HSK_6_FALLBACKS[0]
        if (type === 'HSK_5') setHsk5Prompt(fb)
        else setHsk6Prompt(fb)
      }
    } catch (err: any) {
      console.warn('generatePrompt error, using fallback:', err)
      const fb = type === 'HSK_5' ? HSK_5_FALLBACKS[0] : HSK_6_FALLBACKS[0]
      if (type === 'HSK_5') {
        if (!hsk5Prompt) setHsk5Prompt(fb)
      } else {
        if (!hsk6Prompt) setHsk6Prompt(fb)
      }
    } finally {
      isFetchingHsk.current[type] = false
      setIsGenerating(false)
    }
  }

  // Auto-load prompt on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'HSK_5_FULL' && !hsk5Prompt) {
      generatePrompt('HSK_5')
    } else if (activeTab === 'HSK_6' && !hsk6Prompt) {
      generatePrompt('HSK_6')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Current prompt object for sharing
  const currentPromptObj = activeTab === 'HSK_5_FULL' ? hsk5Prompt : hsk6Prompt

  const handleCreateSharedLink = async (reqPhone: boolean, reqEmail: boolean): Promise<string | void> => {
    if (!currentPromptObj?.content?.trim()) {
      alert(isEn ? 'Please draw a prompt first.' : 'Vui lòng bốc đề thi trước.')
      return
    }
    try {
      const res = await fetch('/api/shared-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: activeTab === 'HSK_5_FULL' ? 'HSK_5' : 'HSK_6',
          content: currentPromptObj.content,
          imageUrl: currentPromptObj.imageUrl,
          requirePhone: reqPhone,
          requireEmail: reqEmail
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert(isEn ? 'Share link generated! Valid for 24h.' : 'Đã tạo link chia sẻ thành công! Link có hiệu lực 24h.\nBạn có thể gửi link này cho học viên.')
        return `${window.location.origin}${isEn ? '/en' : ''}/shared/${data.id}`
      } else {
        alert(data.error || (isEn ? 'Failed to create link' : 'Không thể tạo liên kết, vui lòng thử lại sau.'))
      }
    } catch (e) {
      alert(isEn ? 'Error creating link' : 'Không thể tạo liên kết, vui lòng thử lại sau.')
    }
  }

  // Character counts
  const hsk5P2Count = useMemo(() => countHanzi(hsk5Part2Essay), [hsk5Part2Essay])
  const hsk5P3Count = useMemo(() => countHanzi(hsk5Part3Essay), [hsk5Part3Essay])
  const hsk5P1AnsweredCount = Object.values(hsk5Part1Answers).filter(a => a.trim().length > 0).length
  const hsk6CharCount = useMemo(() => countHanzi(hsk6Essay), [hsk6Essay])

  // Compile HSK 5 submission
  const compileHsk5 = () => {
    const lines: string[] = []
    for (let q = 91; q <= 98; q++) {
      const ans = (hsk5Part1Answers[q] || '').trim()
      lines.push(`${q}. ${ans || '(Chưa làm)'}`)
    }
    lines.push(`99. ${(hsk5Part2Essay || '').trim() || '(Chưa làm)'}`)
    lines.push(`100. ${(hsk5Part3Essay || '').trim() || '(Chưa làm)'}`)
    const compiledEssay = lines.join('\n\n')

    const p1Prompts = hsk5Data?.part1 ? hsk5Data.part1.map(p => `${p.id}. ${p.words}`).join('\n') : ''
    const kwStr = hsk5Data?.part2 ? hsk5Data.part2.keywords.join(', ') : ''
    const promptText = `【Phần 1: Sắp xếp câu (Câu 91–98)】\n${p1Prompts}\n\n【Phần 2: Viết đoạn theo từ khóa (Câu 99)】\nTừ khóa: ${kwStr} (${hsk5Data?.part2?.requirement || 'Viết đoạn văn ngắn khoảng 80 chữ'})\n\n【Phần 3: Viết đoạn theo tranh (Câu 100)】\nMiêu tả tranh: ${hsk5Data?.part3?.description || 'Quan sát tranh'} (${hsk5Data?.part3?.requirement || 'Viết đoạn văn ngắn khoảng 80 chữ'})`

    return { promptText, compiledEssay }
  }

  // Grade HSK 5 Full Test
  const gradeHsk5Full = async () => {
    const hasP1 = Object.values(hsk5Part1Answers).some(a => a.trim().length > 0)
    const hasP2 = hsk5Part2Essay.trim().length > 0
    const hasP3 = hsk5Part3Essay.trim().length > 0

    if (!hasP1 && !hasP2 && !hasP3) {
      setError(isEn ? 'Please answer at least one section before submitting.' : 'Vui lòng hoàn thành ít nhất một phần trong bài thi HSK 5 trước khi nộp.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const { promptText, compiledEssay } = compileHsk5()
      const data = await callApi({
        action: 'grade_essay',
        type: 'HSK_5',
        prompt: promptText,
        essay: compiledEssay,
        feedbackLang
      })

      setResult(data)
      setResultExamType('HSK_5')
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType: 'HSK_5',
        prompt: `${hsk5Prompt?.content || ''}\n\n${promptText}`,
        essay: compiledEssay,
        result: data
      })

      setIsGrading(false)

      // Tự động xóa bài làm và reset bước làm về bước 1
      setHsk5Part1Answers({})
      setHsk5Part2Essay('')
      setHsk5Part3Essay('')
      setHsk5Step(1)

      // Tự động load đề mới chưa từng làm
      await generatePrompt('HSK_5', undefined, true)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chấm bài HSK 5.')
    } finally {
      setIsGrading(false)
    }
  }

  // Grade HSK 6
  const gradeHsk6 = async () => {
    if (!hsk6Essay.trim()) {
      setError(isEn ? 'Please write your summary essay before submitting.' : 'Vui lòng viết bài văn tóm tắt trước khi nộp.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const promptText = hsk6Prompt?.content || 'Đề thi tóm tắt HSK 6'
      const essayText = hsk6Essay.trim()

      const data = await callApi({
        action: 'grade_essay',
        type: 'HSK_6',
        prompt: promptText,
        essay: essayText,
        feedbackLang
      })

      setResult(data)
      setResultExamType('HSK_6')
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType: 'HSK_6',
        prompt: promptText,
        essay: essayText,
        result: data
      })

      setIsGrading(false)

      // Tự động xóa bài làm
      setHsk6Essay('')

      // Tự động load đề mới chưa từng làm
      await generatePrompt('HSK_6', undefined, true)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chấm bài HSK 6.')
    } finally {
      setIsGrading(false)
    }
  }

  // Restore history
  const restoreHistory = (item: GradedEssayHistory) => {
    if (item.examType === 'HSK_6') {
      setActiveTab('HSK_6')
      setHsk6Prompt({ content: item.prompt })
      setHsk6Essay(item.essay)
    } else {
      setActiveTab('HSK_5_FULL')
      setHsk5Prompt({ content: item.prompt })
    }
    setResult(item.result)
    setResultExamType(item.examType)
    setShowHistoryModal(false)
  }

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-6">
      {/* Top Header & Settings */}
      <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 sm:mb-5 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              {isEn ? 'HSK Writing Studio (汉语水平考试)' : 'Phòng Luyện Viết HSK (汉语水平考试)'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Standard Hanban exam format: HSK 5 (10 questions - 3 parts) and HSK 6 (400-char summary).'
                : 'Chuẩn format khảo thí: HSK 5 (10 câu - 3 phần trọn bộ) và HSK 6 (Tóm tắt 400 chữ).'}
            </p>
          </div>

          {/* Action buttons - shown on upper row when screen touches edge (< xl) */}
          <div className="flex xl:hidden min-w-0 max-w-full items-center gap-1.5 overflow-x-auto snap-x pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <button
              onClick={() => {
                if (!session) return signIn('google')
                setShowStudentsModal(true)
                loadStudentsData()
              }}
              className="text-xs font-semibold flex items-center gap-1 px-2 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shrink-0 whitespace-nowrap"
            >
              <Users className="w-3 h-3" />
              <span>{isEn ? 'Students' : 'Học viên'}</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-semibold flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 shrink-0 whitespace-nowrap"
            >
              <History className="w-3 h-3 text-blue-600" />
              <span>{isEn ? 'History' : 'Lịch sử'} ({history.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Selection & Desktop Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Tabs - enlarged on desktop */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 max-w-full overflow-x-auto snap-x xl:overflow-x-visible pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { key: 'HSK_5_FULL', title: 'HSK 5', subtitle: isEn ? 'Full (Q91-100)' : 'Trọn bộ (Câu 91-100)', max: '100đ' },
              { key: 'HSK_6', title: 'HSK 6', subtitle: isEn ? 'Summary Essay' : 'Tóm tắt 400 chữ', max: '100đ' },
            ].map(t => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key as any)
                    setError(null)
                  }}
                  className={`shrink-0 snap-start flex flex-col px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border text-left transition-all min-w-[80px] md:min-w-[130px] ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-bold text-xs md:text-sm whitespace-nowrap">{t.title}</span>
                    <span className={`text-[9px] md:text-[11px] font-bold px-1 md:px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.max}
                    </span>
                  </div>
                  <span className={`text-[10px] md:text-xs whitespace-nowrap mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {t.subtitle}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop action buttons - same row as tabs only on large screen (>= xl) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">

            <button
              onClick={() => {
                if (!session) return signIn('google')
                setShowStudentsModal(true)
                loadStudentsData()
              }}
              className="text-xs font-semibold flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 whitespace-nowrap active:scale-95 duration-75"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isEn ? 'Students' : 'Học viên'}</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-semibold flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 whitespace-nowrap active:scale-95 duration-75"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'History' : 'Lịch sử'} ({history.length})</span>
            </button>
          </div>
        </div>

        {/* HSK 5 Step Indicator */}
        {activeTab === 'HSK_5_FULL' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex min-w-0 max-w-full overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              {isEn ? 'HSK 5 Sections:' : 'Các phần thi HSK 5:'}
            </span>
            <div className="flex shrink-0 items-center gap-1.5 text-xs">
              {[
                { step: 1, label: isEn ? 'Part 1: Word Order (Q91-98)' : 'Phần 1: Sắp xếp (Câu 91-98)', done: hsk5P1AnsweredCount > 0 },
                { step: 2, label: isEn ? 'Part 2: Keywords (Q99)' : 'Phần 2: Từ khóa (Câu 99)', done: hsk5P2Count > 0 },
                { step: 3, label: isEn ? 'Part 3: Picture (Q100)' : 'Phần 3: Theo tranh (Câu 100)', done: hsk5P3Count > 0 },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setHsk5Step(s.step as any)}
                  className={`shrink-0 snap-start px-3 py-1 rounded text-xs font-bold transition-colors ${
                    hsk5Step === s.step
                      ? 'bg-blue-600 text-white'
                      : s.done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {s.label} {s.done && '✓'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 [&>div]:min-w-0 gap-3 sm:gap-6 items-start">
        {/* Left Column: Prompt Box */}
        <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex min-w-0 max-w-full overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-100 shrink-0">
              {activeTab === 'HSK_5_FULL'
                ? (hsk5Step === 1 ? 'Phần 1 (Câu 91–98)' :
                   hsk5Step === 2 ? 'Phần 2 (Câu 99)' :
                   'Phần 3 (Câu 100)')
                : 'HSK 6: Tóm tắt 400 chữ'}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {currentPromptObj?.content && (
                <button
                  type="button"
                  onClick={() => {
                    if (!session) return signIn('google')
                    setIsShareModalOpen(true)
                  }}
                  className="text-xs text-blue-600 font-semibold hover:bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95 duration-75"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Share' : 'Chia sẻ'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!session) return signIn('google')
                  generatePrompt(activeTab === 'HSK_5_FULL' ? 'HSK_5' : 'HSK_6')
                }}
                disabled={isGenerating || isGrading}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-all active:scale-95 duration-75 shrink-0 whitespace-nowrap"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{isEn ? 'New Prompt' : 'Đổi đề'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            {!session ? (
              <div className="w-full min-h-[260px] p-6 rounded-xl border border-blue-100 bg-linear-to-b from-blue-50/70 to-white flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {isEn ? 'Sign in to view HSK prompt' : 'Đăng nhập để xem đề thi HSK'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3.5 leading-relaxed">
                  {isEn 
                    ? 'Please sign in with Google to view the official prompt, write your answer, and receive AI evaluation.' 
                    : 'Vui lòng đăng nhập bằng Google để mở khóa xem đề bài, điền câu trả lời và nhận điểm số đánh giá từ AI.'}
                </p>
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 duration-75 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  {isEn ? 'Sign in with Google' : 'Đăng nhập bằng Google'}
                </button>
              </div>
            ) : activeTab === 'HSK_5_FULL' ? (
              !hsk5Data ? (
                <div className="min-h-[260px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500">{isEn ? 'Drawing HSK 5 prompt...' : 'Đang tải đề thi HSK 5...'}</p>
                </div>
              ) : (
                <div>
                  {hsk5Step === 1 && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-2">
                        {isEn ? 'Rearrange given words into complete sentences:' : 'Sắp xếp các từ bị xáo trộn thành câu hoàn chỉnh:'}
                      </p>

                      {/* Mobile view: 1 câu thì 1 ô điền */}
                      <div className="lg:hidden space-y-3">
                        {hsk5Data.part1.map(item => (
                          <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                                {item.id}
                              </span>
                              <p className="font-sans text-slate-800 text-[15px] font-medium leading-relaxed select-all">
                                {item.words}
                              </p>
                            </div>
                            <AnswerInput isEn={isEn} answerLabel={`HSK ${item.id}`}
                              type="text"
                              value={hsk5Part1Answers[item.id] || ''}
                              onValueChange={value => setHsk5Part1Answers(prev => ({ ...prev, [item.id]: value }))}
                              disabled={!session || isGrading}
                              placeholder={!session ? (isEn ? "Sign in to answer..." : "Đăng nhập để điền...") : `Nhập câu hoàn chỉnh cho câu ${item.id}...`}
                              className="w-full px-3 py-2 text-sm bg-slate-50 focus:bg-white rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 transition-all font-sans"
                            />
                          </div>
                        ))}

                        {/* Mobile Next button directly under paired questions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                            Đã làm {hsk5P1AnsweredCount}/8 câu
                          </span>
                          <button
                            type="button"
                            onClick={() => setHsk5Step(2)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 duration-75 flex items-center gap-1.5 shadow-xs"
                          >
                            <span>{isEn ? 'Next: Part 2 (Q99) →' : 'Chuyển sang Phần 2 (Câu 99) →'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Desktop view: Giữ nguyên danh sách đề bài */}
                      <div className="hidden lg:block divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {hsk5Data.part1.map(item => (
                          <div key={item.id} className="p-3 text-sm flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {item.id}
                            </span>
                            <div className="flex-1">
                              <p className="font-sans text-slate-800 text-[15px] font-medium leading-relaxed select-all">
                                {item.words}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hsk5Step === 2 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">
                        {isEn ? 'Write a short paragraph (~80 characters) using all keywords:' : 'Viết một đoạn văn ngắn khoảng 80 chữ kết hợp tất cả các từ khóa sau:'}
                      </p>
                      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg">
                        <span className="text-xs font-bold text-blue-800 block mb-2">Từ khóa yêu cầu (5 từ):</span>
                        <div className="flex flex-wrap gap-2">
                          {hsk5Data.part2.keywords.map((kw, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-blue-200 text-blue-800 text-sm font-bold rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {hsk5Step === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">
                        {isEn ? 'Look at the picture and write a short paragraph (~80 characters):' : 'Quan sát bức tranh và viết một đoạn văn ngắn khoảng 80 chữ miêu tả hành động, cảm xúc:'}
                      </p>
                      {hsk5Data.part3.imageUrl && (
                        <div className="border border-slate-200 rounded-lg p-2 bg-white">
                          <img
                            src={hsk5Data.part3.imageUrl}
                            alt="HSK 5 Visual"
                            className="w-full max-h-[300px] object-contain cursor-pointer"
                            onClick={() => setExpandedImage(hsk5Data.part3.imageUrl)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              /* HSK 6 Prompt Box */
              !hsk6Prompt ? (
                <div className="min-h-[260px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500">{isEn ? 'Drawing HSK 6 text...' : 'Đang tải bài đọc HSK 6...'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Độ dài bài đọc: ~1.000 chữ Hán
                    </span>
                    <button
                      onClick={() => setIsHsk6TextHidden(!isHsk6TextHidden)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {isHsk6TextHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {isHsk6TextHidden ? 'Hiện bài đọc' : 'Ẩn bài đọc (Mô phỏng thi)'}
                    </button>
                  </div>

                  {isHsk6TextHidden ? (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                      Bài đọc đã được thu hồi theo quy chế thi thật. Hãy tập trung viết bản tóm tắt ở cột bên phải.
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed max-h-[460px] overflow-y-auto whitespace-pre-wrap font-sans">
                      {hsk6Prompt.content}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column: Tailored Answer Form */}
        <div className={`h-full ${isEditorExpanded ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-8 flex flex-col overflow-y-auto' : ''} ${activeTab === 'HSK_5_FULL' && hsk5Step === 1 ? 'hidden lg:block' : ''}`}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className={`bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 shadow-xs flex flex-col ${
            isEditorExpanded ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-5 min-h-0 lg:min-h-[460px]'
          }`}>
            <div className="flex min-w-0 items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'HSK_5_FULL'
                  ? (hsk5Step === 1 ? 'Điền đáp án Câu 91–98' : hsk5Step === 2 ? 'Bài viết Câu 99' : 'Bài viết Câu 100')
                  : 'Bản tóm tắt HSK 6 (400 chữ)'}
              </h3>

              <div className="flex items-center gap-2">
                {activeTab === 'HSK_5_FULL' ? (
                  hsk5Step === 2 ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      hsk5P2Count < 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      hsk5P2Count <= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {hsk5P2Count} / ~80 chữ
                    </span>
                  ) : hsk5Step === 3 ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      hsk5P3Count < 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      hsk5P3Count <= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {hsk5P3Count} / ~80 chữ
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Đã làm {hsk5P1AnsweredCount}/8 câu
                    </span>
                  )
                ) : (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    hsk6CharCount < 350 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    hsk6CharCount <= 450 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {hsk6CharCount} / 400 chữ
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title={isEditorExpanded ? 'Thu nhỏ' : 'Phóng to'}
                >
                  {isEditorExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="relative flex-1 flex flex-col">
              {!session && (
                <div 
                  onClick={() => signIn('google')}
                  className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center cursor-pointer p-4 transition-all hover:bg-white/70"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mb-2 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-2.5 text-center">
                    {isEn ? 'Sign in to write and type your answer' : 'Đăng nhập để điền vào ô làm bài và nộp chấm điểm'}
                  </p>
                  <button
                    type="button"
                    onClick={() => signIn('google')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 duration-75 flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    {isEn ? 'Sign in with Google' : 'Đăng nhập Google ngay'}
                  </button>
                </div>
              )}

              {activeTab === 'HSK_5_FULL' ? (
                hsk5Step === 1 ? (
                  /* Step 1: Part 1 - 8 sentence orderings */
                  <div className="flex-1 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {[91, 92, 93, 94, 95, 96, 97, 98].map(qNum => (
                      <div key={qNum} className="flex items-center gap-2">
                        <span className="w-7 text-xs font-bold text-slate-500">{qNum}.</span>
                        <AnswerInput isEn={isEn} answerLabel={`HSK ${qNum}`}
                          type="text"
                          value={hsk5Part1Answers[qNum] || ''}
                          onValueChange={value => setHsk5Part1Answers(prev => ({ ...prev, [qNum]: value }))}
                          disabled={!session || isGrading}
                          placeholder={!session ? (isEn ? "Sign in to answer..." : "Đăng nhập để điền đáp án...") : `Nhập câu hoàn chỉnh cho câu ${qNum}...`}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm outline-none font-sans disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                ) : hsk5Step === 2 ? (
                  /* Step 2: Part 2 - Keywords paragraph */
                  <AnswerTextarea isEn={isEn} answerLabel={"HSK 99"}
                    value={hsk5Part2Essay}
                    onValueChange={value => setHsk5Part2Essay(value)}
                    disabled={!session || isGrading}
                    placeholder={!session ? (isEn ? "Sign in to write essay..." : "Đăng nhập để nhập bài làm...") : "Nhập đoạn văn ngắn khoảng 80 chữ tiếng Hán, kết hợp đủ 5 từ khóa..."}
                    className="flex-1 w-full min-h-[260px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  />
                ) : (
                  /* Step 3: Part 3 - Picture paragraph */
                  <AnswerTextarea isEn={isEn} answerLabel={"HSK 100"}
                    value={hsk5Part3Essay}
                    onValueChange={value => setHsk5Part3Essay(value)}
                    disabled={!session || isGrading}
                    placeholder={!session ? (isEn ? "Sign in to write essay..." : "Đăng nhập để nhập bài làm...") : "Nhập đoạn văn ngắn khoảng 80 chữ tiếng Hán miêu tả tranh..."}
                    className="flex-1 w-full min-h-[260px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  />
                )
              ) : (
                /* HSK 6 Editor */
                <AnswerTextarea isEn={isEn} answerLabel={"HSK 6"}
                  value={hsk6Essay}
                  onValueChange={value => setHsk6Essay(value)}
                  disabled={!session || isGrading}
                  placeholder={!session ? (isEn ? "Sign in to write summary..." : "Đăng nhập để nhập bài tóm tắt...") : "Nhập bài văn tóm tắt khoảng 400 chữ tiếng Hán (tự đặt tiêu đề, không chép nguyên văn, không bình luận cá nhân)..."}
                  className="flex-1 w-full min-h-[280px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
                />
              )}
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <GraderActions value={feedbackLang} onChange={setFeedbackLang} isEn={isEn} disabled={isGrading} languages={['Tiếng Việt', 'English', '中文']}>
                {activeTab === 'HSK_5_FULL' ? (
                <div className="flex flex-col gap-2">
                  {hsk5Step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setHsk5Step((hsk5Step - 1) as any)}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 duration-75"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {isEn ? `Back to Part ${hsk5Step - 1}` : `Quay lại Phần ${hsk5Step - 1}`}
                    </button>
                  ) : null}

                  {hsk5Step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setHsk5Step((hsk5Step + 1) as any)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center gap-1.5 shadow-xs"
                    >
                      {isEn ? `Next to Part ${hsk5Step + 1} →` : `Chuyển sang Phần ${hsk5Step + 1} →`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!session) return signIn('google')
                        gradeHsk5Full()
                      }}
                      disabled={isGrading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isGrading 
                        ? (isEn ? 'Grading full test...' : 'Đang chấm điểm trọn bộ...') 
                        : (!session 
                            ? (isEn ? 'Sign in to Grade Full HSK 5' : 'Đăng nhập để chấm trọn bộ HSK 5')
                            : (isEn ? 'Submit & Grade Full HSK 5 (100 pts)' : 'Nộp bài & Chấm trọn bộ HSK 5 (100đ)'))}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!session) return signIn('google')
                    gradeHsk6()
                  }}
                  disabled={isGrading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isGrading 
                    ? (isEn ? 'Grading...' : 'Đang chấm điểm...') 
                    : (!session 
                        ? (isEn ? 'Sign in to Grade HSK 6' : 'Đăng nhập để chấm HSK 6') 
                        : (isEn ? 'Submit & Grade HSK 6 (100 pts)' : 'Nộp bài & Chấm HSK 6 (100đ)'))}
                </button>
              )}
              </GraderActions>

              {session && (
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  {isEn ? 'Daily quota:' : 'Lượt chấm hôm nay:'} <span className="font-semibold text-slate-600">{usageCount}/{usageLimit}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  {isEn ? 'HSK Grading History' : 'Lịch Sử Chấm Bài HSK'}
                </h3>
                {session?.user?.email ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {session.user.email}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                    Khách
                  </span>
                )}
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                session ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700">{isEn ? 'No submissions yet for this account.' : 'Bạn chưa có bài làm nào được lưu trong tài khoản này.'}</p>
                    <p className="text-slate-400 mt-1">{isEn ? 'Submissions will be automatically saved to your account.' : 'Sau khi nộp bài chấm điểm, toàn bộ kết quả sẽ được lưu tự động vào tài khoản của bạn.'}</p>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <p className="font-semibold text-slate-700">{isEn ? 'You are not logged in.' : 'Bạn chưa đăng nhập tài khoản.'}</p>
                    <p className="text-slate-400 mt-1 mb-3">{isEn ? 'Log in with Google to save your history to your account.' : 'Vui lòng đăng nhập Google để lưu trữ lịch sử làm bài vào tài khoản của bạn.'}</p>
                    <button onClick={() => signIn('google')} className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs">
                      {isEn ? 'Sign in' : 'Đăng nhập Google'}
                    </button>
                  </div>
                )
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {item.examType === 'HSK_5' ? 'HSK 5 (100đ)' : 'HSK 6 (100đ)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 bg-slate-50 p-2 rounded">
                      {item.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        {isEn ? 'Score: ' : 'Điểm: '}
                        <span className="text-blue-600">{item.result?.overallBandFormatted || item.result?.overallBand}</span>
                      </span>
                      <button
                        onClick={() => restoreHistory(item)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {isEn ? 'Review →' : 'Xem lại bài →'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-500">{isEn ? 'Saved to account' : 'Đã lưu vào tài khoản'}</span>
                <button
                  onClick={async () => {
                    if (confirm(isEn ? 'Clear all history?' : 'Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
                      await clearEssayHistory(session?.user?.email || 'anonymous')
                      loadHistory()
                    }
                  }}
                  className="text-red-600 hover:underline font-semibold text-xs"
                >
                  {isEn ? 'Clear all' : 'Xóa tất cả'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Image Viewer */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded visual"
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      )}

      {/* Student Management Modal */}
      {(showStudentsModal) && (<StudentManagementModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        loading={loadingStudents}
        studentsData={studentsData}
        expandedStudentId={expandedStudentId}
        setExpandedStudentId={setExpandedStudentId}
        examTypePrefix="HSK"
      />)}

      {/* Share Exam Modal */}
      {(isShareModalOpen) && (<ShareExamModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onConfirm={handleCreateSharedLink}
      />)}

      {/* Result Modal */}
      {(isGrading || !!result) && (<GradingResultModal
        isOpen={isGrading || !!result}
        onClose={() => setResult(null)}
        isGrading={isGrading}
        result={result}
        examType={resultExamType}
      />)}
    </div>
  )
}

