'use client'

import React, { useState } from 'react'
import { BrainCircuit, Loader2, Sparkles, Send, RefreshCw, AlertCircle, CheckCircle2, XCircle, PenTool } from 'lucide-react'

type ExamType = 'IELTS_TASK_2' | 'TOEIC_ESSAY'

export function AiGraderClient() {
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
  const [prompt, setPrompt] = useState('')
  const [essay, setEssay] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const generatePrompt = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setEssay('')
    
    try {
      const res = await fetch('/api/ai-grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_prompt', type: examType })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPrompt(data.text)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const gradeEssay = async () => {
    if (!prompt.trim() || !essay.trim()) {
      setError('Vui lòng tạo đề và viết bài trước khi chấm.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)
    
    try {
      const res = await fetch('/api/ai-grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grade_essay', type: examType, prompt, essay })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Cột Left: Đề bài & Viết */}
      <div className="space-y-6">
        <div className="bg-surface rounded-3xl border border-line p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> Thiết lập Đề Thi
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={() => { setExamType('IELTS_TASK_2'); setResult(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                examType === 'IELTS_TASK_2' ? 'bg-primary text-white border-primary shadow-md' : 'bg-page text-ink-muted border-line hover:text-ink'
              }`}
            >
              IELTS Writing Task 2
            </button>
            <button 
              onClick={() => { setExamType('TOEIC_ESSAY'); setResult(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                examType === 'TOEIC_ESSAY' ? 'bg-primary text-white border-primary shadow-md' : 'bg-page text-ink-muted border-line hover:text-ink'
              }`}
            >
              TOEIC Writing (Opinion)
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink">Nội dung đề bài:</label>
              <button 
                onClick={generatePrompt}
                disabled={isGenerating || isGrading}
                className="text-sm text-primary font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Ra Đề Mới
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập đề bài vào đây hoặc bấm 'AI Ra Đề Mới'..."
              className="w-full h-32 p-4 rounded-xl border border-line bg-page text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none custom-scrollbar"
            />
          </div>
        </div>

        <div className="bg-surface rounded-3xl border border-line p-6 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" /> Bài Làm Của Bạn
            </h2>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${wordCount >= 250 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {wordCount} words
            </div>
          </div>
          
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Viết bài làm của bạn vào đây bằng tiếng Anh..."
            className="flex-1 w-full p-4 rounded-xl border border-line bg-page text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none custom-scrollbar leading-relaxed"
          />
          
          <button
            onClick={gradeEssay}
            disabled={isGrading || isGenerating}
            className="mt-6 w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1"
          >
            {isGrading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
            {isGrading ? 'AI Đang Phân Tích...' : 'Nộp Bài & Chấm Điểm'}
          </button>
        </div>
      </div>

      {/* Cột Right: Kết quả */}
      <div className="h-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 text-red-600">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!result && !isGrading && !error && (
          <div className="h-full border-2 border-dashed border-line rounded-3xl flex flex-col items-center justify-center p-12 text-center bg-surface/50">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <BrainCircuit className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold text-ink mb-2">Chờ chấm điểm</h3>
            <p className="text-ink-muted">Hoàn thành bài viết và nộp bài để nhận đánh giá chi tiết từ Giám khảo AI nhé.</p>
          </div>
        )}

        {isGrading && (
          <div className="h-full border border-line rounded-3xl flex flex-col items-center justify-center p-12 text-center bg-surface">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-ink mb-2">Giám khảo AI đang đọc bài...</h3>
            <p className="text-ink-muted">Đang phân tích cấu trúc, từ vựng và ngữ pháp. Vui lòng đợi trong giây lát.</p>
          </div>
        )}

        {result && !isGrading && (
          <div className="bg-surface rounded-3xl border border-line overflow-hidden shadow-xl animate-fade-in">
            {/* Header Score */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center text-white relative">
              <p className="font-semibold uppercase tracking-wider text-emerald-100 mb-2">Overall Score</p>
              <h2 className="text-6xl font-black drop-shadow-md">{result.overallBand}</h2>
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <BrainCircuit className="w-32 h-32" />
              </div>
            </div>

            {/* Criteria Scores */}
            <div className="p-6 md:p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-ink mb-4 border-b border-line pb-2">Điểm Thành Phần</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                    <div key={key} className="bg-page p-4 rounded-2xl border border-line">
                      <div className="text-sm text-ink-muted font-bold capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-2xl font-black text-primary">{data.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-ink mb-4 border-b border-line pb-2">Nhận Xét Tổng Quan</h3>
                <p className="text-ink leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
              </div>

              {result.corrections && result.corrections.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-ink mb-4 border-b border-line pb-2">Lỗi Ngữ Pháp & Gợi ý</h3>
                  <div className="space-y-4">
                    {result.corrections.map((corr: any, idx: number) => (
                      <div key={idx} className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                        <div className="flex items-start gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-red-700 font-medium line-through decoration-red-300">{corr.original}</p>
                        </div>
                        <div className="flex items-start gap-2 mb-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-emerald-700 font-medium">{corr.corrected}</p>
                        </div>
                        <div className="text-sm bg-white p-3 rounded-xl border border-line text-ink-muted">
                          💡 <strong>Giải thích:</strong> {corr.explanation}
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
  )
}
// Add PenTool to imports inside file... Wait, let me make sure it works!
