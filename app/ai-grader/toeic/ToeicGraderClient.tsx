'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
  FileEdit, Loader2, RefreshCw, Send, AlertCircle, History, 
  ArrowLeft, ArrowRight, Maximize2, Minimize2,  CheckCircle2,
  Users, Share2, Lock, LogIn
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import dynamic from 'next/dynamic'
import { toeicWritingRawScore } from '@/src/lib/examScores'
import { TOEIC_PICTURE_SETS, parseToeicPictures, type ToeicPictureSet } from '@/src/data/toeicWriting'
import { ToeicPictureQuestions } from '@/src/components/common/ToeicPictureQuestions'
import { AnswerTextarea, GraderActions } from '@/src/components/common/GraderControls'


import { usePathname } from 'next/navigation'
import { TOEIC_PAIRED_SETS, TOEIC_RESPOND_FALLBACKS, TOEIC_ESSAY_FALLBACKS } from '@/src/data/fallbackPrompts'

const GradingResultModal = dynamic(() => import('@/src/components/common/GradingResultModal').then(module => module.GradingResultModal))
const ShareExamModal = dynamic(() => import('@/src/components/common/ShareExamModal').then(module => module.ShareExamModal))
const StudentManagementModal = dynamic(() => import('@/src/components/common/StudentManagementModal').then(module => module.StudentManagementModal))

