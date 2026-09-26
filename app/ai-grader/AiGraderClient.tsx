'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useAiKey } from '@/src/contexts/AiContext'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'IELTS_TASK_2' | 'TOEIC_ESSAY'

export function AiGraderClient() {
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
  const { apiKey } = useAiKey()
  const [prompt, setPrompt] = useState('')
  const [essay, setEssay] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const [history, setHistory] = useState<GradedEssayHistory[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const loadHistory = async () => {
    const data = await getEssayHistory()
    setHistory(data)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const promptQueue = useRef<string[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('IELTS_TASK_2')

  useEffect(() => {
    promptQueue.current = []
    isFetchingQueue.current = false
    currentExamType.current = examType
  }, [examType])

  const callApi = async (body: object) => {
    const { callAiGraderClient } = await import('@/src/utils/geminiClient')
    return await callAiGraderClient(body, apiKey.trim())
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
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên trước.')
      return
    }

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

  const gradeEssay = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên trước.')
      return
    }
    if (!prompt.trim() || !essay.trim()) {
      setError('Vui lòng tạo đề và viết bài trước khi chấm.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({ action: 'grade_essay', type: examType, prompt, essay })
      setResult(data)
      
      // Save to IndexedDB VIP history
      await saveEssayHistory({
        examType,
        prompt,
        essay,
        result: data
      })
      loadHistory() // Refresh history list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cột Left: Đề bài & Viết */}
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
                onClick={() => { setExamType('IELTS_TASK_2'); setResult(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'IELTS_TASK_2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                IELTS Writing Task 2
              </button>
              <button
                onClick={() => { setExamType('TOEIC_ESSAY'); setResult(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOEIC_ESSAY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                TOEIC Writing
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 text-sm">Nội dung đề bài:</label>
                <button
                  onClick={generatePrompt}
                  disabled={isGenerating || isGrading}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Tạo đề ngẫu nhiên
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập đề bài vào đây hoặc bấm 'Tạo đề ngẫu nhiên'..."
                className="w-full h-28 p-3 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                Bài làm của bạn
              </h2>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= 250 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} từ
              </div>
            </div>

            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Viết bài làm của bạn vào đây (Tiếng Anh)..."
              className="flex-1 w-full p-3 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm leading-relaxed"
            />

            <button
              onClick={gradeEssay}
              disabled={isGrading || isGenerating}
              className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isGrading ? 'Đang chấm điểm...' : 'Nộp bài & Chấm điểm'}
            </button>
          </div>
        </div>

        {/* Cột Right: Kết quả */}
        <div className="h-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!result && !isGrading && !error && (
            <div className="h-full min-h-[300px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <FileEdit className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có kết quả</h3>
              <p className="text-gray-500 text-sm">Hoàn thành bài viết và nộp bài để nhận đánh giá chi tiết.</p>
            </div>
          )}

          {isGrading && (
            <div className="h-full min-h-[300px] border border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hệ thống đang xử lý...</h3>
              <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát.</p>
            </div>
          )}

          {result && !isGrading && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header Score */}
              <div className="bg-blue-600 p-6 text-center text-white">
                <p className="font-semibold text-blue-100 mb-1 text-sm">ĐIỂM TỔNG QUÁT</p>
                <h2 className="text-4xl font-black">{result.overallBand}</h2>
              </div>

              {/* Criteria Scores */}
              <div className="p-5 md:p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2">Điểm Thành Phần</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold capitalize mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-xl font-bold text-blue-600">{data.score}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2">Nhận Xét Tổng Quan</h3>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
                </div>

                {result.corrections && result.corrections.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2">Sửa lỗi ngữ pháp & Từ vựng</h3>
                    <div className="space-y-3">
                      {result.corrections.map((corr: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-2 mb-1 text-sm">
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-700 line-through">{corr.original}</p>
                          </div>
                          <div className="flex items-start gap-2 mb-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-green-700 font-medium">{corr.corrected}</p>
                          </div>
                          <div className="text-xs bg-gray-50 p-2 rounded text-gray-600">
                            <strong>Giải thích:</strong> {corr.explanation}
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

      {/* History Modal */}
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
                        <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded uppercase">
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
                            setPrompt(item.prompt)
                            setEssay(item.essay)
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
    </div>
  )
}
