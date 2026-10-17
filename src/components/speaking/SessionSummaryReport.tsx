'use client'

import React, { useEffect } from 'react'
import {
  Trophy, RotateCcw, BarChart3, CheckCircle2, Clock,
  Volume2, BookOpen, AlertCircle, Sparkles, ChevronRight, MessageSquare
} from 'lucide-react'
import confetti from 'canvas-confetti'

export interface SessionResultItem {
  promptId: string
  examType: string
  part: string
  topic: string
  questionEn: string
  transcript: string
  audioUrl?: string
  wpm: number
  speechDurationSec: number
  pauseCount: number
  longPauseCount: number
  isGraded: boolean
  aiResult?: any
  misheardConfirmedWords?: string[]
}

interface SessionSummaryReportProps {
  examType: string
  results: SessionResultItem[]
  onNewSession: () => void
}

export function SessionSummaryReport({
  examType,
  results,
  onNewSession,
}: SessionSummaryReportProps) {
  useEffect(() => {
    // Confetti celebration on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch {}
  }, [])

  const totalQuestions = results.length
  const totalSpokenSec = results.reduce((acc, r) => acc + (r.speechDurationSec || 0), 0)
  const avgWpm =
    totalQuestions > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.wpm || 0), 0) / totalQuestions)
      : 0
  const totalLongPauses = results.reduce((acc, r) => acc + (r.longPauseCount || 0), 0)

  const gradedResults = results.filter((r) => r.isGraded && r.aiResult)

  const formatMinSec = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ── Celebration Header ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl text-center space-y-2 relative overflow-hidden">
        <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-1">
          <Trophy className="w-10 h-10 text-amber-300" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          Hoàn Thành Phiên Luyện Speaking!
        </h2>
        <p className="text-indigo-100 text-sm max-w-lg mx-auto">
          Bạn đã hoàn thành xuất sắc {totalQuestions} câu hỏi luyện nói theo chuẩn {examType === 'IELTS_SPEAKING' ? 'IELTS' : 'TOEIC'}. Dưới đây là báo cáo thống kê định lượng chi tiết.
        </p>
      </div>

      {/* ── Key Metrics Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalQuestions}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Câu đã trả lời</p>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatMinSec(totalSpokenSec)}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Tổng thời gian nói</p>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgWpm} <span className="text-xs font-normal text-slate-400">WPM</span></p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Tốc độ trung bình</p>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalLongPauses}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Khoảng nghỉ dài (&gt;1.5s)</p>
        </div>
      </div>

      {/* ── Per-Question Breakdown ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Chi tiết từng câu trả lời trong phiên
        </h3>

        <div className="space-y-3">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {item.part} — {item.topic}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-semibold rounded">
                    {item.wpm} WPM
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                    {item.speechDurationSec}s nói
                  </span>
                  {item.isGraded ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded">
                      Đã chấm AI
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium rounded">
                      Chỉ luyện tập
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                "{item.questionEn}"
              </p>

              {/* Transcript Preview */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                <strong>Transcript:</strong> {item.transcript || '(Không có giọng nói nhận diện)'}
              </div>

              {/* Audio Player if available */}
              {item.audioUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <audio src={item.audioUrl} controls className="h-7 w-full max-w-sm rounded" />
                </div>
              )}

              {/* AI Feedback snippet if graded */}
              {item.aiResult?.feedback_vi && (
                <p className="text-xs text-violet-700 dark:text-violet-300 bg-violet-50/80 dark:bg-violet-950/40 p-2.5 rounded-lg border border-violet-100 dark:border-violet-900/50">
                  <strong>Nhận xét AI:</strong> {item.aiResult.feedback_vi}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Bắt đầu phiên luyện mới
        </button>
      </div>
    </div>
  )
}
