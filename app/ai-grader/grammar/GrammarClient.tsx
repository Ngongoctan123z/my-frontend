'use client'

import React, { useState } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'
import { Loader2, Search, AlertCircle, Quote } from 'lucide-react'

export function GrammarClient() {
  const { apiKey } = useAiKey()
  const [text, setText] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên.')
      return
    }
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản tiếng Anh cần soi lỗi.')
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        { action: 'grammar_check', textToCheck: text },
        apiKey.trim()
      )
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-rose-600" /> Soi lỗi ngữ pháp & Từ vựng (Cực gắt)
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Giáo viên AI này không ngần ngại chỉ trích những lỗi ngớ ngẩn nhất trong câu tiếng Anh của bạn. Hãy chuẩn bị tinh thần!
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste đoạn văn hoặc câu tiếng Anh của bạn vào đây để nhận gạch đá..."
              className="w-full h-80 p-4 rounded-xl border border-line bg-page outline-none focus:border-rose-500 text-sm resize-none leading-relaxed"
            />
            <button
              onClick={handleCheck}
              disabled={isChecking || !text.trim()}
              className="w-full h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isChecking ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isChecking ? 'Đang bật tia X-quang soi lỗi...' : 'Bắt đầu soi lỗi'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-slate-200">
            {!result && !isChecking && (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center min-h-[200px]">
                Kết quả bóc phốt sẽ hiện ở đây.
              </div>
            )}

            {isChecking && (
              <div className="h-full flex flex-col items-center justify-center text-rose-400 space-y-4 min-h-[200px]">
                <Loader2 size={40} className="animate-spin" />
                <p className="text-sm animate-pulse">Giám khảo đang nhặt sạn...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fade-up">
                <div className="flex items-start gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="text-4xl font-black text-rose-500">{result.errorsFound}</div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Lỗi được tìm thấy</h4>
                    <p className="text-sm text-slate-300 mt-1">{result.overallComment}</p>
                  </div>
                </div>

                {result.corrections?.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-rose-400">🚨 Chi tiết các "hạt sạn":</h5>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.corrections.map((c: any, i: number) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded border border-rose-900/50 text-sm relative">
                          <span className="absolute top-2 right-2 text-[10px] font-bold text-rose-300 uppercase px-1.5 py-0.5 border border-rose-800 rounded">{c.type}</span>
                          <div className="line-through text-rose-400/80 mb-1">{c.original}</div>
                          <div className="text-emerald-400 font-bold mb-2">→ {c.corrected}</div>
                          <div className="text-xs text-slate-300 italic">{c.explanation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.rewrittenText && (
                  <div className="mt-4 border-t border-slate-700 pt-4">
                    <h5 className="font-bold text-sm text-emerald-400 mb-2 flex items-center gap-2">
                      <Quote size={16} /> Bản sửa hoàn chỉnh (Native Level)
                    </h5>
                    <p className="text-sm text-slate-200 bg-slate-800 p-4 rounded-lg border border-emerald-900/50 leading-relaxed">
                      {result.rewrittenText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
