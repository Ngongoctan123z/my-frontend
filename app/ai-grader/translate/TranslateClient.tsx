'use client'

import React, { useState, useRef } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'
import { Loader2, Send, CheckCircle2, AlertCircle, ArrowRightLeft, Image as ImageIcon, X } from 'lucide-react'

const LANGUAGES = ['English', 'Tiếng Việt', 'Tiếng Nhật', 'Tiếng Hàn']

type StyleType = 'standard' | 'document' | 'story' | 'casual'

export function TranslateClient() {
  const { apiKey } = useAiKey()
  const [text, setText] = useState('')
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Tiếng Việt')
  const [style, setStyle] = useState<StyleType>('standard')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  
  const [isTranslating, setIsTranslating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSwap = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleTranslate = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên.')
      return
    }
    if (!text.trim() && !imageBase64) {
      setError('Vui lòng nhập nội dung hoặc tải ảnh lên để dịch.')
      return
    }

    setIsTranslating(true)
    setError(null)
    setResult(null)

    try {
      const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        { 
          action: 'translate', 
          textToTranslate: text,
          sourceLang,
          targetLang,
          style,
          imageBase64
        },
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-bold text-slate-800">Dịch thuật & Phân tích chuyên sâu</h2>
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-line">
            <select 
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-sm p-1"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            
            <button
              onClick={handleSwap}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <ArrowRightLeft size={16} />
            </button>

            <select 
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none text-sm p-1"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Translation Styles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'standard', label: 'Dịch tiêu chuẩn' },
            { id: 'document', label: 'Dịch tài liệu' },
            { id: 'story', label: 'Dịch truyện' },
            { id: 'casual', label: 'Dịch đời thường' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id as StyleType)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                style === s.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập nội dung cần dịch hoặc tải ảnh lên..."
                className="w-full h-64 p-4 pb-14 rounded-xl border border-line bg-page outline-none focus:border-blue-500 text-sm resize-none"
              />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <ImageIcon size={16} />
                    Tải ảnh lên
                  </button>
                </div>
              </div>
            </div>

            {imageBase64 && (
              <div className="relative inline-block border rounded-lg p-2 bg-slate-50">
                <img src={imageBase64} alt="Uploaded" className="max-h-32 rounded object-contain" />
                <button 
                  onClick={() => setImageBase64(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleTranslate}
              disabled={isTranslating || (!text.trim() && !imageBase64)}
              className="w-full h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isTranslating ? 'Đang dịch...' : 'Dịch ngay'}
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-slate-200 flex flex-col h-full">
            <h3 className="text-base font-bold text-white mb-4 border-b border-slate-700 pb-3 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={18} /> Kết quả dịch thuật
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!result && !isTranslating && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                  Nhập văn bản hoặc ảnh và bấm Dịch để xem AI phân tích ngữ nghĩa chuyên sâu.
                </div>
              )}

              {isTranslating && (
                <div className="h-full flex flex-col items-center justify-center text-blue-400 space-y-4 py-10">
                  <Loader2 size={40} className="animate-spin" />
                  <p className="text-sm animate-pulse">Đang dịch và phân tích ngữ cảnh...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bản dịch chính</h4>
                    <p className="text-white text-lg leading-relaxed bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      {result.translatedText}
                    </p>
                  </div>

                  {result.nuances && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phân tích sắc thái</h4>
                      <p className="text-sm text-emerald-300 leading-relaxed bg-emerald-900/20 p-4 rounded-lg border border-emerald-900/50">
                        {result.nuances}
                      </p>
                    </div>
                  )}

                  {result.alternativeTranslations && result.alternativeTranslations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Các cách dịch khác</h4>
                      <ul className="space-y-2">
                        {result.alternativeTranslations.map((alt: string, i: number) => (
                          <li key={i} className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 flex gap-3">
                            <span className="text-slate-500 font-mono">{i + 1}.</span> {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.vocabulary && result.vocabulary.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Từ vựng đáng chú ý</h4>
                      <div className="space-y-3">
                        {result.vocabulary.map((v: any, i: number) => (
                          <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-bold text-blue-400">{v.word}</span>
                              <span className="text-slate-400 text-sm">- {v.meaning}</span>
                            </div>
                            {v.example && (
                              <p className="text-sm text-slate-400 italic bg-slate-900/50 p-2 rounded mt-2">
                                Ví dụ: {v.example}
                              </p>
                            )}
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
    </div>
  )
}
