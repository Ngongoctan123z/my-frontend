'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'IELTS_TASK_1' | 'IELTS_TASK_2'
type PromptObject = { content: string, imageUrl?: string | null }

export function AiGraderClient() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
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
    setHistory(data.filter(h => h.examType.startsWith('IELTS')))
  }

  useEffect(() => {
    loadHistory()
  }, [])

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
    if (examType === 'IELTS_TASK_1') {
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

  const wordCount = examType === 'IELTS_TASK_1' 
    ? (essayTask1.trim() ? essayTask1.trim().split(/\s+/).length : 0)
    : (
        (essayTask2.intro.trim() ? essayTask2.intro.trim().split(/\s+/).length : 0) +
        (essayTask2.body.trim() ? essayTask2.body.trim().split(/\s+/).length : 0) +
        (essayTask2.conclusion.trim() ? essayTask2.conclusion.trim().split(/\s+/).length : 0)
      )

  const minWords = examType === 'IELTS_TASK_1' ? 150 : 250

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

            {examType === 'IELTS_TASK_1' ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder="Viết bài làm Task 1 của bạn vào đây (Tiếng Anh)..."
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
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Điểm Thành Phần</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold mb-1">
                          {key === 'taskResponse' ? 'Task Response' :
                           key === 'coherenceCohesion' ? 'Coherence & Cohesion' :
                           key === 'lexicalResource' ? 'Lexical Resource' :
                           key === 'grammaticalRange' ? 'Grammar & Accuracy' : key}
                        </div>
                        <div className="text-xl font-bold text-indigo-600">{data.score}</div>
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
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
                            if (item.examType === 'IELTS_TASK_1') {
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
    </div>
  )
}
