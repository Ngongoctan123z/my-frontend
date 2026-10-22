'use client'

import { FloatingToolPanel } from './FloatingToolPanel'
import React, { useState, useEffect } from 'react'
import { Languages, X, ArrowLeftRight, Copy, Check, Volume2, History, Trash2, RotateCcw, Loader2 } from 'lucide-react'

interface TranslationItem {
  id: string
  sourceText: string
  translatedText: string
  from: string
  to: string
  timestamp: number
}

const STORAGE_KEY = 'vndocs_translate_history'

const LANGUAGES = [
  { code: 'auto', name: 'Tự động phát hiện' },
  { code: 'en', name: 'Tiếng Anh (English)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'zh-CN', name: 'Tiếng Trung (Chinese)' },
  { code: 'ko', name: 'Tiếng Hàn (Korean)' },
  { code: 'ja', name: 'Tiếng Nhật (Japanese)' },
  { code: 'fr', name: 'Tiếng Pháp (French)' },
  { code: 'de', name: 'Tiếng Đức (German)' },
  { code: 'ru', name: 'Tiếng Nga (Russian)' },
  { code: 'es', name: 'Tiếng T.B.Nha (Spanish)' },
]

export function TranslateBubble({ onClose }: { onClose: () => void }) {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [fromLang, setFromLang] = useState('en')
  const [toLang, setToLang] = useState('vi')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [history, setHistory] = useState<TranslationItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)
  const [historyCopiedId, setHistoryCopiedId] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setHistory(parsed.filter(item=>item && typeof item.sourceText==='string' && typeof item.translatedText==='string').slice(0,50))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveToHistory = (src: string, trans: string, from: string, to: string) => {
    if (!src.trim() || !trans.trim()) return
    const newItem: TranslationItem = {
      id: Date.now().toString(),
      sourceText: src.trim(),
      translatedText: trans.trim(),
      from,
      to,
      timestamp: Date.now()
    }
    const updated = [newItem, ...history.filter(h => h.sourceText !== src.trim()).slice(0, 49)]
    setHistory(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }
  }

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử dịch?')) {
      setHistory([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Multi-tier non-AI translation engine (Direct Google Translate + Server Proxy fallback)
  const performTranslation = async (text: string, from: string, to: string): Promise<string> => {
    const clean = text.trim()
    if (!clean) return ''
    if (clean.length > 5000) throw new Error('Nội dung tối đa 5000 ký tự.')

    // 1. Client-side direct Google Chrome Dict API (siêu tốc <50ms, không bị chặn CORS)
    try {
      const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&q=${encodeURIComponent(clean)}`
      const res = await fetch(url, {signal: AbortSignal.timeout(8000)})
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          if (typeof data[0] === 'string' && data[0].trim()) {
            return data[0].trim()
          }
          if (Array.isArray(data[0]) && typeof data[0][0] === 'string' && data[0][0].trim()) {
            return data[0][0].trim()
          }
        }
      }
    } catch (e) {
      // ignore, try next
    }

    // 2. Client-side direct Google GTX API (CORS: *)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(clean)}`
      const res = await fetch(url, {signal: AbortSignal.timeout(8000)})
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const trans = data[0].map((item: any) => item[0] || '').join('')
          if (trans.trim()) return trans.trim()
        }
      }
    } catch (e) {
      // ignore, try next
    }

    // 3. Fallback sang server route /api/translate
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, from, to }), signal: AbortSignal.timeout(25000)
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi kết nối dịch thuật')
    }

    return data.translatedText
  }

  const handleTranslate = async () => {
    if (loading || !sourceText.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await performTranslation(sourceText, fromLang, toLang)
      if (!result) throw new Error('Không nhận được kết quả dịch')

      setTranslatedText(result)
      saveToHistory(sourceText, result, fromLang, toLang)
    } catch (err: any) {
      setError(err.message || 'Không thể dịch vào lúc này. Vui lòng kiểm tra lại kết nối.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = () => {
    if (fromLang === 'auto') {
      setFromLang(toLang)
      setToLang('vi')
    } else {
      const temp = fromLang
      setFromLang(toLang)
      setToLang(temp)
    }

    if (translatedText) {
      const tempText = sourceText
      setSourceText(translatedText)
      setTranslatedText(tempText)
    }
  }

  const handleCopy = (text: string, isFromHistoryId?: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (isFromHistoryId) {
      setHistoryCopiedId(isFromHistoryId)
      setTimeout(() => setHistoryCopiedId(null), 1500)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleSpeak = (text: string, lang: string) => {
    if (!window.speechSynthesis || !text) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang === 'vi' ? 'vi-VN' : (lang === 'zh-CN' ? 'zh-CN' : (lang === 'ko' ? 'ko-KR' : (lang === 'ja' ? 'ja-JP' : 'en-US')))
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.error(e)
    }
  }

  const applyHistoryItem = (item: TranslationItem) => {
    setSourceText(item.sourceText)
    setTranslatedText(item.translatedText)
    setFromLang(item.from)
    setToLang(item.to)
    setShowHistory(false)
  }

  return (
    <FloatingToolPanel title="Dịch thuật nhanh" onClose={onClose} className="translation-panel">
      
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Languages size={15} className="text-slate-100" />
          <h3 className="font-semibold text-sm text-slate-100">Dịch thuật nhanh</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`px-2 py-1 text-xs font-medium border transition-colors flex items-center gap-1 rounded-lg ${
              showHistory 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : 'text-slate-200 border-slate-600 hover:border-slate-400 hover:text-slate-50'
            }`}
            title="Lịch sử dịch"
          >
            <History size={12} />
            <span>Lịch sử</span>
            {history.length > 0 && <span className="opacity-70">({history.length})</span>}
          </button>
          <button
            type="button"
            onClick={onClose} aria-label="Đóng dịch thuật nhanh"
            className="p-1 text-slate-300 hover:text-slate-100 transition-colors"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      {showHistory ? (
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-600 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <History size={13} className="text-slate-200" />
              Lịch sử dịch ({history.length})
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-rose-300 hover:text-rose-800 font-medium flex items-center gap-1 px-1.5 py-0.5 hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={11} />
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center p-6">
                <RotateCcw size={28} className="opacity-30 mb-2" />
                <p className="text-xs">Chưa có bản dịch nào được lưu.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 p-3 border border-slate-600 hover:border-slate-400 transition-colors space-y-1 rounded-lg"
                >
                  <div className="flex justify-between items-center text-xs text-slate-300 pb-1 border-b border-slate-700">
                    <span className="font-semibold text-slate-200 uppercase">
                      {item.from} → {item.to}
                    </span>
                    <span>{new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{item.sourceText}</p>
                  <p className="text-xs font-medium text-slate-50 line-clamp-2">{item.translatedText}</p>

                  <div className="flex justify-end items-center gap-2 pt-1">
                    <button
                      onClick={() => handleCopy(item.translatedText, item.id)}
                      className="text-xs text-slate-300 hover:text-slate-50 flex items-center gap-1"
                      title="Sao chép"
                    >
                      {historyCopiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{historyCopiedId === item.id ? 'Đã chép' : 'Chép'}</span>
                    </button>
                    <button
                      onClick={() => applyHistoryItem(item)}
                      className="text-xs font-medium text-slate-100 hover:underline"
                    >
                      Dùng lại
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 flex flex-col overflow-y-auto bg-slate-900">
          
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between border-b border-slate-600 bg-slate-800 px-4 py-3 text-xs gap-2">
            <select
              aria-label="Ngôn ngữ nguồn" value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className="min-w-0 flex-1 bg-slate-800 text-xs font-medium text-slate-100 outline-none cursor-pointer py-1 truncate max-w-[130px] rounded-lg"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 text-slate-300 hover:text-slate-50 transition-colors shrink-0"
              title="Đổi chiều ngôn ngữ"
            >
              <ArrowLeftRight size={13} />
            </button>

            <select
              aria-label="Ngôn ngữ đích" value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="min-w-0 flex-1 bg-slate-800 text-xs font-medium text-slate-100 outline-none cursor-pointer py-1 truncate max-w-[130px] text-right rounded-lg"
            >
              {LANGUAGES.filter(l => l.code !== 'auto').map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Source Text Area */}
          <div className="flex-1 flex flex-col p-3 border-b border-slate-600 bg-slate-900 min-h-[150px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Văn bản nguồn</span>
              {sourceText && (
                <button
                  type="button"
                  onClick={() => { setSourceText(''); setTranslatedText(''); }}
                  className="text-xs text-slate-300 hover:text-slate-200 flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Xóa</span>
                </button>
              )}
            </div>

            <textarea
              maxLength={5000}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleTranslate()
                }
              }}
              placeholder="Nhập hoặc dán văn bản cần dịch... (Ctrl + Enter)"
              aria-label="Văn bản cần dịch" className="flex-1 w-full text-base text-slate-50 placeholder:text-slate-300 resize-none outline-none leading-relaxed bg-transparent"
            />

            <div className="flex justify-between items-center pt-2 text-xs text-slate-300 border-t border-slate-700">
              <span>{sourceText.length}/5000 ký tự</span>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={!sourceText.trim() || loading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wide transition-colors disabled:opacity-70 flex items-center gap-1.5 rounded-lg cursor-pointer"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                <span>Dịch ngay</span>
              </button>
            </div>
          </div>

          {/* Translation Result Area */}
          <div className="flex-1 flex flex-col p-3 bg-slate-800 min-h-[150px] relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Bản dịch</span>
              {translatedText && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSpeak(translatedText, toLang)}
                    className="text-xs text-slate-300 hover:text-slate-50 flex items-center gap-1 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={13} />
                    <span>Đọc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(translatedText)}
                    className="text-xs text-slate-300 hover:text-slate-50 flex items-center gap-1 transition-colors"
                    title="Sao chép"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto text-base text-slate-50 leading-7 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-300 gap-2 py-6">
                  <Loader2 size={14} className="animate-spin text-slate-200" />
                  <span className="text-xs">Đang dịch văn bản...</span>
                </div>
              ) : error ? (
                <p className="text-xs text-rose-300 font-normal py-1">{error}</p>
              ) : translatedText ? (
                <p className="whitespace-pre-wrap font-medium">{translatedText}</p>
              ) : (
                <p className="text-slate-300 italic text-xs py-1">Kết quả dịch sẽ hiển thị tại đây...</p>
              )}
            </div>
          </div>

        </div>
      )}

      <style jsx>{`
        textarea:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #67e8f9; outline-offset: 2px; }
        textarea { font-size: 16px; line-height: 1.75; }
        select { min-height: 36px; color-scheme: dark; }
      `}</style>
      {/* Minimal Footer */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-600 flex justify-between items-center text-xs text-slate-300">
        <span>Dịch nhanh · Lưu lịch sử trên thiết bị</span>
        <span>Phím tắt: Ctrl + Enter</span>
      </div>

    </FloatingToolPanel>
  )
}


