'use client'

import dynamic from 'next/dynamic'
import { PracticeAccessGate } from '@/src/components/auth/PracticeAccessGate'
import { StudentAccessButton } from '@/src/components/common/StudentAccessButton'
import { AnswerTextarea, GraderActions } from '@/src/components/common/GraderControls'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight, Share2, Copy, Users, Maximize2, Minimize2, Play, Pause, Square,  Lock, LogIn } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'


import { IELTS_PAIRED_SETS, IELTS_TASK_1_FALLBACKS, IELTS_TASK_2_FALLBACKS } from '@/src/data/fallbackPrompts'

const GradingResultModal = dynamic(() => import('@/src/components/common/GradingResultModal').then(module => module.GradingResultModal))
const ShareExamModal = dynamic(() => import('@/src/components/common/ShareExamModal').then(module => module.ShareExamModal))
const StudentManagementModal = dynamic(() => import('@/src/components/common/StudentManagementModal').then(module => module.StudentManagementModal))

type ExamType = 'IELTS_TASK_1' | 'IELTS_TASK_2' | 'IELTS_FULL'
type PromptObject = { content: string, imageUrl?: string | null }

interface PairedIeltsSet {
  id: number
  title: string
  part1: PromptObject
  part2: PromptObject
}

const ImageWithProgress = ({ src, onClick, isEn }: { src: string, onClick: () => void, isEn: boolean }) => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  
  useEffect(() => {
    setLoading(true)
    setProgress(0)
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return 90;
        return p + Math.random() * 10 + 5;
      })
    }, 150)
    progressTimer.current = interval
    
    return () => clearInterval(interval)
  }, [src])

  return (
    <div className="relative group cursor-pointer w-full min-h-[250px] flex items-center justify-center bg-slate-50/50 rounded-lg overflow-hidden border border-slate-100" onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 p-4">
          <div className="w-full max-w-[200px] space-y-3">
             <div className="flex justify-between text-xs font-bold text-slate-600">
               <span>{isEn ? 'Loading chart...' : 'Đang tải biểu đồ...'}</span>
               <span>{Math.floor(progress)}%</span>
             </div>
             <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-blue-500 transition-all duration-200 ease-out" style={{ width: `${progress}%` }}></div>
             </div>
          </div>
        </div>
      )}
      <img 
        src={src} 
        alt="Chart/Graph" 
        className={`w-full h-auto max-h-[500px] object-contain transition-all duration-500 group-hover:opacity-90 ${loading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}
        onLoad={() => {
          if (progressTimer.current) clearInterval(progressTimer.current)
          setProgress(100)
          setLoading(false)
        }}
        onError={() => {
          if (progressTimer.current) clearInterval(progressTimer.current)
          setLoading(false)
        }}
      />
      {!loading && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
          <div className="bg-white/90 p-3 rounded-full shadow-lg text-slate-700 transform group-hover:scale-110 transition-all">
            <Maximize2 className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  )
}

export function AiGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const practiceOwner = status === 'authenticated' ? session?.user?.email || null : null
  const practiceOwnerRef = useRef(practiceOwner)
  practiceOwnerRef.current = practiceOwner
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
  const [feedbackLang, setFeedbackLang] = useState<string>(isEn ? 'English' : 'Tiếng Việt')

  // Paired full test sets (Task 1 and Task 2 linked by set ID 1-1, 2-2...)
  const [pairedSets, setPairedSets] = useState<PairedIeltsSet[]>([])
  const [currentSetIdx, setCurrentSetIdx] = useState<number>(0)
  const [isLoadingSets, setIsLoadingSets] = useState(false)

  // Per-task prompts and essays
  const [task1Prompt, setTask1Prompt] = useState<PromptObject | null>(null)
  const [task1Essay, setTask1Essay] = useState('')
  const [task2Prompt, setTask2Prompt] = useState<PromptObject | null>(null)
  const [task2Essay, setTask2Essay] = useState('')

  // Full Test active step (1 = Task 1, 2 = Task 2)
  const [fullStep, setFullStep] = useState<1 | 2>(1)

  // General UI States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  
  // Timer states
  const [examPhase, setExamPhase] = useState<'setup' | 'reading' | 'writing' | 'finished'>('setup')
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (examPhase === 'setup' || examPhase === 'finished' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examPhase, isPaused])

  const handleTimeUp = () => {
    alert(isEn ? 'Time is up! Please submit your work.' : 'Đã hết giờ làm bài! Vui lòng nộp bài.')
    setExamPhase('finished')
  }

  const startExam = () => {
    if (!practiceOwner) return void signIn('google', { callbackUrl: window.location.href })
    const currentActivePrompt = (examType === 'IELTS_TASK_1' || (examType === 'IELTS_FULL' && fullStep === 1)) ? task1Prompt : task2Prompt
    if (!currentActivePrompt?.content) {
      alert(isEn ? 'Please generate or input a prompt first.' : 'Vui lòng bốc đề hoặc nhập đề trước.')
      return
    }
    setExamPhase('writing')
    if (examType === 'IELTS_TASK_1') setTimeLeft(20 * 60)
    else if (examType === 'IELTS_TASK_2') setTimeLeft(40 * 60)
    else setTimeLeft(60 * 60) // Full test: 60 minutes
    setIsPaused(false)
  }

  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(7)
  const [userPlan, setUserPlan] = useState<string>('free')

  useEffect(() => {
    const email = practiceOwner
    let active = true
    fetch('/api/ai-grader').then(r => r.json()).then(data => {
      if (!active || practiceOwnerRef.current !== email) return
      setUsageCount(data.count || 0)
      setUsageLimit(data.limit || 7)
    }).catch(() => {})

    if (email) {
      fetch('/api/profile').then(r => r.json()).then(data => {
        if (active && practiceOwnerRef.current === email && data?.plan) setUserPlan(data.plan)
      }).catch(() => {})
    }
    return () => { active = false }
  }, [status, session?.user?.email])

  const [history, setHistory] = useState<GradedEssayHistory[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [studentsData, setStudentsData] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)

  const loadStudentsData = async () => {
    const email = practiceOwner
    if (!email) return
    setLoadingStudents(true)
    try {
      const res = await fetch('/api/shared-exams/submissions')
      const data = await res.json()
      if (practiceOwnerRef.current === email) setStudentsData(data.submissions || [])
    } catch (e) {
      console.error(e)
    } finally {
      if (practiceOwnerRef.current === email) setLoadingStudents(false)
    }
  }

  // Dọn dẹp bộ nhớ tạm draft trên trình duyệt (chỉ lưu kết quả vào database)
  useEffect(() => {
    try {
      localStorage.removeItem('draft_ielts_t1_essay')
      localStorage.removeItem('draft_ielts_t1_prompt')
      localStorage.removeItem('draft_ielts_t2_essay')
      localStorage.removeItem('draft_ielts_t2_prompt')
      localStorage.removeItem('draft_ielts_examType')
      localStorage.removeItem('draft_ielts_essay')
      localStorage.removeItem('draft_ielts_prompt')
    } catch {}
    fetchPairedSets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-load prompt when switching to single task mode if prompt is missing
  useEffect(() => {
    if (examType === 'IELTS_TASK_1' && !task1Prompt) {
      generatePrompt('IELTS_TASK_1')
    } else if (examType === 'IELTS_TASK_2' && !task2Prompt) {
      generatePrompt('IELTS_TASK_2')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType])

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


  useEffect(() => {
    setHistory([])
    setStudentsData([])
    setShowStudentsModal(false)
    setShowHistoryModal(false)
    setIsShareModalOpen(false)
    setExpandedStudentId(null)
    setLoadingStudents(false)
    setResult(null)
    setIsGrading(false)
    setIsEditorExpanded(false)
    setTask1Essay('')
    setTask2Essay('')
    setUserPlan('free')
    setExamPhase('setup')
    setTimeLeft(0)
  }, [practiceOwner])

  const loadHistory = async () => {
    const email = session?.user?.email
    if (status !== 'authenticated' || !email || practiceOwnerRef.current !== email) return
    const data = await getEssayHistory(email, 'IELTS')
    if (practiceOwnerRef.current !== email) return
    setHistory(data)

    // Tự động kiểm tra: Nếu đề đang hiển thị đã làm rồi, bốc ngay đề mới chưa làm
    if (data.length > 0) {
      if (examType === 'IELTS_FULL') {
        const currentSet = pairedSets[currentSetIdx]
        if (currentSet && isSetAlreadyDone(currentSet, data)) {
          fetchPairedSets(data)
        }
      } else {
        if (task1Prompt && isPromptDone(task1Prompt.content, data)) {
          generatePrompt('IELTS_TASK_1')
        }
        if (task2Prompt && isPromptDone(task2Prompt.content, data)) {
          generatePrompt('IELTS_TASK_2')
        }
      }
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email])

  const promptQueueT1 = useRef<PromptObject[]>([])
  const promptQueueT2 = useRef<PromptObject[]>([])
  const isFetchingT1 = useRef(false)
  const isFetchingT2 = useRef(false)
  const lastClickTimeRef = useRef(0)

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
    if (!res.ok) {
      throw new Error(data.error || (isEn ? 'An error occurred.' : 'Đã có lỗi xảy ra.'))
    }
    return data
  }

  // Fetch Paired Sets for Full Test (Links Task 1 and Task 2 together by set ID 1-1, 2-2...)
  const fetchPairedSets = async (customHistory?: GradedEssayHistory[]) => {
    setIsLoadingSets(true)
    setError(null)
    try {
      const hList = customHistory || history
      const donePrompts = hList.map(h => h.prompt)
      const data = await callApi({ action: 'get_paired_full_test', exam: 'IELTS', donePrompts })
      if (Array.isArray(data.sets) && data.sets.length > 0) {
        setPairedSets(data.sets)
        // Tìm bộ đề đầu tiên chưa làm trong lịch sử
        const uncompletedIdx = data.sets.findIndex((s: any) => !isSetAlreadyDone(s, hList))
        const chosenIdx = uncompletedIdx >= 0 ? uncompletedIdx : 0
        setCurrentSetIdx(chosenIdx)
        setTask1Prompt(data.sets[chosenIdx].part1)
        setTask2Prompt(data.sets[chosenIdx].part2)
      } else {
        setPairedSets(IELTS_PAIRED_SETS)
        setCurrentSetIdx(0)
        setTask1Prompt(IELTS_PAIRED_SETS[0].part1)
        setTask2Prompt(IELTS_PAIRED_SETS[0].part2)
      }
    } catch (err: any) {
      console.warn('Could not load paired IELTS sets, fallback to local official sets:', err)
      setPairedSets(IELTS_PAIRED_SETS)
      setCurrentSetIdx(0)
      setTask1Prompt(IELTS_PAIRED_SETS[0].part1)
      setTask2Prompt(IELTS_PAIRED_SETS[0].part2)
    } finally {
      setIsLoadingSets(false)
    }
  }

  // Switch to next paired set (changes both Task 1 and Task 2 simultaneously and resets to Task 1)
  const switchPairedSet = async (idx?: number) => {
    setFullStep(1)
    setTask1Essay('')
    setTask2Essay('')
    setResult(null)
    setError(null)

    if (pairedSets.length === 0) {
      await fetchPairedSets()
      setFullStep(1)
      return
    }
    const nextIdx = typeof idx === 'number' ? idx : (currentSetIdx + 1) % pairedSets.length
    setCurrentSetIdx(nextIdx)
    setTask1Prompt(pairedSets[nextIdx].part1)
    setTask2Prompt(pairedSets[nextIdx].part2)
  }

  const generatePrompt = async (targetType?: 'IELTS_TASK_1' | 'IELTS_TASK_2', force = false) => {
    const now = Date.now()
    if (!force && (isGenerating || isGrading || now - lastClickTimeRef.current < 200)) return
    lastClickTimeRef.current = now
    setError(null)

    const reqType = targetType || (examType === 'IELTS_TASK_1' || (examType === 'IELTS_FULL' && fullStep === 1) ? 'IELTS_TASK_1' : 'IELTS_TASK_2')
    const qRef = reqType === 'IELTS_TASK_1' ? promptQueueT1 : promptQueueT2

    if (qRef.current.length === 0) {
      setIsGenerating(true)
      try {
        const donePrompts = history.map(h => h.prompt)
        const data = await callApi({ action: 'generate_prompt_batch', type: reqType, donePrompts })
        qRef.current = data.prompts || []
      } catch (err: any) {
        console.warn('generatePrompt error, using fallback:', err)
        const fb = reqType === 'IELTS_TASK_1' ? IELTS_TASK_1_FALLBACKS[0] : IELTS_TASK_2_FALLBACKS[0]
        qRef.current = [fb]
      }
      setIsGenerating(false)
    }

    // Bỏ qua đề đã làm nếu còn đề chưa làm trong queue
    while (qRef.current.length > 1 && isPromptDone(qRef.current[0].content, history)) {
      qRef.current.shift()
    }

    const nextPrompt = qRef.current.shift()
    if (nextPrompt) {
      if (reqType === 'IELTS_TASK_1') setTask1Prompt(nextPrompt)
      else setTask2Prompt(nextPrompt)
    } else {
      const fb = reqType === 'IELTS_TASK_1' ? IELTS_TASK_1_FALLBACKS[0] : IELTS_TASK_2_FALLBACKS[0]
      if (reqType === 'IELTS_TASK_1') setTask1Prompt(fb)
      else setTask2Prompt(fb)
    }
  }

  // Active prompt and essay based on current mode and step
  const isViewingTask1 = examType === 'IELTS_TASK_1' || (examType === 'IELTS_FULL' && fullStep === 1)
  const activePrompt = isViewingTask1 ? task1Prompt : task2Prompt
  const activeEssay = isViewingTask1 ? task1Essay : task2Essay
  const setActiveEssay = isViewingTask1 ? setTask1Essay : setTask2Essay

  const wordCount = useMemo(() => activeEssay.trim() ? activeEssay.trim().split(/\s+/).length : 0, [activeEssay])
  const minWords = isViewingTask1 ? 150 : 250

  const handleCreateSharedLink = async (reqPhone: boolean, reqEmail: boolean): Promise<string | void> => {
    if (!activePrompt?.content?.trim()) {
      throw new Error(isEn ? 'Please generate a prompt first.' : 'Vui lòng tạo hoặc nhập đề trước.')
    }
    
    try {
      const res = await fetch('/api/shared-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: isViewingTask1 ? 'IELTS_TASK_1' : 'IELTS_TASK_2',
          content: activePrompt.content,
          imageUrl: activePrompt.imageUrl,
          imageDescription: (activePrompt as any).imageDescription,
          requirePhone: reqPhone,
          requireEmail: reqEmail
        })
      })
      const data = await res.json()
      if (res.ok) {
        return `${window.location.origin}${isEn ? '/en' : ''}/shared/${data.id}`
      } else {
        throw new Error(data.error || (isEn ? 'Failed to create link' : 'Không thể tạo liên kết, vui lòng thử lại sau.'))
      }
    } catch (failure) {
      throw failure instanceof Error ? failure : new Error(isEn ? 'Error creating link' : 'Không thể tạo liên kết, vui lòng thử lại sau.')
    }
  }

  // Submit and Grade
  const gradeEssay = async () => {
    const gradingOwner = practiceOwner
    if (!gradingOwner || practiceOwnerRef.current !== gradingOwner) return
    const isCurrentOwner = () => practiceOwnerRef.current === gradingOwner
    const now = Date.now()
    if (isGrading || isGenerating || now - lastClickTimeRef.current < 1200) return
    lastClickTimeRef.current = now

    // FULL TEST MODE GRADING
    if (examType === 'IELTS_FULL') {
      if (!task1Prompt?.content || !task2Prompt?.content) {
        setError(isEn ? 'Please ensure prompts for both tasks are loaded.' : 'Vui lòng đảm bảo cả 2 đề thi đã được tải.')
        return
      }
      if (!task1Essay.trim() && !task2Essay.trim()) {
        setError(isEn ? 'Please write your response for at least one task before submitting.' : 'Vui lòng làm ít nhất một Task trước khi nộp bài.')
        return
      }

      setIsGrading(true)
      setError(null)
      setResult(null)

      try {
        const promises: Promise<any>[] = []

        // Grade Task 1
        promises.push(
          task1Essay.trim()
            ? callApi({
                action: 'grade_essay',
                type: 'IELTS_TASK_1',
                prompt: task1Prompt.content,
                essay: task1Essay.trim(),
                imageUrl: task1Prompt.imageUrl,
                imageDescription: (task1Prompt as any).imageDescription,
                feedbackLang
              })
            : Promise.resolve({
                overallBand: 0,
                scoreScale: 9,
                wordCount: 0,
                criteria: {
                  taskAchievement: { score: 0, feedback: isEn ? 'Task 1 was left blank' : 'Task 1 chưa làm bài' },
                  coherenceCohesion: { score: 0, feedback: '' },
                  lexicalResource: { score: 0, feedback: '' },
                  grammaticalRange: { score: 0, feedback: '' }
                },
                detailedFeedback: isEn ? 'Task 1 was left unattempted.' : 'Thí sinh không làm bài Task 1.',
                corrections: []
              })
        )

        // Grade Task 2
        promises.push(
          task2Essay.trim()
            ? callApi({
                action: 'grade_essay',
                type: 'IELTS_TASK_2',
                prompt: task2Prompt.content,
                essay: task2Essay.trim(),
                feedbackLang
              })
            : Promise.resolve({
                overallBand: 0,
                scoreScale: 9,
                wordCount: 0,
                criteria: {
                  taskResponse: { score: 0, feedback: isEn ? 'Task 2 was left blank' : 'Task 2 chưa làm bài' },
                  coherenceCohesion: { score: 0, feedback: '' },
                  lexicalResource: { score: 0, feedback: '' },
                  grammaticalRange: { score: 0, feedback: '' }
                },
                detailedFeedback: isEn ? 'Task 2 was left unattempted.' : 'Thí sinh không làm bài Task 2.',
                corrections: []
              })
        )

        const [t1Res, t2Res] = await Promise.all(promises)
        
        // Official IELTS formula: (Task 1 * 1 + Task 2 * 2) / 3, rounded to nearest 0.5
        const combinedBand = Math.round(((t1Res.overallBand * 1 + t2Res.overallBand * 2) / 3) * 2) / 2

        const currentSetName = pairedSets[currentSetIdx]?.title || 'Bộ đề số #1'

        const fullResult = {
          isFullTest: true,
          fullTestType: 'IELTS',
          overallBand: combinedBand,
          overallBandFormatted: `${combinedBand}/9`,
          scoreScale: 9,
          task1: { ...t1Res, examType: 'IELTS_TASK_1', scoreScale: 9 },
          task2: { ...t2Res, examType: 'IELTS_TASK_2', scoreScale: 9 },
          criteria: t2Res.criteria,
          formula: isEn
            ? `Official IELTS formula (${currentSetName}): (Task 1 × 1 + Task 2 × 2) / 3 = Band ${combinedBand}`
            : `Barem chính thức (${currentSetName}): (Task 1 × 1 + Task 2 × 2) / 3 = Band ${combinedBand}`,
          detailedFeedback: `Task 1 (Band ${t1Res.overallBand}):\n${t1Res.detailedFeedback}\n\nTask 2 (Band ${t2Res.overallBand}):\n${t2Res.detailedFeedback}`,
          corrections: [...(t1Res.corrections || []), ...(t2Res.corrections || [])]
        }

        if (!isCurrentOwner()) return
        setResult(fullResult)
        setUsageCount(prev => prev + 2)

        await saveEssayHistory({
          email: gradingOwner,
          examType: 'IELTS_FULL',
          prompt: `IELTS Full Test (${currentSetName})\n[Task 1]: ${task1Prompt?.content || ''}\n[Task 2]: ${task2Prompt?.content || ''}`,
          essay: `=== TASK 1 (Academic) ===\n${task1Essay.trim()}\n\n=== TASK 2 (Essay) ===\n${task2Essay.trim()}`,
          result: fullResult
        })
        if (!isCurrentOwner()) return
        setIsGrading(false)

        // Tự động xóa bài làm và reset bước làm bài về bước 1
        setTask1Essay('')
        setTask2Essay('')
        setFullStep(1)

        try {
          localStorage.removeItem('draft_ielts_t1_essay')
          localStorage.removeItem('draft_ielts_t1_prompt')
          localStorage.removeItem('draft_ielts_t2_essay')
          localStorage.removeItem('draft_ielts_t2_prompt')
          localStorage.removeItem('draft_ielts_essay')
          localStorage.removeItem('draft_ielts_prompt')
        } catch {}

        // Tự động bốc bộ đề mới chưa từng làm
        await fetchPairedSets()
        if (!isCurrentOwner()) return
        await loadHistory()
        if (!isCurrentOwner()) return
      } catch (err: any) {
        if (!isCurrentOwner()) return
        setError(err.message)
      } finally {
        if (isCurrentOwner()) setIsGrading(false)
      }
      return
    }

    // SINGLE TASK GRADING
    if (!activePrompt?.content?.trim()) {
      setError(isEn ? 'Please generate a prompt before grading.' : 'Vui lòng tạo đề trước khi chấm.')
      return
    }

    const finalEssay = activeEssay.trim()
    if (!finalEssay) {
      setError(isEn ? 'Please write your essay before submitting.' : 'Vui lòng viết bài trước khi nộp.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({
        action: 'grade_essay',
        type: examType,
        prompt: activePrompt.content,
        essay: finalEssay,
        imageUrl: activePrompt.imageUrl,
        imageDescription: (activePrompt as any).imageDescription || undefined,
        feedbackLang
      })
      if (!isCurrentOwner()) return
      setResult(data)
      setUsageCount(prev => prev + 1)
      
      await saveEssayHistory({
        email: gradingOwner,
        examType,
        prompt: activePrompt.content,
        essay: finalEssay,
        result: data
      })
      if (!isCurrentOwner()) return

      setIsGrading(false)

      // Tự động xóa bài làm
      if (examType === 'IELTS_TASK_1') {
        setTask1Essay('')
      } else {
        setTask2Essay('')
      }

      try {
        if (examType === 'IELTS_TASK_1') {
          localStorage.removeItem('draft_ielts_t1_essay')
          localStorage.removeItem('draft_ielts_t1_prompt')
        } else {
          localStorage.removeItem('draft_ielts_t2_essay')
          localStorage.removeItem('draft_ielts_t2_prompt')
        }
      } catch {}

      // Tự động load đề mới chưa từng làm
      await generatePrompt(examType, true)
      if (!isCurrentOwner()) return
      await loadHistory()
      if (!isCurrentOwner()) return
    } catch (err: any) {
      if (!isCurrentOwner()) return
      setError(err.message)
    } finally {
      if (isCurrentOwner()) setIsGrading(false)
    }
  }

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-6">
      {/* Top Header & Modes Card - Matching TOEIC Luxury Design */}
      <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 sm:mb-5 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              {isEn ? 'IELTS Writing Studio' : 'Phòng Luyện Viết IELTS Writing'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Official Cambridge IELTS standard: Academic Task 1 (Charts & Reports) & Task 2 (Discursive Essay).'
                : 'Luyện tập chuẩn khảo thí Cambridge IELTS: Task 1 (Phân tích biểu đồ/bản đồ) & Task 2 (Nghị luận xã hội).'}
            </p>
          </div>

          {/* Action buttons - shown on upper row when screen touches edge (< xl) */}
          <div className="flex xl:hidden min-w-0 max-w-full items-center gap-1.5 overflow-x-auto snap-x pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

            <StudentAccessButton isEn={isEn} onClick={() => {
                if (!session?.user?.email) return void signIn('google', { callbackUrl: window.location.href })
                setShowStudentsModal(true)
                void loadStudentsData()
              }} />

            <button 
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-semibold flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 shrink-0 whitespace-nowrap active:scale-95 duration-75"
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
              { 
                key: 'IELTS_FULL', 
                title: isEn ? 'Trọn bộ' : 'Trọn bộ', 
                subtitle: isEn ? 'Task 1+2' : 'Task 1+2', 
                max: '9.0' 
              },
              { 
                key: 'IELTS_TASK_1', 
                title: 'Task 1', 
                subtitle: isEn ? 'Academic' : 'Biểu đồ', 
                max: '1/3' 
              },
              { 
                key: 'IELTS_TASK_2', 
                title: 'Task 2', 
                subtitle: isEn ? 'Essay' : 'Nghị luận', 
                max: '2/3' 
              },
            ].map(t => {
              const isActive = examType === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setExamType(t.key as any)
                    if (t.key === 'IELTS_FULL') {
                      setFullStep(1)
                    }
                    setResult(null)
                    setExamPhase('setup')
                    setError(null)
                  }}
                  className={`shrink-0 snap-start flex flex-col px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border text-left transition-all active:scale-98 duration-75 min-w-[80px] md:min-w-[120px] ${
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

            <StudentAccessButton isEn={isEn} onClick={() => {
                if (!session?.user?.email) return void signIn('google', { callbackUrl: window.location.href })
                setShowStudentsModal(true)
                void loadStudentsData()
              }} />

            <button 
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-semibold flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 whitespace-nowrap active:scale-95 duration-75"
            >
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'History' : 'Lịch sử'} ({history.length})</span>
            </button>
          </div>
        </div>


      </div>

      {/* Main Two-Column Layout */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 [&>div]:min-w-0 gap-3 sm:gap-6 items-start">
        {/* Left Column: Prompt */}
        <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex min-w-0 max-w-full overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-100 shrink-0">
              {examType === 'IELTS_FULL' 
                ? (fullStep === 1 ? 'Task 1 (Academic)' : 'Task 2 (Essay)')
                : (examType === 'IELTS_TASK_1' ? 'Task 1 (Academic)' : 'Task 2 (Essay)')}
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
                  if (examType === 'IELTS_FULL') {
                    switchPairedSet()
                  } else {
                    generatePrompt()
                  }
                }}
                disabled={isLoadingSets || isGenerating || isGrading}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50 transition-colors shrink-0 whitespace-nowrap active:scale-95 duration-75"
              >
                {(isLoadingSets || isGenerating) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{examType === 'IELTS_FULL' 
                  ? (isEn ? 'Change Set' : 'Đổi bộ đề')
                  : (isEn ? 'New Prompt' : 'Đổi đề')}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {(
              <>
                {practiceOwner && userPlan === 'pro' && !activePrompt?.imageUrl ? (
                  <div className="space-y-1">
                    <textarea 
                      value={activePrompt?.content || ''}
                      onChange={(e) => {
                        const updated = activePrompt ? { ...activePrompt, content: e.target.value } : { content: e.target.value }
                        if (isViewingTask1) setTask1Prompt(updated)
                        else setTask2Prompt(updated)
                      }}
                      placeholder={isEn ? "Enter custom prompt..." : "Nhập đề thi tùy chỉnh hoặc bấm 'Bốc đề ngẫu nhiên'..."}
                      className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm whitespace-pre-wrap resize-y"
                    />
                  </div>
                ) : (
                  !activePrompt?.imageUrl && (
                    <div className="w-full min-h-[120px] p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed select-text">
                      {activePrompt ? activePrompt.content : (isEn ? "Loading prompt..." : "Đang tải đề thi...")}
                    </div>
                  )
                )}

                {/* Chart Image Display */}
                {activePrompt?.imageUrl && (
                  <div className="mt-4 space-y-2 border border-slate-200 rounded-lg overflow-hidden bg-white p-2 shadow-xs">
                    <ImageWithProgress src={activePrompt.imageUrl} onClick={() => setExpandedImage(activePrompt.imageUrl!)} isEn={isEn} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Editor */}
        <PracticeAccessGate authenticated={status === 'authenticated' && !!session?.user?.email} loading={status === 'loading'} isEn={isEn}>
        <div className={`h-full ${isEditorExpanded ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-8 flex flex-col overflow-y-auto' : ''}`}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          <div className={`bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 shadow-xs flex flex-col ${isEditorExpanded ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-6'}`}>
            <div className="flex min-w-0 items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEn 
                  ? (isViewingTask1 ? 'Task 1 Response' : 'Task 2 Response') 
                  : (isViewingTask1 ? 'Bài làm Task 1 (Academic)' : 'Bài làm Task 2 (Essay)')}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${wordCount >= minWords ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-100 text-slate-700'}`}>
                  {wordCount} / {minWords} {isEn ? 'words' : 'từ'}
                </span>
                <button 
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title={isEditorExpanded ? (isEn ? 'Minimize' : 'Thu nhỏ') : (isEn ? 'Expand' : 'Phóng to')}
                >
                  {isEditorExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col">

              <AnswerTextarea isEn={isEn} answerLabel={isEn ? "Your answer" : "Bài làm của bạn"}
                value={activeEssay}
                onValueChange={value => setActiveEssay(value)}
                placeholder={!session ? (isEn ? "Please sign in to write your essay..." : "Vui lòng đăng nhập để bắt đầu làm bài...") : (isEn ? "Write your essay here..." : "Viết bài làm của bạn vào đây...")}
                disabled={!session || isGrading}
                className="flex-1 w-full min-h-[220px] sm:min-h-[280px] p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y text-base leading-relaxed font-sans disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Action buttons depending on mode */}
            <div className="mt-6">
              <GraderActions value={feedbackLang} onChange={setFeedbackLang} isEn={isEn} disabled={isGrading} languages={['Tiếng Việt', 'English', '한국어', '中文', '日本語']}>
                {examType === 'IELTS_FULL' ? (
              fullStep === 1 ? (
                <button
                  onClick={() => {
                    if (!session) return signIn('google')
                    if (!task1Essay.trim()) {
                      const proceed = confirm(isEn ? 'Task 1 is empty. Are you sure you want to proceed to Task 2?' : 'Bài làm Task 1 đang để trống. Bạn có chắc muốn chuyển sang Task 2?')
                      if (!proceed) return
                    }
                    setFullStep(2)
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{isEn ? 'Next to Task 2 →' : 'Chuyển sang Task 2 →'}</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setFullStep(1)}
                    className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{isEn ? '← Back to Task 1' : '← Quay lại Task 1'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!session) return signIn('google')
                      gradeEssay()
                    }}
                    disabled={isGrading || isGenerating}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : (!session ? <LogIn className="w-5 h-5" /> : <Send className="w-5 h-5" />)}
                    {isGrading ? (isEn ? 'Grading Both Tasks...' : 'Đang chấm trọn bộ 2 Task...') : (session ? (isEn ? 'Submit & Grade Full Test' : 'Nộp bài & Chấm trọn bộ') : (isEn ? 'Sign in with Google to Grade' : 'Đăng nhập Google để Chấm điểm'))}
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => {
                  if (!session) return signIn('google')
                  gradeEssay()
                }}
                disabled={isGrading || isGenerating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : (!session ? <LogIn className="w-5 h-5" /> : <Send className="w-5 h-5" />)}
                {isGrading ? (isEn ? 'Grading...' : 'Đang chấm điểm...') : (session ? (isEn ? 'Submit & Grade' : 'Nộp bài & Chấm điểm') : (isEn ? 'Sign in with Google to Grade' : 'Đăng nhập Google để Chấm điểm'))}
              </button>
            )}
              </GraderActions>
            </div>

            {session && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {isEn ? 'Usage today:' : 'Lượt chấm hôm nay:'} <span className="font-bold text-slate-700">{usageCount}/{usageLimit}</span>
              </p>
            )}
          </div>
        </div>
        </PracticeAccessGate>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-indigo-600" /> 
                  {isEn ? 'Grading History' : 'Lịch Sử Chấm Bài'}
                </h3>
                {session?.user?.email ? (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {session.user.email}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                    Khách (Chưa đăng nhập)
                  </span>
                )}
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {history.length === 0 ? (
                session ? (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-700">{isEn ? 'No essay history found for this account.' : 'Bạn chưa có bài làm nào được lưu trong tài khoản này.'}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{isEn ? 'All submissions and grading results will be safely saved to your account.' : 'Mỗi lần hoàn thành nộp bài, bài viết và kết quả chấm điểm sẽ được tự động lưu vào tài khoản của bạn.'}</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-700">{isEn ? 'You are not logged in.' : 'Bạn chưa đăng nhập tài khoản.'}</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md mx-auto">{isEn ? 'Please log in with Google to save your grading history to your account!' : 'Vui lòng đăng nhập bằng Google để lưu trữ lịch sử chấm bài vào tài khoản của bạn!'}</p>
                    <button 
                      onClick={() => signIn('google')} 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      {isEn ? 'Sign in with Google' : 'Đăng nhập Google ngay'}
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : item.examType === 'IELTS_FULL' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.examType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium line-clamp-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold text-slate-900">{isEn ? 'Prompt:' : 'Đề bài:'}</span> {item.prompt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="font-bold text-indigo-600">
                          {isEn ? 'Score:' : 'Điểm số:'} <span className="text-lg">{item.result?.overallBandFormatted || (item.result?.overallBand ? (String(item.result.overallBand).includes('/') ? item.result.overallBand : `${item.result.overallBand}/9`) : 'N/A')}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setResult(item.result)
                            setShowHistoryModal(false)
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {isEn ? 'View Details' : 'Xem chi tiết'} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
                <p className="text-xs text-slate-500 max-w-[60%]">
                  {isEn ? 'Your history is securely saved to your account.' : 'Dữ liệu làm bài được lưu trữ an toàn và bảo mật theo tài khoản của bạn.'}
                </p>
                <button 
                  onClick={async () => {
                    if (confirm(isEn ? 'Are you sure you want to clear all history?' : 'Bạn có chắc muốn xoá toàn bộ lịch sử?')) {
                      await clearEssayHistory(session?.user?.email || 'anonymous')
                      loadHistory()
                    }
                  }}
                  className="text-sm font-semibold flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isEn ? 'Clear All' : 'Xóa tất cả'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Management Modal */}
      {(showStudentsModal) && (<StudentManagementModal 
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        loading={loadingStudents}
        onCreateShare={() => { setShowStudentsModal(false); setIsShareModalOpen(true) }}
        studentsData={studentsData}
        expandedStudentId={expandedStudentId}
        setExpandedStudentId={setExpandedStudentId}
        examTypePrefix="IELTS"
      />)}

      {(isShareModalOpen) && (<ShareExamModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        onConfirm={handleCreateSharedLink} 
      />)}
    
      {(isGrading || !!result) && (<GradingResultModal 
        isOpen={isGrading || !!result} 
        onClose={() => { if (!isGrading) setResult(null) }} 
        isGrading={isGrading} 
        result={result} 
        examType={examType || 'IELTS'} 
      />)}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="Expanded Graph" className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl cursor-default" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2" onClick={() => setExpandedImage(null)}>
            <XCircle className="w-8 h-8" />
          </button>
        </div>
      )}

    </div>
  )
}