type ToeicMode = 'TOEIC_PICTURE' | 'TOEIC_FULL' | 'TOEIC_RESPOND' | 'TOEIC_ESSAY'
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
  const [fullTestStep, setFullTestStep] = useState<0 | 1 | 2>(0)
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
  const [essayEmail7, setEssayEmail7] = useState('')
  const [pictureSet, setPictureSet] = useState<ToeicPictureSet>(TOEIC_PICTURE_SETS[0])
  const [pictureAnswers, setPictureAnswers] = useState<string[]>(Array(5).fill(''))
  const pictureTouched = useRef(false), gradingLock = useRef(false)
  const gradedCache = useRef(new Map<string, any>())
  const owner = session?.user?.email || 'anonymous', ownerRef = useRef(owner); ownerRef.current = owner
  const promptEmail7 = useMemo(() => {
    const next = pairedSets[(currentSetIdx + 1) % pairedSets.length]?.part1
    return next && next.content !== promptPart1?.content ? next : TOEIC_RESPOND_FALLBACKS.find(p => p.content !== promptPart1?.content) || TOEIC_RESPOND_FALLBACKS[0]
  }, [pairedSets, currentSetIdx, promptPart1])
  const pictureView = activeTab === 'TOEIC_PICTURE' || (activeTab === 'TOEIC_FULL' && fullTestStep === 0)


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
  }, [session?.user?.email])

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
    const snippet = ''
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
    if (ownerRef.current === email) setHistory(data)

  }

  useEffect(() => {
    if (status !== 'loading') void loadHistory()
  }, [status, session?.user?.email])

  const loadPictures = async (manual = false) => {
    setIsGenerating(true)
    try {
      const data = await callApi({ action: 'generate_prompt_batch', type: 'TOEIC_PICTURE' })
      const sets = (data.prompts || []).flatMap((p: any) => { try { return [parseToeicPictures(p.content)] } catch { return [] } }) as ToeicPictureSet[]
      if (!manual && pictureTouched.current) return
      const selected = sets.find(set => JSON.stringify(set) !== JSON.stringify(pictureSet)) || sets[0] || TOEIC_PICTURE_SETS[0]
      setPictureSet(selected); setPictureAnswers(Array(5).fill('')); pictureTouched.current = false
    } catch (failure: any) { if (manual) setError(failure.message) }
    finally { setIsGenerating(false) }
  }
  useEffect(() => { void loadPictures() }, [])


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
        setFullTestStep(0)
      } else {
        await Promise.all([drawSinglePrompt('TOEIC_RESPOND', hList), drawSinglePrompt('TOEIC_ESSAY', hList)])
      }
    } catch (err: any) {
      console.warn('Could not load paired sets from API, fallback to local official sets:', err)
      setPairedSets(TOEIC_PAIRED_SETS)
      setCurrentSetIdx(0)
      setPromptPart1(TOEIC_PAIRED_SETS[0].part1)
      setPromptPart2(TOEIC_PAIRED_SETS[0].part2)
      setFullTestStep(0)
    } finally {
      setIsLoadingSets(false)
    }
  }

  // Switch to next paired set (changes both Part 1 and Part 2 simultaneously and resets to step 1)
  const switchPairedSet = async (idx?: number) => {
    setFullTestStep(0)
    setEssayPart1('')
    setEssayPart2(''); setEssayEmail7(''); setPictureAnswers(Array(5).fill('')); pictureTouched.current = false
    setResult(null)
    setError(null)

    if (pairedSets.length === 0) {
      await fetchPairedSets()
      setFullTestStep(0)
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
  const wordsPart1 = useMemo(() => countWords(essayPart1), [essayPart1])
  const wordsPart2 = useMemo(() => countWords(essayPart2), [essayPart2])

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

  const gradeSection = async (type: string, prompt: string, essay: string, lang: string, email: string) => {
    const key = JSON.stringify([email,type,prompt,essay,lang])
    if (gradedCache.current.has(key)) return gradedCache.current.get(key)
    const data = await callApi({ action:'grade_essay', type, prompt, essay, feedbackLang:lang })
    gradedCache.current.set(key,data)
    return data
  }
  const refreshUsage = () => { const email=owner; void fetch('/api/ai-grader').then(r=>r.json()).then(data=>{if(ownerRef.current===email){setUsageCount(data.count || 0);setUsageLimit(data.limit || 7)}}).catch(()=>{}) }
  const gradePictures = async () => {
    if (gradingLock.current) return
    if (pictureAnswers.some(answer=>!answer.trim())) { setError(isEn ? 'Complete all five picture sentences.' : 'Vui lòng viết đủ 5 câu theo ảnh.'); return }
    const submittedSet = pictureSet, submittedAnswers = pictureAnswers.map((answer,index)=>({id:index+1,answer:answer.trim()})), email=owner, lang=feedbackLang
    gradingLock.current=true;setIsGrading(true);setResult(null);setError(null)
    try {
      const data=await gradeSection('TOEIC_PICTURE',JSON.stringify(submittedSet),JSON.stringify(submittedAnswers),lang,email)
      if(ownerRef.current!==email)return
      setResult(data);setResultExamType('TOEIC_PICTURE')
      await saveEssayHistory({email,examType:'TOEIC_PICTURE',prompt:JSON.stringify(submittedSet),essay:JSON.stringify(submittedAnswers),result:data})
      void loadHistory()
    } catch(failure:any){if(ownerRef.current===email)setError(failure.message || 'Chưa chấm được câu theo ảnh. Bài làm vẫn được giữ.')}
    finally {gradingLock.current=false;setIsGrading(false);refreshUsage()}
  }

  // Grade Single Part
  const gradeSingle = async () => {
    if (gradingLock.current) return
    const email=owner, lang=feedbackLang
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

    gradingLock.current=true
    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const type = isRespond ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY'
      const data = await gradeSection(type, promptObj.content, currentText, lang, email)
      if(ownerRef.current!==email)return

      setResult(data)
      setResultExamType(type)

      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType: type,
        prompt: promptObj.content,
        essay: currentText,
        result: data
      })
      void loadHistory()
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chấm bài.')
    } finally {
      gradingLock.current=false;setIsGrading(false);refreshUsage()
    }
  }

  // Snapshot every original question and answer before starting provider calls.
  const gradeFullTest = async () => {
    if (gradingLock.current) return
    if(pictureAnswers.some(answer=>!answer.trim())){setFullTestStep(0);setError(isEn?'Complete questions 1–5.':'Vui lòng hoàn thành câu 1–5.');return}
    if(!essayPart1.trim() || !essayEmail7.trim()){setFullTestStep(1);setError(isEn?'Complete both emails, questions 6 and 7.':'Vui lòng trả lời cả hai email câu 6 và câu 7.');return}
    if(!essayPart2.trim()){setFullTestStep(2);setError(isEn?'Complete question 8.':'Vui lòng hoàn thành bài luận câu 8.');return}
    if(!promptPart1?.content || !promptPart2?.content){setError('Chưa tải đủ đề bài.');return}
    const email=owner, lang=feedbackLang
    const sections=[
      {key:'pictures',type:'TOEIC_PICTURE',prompt:JSON.stringify(pictureSet),essay:JSON.stringify(pictureAnswers.map((answer,i)=>({id:i+1,answer:answer.trim()})))},
      {key:'email6',type:'TOEIC_RESPOND',prompt:promptPart1.content,essay:essayPart1.trim()},
      {key:'email7',type:'TOEIC_RESPOND',prompt:promptEmail7.content,essay:essayEmail7.trim()},
      {key:'part2',type:'TOEIC_ESSAY',prompt:promptPart2.content,essay:essayPart2.trim()},
    ]
    gradingLock.current=true;setIsGrading(true);setError(null);setResult(null)
    try {
      const results: Record<string,any>={}
      // Sequential calls reduce bursts. Successful sections are cached by their
      // exact prompt/answer/language, so a partial retry does not grade them again.
      for(const section of sections){results[section.key]={...await gradeSection(section.type,section.prompt,section.essay,lang,email),examType:section.type};if(ownerRef.current!==email)return}
      const score=toeicWritingRawScore(Object.values(results))
      const fullResult={...results,isFullTest:true,fullTestType:'TOEIC',...score,
        formula:isEn?'Raw task marks: pictures /15 + two emails /8 + essay /5 = total /28. ETS converts ratings to 0–200; no fixed section shares of 200 are published.':'Điểm thô: theo ảnh /15 + hai email /8 + luận /5 = tổng /28. ETS quy đổi tổng sang 0–200, không có mức điểm cố định từng phần trên thang 200.',
        detailedFeedback:isEn?'Review feedback for all eight questions below.':'Xem nhận xét của đủ 8 câu ở từng phần bên dưới.',sections}
      setResult(fullResult);setResultExamType('TOEIC_FULL')
      await saveEssayHistory({email,examType:'TOEIC_FULL',prompt:JSON.stringify(sections.map(s=>({type:s.type,prompt:s.prompt}))),essay:JSON.stringify(sections.map(s=>({type:s.type,essay:s.essay}))),result:fullResult})
      void loadHistory()
    }catch(failure:any){if(ownerRef.current===email)setError((failure.message || 'Chưa chấm xong trọn bộ.')+' '+(isEn?'Your answers and completed sections are kept for retry.':'Bài làm và các phần đã chấm được giữ để gửi lại.'))}
    finally{gradingLock.current=false;setIsGrading(false);refreshUsage()}
  }

  const restoreHistory = (item: GradedEssayHistory) => {
    setResult(item.result);setResultExamType(item.examType);setShowHistoryModal(false)
  }

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-6">
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
                ? 'Picture sentences (Q1–5), two email responses (Q6–7) and an opinion essay (Q8).'
                : 'Luyện viết câu theo ảnh (câu 1–5), trả lời email (câu 6–7) và viết luận quan điểm (câu 8).'}
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
          <div className="flex items-center gap-2 md:gap-3 min-w-0 max-w-full overflow-x-auto snap-x xl:overflow-x-visible pb-1 xl:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { key: 'TOEIC_FULL', title: isEn ? 'Trọn bộ' : 'Trọn bộ', subtitle: isEn ? 'Q1–8' : 'Câu 1–8', max: '28 thô' },
              { key: 'TOEIC_PICTURE', title: isEn ? 'Pictures' : 'Theo ảnh', subtitle: isEn ? 'Q1–5' : 'Câu 1–5', max: '15đ' },
              { key: 'TOEIC_RESPOND', title: isEn ? 'Email' : 'Email', subtitle: isEn ? 'Q6-7' : 'Câu 6-7', max: '4đ/câu' },
              { key: 'TOEIC_ESSAY', title: isEn ? 'Essay' : 'Luận', subtitle: isEn ? 'Q8' : 'Câu 8', max: '5đ' },
            ].map(t => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  disabled={isGrading || isLoadingSets}
                  onClick={() => {
                    setActiveTab(t.key as any)
                    if (t.key === 'TOEIC_FULL') {
                      setFullTestStep(0)
                    }
                    setError(null)
                  }}
                  className={`shrink-0 snap-start flex flex-col px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border text-left transition-all min-w-[75px] md:min-w-[120px] ${
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


      </div>

      {pictureView ? <div className="rounded-none border-y border-slate-200 bg-white p-4 shadow-xs sm:rounded-xl sm:border sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><h3 className="text-sm font-bold text-blue-700">{isEn?'Picture sentences · Q1–5':'Viết câu theo ảnh · Câu 1–5'}</h3><button type="button" disabled={isGenerating || isGrading} onClick={()=>{if(pictureAnswers.some(Boolean)&&!confirm(isEn?'Discard the five answers and change pictures?':'Đổi bộ ảnh và xoá 5 câu đang viết?'))return;void loadPictures(true)}} className="shrink-0 rounded border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 disabled:opacity-50">{isGenerating?(isEn?'Loading…':'Đang tải…'):(isEn?'New pictures':'Đổi bộ ảnh')}</button></div>
        <ToeicPictureQuestions set={pictureSet} answers={pictureAnswers} onAnswer={(index,value)=>{pictureTouched.current=true;setPictureAnswers(previous=>previous.map((answer,i)=>i===index?value:answer))}} disabled={!session || isGrading} isEn={isEn}/>
        {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 border-t border-slate-100 pt-4"><GraderActions value={feedbackLang} onChange={setFeedbackLang} isEn={isEn} disabled={isGrading} languages={['Tiếng Việt','English']}><button type="button" disabled={isGrading} onClick={()=>{if(!session)return signIn('google');if(activeTab==='TOEIC_FULL')setFullTestStep(1);else void gradePictures()}} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isGrading?<Loader2 className="h-4 w-4 animate-spin"/>:null}{!session?(isEn?'Sign in to continue':'Đăng nhập để tiếp tục'):activeTab==='TOEIC_FULL'?(isEn?'Continue to emails (Q6–7) →':'Chuyển sang email (Câu 6–7) →'):(isEn?'Submit questions 1–5':'Nộp bài câu 1–5')}</button></GraderActions><p className="mt-2 text-center text-[11px] text-slate-400">{isEn?'Daily quota:':'Lượt chấm hôm nay:'} {usageCount}/{usageLimit}</p></div>
      </div> : <>
      {/* Main Two-Column Layout */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 [&>div]:min-w-0 gap-3 sm:gap-6 items-start">
        {/* Left Column: Prompt */}
        <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col min-h-0 lg:min-h-[440px]">
          <div className="flex min-w-0 max-w-full overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
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
                  if ((essayPart1 || essayPart2 || essayEmail7 || pictureAnswers.some(Boolean)) && !confirm(isEn ? 'Change prompts and clear the current answers?' : 'Đổi đề và xoá bài đang viết?')) return
                  if (activeTab === 'TOEIC_FULL') {
                    switchPairedSet()
                  } else {
                    const target = activeTab === 'TOEIC_RESPOND' ? 'TOEIC_RESPOND' : 'TOEIC_ESSAY'
                    if (target === 'TOEIC_RESPOND') setEssayPart1(''); else setEssayPart2('')
                    setResult(null); void drawSinglePrompt(target)
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
            <div className="flex min-w-0 items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEn ? 'Your Written Response' : 'Bài làm của bạn'}
              </h3>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {(activeTab === 'TOEIC_FULL' ? fullTestStep === 1 : activeTab === 'TOEIC_RESPOND') ? wordsPart1 : wordsPart2} {isEn ? 'words' : 'từ'}
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
              <AnswerTextarea isEn={isEn} answerLabel={isEn ? "Your answer" : "Bài làm của bạn"}
                value={activeEssay}
                onValueChange={value => setActiveEssay(value)}
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

            {activeTab === 'TOEIC_FULL' && fullTestStep === 1 && <div className="mt-5 space-y-3 border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-800">{isEn?'Question 7 · Second email':'Câu 7 · Email thứ hai'}</h3><p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">{promptEmail7.content}</p><AnswerTextarea isEn={isEn} answerLabel={isEn?'TOEIC question 7':'TOEIC câu 7'} value={essayEmail7} onValueChange={setEssayEmail7} disabled={!session||isGrading} maxLength={8000} rows={8} placeholder={isEn?'Write your second email response…':'Nhập email trả lời câu 7…'} className="w-full rounded-lg border border-slate-300 p-4 text-sm leading-relaxed outline-none focus:border-blue-500" /></div>}
            {/* Bottom Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <GraderActions value={feedbackLang} onChange={setFeedbackLang} isEn={isEn} disabled={isGrading} languages={['Tiếng Việt', 'English']}>
                {activeTab === 'TOEIC_FULL' ? (
                <div className="flex flex-col gap-2">
                  {fullTestStep > 0 ? (
                    <button
                      type="button"
                      disabled={isGrading}
                      onClick={() => setFullTestStep(fullTestStep === 2 ? 1 : 0)}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {fullTestStep === 2 ? (isEn ? 'Back to emails' : 'Quay lại email') : (isEn ? 'Back to pictures' : 'Quay lại câu 1–5')}
                    </button>
                  ) : null}

                  {fullTestStep === 1 ? (
                    <button
                      type="button"
                      disabled={isGrading}
                      onClick={() => {
                        if (!session) return signIn('google')
                        setFullTestStep(2)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                    >
                      {isEn ? 'Continue to essay (Q8) →' : 'Chuyển sang luận (Câu 8) →'}
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
                      {isGrading ? (isEn ? 'Grading full test...' : 'Đang chấm điểm trọn bộ...') : (session ? (isEn ? 'Submit all eight questions' : 'Nộp bài & Chấm đủ 8 câu') : (isEn ? 'Sign in with Google to Grade' : 'Đăng nhập Google để Chấm điểm'))}
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

      </>}

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
                        {item.examType === 'TOEIC_FULL' ? 'Thi trọn bộ (Câu 1–8)' : item.examType === 'TOEIC_PICTURE' ? 'Câu 1–5 (Theo ảnh)' : item.examType === 'TOEIC_RESPOND' ? 'Câu 6–7 (Email)' : 'Câu 8 (Essay)'}
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
      {(showStudentsModal) && (<StudentManagementModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        loading={loadingStudents}
        studentsData={studentsData}
        expandedStudentId={expandedStudentId}
        setExpandedStudentId={setExpandedStudentId}
        examTypePrefix="TOEIC"
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

