'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Clock, Mic, RotateCcw, Eye, EyeOff, BookOpen, Volume2,
  Maximize2, X, AlertTriangle, Play, Square, Sparkles, CheckCircle2
} from 'lucide-react'
import { SpeakingPrompt } from '@/src/data/speakingPrompts'

interface SquarePromptCardProps {
  prompt: SpeakingPrompt
  isPracticeMode: boolean
  onStartRecording: () => void
  onSkipOrReroll?: () => void
  onCardExpired: () => void
  isRecording: boolean
  isProcessing: boolean
  recordingMs: number
  volumeLevel: number
  speechDetected: boolean
  onStopRecording: () => void
  analyser: AnalyserNode | null
}

export function SquarePromptCard({
  prompt,
  isPracticeMode,
  onStartRecording,
  onSkipOrReroll,
  onCardExpired,
  isRecording,
  isProcessing,
  recordingMs,
  volumeLevel,
  speechDetected,
  onStopRecording,
  analyser,
}: SquarePromptCardProps) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'prep' | 'grace' | 'recording' | 'expired'>('prep')
  const [prepRemaining, setPrepRemaining] = useState(prompt.prepTimeSec)
  const [graceRemaining, setGraceRemaining] = useState(prompt.startGraceSec || 15)
  const [showVi, setShowVi] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  const prepDeadlineRef = useRef<number>(0)
  const graceDeadlineRef = useRef<number>(0)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  // ── Phase 1: Preparation Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      setPhase('recording')
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      return
    }

    if (prompt.prepTimeSec <= 0) {
      // No prep required -> Go directly to grace phase
      setPhase('grace')
      setGraceRemaining(prompt.startGraceSec || 15)
      graceDeadlineRef.current = Date.now() + (prompt.startGraceSec || 15) * 1000
      startGraceTimer()
      return
    }

    setPhase('prep')
    setPrepRemaining(prompt.prepTimeSec)
    prepDeadlineRef.current = Date.now() + prompt.prepTimeSec * 1000

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const diffMs = prepDeadlineRef.current - now
      const sec = Math.ceil(diffMs / 1000)

      if (sec <= 0) {
        clearInterval(timerIntervalRef.current!)
        setPrepRemaining(0)
        // Transition to grace phase
        setPhase('grace')
        setGraceRemaining(prompt.startGraceSec || 15)
        graceDeadlineRef.current = Date.now() + (prompt.startGraceSec || 15) * 1000
        startGraceTimer()
      } else {
        setPrepRemaining(sec)
      }
    }, 200)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [prompt])

  // ── Phase 2: Start Grace Period Timer (Withdrawal if inactive) ───────────────
  const startGraceTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const diffMs = graceDeadlineRef.current - now
      const sec = Math.ceil(diffMs / 1000)

      if (sec <= 0) {
        clearInterval(timerIntervalRef.current!)
        setGraceRemaining(0)
        setPhase('expired')
        onCardExpired()
      } else {
        setGraceRemaining(sec)
      }
    }, 200)
  }

  // ── Early Start (Skip prep) ────────────────────────────────────────────────
  const handleEarlyStart = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setPhase('recording')
    onStartRecording()
  }

  // ── Start Recording Click ───────────────────────────────────────────────────
  const handleStartRecordingClick = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setPhase('recording')
    onStartRecording()
  }

  // ── Waveform Canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!analyser || !isRecording) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#6366F1'
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }

    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [analyser, isRecording])

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const responseLimitSec = prompt.speakTimeSec || 45
  const remainingResponseSec = Math.max(0, responseLimitSec - Math.floor(recordingMs / 1000))

  return (
    <>
      {/* ── Main Square Card ──────────────────────────────────────────────── */}
      <div
        className={`w-full max-w-xl mx-auto bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500 flex flex-col justify-between ${
          phase === 'expired'
            ? 'scale-95 opacity-60 border-red-300 dark:border-red-900'
            : 'scale-100 opacity-100'
        }`}
        style={{ minHeight: '520px' }}
      >
        {/* Top Header / Badges */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 rounded-lg text-xs font-bold uppercase tracking-wider">
              {prompt.part}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold">
              {prompt.topic}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                prompt.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : prompt.difficulty === 'medium'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {prompt.difficulty.toUpperCase()}
            </span>
          </div>

          {/* Skip / Reroll in Practice Mode */}
          {isPracticeMode && phase !== 'recording' && phase !== 'expired' && onSkipOrReroll && (
            <button
              onClick={onSkipOrReroll}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold transition-colors"
              title="Bốc đề khác"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đổi đề
            </button>
          )}
        </div>

        {/* Center Prompt Body */}
        <div className="p-5 sm:p-7 flex-1 flex flex-col justify-center space-y-4">
          {/* Image / Attachment if available (TOEIC Q3 / Q7-9) */}
          {prompt.imageUrl && (
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-52 bg-slate-100 dark:bg-slate-800">
              <img
                src={prompt.imageUrl}
                alt={prompt.topic}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => setImageModalOpen(true)}
                className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 backdrop-blur-xs transition-all shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Phóng to ảnh
              </button>
            </div>
          )}

          {/* Cue card formatting for IELTS Part 2 */}
          {prompt.cueCard ? (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                {prompt.questionEn}
              </h3>
              <div className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {prompt.cueCard}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {prompt.questionEn}
              </p>
              {prompt.subQuestions && prompt.subQuestions.length > 0 && (
                <div className="mt-3 pl-3 border-l-2 border-indigo-400 dark:border-indigo-600 space-y-1.5">
                  {prompt.subQuestions.map((q, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                      • {q}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vietnamese Translation (Collapsible) */}
          {showVi && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
              <strong>Nghĩa tiếng Việt:</strong> {prompt.questionVi}
            </div>
          )}

          {/* Suggested Vocabulary (Collapsible) */}
          {showVocab && prompt.suggestedVocabulary && (
            <div className="p-3 bg-violet-50/70 dark:bg-violet-950/30 rounded-xl border border-violet-200/70 dark:border-violet-900/40">
              <p className="text-xs font-bold text-violet-800 dark:text-violet-300 mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Từ vựng gợi ý:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {prompt.suggestedVocabulary.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded text-xs font-mono"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Utility Toggles */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => setShowVi(!showVi)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {showVi ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showVi ? 'Ẩn bản dịch' : 'Xem bản dịch TV'}
            </button>

            {prompt.suggestedVocabulary && prompt.suggestedVocabulary.length > 0 && (
              <button
                onClick={() => setShowVocab(!showVocab)}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-400 flex items-center gap-1 px-2.5 py-1 rounded-md border border-violet-200 dark:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {showVocab ? 'Ẩn từ gợi ý' : 'Từ vựng gợi ý'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Action & Timer Area */}
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80">
          {/* Phase 1: Preparation */}
          {phase === 'prep' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                  <Clock className="w-4 h-4 animate-spin" />
                  Thời gian chuẩn bị
                </span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                  {formatSec(prepRemaining)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (prepRemaining / Math.max(1, prompt.prepTimeSec)) * 100)}%`,
                  }}
                />
              </div>

              {/* Option to skip prep in practice mode */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">Đọc kỹ đề và chuẩn bị ý tưởng trước khi nói</p>
                {isPracticeMode && (
                  <button
                    onClick={handleEarlyStart}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all"
                  >
                    Sẵn sàng — Nói ngay &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Start Grace Period */}
          {phase === 'grace' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                  <Mic className="w-4 h-4 animate-pulse" />
                  Sẵn sàng trả lời! Hãy bấm thu âm
                </span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                  {graceRemaining}s
                </span>
              </div>

              {/* Grace progress bar */}
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                  style={{
                    width: `${(graceRemaining / (prompt.startGraceSec || 15)) * 100}%`,
                  }}
                />
              </div>

              <button
                onClick={handleStartRecordingClick}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-base rounded-xl shadow-lg shadow-red-500/25 active:scale-95 transition-all"
              >
                <Mic className="w-5 h-5 animate-bounce" />
                BẮT ĐẦU THU ÂM
              </button>
            </div>
          )}

          {/* Phase 3: Recording Active */}
          {phase === 'recording' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-red-600 font-bold">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  {speechDetected ? 'Đang nghe...' : 'Đang thu âm...'}
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatMs(recordingMs)} / {formatSec(responseLimitSec)}
                </span>
              </div>

              {/* Waveform Canvas */}
              <canvas
                ref={canvasRef}
                width={380}
                height={55}
                className="w-full h-14 bg-slate-900 rounded-xl"
              />

              {/* Volume Meter */}
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-75"
                  style={{ width: `${volumeLevel * 100}%` }}
                />
              </div>

              {/* Stop & Submit Button */}
              <button
                onClick={onStopRecording}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md"
              >
                <Square className="w-4 h-4 fill-white" />
                DỪNG VÀ NỘP BÀI
              </button>
            </div>
          )}

          {/* Phase 4: Expired / Card Withdrawn */}
          {phase === 'expired' && (
            <div className="text-center py-2 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Hết thời gian bắt đầu. Bạn chưa bắt đầu trả lời.
              </div>
              <p className="text-xs text-slate-500">
                Hệ thống tự động thu hồi thẻ đề để đảm bảo tính kỷ luật phòng thi.
              </p>
              {onSkipOrReroll && (
                <button
                  onClick={onSkipOrReroll}
                  className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  Bốc câu hỏi mới &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Image Lightbox Modal ───────────────────────────────────────────── */}
      {imageModalOpen && prompt.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={prompt.imageUrl}
              alt={prompt.topic}
              className="max-h-[82vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
