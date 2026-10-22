'use client'
import { learnerPromptContent, learnerHistoryPrompt } from '@/src/lib/publicWritingPrompt'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { 
  FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, 
  History, Users, Clock, ArrowRight, ArrowLeft, Share2, 
  Maximize2, Minimize2, Check, Info,  ChevronRight, Lock, LogIn
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'


import dynamic from 'next/dynamic'
import { PracticeAccessGate } from '@/src/components/auth/PracticeAccessGate'
import { StudentAccessButton } from '@/src/components/common/StudentAccessButton'
import {WritingSetPicker} from '@/src/components/common/WritingSetPicker'
import type {WritingLoadedSet,WritingPrompt} from '@/src/lib/writingBank'
import { AnswerTextarea, GraderActions } from '@/src/components/common/GraderControls'
import { usePathname } from 'next/navigation'
import { TOPIK_51_FALLBACKS, TOPIK_52_FALLBACKS, TOPIK_53_FALLBACKS, TOPIK_54_FALLBACKS } from '@/src/data/fallbackPrompts'

export type TopikQuestionKey = 'TOPIK_51' | 'TOPIK_52' | 'TOPIK_53' | 'TOPIK_54'
export type TopikMode = TopikQuestionKey | 'TOPIK_FULL'
export type PromptObject = WritingPrompt

const GradingResultModal = dynamic(() => import('@/src/components/common/GradingResultModal').then(module => module.GradingResultModal))
const ShareExamModal = dynamic(() => import('@/src/components/common/ShareExamModal').then(module => module.ShareExamModal))
const StudentManagementModal = dynamic(() => import('@/src/components/common/StudentManagementModal').then(module => module.StudentManagementModal))

interface TabMeta {
  key: TopikMode
  title: string
  subtitle: string
  maxScore: number
  targetChars?: string
}

const TOPIK_TABS: TabMeta[] = [
  { key: 'TOPIK_FULL', title: 'Thi trọn bộ (51–54)', subtitle: 'Toàn bộ bài thi 쓰기', maxScore: 100 },
  { key: 'TOPIK_51', title: 'Câu 51', subtitle: 'Hoàn thành câu', maxScore: 10 },
  { key: 'TOPIK_52', title: 'Câu 52', subtitle: 'Hoàn thành câu', maxScore: 10 },
  { key: 'TOPIK_53', title: 'Câu 53', subtitle: 'Viết theo biểu đồ', maxScore: 30, targetChars: '200–300 ký tự' },
  { key: 'TOPIK_54', title: 'Câu 54', subtitle: 'Viết văn nghị luận', maxScore: 50, targetChars: '600–700 ký tự' },
]

export function TopikGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const practiceOwner = status === 'authenticated' ? session?.user?.email || null : null
  const practiceOwnerRef = useRef(practiceOwner)
  practiceOwnerRef.current = practiceOwner
  const [activeTab, setActiveTab] = useState<TopikMode>('TOPIK_FULL')
  const [fullSetId,setFullSetId]=useState('')
  const activeMode=useRef<TopikMode>('TOPIK_FULL'),requestEpoch=useRef(0),fullDraft=useRef<any>(null),singleDraft=useRef<any>(null)
  activeMode.current=activeTab
  const [fullTestStep, setFullTestStep] = useState<1 | 2 | 3 | 4>(1)
  const [feedbackLang, setFeedbackLang] = useState<string>(isEn ? 'English' : 'Tiếng Việt')

  // Prompts per question
  const [prompt51, setPrompt51] = useState<PromptObject | null>(null)
  const [prompt52, setPrompt52] = useState<PromptObject | null>(null)
  const [prompt53, setPrompt53] = useState<PromptObject | null>(null)
  const [prompt54, setPrompt54] = useState<PromptObject | null>(null)

  // Answers per question
  const [answers51, setAnswers51] = useState<{ a: string; b: string }>({ a: '', b: '' })
  const [answers52, setAnswers52] = useState<{ a: string; b: string }>({ a: '', b: '' })
  const [essay53, setEssay53] = useState<string>('')
  const [essay54, setEssay54] = useState<string>('')

  // Validation
  const [fieldErrors51, setFieldErrors51] = useState<{ a?: boolean; b?: boolean }>({})
  const [fieldErrors52, setFieldErrors52] = useState<{ a?: boolean; b?: boolean }>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [resultExamType, setResultExamType] = useState<string>('TOPIK_FULL')
  const [userPlan, setUserPlan] = useState<string>('free')
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(7)

  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [history, setHistory] = useState<GradedEssayHistory[]>([])

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

  // Queues
  const queue51 = useRef<PromptObject[]>([])
  const queue52 = useRef<PromptObject[]>([])
  const queue53 = useRef<PromptObject[]>([])
  const queue54 = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef<Record<TopikQuestionKey, boolean>>({
    TOPIK_51: false, TOPIK_52: false, TOPIK_53: false, TOPIK_54: false
  })
  const lastActionTimeRef = useRef(0)

  // Effective question for full test mode or single mode
  const effectiveQuestionKey: TopikQuestionKey = useMemo(() => {
    if (activeTab === 'TOPIK_FULL') {
      if (fullTestStep === 1) return 'TOPIK_51'
      if (fullTestStep === 2) return 'TOPIK_52'
      if (fullTestStep === 3) return 'TOPIK_53'
      return 'TOPIK_54'
    }
    return activeTab
  }, [activeTab, fullTestStep])

  const currentPrompt = useMemo<PromptObject | null>(() => {
    if (effectiveQuestionKey === 'TOPIK_51') return prompt51
    if (effectiveQuestionKey === 'TOPIK_52') return prompt52
    if (effectiveQuestionKey === 'TOPIK_53') return prompt53
    return prompt54
  }, [effectiveQuestionKey, prompt51, prompt52, prompt53, prompt54])

  const setCurrentPrompt = (key: TopikQuestionKey, p: PromptObject | null) => {
    if (key === 'TOPIK_51') setPrompt51(p)
    else if (key === 'TOPIK_52') setPrompt52(p)
    else if (key === 'TOPIK_53') setPrompt53(p)
    else setPrompt54(p)
  }

  const snapshot=()=>({prompt51,prompt52,prompt53,prompt54,answers51,answers52,essay53,essay54,fullSetId,fullTestStep})
  const applySnapshot=(draft:any)=>{setPrompt51(draft?.prompt51||null);setPrompt52(draft?.prompt52||null);setPrompt53(draft?.prompt53||null);setPrompt54(draft?.prompt54||null);setAnswers51(draft?.answers51||{a:'',b:''});setAnswers52(draft?.answers52||{a:'',b:''});setEssay53(draft?.essay53||'');setEssay54(draft?.essay54||'');setFullSetId(draft?.fullSetId||'');setFullTestStep(draft?.fullTestStep||1)}
  const switchMode=(next:TopikMode)=>{
    if(isGrading||next===activeTab)return
    requestEpoch.current++;setIsGenerating(false)
    if(activeTab==='TOPIK_FULL'&&next!=='TOPIK_FULL'){fullDraft.current=snapshot();applySnapshot(singleDraft.current)}
    else if(activeTab!=='TOPIK_FULL'&&next==='TOPIK_FULL'){singleDraft.current=snapshot();applySnapshot(fullDraft.current)}
    setActiveTab(next);setGeneralError(null)
  }
  const applyFullSet=(set:WritingLoadedSet)=>{setPrompt51(set.questions.TOPIK_51);setPrompt52(set.questions.TOPIK_52);setPrompt53(set.questions.TOPIK_53);setPrompt54(set.questions.TOPIK_54);setFullSetId(set.id);setFullTestStep(1);setAnswers51({a:'',b:''});setAnswers52({a:'',b:''});setEssay53('');setEssay54('');setResult(null);setFieldErrors51({});setFieldErrors52({});setGeneralError(null)}
  const loadFullSet=async(id:string)=>{
    if(isGrading)return
    const epoch=++requestEpoch.current;setIsGenerating(true);setGeneralError(null)
    try{const data=await callApi({action:'get_writing_set',exam:'TOPIK',id});if(epoch===requestEpoch.current&&activeMode.current==='TOPIK_FULL')applyFullSet(data.set)}
    catch(failure:any){if(epoch===requestEpoch.current)setGeneralError(failure.message)}
    finally{if(epoch===requestEpoch.current)setIsGenerating(false)}
  }
  const drawFullSet=async()=>{
    if(isGrading||isGenerating)return
    setIsGenerating(true);setGeneralError(null)
    const epoch=++requestEpoch.current
    try{const data=await callApi({action:'get_writing_catalog',exam:'TOPIK'});if(epoch!==requestEpoch.current||activeMode.current!=='TOPIK_FULL')return
      const choices=(data.sets||[]).filter((row:any)=>row.id!==fullSetId),pool=choices.length?choices:data.sets||[]
      if(!pool.length)throw new Error(isEn?'No complete sets are available.':'Chưa có bộ đề đầy đủ.')
      const response=await callApi({action:'get_writing_set',exam:'TOPIK',id:pool[Math.floor(Math.random()*pool.length)].id})
      if(epoch===requestEpoch.current&&activeMode.current==='TOPIK_FULL')applyFullSet(response.set)
    }catch(failure:any){if(epoch===requestEpoch.current)setGeneralError(failure.message)}finally{if(epoch===requestEpoch.current)setIsGenerating(false)}
  }

  // Load usage & plan
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

  // History is private to the authenticated account.
  const isPromptDone = (content?: string, historyList = history) => {
    if (!content) return false
    const source=content.trim().replace(/\s+/g,' ')
    return historyList.some(h=>typeof h.prompt==='string'&&(h.prompt.trim().replace(/\s+/g,' ')===source||(source.length>=80&&h.prompt.trim().replace(/\s+/g,' ').includes(source))))
  }

  // History is private to the authenticated account.

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
    setAnswers51({ a: '', b: '' })
    setAnswers52({ a: '', b: '' })
    setEssay53('')
    setEssay54('')
    setUserPlan('free')
    fullDraft.current = null
    singleDraft.current = null
  }, [practiceOwner])

  const loadHistory = async () => {
    const email = session?.user?.email
    if (status !== 'authenticated' || !email || practiceOwnerRef.current !== email) return
    const data = await getEssayHistory(email, 'TOPIK')
    if (practiceOwnerRef.current !== email) return
    setHistory(data)


  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email])

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

  const getTopikFallback = (k: TopikQuestionKey) => {
    if (k === 'TOPIK_51') return TOPIK_51_FALLBACKS[0]
    if (k === 'TOPIK_52') return TOPIK_52_FALLBACKS[0]
    if (k === 'TOPIK_53') return TOPIK_53_FALLBACKS[0]
    return TOPIK_54_FALLBACKS[0]
  }

  // Prefetch prompts
  const fetchPromptsBatch = async (type: TopikQuestionKey, customHistory?: GradedEssayHistory[]) => {
    if (isFetchingQueue.current[type]) return
    isFetchingQueue.current[type] = true
    try {
      const hList = customHistory || history
      const pastPrompts = hList.map(h => h.prompt)
      const data = await callApi({ action: 'generate_prompt_batch', type, donePrompts: pastPrompts })
      const q = type === 'TOPIK_51' ? queue51 : type === 'TOPIK_52' ? queue52 : type === 'TOPIK_53' ? queue53 : queue54
      if (Array.isArray(data.prompts)) {
        q.current = [...q.current, ...data.prompts]
      }
    } catch (e) {
      console.warn('fetchPromptsBatch error, skipping queue prefetch:', e)
    } finally {
      isFetchingQueue.current[type] = false
    }
  }

  // Generate prompt
  const generatePrompt = async (targetKey?: TopikQuestionKey, customHistory?: GradedEssayHistory[], force = false) => {
    if(activeMode.current==='TOPIK_FULL'){await drawFullSet();return}
    const key = targetKey || effectiveQuestionKey
    const epoch=++requestEpoch.current,mode=activeMode.current
    const now = Date.now()
    if (!force && (isGenerating || isGrading || now - lastActionTimeRef.current < 600)) return
    lastActionTimeRef.current = now
    setGeneralError(null)

    const qRef = key === 'TOPIK_51' ? queue51 : key === 'TOPIK_52' ? queue52 : key === 'TOPIK_53' ? queue53 : queue54
    const hList = customHistory || history
    const pastPrompts = hList.map(h => h.prompt)

    if (qRef.current.length === 0) {
      setIsGenerating(true)
      try {
        const data = await callApi({ action: 'generate_prompt_batch', type: key, donePrompts: pastPrompts })
        if (Array.isArray(data.prompts) && data.prompts.length > 0) {
          qRef.current = data.prompts
        } else if (data.text) {
          qRef.current = [{ content: data.text }]
        }
      } catch (err: any) {
        if(epoch===requestEpoch.current){setGeneralError(err.message||'Không tải được đề.');setIsGenerating(false)}
        return
      }
      setIsGenerating(false)
    }

    if(epoch!==requestEpoch.current||mode!==activeMode.current)return
    // Bỏ qua đề đã làm nếu còn đề chưa làm trong queue
    while (qRef.current.length > 1 && isPromptDone(qRef.current[0].content, hList)) {
      qRef.current.shift()
    }

    const nextPrompt = qRef.current.shift()
    if (nextPrompt) {
      setCurrentPrompt(key, nextPrompt)
      if(key==='TOPIK_51')setAnswers51({a:'',b:''});else if(key==='TOPIK_52')setAnswers52({a:'',b:''});else if(key==='TOPIK_53')setEssay53('');else setEssay54('')
      setResult(null)
    } else {
      setGeneralError(isEn?'No prompts are available.':'Không có đề trong kho. Hãy thử lại.')
    }
  }

  // Auto-load prompt on initial render & step switch if empty
  useEffect(() => {
    if (activeTab!=='TOPIK_FULL'&&!currentPrompt) {
      generatePrompt(effectiveQuestionKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuestionKey, currentPrompt])

  const countKoreanChars = (text: string) => text.replace(/[\r\n]/g, '').length
  const charsCount53 = countKoreanChars(essay53)
  const charsCount54 = countKoreanChars(essay54)

  const buildTopik51Answer = (ans: { a: string; b: string }) => `㉠ ${ans.a.trim()}\n㉡ ${ans.b.trim()}`

  const handleCreateSharedLink = async (reqPhone: boolean, reqEmail: boolean): Promise<string | void> => {
    if (!currentPrompt?.content?.trim()) {
      throw new Error(isEn ? 'Please draw a prompt first.' : 'Vui lòng bốc đề thi trước.')
    }
    try {
      const res = await fetch('/api/shared-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: effectiveQuestionKey,
          content: currentPrompt.content,
          imageUrl: currentPrompt.imageUrl,
          imageDescription: currentPrompt.imageDescription,
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

  // Grade Single Question
  const gradeSingleQuestion = async () => {
    const gradingOwner = practiceOwner
    if (!gradingOwner || practiceOwnerRef.current !== gradingOwner) return
    const isCurrentOwner = () => practiceOwnerRef.current === gradingOwner
    const key = effectiveQuestionKey
    const p = currentPrompt
    if (!p?.content?.trim()) {
      setGeneralError(isEn ? 'Please draw a prompt first.' : 'Vui lòng bốc đề thi trước khi nộp.')
      return
    }

    let finalEssay = ''
    if (key === 'TOPIK_51') {
      const errs: { a?: boolean; b?: boolean } = {}
      if (!answers51.a.trim()) errs.a = true
      if (!answers51.b.trim()) errs.b = true
      if (errs.a || errs.b) {
        setFieldErrors51(errs)
        setGeneralError(isEn ? 'Please fill in both ㉠ and ㉡ blanks.' : 'Vui lòng điền đáp án cho cả hai chỗ trống ㉠ và ㉡.')
        return
      }
      finalEssay = buildTopik51Answer(answers51)
    } else if (key === 'TOPIK_52') {
      const errs: { a?: boolean; b?: boolean } = {}
      if (!answers52.a.trim()) errs.a = true
      if (!answers52.b.trim()) errs.b = true
      if (errs.a || errs.b) {
        setFieldErrors52(errs)
        setGeneralError(isEn ? 'Please fill in both ㉠ and ㉡ blanks.' : 'Vui lòng điền đáp án cho cả hai chỗ trống ㉠ và ㉡.')
        return
      }
      finalEssay = buildTopik51Answer(answers52)
    } else if (key === 'TOPIK_53') {
      if (!essay53.trim()) {
        setGeneralError(isEn ? 'Please write your response for Question 53.' : 'Vui lòng nhập bài làm cho Câu 53.')
        return
      }
      finalEssay = essay53.trim()
    } else {
      if (!essay54.trim()) {
        setGeneralError(isEn ? 'Please write your essay for Question 54.' : 'Vui lòng nhập bài văn cho Câu 54.')
        return
      }
      finalEssay = essay54.trim()
    }

    setIsGrading(true)
    setGeneralError(null)
    setResult(null)

    try {
      const body: any = {
        action: 'grade_essay',
        type: key,
        prompt: p.content,
        essay: finalEssay,
        feedbackLang
      }
      if (key === 'TOPIK_53') {
        body.imageUrl = p.imageUrl
        body.chartExtra = p.imageDescription
      }
      const data = await callApi(body)
      if (!isCurrentOwner()) return
      setResult(data)
      setResultExamType(key)
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: gradingOwner,
        examType: key,
        prompt: p.content,
        essay: finalEssay,
        result: data
      })
      if (!isCurrentOwner()) return

      setIsGrading(false)

      // Tự động xóa bài làm của câu tương ứng
      if (key === 'TOPIK_51') setAnswers51({ a: '', b: '' })
      else if (key === 'TOPIK_52') setAnswers52({ a: '', b: '' })
      else if (key === 'TOPIK_53') setEssay53('')
      else if (key === 'TOPIK_54') setEssay54('')

      // Tự động load đề mới chưa từng làm
      await generatePrompt(key, undefined, true)
      if (!isCurrentOwner()) return
      await loadHistory()
      if (!isCurrentOwner()) return
    } catch (err: any) {
      if (!isCurrentOwner()) return
      setGeneralError(err.message || 'Lỗi khi chấm bài.')
    } finally {
      if (isCurrentOwner()) setIsGrading(false)
    }
  }

  // Grade Full Test (All 4 Questions Simultaneously)
  const gradeFullTest = async () => {
    const gradingOwner = practiceOwner
    if (!gradingOwner || practiceOwnerRef.current !== gradingOwner) return
    const isCurrentOwner = () => practiceOwnerRef.current === gradingOwner
    // Validate all 4 questions
    if (!answers51.a.trim() && !answers51.b.trim()) {
      setActiveTab('TOPIK_FULL')
      setFullTestStep(1)
      setGeneralError(isEn ? 'Please complete Question 51.' : 'Vui lòng hoàn thành Câu 51 trước khi nộp.')
      return
    }
    if (!answers52.a.trim() && !answers52.b.trim()) {
      setActiveTab('TOPIK_FULL')
      setFullTestStep(2)
      setGeneralError(isEn ? 'Please complete Question 52.' : 'Vui lòng hoàn thành Câu 52 trước khi nộp.')
      return
    }
    if (!essay53.trim()) {
      setActiveTab('TOPIK_FULL')
      setFullTestStep(3)
      setGeneralError(isEn ? 'Please complete Question 53.' : 'Vui lòng hoàn thành Câu 53 trước khi nộp.')
      return
    }
    if (!essay54.trim()) {
      setActiveTab('TOPIK_FULL')
      setFullTestStep(4)
      setGeneralError(isEn ? 'Please complete Question 54.' : 'Vui lòng hoàn thành Câu 54 trước khi nộp.')
      return
    }

    setIsGrading(true)
    setGeneralError(null)
    setResult(null)

    try {
      const [res51, res52, res53, res54] = await Promise.all([
        callApi({
          action: 'grade_essay',
          type: 'TOPIK_51',
          prompt: prompt51?.content || 'TOPIK Câu 51',
          essay: buildTopik51Answer(answers51),
          feedbackLang
        }),
        callApi({
          action: 'grade_essay',
          type: 'TOPIK_52',
          prompt: prompt52?.content || 'TOPIK Câu 52',
          essay: buildTopik51Answer(answers52),
          feedbackLang
        }),
        callApi({
          action: 'grade_essay',
          type: 'TOPIK_53',
          prompt: prompt53?.content || 'TOPIK Câu 53',
          essay: essay53,
          imageUrl: prompt53?.imageUrl,
          chartExtra: prompt53?.imageDescription,
          feedbackLang
        }),
        callApi({
          action: 'grade_essay',
          type: 'TOPIK_54',
          prompt: prompt54?.content || 'TOPIK Câu 54',
          essay: essay54,
          feedbackLang
        })
      ])

      const score51 = Number(res51.overallBand) || 0
      const score52 = Number(res52.overallBand) || 0
      const score53 = Number(res53.overallBand) || 0
      const score54 = Number(res54.overallBand) || 0
      const totalScore = Math.min(100, Math.max(0, Math.round(score51 + score52 + score53 + score54)))

      const fullTestResult = {
        isFullTest: true,
        fullTestType: 'TOPIK',
        overallBand: totalScore,
        linkedSetId:fullSetId||undefined,
        sourcePrompts:{TOPIK_51:prompt51,TOPIK_52:prompt52,TOPIK_53:prompt53,TOPIK_54:prompt54},
        scoreScale: 100,
        overallBandFormatted: `${totalScore}/100`,
        formula: isEn
          ? `Total: Q51 (${score51}/10) + Q52 (${score52}/10) + Q53 (${score53}/30) + Q54 (${score54}/50) = ${totalScore}/100 pts`
          : `Tổng kết: Câu 51 (${score51}/10) + Câu 52 (${score52}/10) + Câu 53 (${score53}/30) + Câu 54 (${score54}/50) = ${totalScore}/100 điểm`,
        topik51: { ...res51, examType: 'TOPIK_51', scoreScale: 10 },
        topik52: { ...res52, examType: 'TOPIK_52', scoreScale: 10 },
        topik53: { ...res53, examType: 'TOPIK_53', scoreScale: 30 },
        topik54: { ...res54, examType: 'TOPIK_54', scoreScale: 50 },
        detailedFeedback: isEn
          ? `TOPIK II Writing Full Test Results:\n• Question 51: ${score51}/10\n• Question 52: ${score52}/10\n• Question 53: ${score53}/30\n• Question 54: ${score54}/50\n\nOverall Score: ${totalScore}/100.`
          : `Kết quả toàn diện bài thi TOPIK II Viết (쓰기):\n• Câu 51: ${score51}/10 điểm\n• Câu 52: ${score52}/10 điểm\n• Câu 53: ${score53}/30 điểm\n• Câu 54: ${score54}/50 điểm\n\nTổng điểm toàn bài: ${totalScore}/100 điểm.`
      }

      if (!isCurrentOwner()) return
      setResult(fullTestResult)
      setResultExamType('TOPIK_FULL')
      setUsageCount(prev => prev + 1)

      await saveEssayHistory({
        email: gradingOwner,
        examType: 'TOPIK_FULL',
        prompt: `TOPIK II Full Test (Câu 51–54)\n51: ${prompt51?.content?.slice(0, 100)}\n52: ${prompt52?.content?.slice(0, 100)}\n53: ${prompt53?.content?.slice(0, 100)}\n54: ${prompt54?.content?.slice(0, 100)}`,
        essay: `[Câu 51]\n${buildTopik51Answer(answers51)}\n\n[Câu 52]\n${buildTopik51Answer(answers52)}\n\n[Câu 53]\n${essay53}\n\n[Câu 54]\n${essay54}`,
        result: fullTestResult
      })
      if (!isCurrentOwner()) return

      setIsGrading(false)

      await loadHistory()
      if (!isCurrentOwner()) return
    } catch (err: any) {
      if (!isCurrentOwner()) return
      setGeneralError(err.message || 'Lỗi khi chấm trọn bộ TOPIK.')
    } finally {
      if (isCurrentOwner()) setIsGrading(false)
    }
  }

  // Restore history
  const restoreHistoryItem = (item: GradedEssayHistory) => {
    if (item.result?.isFullTest) {
      requestEpoch.current++
      const source=item.result.sourcePrompts
      if(source?.TOPIK_51&&source?.TOPIK_52&&source?.TOPIK_53&&source?.TOPIK_54){
        if(activeTab!=='TOPIK_FULL')singleDraft.current=snapshot()
        setPrompt51(source.TOPIK_51);setPrompt52(source.TOPIK_52);setPrompt53(source.TOPIK_53);setPrompt54(source.TOPIK_54);setFullSetId(item.result.linkedSetId||'')
        const answer=(n:number)=>new RegExp('\\[Câu '+n+'\\]\\n([\\s\\S]*?)(?=\\n\\n\\[Câu |$)').exec(item.essay)?.[1]||''
        const blanks=(text:string)=>({a:/㉠\s*([^\n]+)/.exec(text)?.[1]?.trim()||'',b:/㉡\s*([^\n]+)/.exec(text)?.[1]?.trim()||''})
        setAnswers51(blanks(answer(51)));setAnswers52(blanks(answer(52)));setEssay53(answer(53));setEssay54(answer(54))
      }
      setActiveTab('TOPIK_FULL')
      setFullTestStep(1)
      setResult(item.result)
      setResultExamType('TOPIK_FULL')
      setShowHistoryModal(false)
      return
    }

    const t = item.examType as TopikQuestionKey
    setActiveTab(t)
    setCurrentPrompt(t, { content: item.prompt })
    if (t === 'TOPIK_51' || t === 'TOPIK_52') {
      const matchA = item.essay.match(/㉠\s*([^\n]+)/)
      const matchB = item.essay.match(/㉡\s*([^\n]+)/)
      const a = matchA ? matchA[1].trim() : ''
      const b = matchB ? matchB[1].trim() : ''
      if (t === 'TOPIK_51') setAnswers51({ a, b })
      else setAnswers52({ a, b })
    } else if (t === 'TOPIK_53') {
      setEssay53(item.essay)
    } else {
      setEssay54(item.essay)
    }

    setResult(item.result)
    setResultExamType(t)
    setShowHistoryModal(false)
  }

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-6">
      {/* Top Card: Navigation & Settings */}
      <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 sm:mb-5 sm:pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              {isEn ? 'TOPIK II Writing Studio (쓰기)' : 'Phòng Luyện Viết TOPIK II (쓰기)'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEn 
                ? 'Official TOPIK II standard: Complete blanks (51, 52), data interpretation (53), and essay (54).'
                : 'Chuẩn format đề thi PBT/IBT: Điền khuyết (51, 52), biểu đồ dữ liệu (53) và nghị luận xã hội (54).'}
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
              className="text-xs font-semibold flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 shrink-0 whitespace-nowrap"
            >
              <History className="w-3 h-3 text-blue-600" />
              <span>{isEn ? 'History' : 'Lịch sử'} ({history.length})</span>
            </button>
          </div>
        </div>

        {session&&activeTab==='TOPIK_FULL'&&<div className="mb-4"><WritingSetPicker exam="TOPIK" currentId={fullSetId} onChoose={id=>void loadFullSet(id)} autoLoad disabled={isGenerating||isGrading} isEn={isEn}/></div>}

        {/* Tab Selection & Desktop Action Buttons */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Tabs - enlarged on desktop with plenty of space */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 max-w-full overflow-x-auto snap-x xl:overflow-x-visible pb-1 xl:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {TOPIK_TABS.map(t => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  disabled={isGrading}
                  onClick={() => {
                    switchMode(t.key)
                  }}
                  className={`shrink-0 snap-start flex flex-col px-3 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl border text-left transition-all ${
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
                      {t.maxScore}đ
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
        {/* Left Column: Prompt Box */}
        <div className="bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex min-w-0 max-w-full overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-100 shrink-0">
              {effectiveQuestionKey === 'TOPIK_51' ? 'Câu 51 (10đ)' :
               effectiveQuestionKey === 'TOPIK_52' ? 'Câu 52 (10đ)' :
               effectiveQuestionKey === 'TOPIK_53' ? 'Câu 53 (30đ)' : 'Câu 54 (50đ)'}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {currentPrompt?.content && (
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
                  generatePrompt(effectiveQuestionKey)
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
            {!currentPrompt ? (
              <div className="min-h-[280px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs text-slate-500">{isEn ? 'Drawing official prompt...' : 'Đang tải đề thi...'}</p>
              </div>
            ) : effectiveQuestionKey === 'TOPIK_53' ? (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{learnerPromptContent(currentPrompt.content)}</p>
                {currentPrompt.source&&<p className="text-[11px] leading-5 text-slate-400">{isEn?'Chart source: ':'Nguồn biểu đồ: '}<a href={currentPrompt.source.url} target="_blank" rel="noopener noreferrer" className="underline">{currentPrompt.source.publisher||currentPrompt.source.title}</a></p>}
                {currentPrompt.imageUrl ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div
                      className="cursor-pointer group relative"
                      onClick={() => setExpandedImage(currentPrompt.imageUrl!)}
                      title={isEn ? 'Click to expand' : 'Bấm để phóng to'}
                    >
                      <img
                        src={currentPrompt.imageUrl}
                        alt="TOPIK 53 Chart"
                        className="w-full max-h-[440px] object-contain mx-auto"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded shadow">
                          <Maximize2 className="w-3.5 h-3.5 inline mr-1" /> {isEn ? 'Expand chart' : 'Phóng to ảnh'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {learnerPromptContent(currentPrompt.content)}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {learnerPromptContent(currentPrompt.content)}
                </div>
                {currentPrompt.imageUrl && (
                  <div className="border border-slate-200 rounded-lg p-2 bg-white">
                    <img
                      src={currentPrompt.imageUrl}
                      alt="Prompt visual"
                      className="w-full max-h-[240px] object-contain cursor-pointer"
                      onClick={() => setExpandedImage(currentPrompt.imageUrl!)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tailored Answer Form */}
        <PracticeAccessGate authenticated={status === 'authenticated' && !!session?.user?.email} loading={status === 'loading'} isEn={isEn}>
        <div className={`h-full ${isEditorExpanded ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-8 flex flex-col overflow-y-auto' : ''}`}>
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <div className={`bg-white rounded-none sm:rounded-xl border-y sm:border border-slate-200 shadow-xs flex flex-col ${
            isEditorExpanded ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-5 min-h-0 lg:min-h-[460px]'
          }`}>
            <div className="flex min-w-0 items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEn ? `Your Answer for ${effectiveQuestionKey.replace('_', ' ')}` : `Bài làm ${effectiveQuestionKey.replace('TOPIK_', 'Câu ')}`}
              </h3>

              <div className="flex items-center gap-2">
                {effectiveQuestionKey === 'TOPIK_53' && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    charsCount53 < 200 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    charsCount53 <= 300 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {charsCount53} / 200–300 ký tự
                  </span>
                )}
                {effectiveQuestionKey === 'TOPIK_54' && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    charsCount54 < 600 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    charsCount54 <= 700 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {charsCount54} / 600–700 ký tự
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

            {/* Answer Form */}
            <div className="relative flex-1 flex flex-col">


              {(effectiveQuestionKey === 'TOPIK_51' || effectiveQuestionKey === 'TOPIK_52') ? (
                <div className="flex-1 space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 leading-relaxed">
                    <strong>Hướng dẫn:</strong> Điền phần cụm từ còn thiếu tương ứng vào hai chỗ trống ㉠ và ㉡ (khoảng 1 câu ngắn, đúng kính ngữ và cấu trúc liên kết).
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Đáp án chỗ trống ㉠:</span>
                      <span className="text-[11px] text-slate-400 font-normal">Tối đa 5 điểm</span>
                    </label>
                    <AnswerTextarea isEn={isEn} answerLabel={"TOPIK ㉠"}
                      value={effectiveQuestionKey === 'TOPIK_51' ? answers51.a : answers52.a}
                      onValueChange={v => {
                        if (effectiveQuestionKey === 'TOPIK_51') setAnswers51(p => ({ ...p, a: v }))
                        else setAnswers52(p => ({ ...p, a: v }))
                      }}
                      disabled={!session || isGrading}
                      placeholder={!session ? (isEn ? "Sign in to answer..." : "Đăng nhập để điền đáp án...") : "Nhập câu tiếng Hàn điền vào ㉠..."}
                      rows={3}
                      className="w-full min-h-[76px] p-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm outline-none resize-y disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Đáp án chỗ trống ㉡:</span>
                      <span className="text-[11px] text-slate-400 font-normal">Tối đa 5 điểm</span>
                    </label>
                    <AnswerTextarea isEn={isEn} answerLabel={"TOPIK ㉡"}
                      value={effectiveQuestionKey === 'TOPIK_51' ? answers51.b : answers52.b}
                      onValueChange={v => {
                        if (effectiveQuestionKey === 'TOPIK_51') setAnswers51(p => ({ ...p, b: v }))
                        else setAnswers52(p => ({ ...p, b: v }))
                      }}
                      disabled={!session || isGrading}
                      placeholder={!session ? (isEn ? "Sign in to answer..." : "Đăng nhập để điền đáp án...") : "Nhập câu tiếng Hàn điền vào ㉡..."}
                      rows={3}
                      className="w-full min-h-[76px] p-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm outline-none resize-y disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>
              ) : effectiveQuestionKey === 'TOPIK_53' ? (
                <div className="flex-1 flex flex-col space-y-2">
                  <AnswerTextarea isEn={isEn} answerLabel={"TOPIK 53"}
                    value={essay53}
                    onValueChange={value => setEssay53(value)}
                    disabled={!session || isGrading}
                    placeholder={!session ? (isEn ? "Sign in to write essay..." : "Đăng nhập để nhập bài làm...") : "Nhập bài văn phân tích số liệu biểu đồ (200~300 ký tự, dùng đuôi câu viết -ㄴ/는다)..."}
                    className="flex-1 w-full min-h-[220px] sm:min-h-[260px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-2">
                  <AnswerTextarea isEn={isEn} answerLabel={"TOPIK 54"}
                    value={essay54}
                    onValueChange={value => setEssay54(value)}
                    disabled={!session || isGrading}
                    placeholder={!session ? (isEn ? "Sign in to write essay..." : "Đăng nhập để nhập bài làm...") : "Nhập bài văn nghị luận xã hội (600~700 ký tự, bố cục 3 phần, dùng từ vựng cao cấp)..."}
                    className="flex-1 w-full min-h-[260px] sm:min-h-[320px] p-4 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm leading-relaxed outline-none resize-y font-sans disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <GraderActions value={feedbackLang} onChange={setFeedbackLang} isEn={isEn} disabled={isGrading} languages={['Tiếng Việt', 'English', '한국어', '中文']}>
                {activeTab === 'TOPIK_FULL' ? (
                /* Full test step navigation */
                <div className="flex flex-col gap-2">
                  {fullTestStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setFullTestStep((fullTestStep - 1) as any)}
                      className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 duration-75"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {isEn ? `Back to Q${50 + fullTestStep - 1}` : `Quay lại Câu ${50 + fullTestStep - 1}`}
                    </button>
                  ) : null}

                  {fullTestStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setFullTestStep((fullTestStep + 1) as any)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center gap-1.5 shadow-xs"
                    >
                      {isEn ? `Next to Q${51 + fullTestStep} →` : `Chuyển sang Câu ${51 + fullTestStep} →`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!session) return signIn('google')
                        gradeFullTest()
                      }}
                      disabled={isGrading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isGrading 
                        ? (isEn ? 'Grading full test...' : 'Đang chấm trọn bộ 100đ...') 
                        : (!session 
                            ? (isEn ? 'Sign in to Grade Full Test' : 'Đăng nhập để chấm trọn bộ (100đ)')
                            : (isEn ? 'Submit & Grade Full Test (100 pts)' : 'Nộp bài & Chấm trọn bộ (100đ)'))}
                    </button>
                  )}
                </div>
              ) : (
                /* Single Question Submit */
                <button
                  type="button"
                  onClick={() => {
                    if (!session) return signIn('google')
                    gradeSingleQuestion()
                  }}
                  disabled={Boolean(isGrading || (session && !currentPrompt))}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 duration-75 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isGrading 
                    ? (isEn ? 'Grading...' : 'Đang chấm điểm...') 
                    : (!session
                        ? (isEn ? 'Sign in to Submit & Grade' : 'Đăng nhập để chấm điểm')
                        : (isEn ? `Submit & Grade ${activeTab.replace('_', ' ')}` : `Nộp bài & Chấm ${activeTab.replace('TOPIK_', 'Câu ')}`))}
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
        </PracticeAccessGate>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  {isEn ? 'TOPIK Grading History' : 'Lịch Sử Chấm Bài TOPIK'}
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
                        {item.examType === 'TOPIK_FULL' ? 'Thi trọn bộ (100đ)' : item.examType.replace('TOPIK_', 'Câu ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 bg-slate-50 p-2 rounded">
                      {learnerHistoryPrompt(item.prompt)}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800">
                        {isEn ? 'Score: ' : 'Điểm: '}
                        <span className="text-blue-600">{item.result?.overallBandFormatted || item.result?.overallBand}</span>
                      </span>
                      <button
                        onClick={() => restoreHistoryItem(item)}
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
        onCreateShare={() => { setShowStudentsModal(false); setIsShareModalOpen(true) }}
        studentsData={studentsData}
        expandedStudentId={expandedStudentId}
        setExpandedStudentId={setExpandedStudentId}
        examTypePrefix="TOPIK"
      />)}

      {/* Share Exam Modal */}
      {(isShareModalOpen) && (<ShareExamModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onConfirm={handleCreateSharedLink}
      />)}

      {/* Grading Result Modal */}
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



