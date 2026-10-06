'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight, Share2, Copy, Users, Maximize2, Minimize2 } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import { ShareExamModal } from '@/src/components/common/ShareExamModal'
import { StudentManagementModal } from '@/src/components/common/StudentManagementModal'

type ExamType = 'IELTS_TASK_1' | 'IELTS_TASK_2'
type PromptObject = { content: string, imageUrl?: string | null }

export function AiGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
  const [feedbackLang, setFeedbackLang] = useState<string>('Tiếng Việt')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  // States for Task 1 and Task 2
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [essay, setEssay] = useState('')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(15)
  const [userPlan, setUserPlan] = useState<string>('free')
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
  const [showHistoryModal, setShowHistoryModal] = useState(false)
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

  // Load draft on mount
  useEffect(() => {
    try {
      const savedEssay = localStorage.getItem('draft_ielts_essay')
      const savedPrompt = localStorage.getItem('draft_ielts_prompt')
      const savedExamType = localStorage.getItem('draft_ielts_examType')

      if (savedEssay) setEssay(savedEssay)
      if (savedPrompt) setPrompt(JSON.parse(savedPrompt))
      if (savedExamType) setExamType(savedExamType as ExamType)
    } catch (e) {}
  }, [])

  // Save draft on change
  useEffect(() => {
    localStorage.setItem('draft_ielts_essay', essay)
    if (prompt) localStorage.setItem('draft_ielts_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_ielts_examType', examType)
  }, [essay, prompt, examType])

  const loadHistory = async () => {
    const email = session?.user?.email || 'anonymous';
    const data = await getEssayHistory(email)
    setHistory(data.filter(h => h.examType.startsWith('IELTS')))
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  }, [status, session])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('IELTS_TASK_2')

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
    setEssay('')

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
      if (res.ok) {
        alert('Đã tạo link chia sẻ thành công! Link có hiệu lực 24h.\nBạn có thể gửi link này cho học sinh.')
        return `${window.location.origin}/shared/${data.id}`
      } else {
        alert(data.error || 'Lỗi hệ thống')
      }
    } catch (e) {
      alert('Lỗi tạo link')
    }
  }

  const gradeEssay = async () => {
    if (!prompt?.content?.trim()) {
      setError('Vui lòng tạo đề trước khi chấm.')
      return
    }

    const finalEssay = essay.trim()
    if (!finalEssay) {
      setError('Vui lòng viết bài trước khi nộp.')
      return
    }

    let essayForApi = finalEssay
    if (feedbackLang !== 'Tiếng Việt') {
      essayForApi += `\n\n[CRITICAL DIRECTIVE: YOU MUST TRANSLATE ALL YOUR FEEDBACK, REASONING, EXPLANATION AND SUGGESTIONS TO ${feedbackLang.toUpperCase()}. DO NOT TRANSLATE THE 'evidence' OR 'original' FIELDS.]`
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({ action: 'grade_essay', type: examType, prompt: prompt.content, essay: essayForApi, imageDescription: (prompt as any).imageDescription || undefined })
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

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0

  const minWords = examType === 'IELTS_TASK_1' ? 150 : 250

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-blue-600" /> {isEn ? 'Exam Setup' : 'Thiết lập đề thi'}
              </h2>
              <div className="flex gap-2">
                {(userPlan === 'plus' || userPlan === 'pro') && (
                  <button 
                    onClick={() => { setShowStudentsModal(true); loadStudentsData(); }}
                    className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    {isEn ? 'Students' : 'Học viên'}
                  </button>
                )}
                <button 
                  onClick={() => setShowHistoryModal(true)}
                  className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  {isEn ? 'History' : 'Lịch sử'} ({history.length})
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => { setExamType('IELTS_TASK_1'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'IELTS_TASK_1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                IELTS Writing Task 1
              </button>
              <button
                onClick={() => { setExamType('IELTS_TASK_2'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'IELTS_TASK_2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                IELTS Writing Task 2
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
                <div className="flex items-center gap-2">
                  
                  
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
                    className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isEn ? 'Random Prompt' : 'Bốc đề ngẫu nhiên'}
                  </button>
                </div>
              </div>
              
              {userPlan === 'pro' ? (
                <div className="space-y-1">
                  {prompt?.imageUrl && <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Context ẩn cho AI (Học viên không thấy):</label>}
                  <textarea 
                    value={prompt?.content || ''}
                    onChange={(e) => setPrompt(prompt ? { ...prompt, content: e.target.value } : { content: e.target.value })}
                    placeholder="Nhập đề thi tùy chỉnh hoặc bấm 'Bốc đề ngẫu nhiên'..."
                    className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm whitespace-pre-wrap resize-y"
                  />
                </div>
              ) : (
                !prompt?.imageUrl && (
                  <div className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap">
                    {prompt ? prompt.content : (isEn ? "Click 'Random Prompt' to begin..." : "Bấm 'Bốc đề ngẫu nhiên' để bắt đầu...")}
                  </div>
                )
              )}

              

                <div className="mt-4 space-y-2 border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                  <div className="relative group cursor-pointer" onClick={() => setExpandedImage(prompt.imageUrl!)}>
                    <img src={prompt.imageUrl} alt="Chart/Graph" className="w-full h-auto object-contain bg-white transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                      <div className="bg-white/90 p-2 rounded-full shadow-sm text-slate-700">
                        <Maximize2 className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  {userPlan === 'pro' && (
                    <input 
                      type="text"
                      placeholder="Nhập mô tả đề (viết các thông số có trên hình ảnh ra để AI chấm thuận tiện hơn)..."
                      value={(prompt as any).imageDescription || ''}
                      onChange={(e) => setPrompt({ ...prompt, imageDescription: e.target.value } as any)}
                      className="w-full px-3 py-2 text-sm border-t border-gray-200 focus:outline-none focus:bg-gray-50"
                    />
                  )}
                </div>
              )}


            </div>
          </div>

          
        </div>

        {/* Right Column: Editor */}
        <div className={`h-full ${isEditorExpanded ? 'fixed inset-0 z-50 bg-slate-100 p-4 sm:p-8 flex flex-col' : ''}`}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col ${isEditorExpanded ? 'flex-1 p-6' : 'p-6 min-h-[480px]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                {isEn ? 'Your Essay' : 'Bài làm của bạn'}
              </h2>
              <div className="flex items-center gap-3">
                <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {wordCount} / {minWords} {isEn ? 'words' : 'từ'}
                </div>
                <button 
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title={isEditorExpanded ? (isEn ? 'Minimize' : 'Thu nhỏ') : (isEn ? 'Expand' : 'Phóng to')}
                >
                  {isEditorExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={isEn ? "Write your essay here..." : "Viết bài làm của bạn vào đây..."}
              className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none text-base leading-relaxed font-sans"
            />

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
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
                            if (item.examType === 'IELTS_TASK_1') {
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
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn & Tiêu Chí Chấm Điểm IELTS Writing Bằng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Hệ thống <strong>Chấm thi IELTS Writing AI</strong> của VNDocs là công cụ miễn phí giúp bạn luyện tập và cải thiện kỹ năng viết chuẩn quốc tế. Sử dụng mô hình Trí Tuệ Nhân Tạo hiện đại, công cụ tự động phân tích và đưa ra điểm số mô phỏng chính xác kỳ thi thật.
          </p>
          
          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. 4 Tiêu Chí Chấm Điểm (IELTS Grading Criteria)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">Bài viết của bạn được AI đánh giá cực kỳ khắt khe dựa trên 4 tiêu chí chính thức của IDP và Hội đồng Anh (British Council):</p>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong>Task Response (TR) - Đáp ứng yêu cầu đề bài:</strong> AI sẽ kiểm tra xem bạn đã trả lời đầy đủ các vế của câu hỏi chưa? Lập luận có rõ ràng, nhất quán và có ví dụ chứng minh cụ thể không. Nếu viết lạc đề (off-topic), điểm TR sẽ rất thấp.</li>
                  <li><strong>Coherence and Cohesion (CC) - Tính mạch lạc và liên kết:</strong> Đánh giá cách bạn sắp xếp các đoạn văn (Mở bài, Thân bài, Kết bài). Bạn có sử dụng đa dạng và chính xác các từ nối (Linking words) như <em>Furthermore, Nevertheless, On the other hand</em> hay không.</li>
                  <li><strong>Lexical Resource (LR) - Vốn từ vựng:</strong> Kiểm tra mức độ đa dạng từ vựng. Trí tuệ nhân tạo có khả năng phát hiện bạn đang dùng từ vựng cơ bản hay nâng cao (Less common vocabulary), việc sử dụng các cụm từ (Collocations) có chuẩn tự nhiên (Native-like) hay không.</li>
                  <li><strong>Grammatical Range and Accuracy (GRA) - Sự đa dạng và chính xác ngữ pháp:</strong> Bài viết phải có sự kết hợp nhuần nhuyễn giữa câu đơn, câu ghép và câu phức. AI sẽ rà soát từng lỗi chính tả, sai thì (Tense), mạo từ (a/an/the) và đưa ra gợi ý sửa lỗi hoàn hảo nhất.</li>
                </ul>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Mẹo Đạt Band 7.0+ Cho IELTS Task 2
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">Để đạt điểm cao trong bài thi IELTS Writing Task 2, bạn cần áp dụng chiến lược rõ ràng thay vì chỉ nhồi nhét từ khó:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Lập dàn ý (Outline):</strong> Dành ít nhất 3-5 phút đầu tiên để gạch đầu dòng ý tưởng cho Thân bài 1 và Thân bài 2. Điều này giúp bài không bị cụt ý hay thiếu logic giữa chừng.</li>
                  <li><strong>Công thức P.I.E cho Thân Bài:</strong> Mỗi đoạn thân bài nên tuân theo cấu trúc: <strong>P</strong>oint (Luận điểm chính) - <strong>I</strong>llustration (Giải thích/Ví dụ) - <strong>E</strong>ffect (Hậu quả/Kết quả).</li>
                  <li><strong>Tránh sử dụng từ ngữ tuyệt đối:</strong> Hãy dùng các từ chỉ mức độ (Hedging words) như <em>tend to, likely, often, majority</em> thay vì <em>always, all, everyone</em> để lập luận chặt chẽ và học thuật hơn.</li>
                  <li><strong>Luyện tập thường xuyên với AI Grader:</strong> Dùng công cụ VNDocs để liên tục chấm lỗi sai. Quan sát các phần từ vựng màu đỏ bị gạch đi và học thuộc cách diễn đạt màu xanh để tự cải thiện.</li>
                </ol>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Cách Sử Dụng Công Cụ Chấm Bài AI
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Bước 1:</strong> Bấm nút "Bốc đề ngẫu nhiên" để hệ thống chọn một đề IELTS từ kho dữ liệu thi thật. Hoặc bạn có thể tự copy một đề bên ngoài và dán vào.</li>
                  <li><strong>Bước 2:</strong> Viết bài vào các ô tương ứng. Hệ thống chia sẵn Mở bài, Thân bài, Kết bài để rèn luyện thói quen tách đoạn. Nhìn đồng hồ bộ đếm từ (Word count) để đảm bảo tối thiểu 250 từ.</li>
                  <li><strong>Bước 3:</strong> Bấm "Nộp bài & Chấm điểm". Hệ thống AI của chúng tôi sẽ phân tích trong 10-15 giây và trả ra bảng điểm Overall cùng các góp ý siêu chi tiết. Dữ liệu của bạn sẽ được lưu tự động lên trình duyệt để xem lại.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
      )}

      {/* Students Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-emerald-50/50">
              <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-800">
                <Users className="w-5 h-5" /> {isEn ? 'Student Management' : 'Quản lý học viên'}
              </h3>
              <button 
                onClick={() => setShowStudentsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loadingStudents ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : studentsData.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">{isEn ? 'No student submissions yet.' : 'Chưa có học viên nào làm bài.'}</p>
                </div>
              ) : (
                studentsData.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 transition-all hover:border-emerald-300">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedStudentId(expandedStudentId === sub.id ? null : sub.id)}
                    >
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          {sub.studentName}
                          {sub.studentPhone && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{sub.studentPhone}</span>}
                          {sub.studentEmail && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{sub.studentEmail}</span>}
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sub.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold text-lg">
                          Band {sub.gradingResult.overall_band || sub.gradingResult.band_score}
                        </div>
                        <div className="text-gray-400">
                          {expandedStudentId === sub.id ? (isEn ? 'Collapse' : 'Thu gọn') : (isEn ? 'Details' : 'Chi tiết')}
                        </div>
                      </div>
                    </div>
                    
                    {expandedStudentId === sub.id && (
                      <div className="space-y-4 mt-6 pt-4 border-t border-gray-100">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                          <strong className="text-gray-700 block mb-1">{isEn ? 'Prompt:' : 'Đề bài:'}</strong>
                          <p className="text-gray-600 line-clamp-2">{sub.examContent}</p>
                        </div>
                        
                        <div>
                          <strong className="text-gray-700 text-sm block mb-1">{isEn ? 'Essay:' : 'Bài làm:'}</strong>
                          <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {sub.studentEssay}
                          </div>
                        </div>

                        <div>
                          <strong className="text-gray-700 text-sm block mb-1">{isEn ? 'Feedback:' : 'Nhận xét:'}</strong>
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 whitespace-pre-wrap">
                            {sub.gradingResult.feedback}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
