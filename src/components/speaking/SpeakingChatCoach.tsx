'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
export function SpeakingChatCoach({ recordingId }: { recordingId: string }) {
  const [messages, setMessages] = useState<Message[]>([]), [input, setInput] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setMessages([]); setError('')
    fetch('/api/speaking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat_history', recordingId }), signal: controller.signal })
      .then(r => r.ok ? r.json() : null).then(data => { if (!controller.signal.aborted && Array.isArray(data?.messages)) setMessages(data.messages) }).catch(() => {})
    return () => controller.abort()
  }, [recordingId])
  const send = async (text = input) => {
    if (!text.trim() || loading) return
    setLoading(true); setError(''); setInput('')
    try {
      const response = await fetch('/api/speaking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat', recordingId, message: text.trim() }) })
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Máy chủ chưa phản hồi. Vui lòng thử lại.')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chưa gửi được câu hỏi.')
      setMessages(previous => [...previous, { role: 'user', content: text.trim() }, { role: 'assistant', content: data.reply }])
    } catch (failure: any) { setInput(text); setError(failure.message || 'Chưa gửi được câu hỏi.') }
    finally { setLoading(false) }
  }
  return <div className="mt-3 space-y-3">
    {!messages.length && <p className="text-xs leading-relaxed text-slate-400">Hỏi về lỗi cần sửa, cách phát triển ý hoặc một ví dụ diễn đạt tốt hơn.</p>}
    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">{['Vì sao câu này cần sửa?', 'Gợi ý một câu trả lời tốt hơn'].map(text => <button key={text} type="button" disabled={loading} onClick={() => void send(text)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-slate-500 hover:bg-slate-50 disabled:opacity-40">{text}</button>)}</div>
    <div aria-live="polite" className="max-h-72 space-y-2 overflow-y-auto">{messages.map((message, index) => <p key={index} className={`whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed ${message.role === 'user' ? 'ml-8 bg-blue-50 text-blue-900' : 'mr-3 bg-slate-50 text-slate-600'}`}>{message.content}</p>)}</div>
    <form onSubmit={event => { event.preventDefault(); void send() }} className="flex gap-2"><input value={input} onChange={event => setInput(event.target.value)} maxLength={1800} disabled={loading} aria-label="Hỏi AI về bài nói" placeholder="Nhập điều bạn muốn hỏi..." className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400" /><button type="submit" aria-label="Gửi câu hỏi" disabled={loading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-40">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form>
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </div>
}
