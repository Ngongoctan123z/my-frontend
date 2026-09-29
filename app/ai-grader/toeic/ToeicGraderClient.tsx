'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'TOEIC_RESPOND' | 'TOEIC_ESSAY'
type PromptObject = { content: string, imageUrl?: string | null }

export function ToeicGraderClient() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState<ExamType>('TOEIC_ESSAY')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  // States for Task 1 and Task 2
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
      setUsageLimit(data.limit || 15)
    }).catch(() => {})
  }, [session])

  const [history, setHistory] = useState<GradedEssayHistory[]>([])
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
    const data = await getEssayHistory()
    setHistory(data.filter(h => h.examType.startsWith('TOEIC')))
  }

  useEffect(() => {
    loadHistory()
  }, [])

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

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({ action: 'grade_essay', type: examType, prompt: prompt.content, essay: finalEssay })
      setResult(data)
      setUsageCount(prev => prev + 1)
      
      await saveEssayHistory({
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-blue-600" /> Thiết lập đề thi
              </h2>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 text-sm">Nội dung đề bài:</label>
                <button
                  onClick={generatePrompt}
                  disabled={isGenerating || isGrading}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Bốc đề ngẫu nhiên
                </button>
              </div>
              
              <div className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap">
                {prompt ? prompt.content : "Bấm 'Bốc đề ngẫu nhiên' để bắt đầu..."}
              </div>

              {prompt?.imageUrl && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img src={prompt.imageUrl} alt="Chart/Graph" className="w-full h-auto object-contain bg-white" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                Bài làm của bạn
              </h2>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} / {minWords} từ
              </div>
            </div>

            {examType === 'TOEIC_RESPOND' ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder="Viết email phản hồi của bạn vào đây (Tiếng Anh)..."
                className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none text-sm leading-relaxed"
              />
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mở bài (Introduction)</label>
                  <textarea
                    value={essayTask2.intro}
                    onChange={(e) => setEssayTask2({ ...essayTask2, intro: e.target.value })}
                    placeholder="Paraphrase the prompt & state your thesis..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-24"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Thân bài (Body Paragraphs)</label>
                  <textarea
                    value={essayTask2.body}
                    onChange={(e) => setEssayTask2({ ...essayTask2, body: e.target.value })}
                    placeholder="Develop your arguments with examples..."
                    className="flex-1 w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none min-h-[150px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kết bài (Conclusion)</label>
                  <textarea
                    value={essayTask2.conclusion}
                    onChange={(e) => setEssayTask2({ ...essayTask2, conclusion: e.target.value })}
                    placeholder="Summarize your main points..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none h-20"
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
              {isGrading ? 'Đang chấm điểm...' : (session ? 'Nộp bài & Chấm điểm' : 'Đăng nhập để Chấm điểm')}
            </button>
            {session && (
              <p className="text-center text-xs text-slate-500 mt-2">
                Lượt chấm hôm nay: <span className="font-bold text-slate-700">{usageCount}/{usageLimit}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="h-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!result && !isGrading && !error && (
            <div className="h-full min-h-[500px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <FileEdit className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có kết quả</h3>
              <p className="text-gray-500 text-sm max-w-sm">Hoàn thành bài viết và nộp bài để nhận đánh giá chi tiết theo chuẩn tiêu chí IELTS.</p>
            </div>
          )}

          {isGrading && (
            <div className="h-full min-h-[500px] border border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hệ thống đang xử lý...</h3>
              <p className="text-gray-500 text-sm">AI đang chấm bài của bạn, vui lòng đợi trong giây lát.</p>
            </div>
          )}

          {result && !isGrading && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center text-white">
                <p className="font-semibold text-blue-100 mb-1 text-sm tracking-wider">OVERALL BAND SCORE</p>
                <h2 className="text-5xl font-black">{result.overallBand}</h2>
              </div>

              <div className="p-5 md:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Điểm Thành Phần (Thang TOEIC)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase">
                          {key}
                        </div>
                        <div className="text-xl font-bold text-indigo-600">{data.score}/5</div>
                        <div className="text-xs text-gray-400 mt-1">{data.feedback}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Nhận Xét Tổng Quan</h3>
                  <div className="bg-blue-50/50 p-4 rounded-lg">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
                  </div>
                </div>

                {result.corrections && result.corrections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Sửa Lỗi Chi Tiết</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.corrections.map((corr: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                          <div className="flex items-start gap-2 mb-1.5 text-sm">
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-rose-700 line-through">{corr.original}</p>
                          </div>
                          <div className="flex items-start gap-2 mb-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-emerald-700 font-medium">{corr.corrected}</p>
                          </div>
                          <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600">
                            <strong>Lý do:</strong> {corr.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-indigo-600" /> 
                Lịch sử chấm bài (Lưu trữ ngoại tuyến an toàn)
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Bạn chưa chấm bài nào.</p>
                  <p className="text-sm mt-1">Dữ liệu sẽ được lưu tự động trên trình duyệt mà không cần tài khoản!</p>
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
                        <span className="font-bold text-slate-900">Đề bài:</span> {item.prompt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="font-bold text-indigo-600">
                          Điểm số: <span className="text-lg">{item.result?.overallBand || 'N/A'}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setPrompt({ content: item.prompt })
                            if (item.examType === 'TOEIC_RESPOND') {
                              setEssayTask1(item.essay)
                            } else {
                              // basic parser to populate the 3 fields, since we saved it as a single string
                              const parts = item.essay.split(/\[BODY\]|\[CONCLUSION\]/)
                              const intro = parts[0]?.replace(/\[INTRODUCTION\]/, '').trim() || ''
                              const body = parts[1]?.trim() || ''
                              const conclusion = parts[2]?.trim() || ''
                              setEssayTask2({ intro, body, conclusion })
                            }
                            setResult(item.result)
                            setShowHistoryModal(false)
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Xem chi tiết <ArrowRight className="w-4 h-4" />
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
                  Dữ liệu được lưu trữ an toàn ngay trên trình duyệt (IndexedDB), đảm bảo quyền riêng tư 100%.
                </p>
                <button 
                  onClick={async () => {
                    if (confirm('Bạn có chắc muốn xoá toàn bộ lịch sử?')) {
                      await clearEssayHistory()
                      loadHistory()
                    }
                  }}
                  className="text-sm font-semibold flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO Content Section */}
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
    </div>
  )
}
