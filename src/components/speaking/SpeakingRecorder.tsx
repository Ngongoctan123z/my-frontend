'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, Check, Loader2, Mic, RotateCcw, Square, Trash2, X } from 'lucide-react'
import { useSpeakingAudioUrl, useSpeakingRecorder } from '@/src/hooks/useSpeakingRecorder'
import { formatSpeakingTime, type SpeakingClip, type SpeakingQuestion } from '@/src/lib/speaking'

function readQuestion(question: SpeakingQuestion) {
  return new Promise<void>(resolve => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    const instruction = question.part === 'Q1_2' ? 'Read the text aloud. You have forty-five seconds to prepare.' : question.questionEn
    const utterance = new SpeechSynthesisUtterance(question.repeatQuestion ? `${instruction} ... ${instruction}` : instruction)
    utterance.lang = 'en-US'; utterance.rate = 0.95
    const voice = speechSynthesis.getVoices().find(voice => voice.lang.startsWith('en'))
    if (voice) utterance.voice = voice
    const timeout = setTimeout(() => { speechSynthesis.cancel(); resolve() }, 25_000)
    utterance.onend = utterance.onerror = () => { clearTimeout(timeout); resolve() }
    speechSynthesis.speak(utterance)
  })
}

export function SpeakingRecorder({ question, clip, strict, autoStart, canRecord, busy, processing, footer,
  onLogin, onComplete, onClear, onActiveChange, onStartExam, onAutoError }: {
  question: SpeakingQuestion; clip?: SpeakingClip; strict: boolean; autoStart: boolean; canRecord: boolean
  busy: boolean; processing: string; footer: ReactNode
  onLogin: () => void; onComplete: (clip: SpeakingClip) => void; onClear: () => void
  onActiveChange: (active: boolean) => void; onStartExam: () => void; onAutoError: () => void
}) {
  const [phase, setPhase] = useState<'idle' | 'reading' | 'preparing'>('idle'), [remaining, setRemaining] = useState(0), [prepLabel, setPrepLabel] = useState('Thời gian chuẩn bị'), [flowError, setFlowError] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null), generation = useRef(0), canvas = useRef<HTMLCanvasElement>(null)
  const complete = useRef(onComplete); complete.current = onComplete
  const recorder = useSpeakingRecorder({ maxDurationMs: strict ? question.speakTimeSec * 1000 : 300_000,
    onComplete: next => { setPhase('idle'); complete.current(next) }, onStarted: onClear, onActiveChange })
  const audioUrl = useSpeakingAudioUrl(clip?.blob)
  const prepare = (seconds: number, label: string, then: () => void) => {
    if (timer.current) clearInterval(timer.current)
    if (seconds <= 0) { then(); return }
    setPrepLabel(label); setPhase('preparing'); setRemaining(seconds); onActiveChange(true)
    const until = Date.now() + seconds * 1000
    timer.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000)); setRemaining(left)
      if (!left) { clearInterval(timer.current!); timer.current = null; then() }
    }, 200)
  }
  const beginExamQuestion = async () => {
    const token = ++generation.current
    setFlowError(''); onActiveChange(true)
    try {
      if (question.questionNumber === 1) {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro không được hỗ trợ trên trình duyệt này.')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop())
      }
      if (token !== generation.current) return
      const afterReading = async () => {
        if (token !== generation.current) return
        setPhase('reading'); await readQuestion(question)
        if (token !== generation.current) return
        prepare(question.prepTimeSec, 'Thời gian chuẩn bị', () => { setPhase('idle'); void recorder.start() })
      }
      if (question.readingTimeSec) prepare(question.readingTimeSec, 'Đọc thông tin trước câu hỏi', () => { void afterReading() })
      else await afterReading()
    } catch {
      setPhase('idle'); onActiveChange(false); onAutoError()
      setFlowError('Không mở được micro. Hãy cấp quyền micro rồi bấm bắt đầu lại.')
    }
  }
  useEffect(() => {
    if (autoStart && strict) void beginExamQuestion()
    return () => { generation.current++; if (timer.current) clearInterval(timer.current); if ('speechSynthesis' in window) speechSynthesis.cancel() }
  }, [autoStart, question.id])
  useEffect(() => {
    if (recorder.error && strict) onAutoError()
  }, [recorder.error, strict])
  useEffect(() => {
    if (!recorder.recording || !canvas.current) return
    const element = canvas.current, context = element.getContext('2d')
    if (!context) return
    const bytes = new Uint8Array(512)
    let animation = 0
    const draw = () => {
      const node = recorder.analyser.current
      if (!node) return
      node.getByteTimeDomainData(bytes)
      context.clearRect(0, 0, element.width, element.height); context.beginPath(); context.strokeStyle = '#548bf5'; context.lineWidth = 2
      for (let i = 0; i < bytes.length; i += 2) {
        const x = i / bytes.length * element.width, y = bytes[i] / 128 * element.height / 2
        if (!i) context.moveTo(x, y); else context.lineTo(x, y)
      }
      context.stroke(); animation = requestAnimationFrame(draw)
    }
    draw(); return () => cancelAnimationFrame(animation)
  }, [recorder.recording])
  const active = recorder.recording || recorder.requesting || phase !== 'idle'
  const cancel = () => { generation.current++; if (timer.current) clearInterval(timer.current); if ('speechSynthesis' in window) speechSynthesis.cancel(); setPhase('idle'); recorder.cancel(); if (strict) onAutoError() }
  const start = () => { if (!canRecord) onLogin(); else if (strict) onStartExam(); else void recorder.start() }

  return <section aria-label="Bài nói của bạn" className="min-w-0 rounded-none border-y border-slate-200 bg-white shadow-xs sm:rounded-xl sm:border">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><h3 className="text-sm font-bold text-slate-800">Bài nói của bạn</h3><span role="status" className={`flex shrink-0 items-center gap-1.5 text-[11px] ${recorder.recording ? 'text-red-500' : 'text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${recorder.recording ? 'bg-red-500' : clip ? 'bg-emerald-500' : 'bg-slate-300'}`} />{busy ? 'Đang nhận xét' : recorder.recording ? 'Đang thu âm' : active ? 'Đang chuẩn bị' : clip ? 'Đã có bản thu' : 'Chưa thu âm'}</span></div>
    <div className="flex min-h-[280px] flex-col items-center justify-center px-4 py-7 text-center sm:min-h-[320px] sm:px-6">
      {busy ? <><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Loader2 className="h-7 w-7 animate-spin" /></div><p className="mt-5 text-sm font-semibold text-slate-700">{processing || 'Đang xử lý bài nói'}</p><p className="mt-2 text-xs text-slate-400">Bản thu đã được giữ để tiếp tục nếu kết nối gián đoạn.</p></>
      : recorder.requesting ? <><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="mt-4 text-sm font-semibold">Đang mở microphone</p><p className="mt-2 text-xs text-slate-400">Cho phép dùng micro khi trình duyệt yêu cầu.</p></>
      : phase !== 'idle' ? <><p className="text-xs text-slate-400">{phase === 'reading' ? 'Đang đọc câu hỏi' : prepLabel}</p><p className="my-5 font-mono text-4xl font-semibold tabular-nums tracking-wide text-blue-600">{phase === 'reading' ? '…' : formatSpeakingTime(remaining * 1000)}</p><p className="text-xs text-slate-400">Micro sẽ bắt đầu khi hết thời gian chuẩn bị.</p>{!strict && <button type="button" onClick={() => { if (timer.current) clearInterval(timer.current); setPhase('idle'); void recorder.start() }} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Bắt đầu nói ngay</button>}</>
      : recorder.recording ? <><button type="button" onClick={recorder.stop} disabled={recorder.elapsedMs < 1000} aria-label="Dừng thu âm" className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50"><Square className="h-6 w-6 fill-current" /></button><canvas ref={canvas} width={560} height={70} aria-hidden="true" className="mt-5 h-9 w-full max-w-xs" /><p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-wide">{formatSpeakingTime(recorder.elapsedMs)}</p><p className="mt-2 text-xs text-slate-400">{strict ? `Giới hạn ${formatSpeakingTime(question.speakTimeSec * 1000)}` : 'Bấm dừng khi bạn nói xong.'}</p>{!recorder.signalDetected && recorder.elapsedMs > 6000 && <p className="mt-3 max-w-xs text-xs text-amber-600">Chưa nhận được tín hiệu rõ. Kiểm tra micro và nói gần thiết bị hơn.</p>}</>
      : clip ? <><span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold">Bản thu đã sẵn sàng</p><p className="mt-1 text-xs text-slate-400">{formatSpeakingTime(clip.metrics.totalDurationMs)} · Nghe lại trước khi nộp</p>{audioUrl && <audio aria-label="Nghe lại bản thu" controls preload="metadata" src={audioUrl} className="mt-5 h-10 w-full min-w-0 max-w-sm" />}<div className="mt-4 flex items-center gap-3"><button type="button" disabled={strict} onClick={() => void recorder.start()} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Thu lại</button>{!strict && <button type="button" onClick={onClear} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" />Xóa bản thu</button>}</div></>
      : <><button type="button" onClick={start} aria-label={canRecord ? strict ? 'Bắt đầu thi thử' : 'Bắt đầu thu âm' : 'Đăng nhập để thu âm'} className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300"><Mic className="h-7 w-7" strokeWidth={1.7} /></button><p className="mt-5 text-sm font-semibold">{canRecord ? strict ? 'Sẵn sàng bắt đầu bài thi?' : 'Sẵn sàng khi bạn muốn' : 'Đăng nhập để bắt đầu luyện nói'}</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">{strict ? 'Chuẩn bị và nói theo thời gian từng câu. Nhận xét sau khi nộp trọn bộ.' : 'Bấm micro để nói. Bạn có thể nghe lại và thu lại trước khi nộp.'}</p>{canRecord && !strict && question.prepTimeSec > 0 && <button type="button" onClick={() => prepare(question.prepTimeSec, 'Thời gian chuẩn bị', () => { setPhase('idle'); void recorder.start() })} className="mt-4 rounded-md px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">Chuẩn bị {formatSpeakingTime(question.prepTimeSec * 1000)}</button>}</>}
      {active && !busy && <button type="button" onClick={cancel} className="mt-5 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-600"><X className="h-3 w-3" />Hủy thao tác</button>}
      {(recorder.error || flowError) && <p role="alert" className="mt-4 flex max-w-sm items-start gap-2 rounded-lg bg-red-50 p-3 text-left text-xs leading-relaxed text-red-600"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{recorder.error || flowError}</p>}
    </div>
    <div className="mx-4 border-t border-slate-100 py-4 sm:mx-5">{footer}</div>
  </section>
}
