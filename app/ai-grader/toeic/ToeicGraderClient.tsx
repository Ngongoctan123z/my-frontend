'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Users, Clock, Trash2, ArrowRight, Share2 } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import { ShareExamModal } from '@/src/components/common/ShareExamModal'
import { StudentManagementModal } from '@/src/components/common/StudentManagementModal'

type ExamType = 'TOEIC_RESPOND' | 'TOEIC_ESSAY'
type PromptObject = { content: string, imageUrl?: string | null }

import { usePathname } from 'next/navigation'

export function ToeicGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const [examType, setExamType] = useState<ExamType>('TOEIC_ESSAY')
  const [feedbackLang, setFeedbackLang] = useState<string>('Tiếng Việt')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  // States for Task 1 and Task 2
  const [userPlan, setUserPlan] = useState<string>('free')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [essayTask1, setEssayTask1] = useState('')
  const [essayTask2, setEssayTask2] = useState({ intro: '', body: '', conclusion: '' })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(15)

  useEffect(() => {
    fetch('/api/ai-grader').then(r => r.json()).then(data => {
      setUsageCount(data.count || 0)
      setUsageLimit(data.limit || 2)
    }).catch(() => {})
  
    if (session?.user) {
      fetch('/api/profile').then(r => r.json()).then(data => {
        if (data && data.plan) setUserPlan(data.plan)
      }).catch(() => {})
    }
}, [session])

  const [history, setHistory] = useState<GradedEssayHistory[]>([])

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
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Load draft on mount
  useEffect(() => {
    try {
      const savedTask1 = localStorage.getItem('draft_essayTask1')
      const savedTask2 = localStorage.getItem('draft_essayTask2')
      const savedPrompt = localStorage.getItem('draft_prompt')
      const savedExamType = localStorage.getItem('draft_examType')

      if (savedTask1) setEssayTask1(savedTask1)
      if (savedTask2) setEssayTask2(JSON.parse(savedTask2))
      if (savedPrompt) setPrompt(JSON.parse(savedPrompt))
      if (savedExamType) setExamType(savedExamType as ExamType)
    } catch (e) {}
  }, [])

  // Save draft on change
  useEffect(() => {
    localStorage.setItem('draft_essayTask1', essayTask1)
    localStorage.setItem('draft_essayTask2', JSON.stringify(essayTask2))
    if (prompt) localStorage.setItem('draft_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_examType', examType)
  }, [essayTask1, essayTask2, prompt, examType])

  const loadHistory = async () => {
    const email = session?.user?.email || 'anonymous';
    const data = await getEssayHistory(email)
    setHistory(data.filter(h => h.examType.startsWith('TOEIC')))
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  }, [status, session])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('TOEIC_ESSAY')

  useEffect(() => {
    promptQueue.current = []
    isFetchingQueue.current = false
    currentExamType.current = examType
    setPrompt(null)
  }, [examType])

  const callApi = async (body: object) => {
    const res = await fetch('/api/ai-grader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đã có lỗi xảy ra.');
    }
    return data;
  }

  const fetchPromptsBatch = async (type: ExamType) => {
    if (isFetchingQueue.current) return
    isFetchingQueue.current = true
    try {
      const data = await callApi({ action: 'generate_prompt_batch', type })
      if (currentExamType.current === type) {
        promptQueue.current = [...promptQueue.current, ...data.prompts]
      }
    } catch (err) {
      console.error("Background fetch failed:", err)
    } finally {
      isFetchingQueue.current = false
    }
  }

  const generatePrompt = async () => {
    setError(null)
    setResult(null)
    setEssayTask1('')
    setEssayTask2({ intro: '', body: '', conclusion: '' })

    if (promptQueue.current.length === 0) {
      setIsGenerating(true)
      try {
        const data = await callApi({ action: 'generate_prompt_batch', type: examType })
        promptQueue.current = data.prompts
      } catch (err: any) {
        setError(err.message)
        setIsGenerating(false)
        return
      }
      setIsGenerating(false)
    }

    const nextPrompt = promptQueue.current.shift()
    if (nextPrompt) {
      setPrompt(nextPrompt)
    }

    if (promptQueue.current.length <= 1 && !isFetchingQueue.current) {
      fetchPromptsBatch(examType)
    }
  }


  const handleCreateSharedLink = async (reqPhone: boolean, reqEmail: boolean): Promise<string | void> => {
    if (!prompt?.content?.trim()) {
      alert('Vui lòng tạo hoặc nhập đề trước.')
      return
    }
    
    try {
      const res = await fetch('/api/shared-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType,
          content: prompt.content,
          imageUrl: prompt.imageUrl,
          imageDescription: (prompt as any).imageDescription,
          requirePhone: reqPhone,
          requireEmail: reqEmail
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      return `${window.location.origin}/shared/${data.id}`
    } catch (e: any) {
      alert(e.message || 'Lỗi khi tạo link.')
      throw e
    }
  }

  const gradeEssay = async () => {
    if (!prompt?.content.trim()) {
      setError('Vui lòng tạo đề trước khi chấm.')
      return
    }

    let finalEssay = ''
    if (examType === 'TOEIC_RESPOND') {
      finalEssay = essayTask1.trim()
      if (!finalEssay) {
        setError('Vui lòng viết bài trước khi nộp.')
        return
      }
    } else {
      const { intro, body, conclusion } = essayTask2
      if (!intro.trim() || !body.trim() || !conclusion.trim()) {
        setError('Vui lòng điền đầy đủ cả 3 phần: Mở bài, Thân bài và Kết bài.')
        return
      }
      finalEssay = `[INTRODUCTION]\n${intro}\n\n[BODY]\n${body}\n\n[CONCLUSION]\n${conclusion}`
    }

    if (feedbackLang !== 'Tiếng Việt') {
      finalEssay += `\n\n[CRITICAL DIRECTIVE: YOU MUST TRANSLATE ALL YOUR FEEDBACK, REASONING, EXPLANATION AND SUGGESTIONS TO ${feedbackLang.toUpperCase()}. DO NOT TRANSLATE THE 'evidence' OR 'original' FIELDS.]`
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({ action: 'grade_essay', type: examType, prompt: prompt.content, essay: finalEssay })
      setResult(data)
      setUsageCount(prev => prev + 1)
      
      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType,
        prompt: prompt.content,
        essay: finalEssay,
        result: data
      })
      loadHistory()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  const wordCount = examType === 'TOEIC_RESPOND' 
    ? (essayTask1.trim() ? essayTask1.trim().split(/\s+/).length : 0)
    : (
        (essayTask2.intro.trim() ? essayTask2.intro.trim().split(/\s+/).length : 0) +
        (essayTask2.body.trim() ? essayTask2.body.trim().split(/\s+/).length : 0) +
        (essayTask2.conclusion.trim() ? essayTask2.conclusion.trim().split(/\s+/).length : 0)
      )

  const minWords = examType === 'TOEIC_RESPOND' ? 50 : 300

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-blue-600" /> Thiết lập đề thi
              </h2>
              
              {(userPlan === 'plus' || userPlan === 'pro') && (
                <button 
                  onClick={() => { loadStudentsData(); setShowStudentsModal(true); }}
                  className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Quản lý học viên
                </button>
              )}
<button 
                onClick={() => setShowHistoryModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                Lịch sử ({history.length})
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setExamType('TOEIC_RESPOND'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOEIC_RESPOND' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                TOEIC Writing Q6-7 (Respond to Request)
              </button>
              <button
                onClick={() => { setExamType('TOEIC_ESSAY'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOEIC_ESSAY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                TOEIC Writing Q8 (Opinion Essay)
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                {isEn ? 'Feedback Language:' : 'Ngôn ngữ nhận xét:'}
              </label>
              <select 
                value={feedbackLang} 
                onChange={e => setFeedbackLang(e.target.value)}
                className="w-full text-sm bg-white border border-slate-300 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="English">English</option>
                <option value="한국어">한국어 (Korean)</option>
                <option value="中文">中文 (Chinese)</option>
                <option value="日本語">日本語 (Japanese)</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 text-sm">{isEn ? 'Prompt Content:' : 'Nội dung đề bài:'}</label>
                
                  {(userPlan === 'plus' || userPlan === 'pro') && prompt?.content && (
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-sm text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      {isEn ? 'Share Link' : 'Tạo link chia sẻ'}
                    </button>
                  )}
                  <button
                  onClick={generatePrompt}
                  disabled={isGenerating || isGrading}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isEn ? 'Random Prompt' : 'Bốc đề ngẫu nhiên'}
                </button>
              </div>
              
              {!prompt?.imageUrl && (
<div className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap">
                {prompt ? prompt.content : (isEn ? "Click 'Random Prompt' to begin..." : "Bấm 'Bốc đề ngẫu nhiên' để bắt đầu...")}
              </div>
)}

              {prompt?.imageUrl && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img src={prompt.imageUrl} alt="Chart/Graph" className="w-full h-auto object-contain bg-white" />
                </div>
              )}
            </div>
          </div>

          
        </div>

        {/* Right Column: Editor */}
        <div className="h-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                {isEn ? 'Your Essay' : 'Bài làm của bạn'}
              </h2>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} / {minWords} {isEn ? 'words' : 'từ'}
              </div>
            </div>

            {examType === 'TOEIC_RESPOND' ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder={isEn ? "Write your email response here (English)..." : "Viết email phản hồi của bạn vào đây (Tiếng Anh)..."}
                className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y text-sm leading-relaxed min-h-[300px]"
              />
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Introduction' : 'Mở bài (Introduction)'}</label>
                  <textarea
                    value={essayTask2.intro}
                    onChange={(e) => setEssayTask2({ ...essayTask2, intro: e.target.value })}
                    placeholder="Paraphrase the prompt & state your thesis..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[120px]"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Body Paragraphs' : 'Thân bài (Body Paragraphs)'}</label>
                  <textarea
                    value={essayTask2.body}
                    onChange={(e) => setEssayTask2({ ...essayTask2, body: e.target.value })}
                    placeholder="Develop your arguments with examples..."
                    className="flex-1 w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[250px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Conclusion' : 'Kết bài (Conclusion)'}</label>
                  <textarea
                    value={essayTask2.conclusion}
                    onChange={(e) => setEssayTask2({ ...essayTask2, conclusion: e.target.value })}
                    placeholder="Summarize your main points..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[120px]"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!session) return signIn('google')
                gradeEssay()
              }}
              disabled={isGrading || isGenerating}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isGrading ? (isEn ? 'Grading...' : 'Đang chấm điểm...') : (session ? (isEn ? 'Submit & Grade' : 'Nộp bài & Chấm điểm') : (isEn ? 'Login to Grade' : 'Đăng nhập để Chấm điểm'))}
            </button>
            {session && (
              <p className="text-center text-xs text-slate-500 mt-2">
                {isEn ? 'Usage today:' : 'Lượt chấm hôm nay:'} <span className="font-bold text-slate-700">{usageCount}/{usageLimit}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-indigo-600" /> 
                {isEn ? 'Grading History (Secure offline storage)' : 'Lịch sử chấm bài (Lưu trữ ngoại tuyến an toàn)'}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>{isEn ? 'You have no grading history.' : 'Bạn chưa chấm bài nào.'}</p>
                  <p className="text-sm mt-1">{isEn ? 'Data will be saved automatically on your browser without an account!' : 'Dữ liệu sẽ được lưu tự động trên trình duyệt mà không cần tài khoản!'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'TOEIC_RESPOND' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
                          {isEn ? 'Score:' : 'Điểm số:'} <span className="text-lg">{item.result?.overallBand || 'N/A'}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setPrompt({ content: item.prompt })
                            if (item.examType === 'TOEIC_RESPOND') {
                              setEssayTask1(item.essay)
                            } else {
                              const parts = item.essay.split(/\[BODY\n]|\[CONCLUSION\n]/)
                              const intro = parts[0]?.replace(/\[INTRODUCTION\n]/, '').trim() || ''
                              const body = parts[1]?.trim() || ''
                              const conclusion = parts[2]?.trim() || ''
                              setEssayTask2({ intro, body, conclusion })
                            }
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
                  {isEn ? 'Data is stored securely on your browser (IndexedDB), ensuring 100% privacy.' : 'Dữ liệu được lưu trữ an toàn ngay trên trình duyệt (IndexedDB), đảm bảo quyền riêng tư 100%.'}
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

      {/* SEO Content Section */}
      {!isEn && (
      <section className="mt-12 pt-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn & Tiêu Chí Chấm Điểm TOEIC Writing Bằng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Hệ thống <strong>Chấm thi TOEIC Writing AI</strong> của VNDocs là giải pháp luyện thi hoàn hảo cho người đi làm và sinh viên. Hệ thống được tinh chỉnh đặc biệt để chấm điểm 2 phần thi quan trọng nhất: Viết email phản hồi (Q6-7) và Viết bài tiểu luận (Q8) theo đúng thang điểm chuẩn của ETS.
          </p>
          
          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Cách Chấm Điểm Câu 6-7 (Respond to a written request)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">Ở phần thi này, bạn sẽ nhận được một email và phải viết email phản hồi đáp ứng đủ yêu cầu đề bài. AI sẽ chấm theo thang điểm từ 0-5 dựa trên các yếu tố:</p>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong>Task Fulfillment (Hoàn thành yêu cầu):</strong> Bạn có trả lời đủ các câu hỏi hoặc cung cấp đủ số lượng thông tin mà email gốc yêu cầu không? (Ví dụ: Đề yêu cầu đưa ra 2 gợi ý và đặt 1 câu hỏi).</li>
                  <li><strong>Organization (Bố cục & Liên kết):</strong> Email có đủ cấu trúc Chào hỏi (Salutation), Thân bài, và Kết thư (Closing) không? Các câu có sự liên kết tự nhiên không?</li>
                  <li><strong>Grammar & Vocabulary (Ngữ pháp & Từ vựng):</strong> Email công sở yêu cầu ngôn ngữ trang trọng (Formal) hoặc bán trang trọng (Semi-formal). Việc sai chính tả hay dùng từ lóng sẽ bị trừ điểm nặng.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Bí Quyết Đạt Điểm Tuyệt Đối Câu 8 (Opinion Essay)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">Câu 8 là phần thi viết Essay dài tối thiểu 300 từ. Để đạt điểm tối đa (5/5), bạn cần lưu ý:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Bảo vệ quan điểm rõ ràng:</strong> TOEIC thường hỏi bạn đồng ý hay không đồng ý với một nhận định. Mở bài phải thể hiện rõ lập trường (Thesis statement).</li>
                  <li><strong>Đưa lý do và ví dụ cụ thể (Reasons & Examples):</strong> Khác với IELTS có thể lập luận hàn lâm, TOEIC đánh giá cao các ví dụ thực tế liên quan đến môi trường công sở, công việc hoặc đời sống thường ngày.</li>
                  <li><strong>Hạn chế lỗi ngữ pháp cơ bản:</strong> Tiêu chí chấm TOEIC đôi khi "gắt" về độ chính xác hơn là độ phức tạp. Một bài viết với câu đơn giản nhưng chuẩn xác 100% sẽ điểm cao hơn bài dùng cấu trúc phức tạp nhưng sai lỗi chính tả.</li>
                </ol>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Lợi Ích Khi Luyện TOEIC Writing Tại VNDocs
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Sửa lỗi như gia sư 1 kèm 1:</strong> AI không chỉ báo điểm mà còn chỉ ra chính xác cụm từ bạn viết sai, giải thích lý do bằng tiếng Việt và đề xuất cách viết chuẩn xác hơn.</li>
                  <li><strong>Kho đề phong phú:</strong> Bấm "Bốc đề ngẫu nhiên" để lấy các tình huống email và essay bám sát thực tế đề thi TOEIC.</li>
                  <li><strong>Bảo mật & Tốc độ:</strong> Chấm điểm trong chưa đầy 15 giây. Lịch sử làm bài được lưu hoàn toàn trên máy tính của bạn (Local Storage) giúp xem lại bất cứ lúc nào mà không sợ lộ thông tin.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
      )}

      <ShareExamModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        onConfirm={handleCreateSharedLink} 
      />
    
      <GradingResultModal 
        isOpen={isGrading || !!result} 
        onClose={() => { if (!isGrading) setResult(null) }} 
        isGrading={isGrading} 
        result={result} 
        examType={examType || 'IELTS'} 
      />
    </div>
  )
}
