'use client'

import React, { useState } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'
import { Loader2, Send, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react'

export function TranslateClient() {
  const { apiKey } = useAiKey()
  const [text, setText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTranslate = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên.')
      return
    }
    if (!text.trim()) {
      setError('Vui lòng nhập nội dung cần dịch.')
      return
    }

    setIsTranslating(true)
    setError(null)
    setResult(null)

    try {
      const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        { action: 'translate', textToTranslate: text },
        apiKey.trim()
      )
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Dịch Nhanh & Trích Xuất Từ Vựng</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 font-semibold rounded-lg text-sm border border-indigo-100">
            <CheckCircle2 size={14} />
            Tự động nhận diện ngôn ngữ
          </div>
        </div>

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
              placeholder="Nhập nội dung cần dịch vào đây..."
              className="w-full h-64 p-4 rounded-xl border border-line bg-page outline-none focus:border-blue-500 text-sm resize-none"
            />
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !text.trim()}
              className="w-full h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isTranslating ? 'Đang phân tích...' : 'Dịch ngay'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-slate-200">
            <h3 className="text-base font-bold text-white mb-4 border-b border-slate-700 pb-3 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={18} /> Kết quả dịch thuật
            </h3>

            {!result && !isTranslating && (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">
                Nhập văn bản và bấm Dịch để xem AI phân tích ngữ nghĩa chuyên sâu.
              </div>
            )}

            {isTranslating && (
              <div className="h-[200px] flex flex-col items-center justify-center text-blue-400 space-y-4">
                <Loader2 size={40} className="animate-spin" />
                <p className="text-sm animate-pulse">Đang dịch siêu tốc...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fade-up">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-emerald-400">Bản dịch chính:</h4>
                    {result.detectedLanguage && (
                      <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                        Đã dịch từ: {result.detectedLanguage}
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-white font-medium leading-relaxed">{result.translatedText}</p>
                </div>

                {result.correctedOriginalText && result.correctedOriginalText.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '') !== text.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '') && (
                  <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-lg">
                    <h4 className="font-bold text-rose-400 mb-1 text-sm">Phát hiện lỗi ngữ pháp trong bản gốc:</h4>
                    <p className="text-sm text-slate-300 line-through opacity-70">{text}</p>
                    <p className="text-base text-rose-200 mt-1 font-medium">{result.correctedOriginalText}</p>
                  </div>
                )}

                {result.vocabulary?.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-blue-400">Từ vựng đáng chú ý:</h5>
                    <div className="space-y-2">
                      {result.vocabulary.map((v: any, i: number) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700 text-sm">
                          <span className="font-bold text-rose-400">{v.word}</span>: <span className="text-slate-300">{v.meaning}</span>
                        </div>
                      ))}
                    </div>
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
