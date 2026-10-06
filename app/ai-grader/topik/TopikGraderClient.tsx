'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Users, Clock, Trash2, ArrowRight, Share2 } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'
import { ShareExamModal } from '@/src/components/common/ShareExamModal'
import { StudentManagementModal } from '@/src/components/common/StudentManagementModal'

type ExamType = 'TOPIK_51_52' | 'TOPIK_53' | 'TOPIK_54'
type PromptObject = { content: string, imageUrl?: string | null }

import { usePathname } from 'next/navigation'

export function TopikGraderClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const { data: session, status } = useSession()
  const [examType, setExamType] = useState<ExamType>('TOPIK_53')
  const [feedbackLang, setFeedbackLang] = useState<string>('Tiếng Việt')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  const [userPlan, setUserPlan] = useState<string>('free')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [essay, setEssay] = useState('')
  
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

  useEffect(() => {
    try {
      const savedEssay = localStorage.getItem('draft_topik_essay')
      const savedPrompt = localStorage.getItem('draft_topik_prompt')
      const savedExamType = localStorage.getItem('draft_topik_examType')

      if (savedEssay) setEssay(savedEssay)
      if (savedPrompt) setPrompt(JSON.parse(savedPrompt))
      if (savedExamType) setExamType(savedExamType as ExamType)
    } catch (e) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('draft_topik_essay', essay)
    if (prompt) localStorage.setItem('draft_topik_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_topik_examType', examType)
  }, [essay, prompt, examType])

  const loadHistory = async () => {
    const email = session?.user?.email || 'anonymous';
    const data = await getEssayHistory(email)
    setHistory(data.filter(h => h.examType.startsWith('TOPIK')))
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadHistory()
    }
  }, [status, session])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('TOPIK_53')

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

    let finalEssay = essay.trim()
    if (!finalEssay) {
      setError('Vui lòng viết bài trước khi nộp.')
      return
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

  // Tiếng Hàn đếm chữ (characters)
  const charCount = essay.replace(/\s+/g, '').length
  let minChars = 0
  if (examType === 'TOPIK_53') minChars = 200
  if (examType === 'TOPIK_54') minChars = 600

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-emerald-600" /> {isEn ? 'Exam Setup' : 'Thiết lập đề thi TOPIK'}
              </h2>
              
              {(userPlan === 'plus' || userPlan === 'pro') && (
                <button 
                  onClick={() => { loadStudentsData(); setShowStudentsModal(true); }}
                  className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4" />
                  {isEn ? 'Students' : 'Quản lý học viên'}
                </button>
              )}
<button 
                onClick={() => setShowHistoryModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                {isEn ? 'History' : 'Lịch sử'} ({history.length})
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setExamType('TOPIK_51_52'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_51_52' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isEn ? 'Q51-52 (Fill in)' : 'Câu 51-52 (Điền từ)'}
              </button>
              <button
                onClick={() => { setExamType('TOPIK_53'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_53' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isEn ? 'Q53 (Chart)' : 'Câu 53 (Biểu đồ)'}
              </button>
              <button
                onClick={() => { setExamType('TOPIK_54'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_54' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isEn ? 'Q54 (Essay)' : 'Câu 54 (Nghị luận)'}
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
                  className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
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
              {minChars > 0 && (
                <div className={`text-xs font-semibold px-2 py-1 rounded ${charCount >= minChars ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {charCount} / {minChars} {isEn ? 'chars' : 'chữ'}
                </div>
              )}
            </div>

            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={isEn ? "Write your essay here (Korean)..." : "Viết bài của bạn bằng Tiếng Hàn vào đây..."}
              className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none text-base leading-relaxed font-sans"
            />

            <button
              onClick={() => {
                if (!session) return signIn('google')
                gradeEssay()
              }}
              disabled={isGrading || isGenerating}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <History className="w-5 h-5 text-emerald-600" /> 
                {isEn ? 'TOPIK Grading History' : 'Lịch sử chấm bài TOPIK'}
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
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700">
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
                        <div className="font-bold text-emerald-600">
                          {isEn ? 'Score:' : 'Điểm số:'} <span className="text-lg">{item.result?.overallBand || 'N/A'}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setPrompt({ content: item.prompt })
                            setEssay(item.essay)
                            setResult(item.result)
                            setShowHistoryModal(false)
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
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
              <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={async () => {
                    if (confirm('Bạn có chắc muốn xoá toàn bộ lịch sử?')) {
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
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Hướng Dẫn Luyện Viết TOPIK Bằng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Công cụ chấm điểm TOPIK II Writing tự động bằng AI giúp bạn luyện tập các bài viết TOPIK (câu 51-54), đánh giá chính xác ngữ pháp, từ vựng và cấu trúc theo tiêu chuẩn TOPIK.
          </p>
          
          <div className="space-y-4">
            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. Câu 51-52: Dạng bài điền từ
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Bạn phải điền một câu ngắn (hoặc cụm từ) vào chỗ trống để hoàn thành thông báo, email hoặc bài viết ngắn sao cho phù hợp với ngữ cảnh, kính ngữ và ngữ pháp.</p>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Câu 53: Viết phân tích biểu đồ
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Bạn sẽ phải quan sát một biểu đồ cho sẵn và viết đoạn văn (200 - 300 chữ) mô tả lại những thay đổi, nguyên nhân và kết quả. Đây là bài thi đòi hỏi nắm vững mẫu câu (template) biểu đồ.</p>
              </div>
            </details>

            <details className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Câu 54: Nghị luận xã hội
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Bài luận dài khoảng 600 - 700 chữ với 1 chủ đề cố định và 3 câu hỏi gợi ý. Bạn phải đảm bảo chia đoạn (Mở, Thân, Kết) rõ ràng và sử dụng từ vựng ở trình độ cao cấp.</p>
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
