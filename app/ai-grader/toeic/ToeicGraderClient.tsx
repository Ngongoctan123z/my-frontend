'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  FileEdit, Loader2, RefreshCw, Send, AlertCircle, History, 
  ArrowLeft, ArrowRight, Maximize2, Minimize2, Layers, CheckCircle2,
  Users, Share2, Lock, LogIn
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import { ShareExamModal } from '@/src/components/common/ShareExamModal'
import { StudentManagementModal } from '@/src/components/common/StudentManagementModal'
import { usePathname } from 'next/navigation'
import { TOEIC_PAIRED_SETS, TOEIC_RESPOND_FALLBACKS, TOEIC_ESSAY_FALLBACKS } from '@/src/data/fallbackPrompts'

type ToeicMode = 'TOEIC_FULL' | 'TOEIC_RESPOND' | 'TOEIC_ESSAY'
type PromptObject = { content: string, imageUrl?: string | null }

interface PairedToeicSet {
  id: number
  title: string
  part1: PromptObject
  part2: PromptObject
}

export function ToeicGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<ToeicMode>('TOEIC_FULL')
  const [fullTestStep, setFullTestStep] = useState<1 | 2>(1)
  const [feedbackLang, setFeedbackLang] = useState<string>(isEn ? 'English' : 'Tiếng Việt')

  // Paired full test sets (Part 1 and Part 2 linked by set ID 1-1, 2-2...)
  const [pairedSets, setPairedSets] = useState<PairedToeicSet[]>([])
  const [currentSetIdx, setCurrentSetIdx] = useState<number>(0)
  const [isLoadingSets, setIsLoadingSets] = useState(false)

  // Prompts for Part 1 (Q6-7) and Part 2 (Q8)
  const [promptPart1, setPromptPart1] = useState<PromptObject | null>(null)
  const [promptPart2, setPromptPart2] = useState<PromptObject | null>(null)

  // Essays for Part 1 and Part 2
  const [essayPart1, setEssayPart1] = useState('')
  const [essayPart2, setEssayPart2] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [resultExamType, setResultExamType] = useState<string>('TOEIC_FULL')
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
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

  // Queues for single modes
  const queuePart1 = useRef<PromptObject[]>([])
  const queuePart2 = useRef<PromptObject[]>([])
  const lastActionTimeRef = useRef(0)

  // Call API helper - safe response parsing to prevent unexpected HTML token errors
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
          ? 'AI Service is currently rate-limited or busy. Please try again in a moment.' 
          : 'Dịch vụ AI đang tạm thời bận hoặc chạm giới hạn gọi. Vui lòng thử lại sau ít phút.')
      }
      throw new Error(isEn ? `Server error (${res.status}).` : `Máy chủ phản hồi mã lỗi (${res.status}).`)
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || (isEn ? 'An error occurred.' : 'Đã có lỗi xảy ra.'))
    return data
  }

  // Load usage
  useEffect(() => {
    fetch('/api/ai-grader').then(r => r.json()).then(data => {
      setUsageCount(data.count || 0)
      setUsageLimit(data.limit || 7)
    }).catch(() => {})
  }, [session])

  const isSetAlreadyDone = (set: { title?: string; id?: number; part1?: any; part2?: any }, historyList = history) => {
    return historyList.some(h => {
      const p = (h.prompt || '').toLowerCase()
      if (set.title && p.includes(set.title.toLowerCase())) return true
      if (set.id && (p.includes(`bộ đề số #${set.id}`) || p.includes(`số #${set.id}`))) return true
      if (set.part1?.content && p.includes(set.part1.content.slice(0, 60).toLowerCase())) return true
      if (set.part2?.content && p.includes(set.part2.content.slice(0, 60).toLowerCase())) return true
      return false
    })
  }

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
    const data = await getEssayHistory(email, 'TOEIC')
    setHistory(data)

    // Tự động kiểm tra: Nếu đề TOEIC đang hiển thị đã có trong lịch sử đã làm -> Đổi ngay sang đề chưa làm
    if (data.length > 0) {
      if (activeTab === 'TOEIC_FULL') {
        const currentSet = pairedSets[currentSetIdx]
        if (currentSet && isSetAlreadyDone(currentSet, data)) {
          fetchPairedSets(data)
        }
      } else if (activeTab === 'TOEIC_RESPOND') {
        if (promptPart1 && isPromptDone(promptPart1.content, data)) {
          drawSinglePrompt('TOEIC_RESPOND', data)
        }
      } else {
        if (promptPart2 && isPromptDone(promptPart2.content, data)) {
          drawSinglePrompt('TOEIC_ESSAY', data)
        }
      }
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  // Fetch Paired Sets for Full Test (Links Part 1 and Part 2 together)
  const fetchPairedSets = async (customHistory?: GradedEssayHistory[]) => {
    setIsLoadingSets(true)
    setError(null)
    try {
      const hList = customHistory || history
      const donePrompts = hList.map(h => h.prompt)
      const data = await callApi({ action: 'get_paired_full_test', exam: 'TOEIC', donePrompts })
      if (Array.isArray(data.sets) && data.sets.length > 0) {
        setPairedSets(data.sets)
        const uncompletedIdx = data.sets.findIndex((s: any) => !isSetAlreadyDone(s, hList))
        const chosenIdx = uncompletedIdx >= 0 ? uncompletedIdx : 0
        setCurrentSetIdx(chosenIdx)
        setPromptPart1(data.sets[chosenIdx].part1)
        setPromptPart2(data.sets[chosenIdx].part2)
        setFullTestStep(1)
      } else {
        await Promise.all([drawSinglePrompt('TOEIC_RESPOND', hList), drawSinglePrompt('TOEIC_ESSAY', hList)])
      }
    } catch (err: any) {
      console.warn('Could not load paired sets from API, fallback to local official sets:', err)
      setPairedSets(TOEIC_PAIRED_SETS)
      setCurrentSetIdx(0)
      setPromptPart1(TOEIC_PAIRED_SETS[0].part1)
      setPromptPart2(TOEIC_PAIRED_SETS[0].part2)
      setFullTestStep(1)
    } finally {
      setIsLoadingSets(false)
    }
  }

  // Switch to next paired set (changes both Part 1 and Part 2 simultaneously and resets to step 1)
  const switchPairedSet = async (idx?: number) => {
    setFullTestStep(1)
    setEssayPart1('')
    setEssayPart2('')
    setResult(null)
    setError(null)

    if (pairedSets.length === 0) {
      await fetchPairedSets()
      setFullTestStep(1)
      return
    }
    const nextIdx = typeof idx === 'number' ? idx : (currentSetIdx + 1) % pairedSets.length
    setCurrentSetIdx(nextIdx)
    setPromptPart1(pairedSets[nextIdx].part1)
    setPromptPart2(pairedSets[nextIdx].part2)
  }

  // Draw single prompt for single mode
  const drawSinglePrompt = async (targetType: 'TOEIC_RESPOND' | 'TOEIC_ESSAY', customHistory?: GradedEssayHistory[]) => {
    setIsGenerating(true)
    setError(null)
    try {
      const qRef = targetType === 'TOEIC_RESPOND' ? queuePart1 : queuePart2
      const hList = customHistory || history
      if (qRef.current.length === 0) {
        const donePrompts = hList.map(h => h.prompt)
        const data = await callApi({ action: 'generate_prompt_batch', type: targetType, donePrompts })
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
        if (targetType === 'TOEIC_RESPOND') setPromptPart1(nextPrompt)
        else setPromptPart2(nextPrompt)
      } else {
        const fallback = targetType === 'TOEIC_RESPOND' ? TOEIC_RESPOND_FALLBACKS[0] : TOEIC_ESSAY_FALLBACKS[0]
        if (targetType === 'TOEIC_RESPOND') setPromptPart1(fallback)
        else setPromptPart2(fallback)
      }
    } catch (err: any) {
      console.warn('drawSinglePrompt error, using fallback:', err)
      const fallback = targetType === 'TOEIC_RESPOND' ? TOEIC_RESPOND_FALLBACKS[0] : TOEIC_ESSAY_FALLBACKS[0]
      if (targetType === 'TOEIC_RESPOND') {
        if (!promptPart1) setPromptPart1(fallback)
      } else {
        if (!promptPart2) setPromptPart2(fallback)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    fetchPairedSets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-load prompt when switching to single mode if prompt is missing
  useEffect(() => {
    if (activeTab === 'TOEIC_RESPOND' && !promptPart1) {
      drawSinglePrompt('TOEIC_RESPOND')
    } else if (activeTab === 'TOEIC_ESSAY' && !promptPart2) {
      drawSinglePrompt('TOEIC_ESSAY')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Word count helpers
  const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length
  const wordsPart1 = countWords(essayPart1)
  const wordsPart2 = countWords(essayPart2)

  // Current active prompt & essay
  const activePrompt = (activeTab === 'TOEIC_FULL')
    ? (fullTestStep === 1 ? promptPart1 : promptPart2)
    : (activeTab === 'TOEIC_RESPOND' ? promptPart1 : promptPart2)

  const activeEssay = (activeTab === 'TOEIC_FULL')
    ? (fullTestStep === 1 ? essayPart1 : essayPart2)
    : (activeTab === 'TOEIC_RESPOND' ? essayPart1 : essayPart2)

  const setActiveEssay = (val: string) => {
    if (activeTab === 'TOEIC_FULL') {
      if (fullTestStep === 1) setEssayPart1(val)
      else setEssayPart2(val)
    } else if (activeTab === 'TOEIC_RESPOND') {
      setEssayPart1(val)
    } else {
      setEssayPart2(val)
    }
  }

  const handleCreateSharedLink = async (reqPhone: boolean, reqEmail: boolean): Promise<string | void> => {
    if (!activePrompt?.content?.trim()) {
      alert(isEn ? 'Please draw a prompt first.' : 'Vui lòng bốc đề thi trước.')
      return
    }
    try {
      const currentType = activeTab === 'TOEIC_FULL'
        ? (fullTestStep === 1 ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY')
        : activeTab

      const res = await fetch('/api/shared-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: currentType,
          content: activePrompt.content,
          imageUrl: activePrompt.imageUrl,
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

  // Grade Single Part
  const gradeSingle = async () => {
    const isRespond = activeTab === 'TOEIC_RESPOND'
    const promptObj = isRespond ? promptPart1 : promptPart2
    const currentText = isRespond ? essayPart1.trim() : essayPart2.trim()

    if (!promptObj?.content) {
      setError(isEn ? 'Please draw a prompt first.' : 'Vui lòng bốc đề trước khi nộp.')
      return
    }
    if (!currentText) {
      setError(isEn ? 'Please write your response before submitting.' : 'Vui lòng viết bài trước khi nộp.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const type = isRespond ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY'
      const data = await callApi({
        action: 'grade_essay',
        type,
        prompt: promptObj.content,
        essay: currentText,
        feedbackLang
      })

      setResult(data)
      setResultExamType(type)
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType: type,
        prompt: promptObj.content,
        essay: currentText,
        result: data
      })
      setIsGrading(false)

      // Tự động xóa bài làm
      if (type === 'TOEIC_RESPOND') {
        setEssayPart1('')
      } else {
        setEssayPart2('')
      }
      // Tự động load đề mới chưa từng làm
      await drawSinglePrompt(type)
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chấm bài.')
    } finally {
      setIsGrading(false)
    }
  }

  // Grade Full Test (Both Parts)
  const gradeFullTest = async () => {
    if (!promptPart1?.content || !promptPart2?.content) {
      setError(isEn ? 'Prompts are missing.' : 'Chưa tải đủ đề bài cho cả 2 phần.')
      return
    }
    if (!essayPart1.trim()) {
      setFullTestStep(1)
      setError(isEn ? 'Please complete Part 1 (Email response).' : 'Vui lòng hoàn thành Phần 1 (Trả lời Email).')
      return
    }
    if (!essayPart2.trim()) {
      setFullTestStep(2)
      setError(isEn ? 'Please complete Part 2 (Opinion Essay).' : 'Vui lòng hoàn thành Phần 2 (Viết luận quan điểm).')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const [resPart1, resPart2] = await Promise.all([
        callApi({
          action: 'grade_essay',
          type: 'TOEIC_RESPOND',
          prompt: promptPart1.content,
          essay: essayPart1.trim(),
          feedbackLang
        }),
        callApi({
          action: 'grade_essay',
          type: 'TOEIC_ESSAY',
          prompt: promptPart2.content,
          essay: essayPart2.trim(),
          feedbackLang
        })
      ])

      const s1 = Number(resPart1.overallBand) || 0
      const s2 = Number(resPart2.overallBand) || 0

      // ETS scaled score: 0 to 200 (step 10)
      const rawFraction = (s1 / 4) * 0.4 + (s2 / 5) * 0.6
      const scaledScore = Math.min(200, Math.max(0, Math.round(rawFraction * 20) * 10))

      const currentSetName = pairedSets[currentSetIdx]?.title || 'Bộ đề thi trọn bộ'

      const fullResult = {
        isFullTest: true,
        fullTestType: 'TOEIC',
        overallBand: scaledScore,
        scoreScale: 200,
        overallBandFormatted: `${scaledScore}/200`,
        formula: isEn
          ? `ETS conversion (${currentSetName}): Part 1 (Q6-7: ${s1}/4, weight 40%) + Part 2 (Q8: ${s2}/5, weight 60%) = ${scaledScore}/200 pts`
          : `Quy đổi chuẩn ETS (${currentSetName}): Phần 1 (${s1}/4, hệ số 40%) + Phần 2 (${s2}/5, hệ số 60%) = ${scaledScore}/200 điểm`,
        part1: { ...resPart1, examType: 'TOEIC_RESPOND', scoreScale: 4 },
        part2: { ...resPart2, examType: 'TOEIC_ESSAY', scoreScale: 5 },
        detailedFeedback: isEn
          ? `TOEIC Writing Full Test Results (${currentSetName}):\n• Part 1 (Q6-7 Email): Holistic Score ${s1}/4\n• Part 2 (Q8 Opinion Essay): Holistic Score ${s2}/5\n\nOverall Scaled Score: ${scaledScore}/200.`
          : `Tổng kết bài thi TOEIC Writing (${currentSetName}):\n• Phần 1 (Câu 6-7 Email): Điểm tổng thể ${s1}/4\n• Phần 2 (Câu 8 Nghị luận): Điểm tổng thể ${s2}/5\n\nĐiểm quy đổi chuẩn TOEIC: ${scaledScore}/200.`
      }

      setResult(fullResult)
      setResultExamType('TOEIC_FULL')
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType: 'TOEIC_FULL',
        prompt: `TOEIC Writing Full Test (${currentSetName})\n[Part 1]: ${promptPart1?.content || ''}\n[Part 2]: ${promptPart2?.content || ''}`,
        essay: `[Part 1: Email]\n${essayPart1}\n\n[Part 2: Opinion Essay]\n${essayPart2}`,
        result: fullResult
      })
      setIsGrading(false)

      // Tự động xóa bài làm và reset bước về bước 1
      setEssayPart1('')
      setEssayPart2('')
      setFullTestStep(1)
      // Tự động load bộ đề mới chưa từng làm
      await fetchPairedSets()
      await loadHistory()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chấm bài TOEIC.')
    } finally {
      setIsGrading(false)
    }
  }

  // Restore history
  const restoreHistory = (item: GradedEssayHistory) => {
    if (item.result?.isFullTest) {
      setActiveTab('TOEIC_FULL')
      setFullTestStep(1)
      setResult(item.result)
      setResultExamType('TOEIC_FULL')
      setShowHistoryModal(false)
      return
    }

    if (item.examType === 'TOEIC_RESPOND') {
      setActiveTab('TOEIC_RESPOND')
      setPromptPart1({ content: item.prompt })
      setEssayPart1(item.essay)
    } else {
      setActiveTab('TOEIC_ESSAY')
      setPromptPart2({ content: item.prompt })
      setEssayPart2(item.essay)
    }
    setResult(item.result)
    setResultExamType(item.examType)
    setShowHistoryModal(false)
  }

  return (
    <div className="w-full space-y-3 sm:space-y-6">
      {/* Header & Modes */}
      <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 sm:mb-5 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              {isEn ? 'TOEIC Writing Studio' : 'Phòng Luyện Viết TOEIC Writing'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Practice official ETS tasks: Respond to a written request (Q6-7) & Opinion essay (Q8).'
                : 'Luyện tập chuẩn khảo thí ETS: Trả lời yêu cầu bằng văn bản (Email Q6-7) & Viết luận quan điểm (Q8).'}
            </p>
          </div>

          {/* Action buttons - shown on upper row when screen touches edge (< xl) */}
          <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <span className="font-semibold text-slate-600">{isEn ? 'Lang:' : 'Ngôn ngữ:'}</span>
              <select
                value={feedbackLang}
                onChange={e => setFeedbackLang(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="English">English</option>
              </select>
            </div>

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
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto xl:overflow-x-visible pb-1 xl:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { key: 'TOEIC_FULL', title: isEn ? 'Trọn bộ' : 'Trọn bộ', subtitle: isEn ? 'Q6-8' : 'Q6–8 (200đ)', max: '200đ' },
              { key: 'TOEIC_RESPOND', title: isEn ? 'Email' : 'Email', subtitle: isEn ? 'Q6-7' : 'Câu 6-7', max: '4đ' },
              { key: 'TOEIC_ESSAY', title: isEn ? 'Essay' : 'Luận', subtitle: isEn ? 'Q8' : 'Câu 8', max: '5đ' },
            ].map(t => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key as any)
                    if (t.key === 'TOEIC_FULL') {
                      setFullTestStep(1)
                    }
                    setError(null)
                  }}
                  className={`shrink-0 flex flex-col px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border text-left transition-all min-w-[75px] md:min-w-[120px] ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-bold text-xs md:text-sm whitespace-nowrap">{t.title}</span>
                    <span className={`text-[9px] md:text-[11px] font-bold px-1.5 py-0.5 rounded ${
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
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600">{isEn ? 'Lang:' : 'Ngôn ngữ:'}</span>
              <select
                value={feedbackLang}
                onChange={e => setFeedbackLang(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="English">English</option>
              </select>
            </div>

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

        {/* Full test step indicator */}
        {activeTab === 'TOEIC_FULL' && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5 shrink-0">
              <Layers className="w-4 h-4 text-blue-600" />
              {isEn ? 'Full Test Flow:' : 'Tiến trình thi trọn bộ:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFullTestStep(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  fullTestStep === 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                1. Part 1 (Email Q6-7) {wordsPart1 > 0 && '✓'}
              </button>
              <button
                type="button"
                onClick={() => setFullTestStep(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  fullTestStep === 2 ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                2. Part 2 (Essay Q8) {wordsPart2 > 0 && '✓'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 items-start">
        {/* Left Column: Prompt */}
        <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col min-h-0 lg:min-h-[440px]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-100 shrink-0">
              {(activeTab === 'TOEIC_FULL' ? fullTestStep === 1 : activeTab === 'TOEIC_RESPOND')
                ? (isEn ? 'Part 1: Email (Q6-7)' : 'Phần 1: Email (Câu 6-7)')
                : (isEn ? 'Part 2: Essay (Q8)' : 'Phần 2: Viết luận (Câu 8)')}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {activePrompt?.content && (
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
                  if (activeTab === 'TOEIC_FULL') {
                    switchPairedSet()
                  } else {
                    const target = activeTab === 'TOEIC_RESPOND' ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY'
                    drawSinglePrompt(target)
                  }
                }}
                disabled={isLoadingSets || isGenerating || isGrading}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-colors shrink-0 whitespace-nowrap active:scale-95 duration-75"
              >
                {(isLoadingSets || isGenerating) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{activeTab === 'TOEIC_FULL' 
                  ? (isEn ? 'Change Set' : 'Đổi bộ đề') 
                  : (isEn ? 'New Prompt' : 'Đổi đề')}</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            {!session ? (
              <div className="min-h-[220px] p-6 rounded-xl border border-blue-100 bg-linear-to-b from-blue-50/70 to-white flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {isEn ? 'Sign in to view TOEIC prompt' : 'Đăng nhập để xem đề thi TOEIC'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3.5 leading-relaxed">
                  {isEn 
                    ? 'Please sign in with Google to view the official prompt, write your response, and receive detailed AI evaluation.' 
                    : 'Vui lòng đăng nhập bằng Google để mở khóa đề thi, điền bài làm và nhận điểm số đánh giá từ AI.'}
                </p>
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  {isEn ? 'Sign in with Google' : 'Đăng nhập bằng Google'}
                </button>
              </div>
            ) : !activePrompt ? (
              <div className="min-h-[260px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs text-slate-500 mb-2">{isEn ? 'Loading prompt...' : 'Đang tải đề thi...'}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'TOEIC_FULL') {
                      fetchPairedSets()
                    } else {
                      drawSinglePrompt(activeTab === 'TOEIC_RESPOND' ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY')
                    }
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline transition-colors"
                >
                  {isEn ? 'Click to retry' : 'Nhấn vào đây để tải lại nếu chờ lâu'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {activePrompt.content}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className={`h-full ${isEditorExpanded ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-8 flex flex-col overflow-y-auto' : ''}`}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className={`bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 shadow-xs flex flex-col ${
            isEditorExpanded ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-5 min-h-0 lg:min-h-[440px]'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEn ? 'Your Written Response' : 'Bài làm của bạn'}
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {countWords(activeEssay)} {isEn ? 'words' : 'từ'}
                </span>
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

            <div className="relative flex-1 flex flex-col">
              {!session && (
                <div 
                  onClick={() => signIn('google')}
                  className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center cursor-pointer p-4 transition-all hover:bg-white/65"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mb-2 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-2.5">
                    {isEn ? 'Sign in to write and type your TOEIC essay' : 'Đăng nhập để điền vào ô làm bài và nộp chấm điểm'}
                  </p>
                  <button
                    type="button"
                    onClick={() => signIn('google')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    {isEn ? 'Sign in with Google' : 'Đăng nhập Google ngay'}
                  </button>
                </div>
              )}
              <textarea
                value={activeEssay}
                onChange={e => setActiveEssay(e.target.value)}
                placeholder={
                  !session
                    ? (isEn ? 'Please sign in to write your response...' : 'Vui lòng đăng nhập để bắt đầu làm bài...')
                    : (activeTab === 'TOEIC_FULL' ? fullTestStep === 1 : activeTab === 'TOEIC_RESPOND')
                      ? (isEn ? 'Write your email response here...' : 'Nhập email trả lời của bạn ở đây...')
                      : (isEn ? 'Write your opinion essay here (recommended 300+ words)...' : 'Nhập bài luận quan điểm ở đây (khuyến nghị 300+ từ)...')
                }
                disabled={!session || isGrading}
                className="flex-1 w-full min-h-[260px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              {activeTab === 'TOEIC_FULL' ? (
                <div className="flex items-center justify-between gap-3">
                  {fullTestStep === 2 ? (
                    <button
                      type="button"
                      onClick={() => setFullTestStep(1)}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {isEn ? 'Back to Part 1' : 'Quay lại Part 1'}
                    </button>
                  ) : <div />}

                  {fullTestStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!session) return signIn('google')
                        setFullTestStep(2)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                    >
                      {isEn ? 'Next to Part 2 →' : 'Chuyển sang Part 2 →'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!session) return signIn('google')
                        gradeFullTest()
                      }}
                      disabled={isGrading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : (!session ? <LogIn className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                      {isGrading ? (isEn ? 'Grading full test...' : 'Đang chấm điểm trọn bộ...') : (session ? (isEn ? 'Submit & Grade Full Test (200 pts)' : 'Nộp bài & Chấm trọn bộ (200đ)') : (isEn ? 'Sign in with Google to Grade' : 'Đăng nhập Google để Chấm điểm'))}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!session) return signIn('google')
                    gradeSingle()
                  }}
                  disabled={isGrading || !activePrompt}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : (!session ? <LogIn className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                  {isGrading ? (isEn ? 'Grading...' : 'Đang chấm điểm...') : (session ? (isEn ? 'Submit & Grade Essay' : 'Nộp bài & Chấm điểm') : (isEn ? 'Sign in with Google to Grade' : 'Đăng nhập Google để Chấm điểm'))}
                </button>
              )}

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
                  {isEn ? 'TOEIC Grading History' : 'Lịch Sử Chấm Bài TOEIC'}
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
                        {item.examType === 'TOEIC_FULL' ? 'Thi trọn bộ (200đ)' : item.examType === 'TOEIC_RESPOND' ? 'Part 1 (Email)' : 'Part 2 (Essay)'}
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

      {/* Student Management Modal */}
      <StudentManagementModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        loading={loadingStudents}
        studentsData={studentsData}
        expandedStudentId={expandedStudentId}
        setExpandedStudentId={setExpandedStudentId}
        examTypePrefix="TOEIC"
      />

      {/* Share Exam Modal */}
      <ShareExamModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onConfirm={handleCreateSharedLink}
      />

      {/* Result Modal */}
      <GradingResultModal
        isOpen={isGrading || !!result}
        onClose={() => setResult(null)}
        isGrading={isGrading}
        result={result}
        examType={resultExamType}
      />
    </div>
  )
}
