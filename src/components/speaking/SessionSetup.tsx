'use client'

import React, { useState } from 'react'
import {
  Mic, CheckSquare, Square, Play, ShieldAlert, Sparkles,
  BookOpen, HelpCircle, CheckCircle2, AlertCircle, Clock
} from 'lucide-react'
import { SpeakingPart, PART_META } from '@/src/data/speakingPrompts'

export interface SessionConfig {
  examType: 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
  mode: 'full' | 'custom'
  practiceParts: SpeakingPart[]
  gradeParts: SpeakingPart[]
  source: 'random' | 'manual'
  isPracticeMode: boolean // true = Practice with helpers; false = Strict Exam Simulation
}

interface SessionSetupProps {
  initialExamType: 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
  onStartSession: (config: SessionConfig) => void
}

const IELTS_ALL_PARTS: SpeakingPart[] = ['PART_1', 'PART_2', 'PART_3']
const TOEIC_ALL_PARTS: SpeakingPart[] = ['Q1_2', 'Q3', 'Q4_6', 'Q7_9', 'Q10_11']

export function SessionSetup({ initialExamType, onStartSession }: SessionSetupProps) {
  const [examType, setExamType] = useState<'IELTS_SPEAKING' | 'TOEIC_SPEAKING'>(initialExamType)
  const [mode, setMode] = useState<'full' | 'custom'>('full')

  const allParts = examType === 'IELTS_SPEAKING' ? IELTS_ALL_PARTS : TOEIC_ALL_PARTS

  const [practiceParts, setPracticeParts] = useState<SpeakingPart[]>(allParts)
  const [gradeParts, setGradeParts] = useState<SpeakingPart[]>(allParts)
  const [source, setSource] = useState<'random' | 'manual'>('random')
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(true)
  const [micChecking, setMicChecking] = useState<boolean>(false)
  const [micError, setMicError] = useState<string>('')

  // Handle Exam Type Switch
  const handleExamTypeChange = (newType: 'IELTS_SPEAKING' | 'TOEIC_SPEAKING') => {
    setExamType(newType)
    const newAllParts = newType === 'IELTS_SPEAKING' ? IELTS_ALL_PARTS : TOEIC_ALL_PARTS
    setPracticeParts(newAllParts)
    setGradeParts(newAllParts)
  }

  // Handle Mode Switch
  const handleModeChange = (newMode: 'full' | 'custom') => {
    setMode(newMode)
    if (newMode === 'full') {
      setPracticeParts(allParts)
      setGradeParts(allParts)
    }
  }

  // Toggle Practice Part
  const togglePracticePart = (part: SpeakingPart) => {
    if (practiceParts.includes(part)) {
      // Remove from practice -> also automatically remove from grade
      setPracticeParts((prev) => prev.filter((p) => p !== part))
      setGradeParts((prev) => prev.filter((p) => p !== part))
    } else {
      setPracticeParts((prev) => [...prev, part])
      // Automatically enable grading for it as default
      setGradeParts((prev) => [...prev, part])
    }
  }

  // Toggle Grade Part
  const toggleGradePart = (part: SpeakingPart) => {
    // Cannot grade a part that is not in practice
    if (!practiceParts.includes(part)) return

    if (gradeParts.includes(part)) {
      setGradeParts((prev) => prev.filter((p) => p !== part))
    } else {
      setGradeParts((prev) => [...prev, part])
    }
  }

  // Calculate estimated questions & time
  const estQuestions = practiceParts.length
  let estDurationSec = 0
  practiceParts.forEach((p) => {
    const meta = PART_META[p]
    if (meta) {
      estDurationSec += (meta.defaultPrep || 0) + (meta.defaultSpeak || 45) + 15
    }
  })
  const estDurationMin = Math.ceil(estDurationSec / 60)

  // Pre-flight Mic check and launch
  const handleStart = async () => {
    if (practiceParts.length === 0) return

    setMicChecking(true)
    setMicError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      // Success: release stream immediately
      stream.getTracks().forEach((t) => t.stop())
      setMicChecking(false)

      onStartSession({
        examType,
        mode,
        practiceParts,
        gradeParts,
        source,
        isPracticeMode,
      })
    } catch (err: any) {
      setMicChecking(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Trình duyệt chưa được cấp quyền micro. Vui lòng bật quyền truy cập microphone trên thanh địa chỉ và thử lại.')
      } else {
        setMicError('Không tìm thấy microphone trên thiết bị của bạn. Vui lòng kiểm tra lại mic.')
      }
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-7">
      {/* Title */}
      <div className="text-center space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-5">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <Mic className="w-7 h-7 text-indigo-600" />
          Thiết Lập Phiên Luyện Speaking AI
        </h2>
        <p className="text-sm text-slate-500">
          Tùy chỉnh kỳ thi, các phần muốn luyện tập và chế độ bốc đề
        </p>
      </div>

      {/* 1. Select Exam Type */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          1. Chọn kỳ thi
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleExamTypeChange('IELTS_SPEAKING')}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
              examType === 'IELTS_SPEAKING'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
            }`}
          >
            IELTS Speaking (Part 1 - 3)
          </button>
          <button
            type="button"
            onClick={() => handleExamTypeChange('TOEIC_SPEAKING')}
            className={`py-3.5 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
              examType === 'TOEIC_SPEAKING'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
            }`}
          >
            TOEIC Speaking (Q1 - 11)
          </button>
        </div>
      </div>

      {/* 2. Select Mode: Full vs Custom */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          2. Phạm vi phiên làm bài
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            onClick={() => handleModeChange('full')}
            className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              mode === 'full'
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'full'}
              onChange={() => handleModeChange('full')}
              className="text-indigo-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Làm toàn bộ</p>
              <p className="text-xs text-slate-400">Tất cả các phần theo chuẩn kỳ thi</p>
            </div>
          </label>

          <label
            onClick={() => handleModeChange('custom')}
            className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              mode === 'custom'
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
            }`}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === 'custom'}
              onChange={() => handleModeChange('custom')}
              className="text-indigo-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Chọn từng phần</p>
              <p className="text-xs text-slate-400">Luyện tập tập trung vào kỹ năng yếu</p>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Detailed Checkboxes: Practice & Grade */}
      <div className="space-y-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200/70 dark:border-slate-800">
          <span>Phần thi</span>
          <div className="flex gap-6 pr-2">
            <span>Luyện [✓]</span>
            <span>Chấm AI [✓]</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {allParts.map((part) => {
            const meta = PART_META[part]
            const isPracticed = practiceParts.includes(part)
            const isGraded = gradeParts.includes(part)

            return (
              <div
                key={part}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80"
              >
                <div className="flex-1 pr-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {meta.labelEn} — {meta.labelVi}
                  </p>
                  <p className="text-xs text-slate-400 leading-snug">{meta.descVi}</p>
                </div>

                <div className="flex items-center gap-7 pr-3">
                  {/* Practice Checkbox */}
                  <button
                    type="button"
                    onClick={() => togglePracticePart(part)}
                    className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                    title={isPracticed ? 'Bỏ luyện phần này' : 'Chọn luyện phần này'}
                  >
                    {isPracticed ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>

                  {/* Grade Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleGradePart(part)}
                    disabled={!isPracticed}
                    className="p-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      !isPracticed
                        ? 'Chỉ có thể chấm phần đã chọn luyện'
                        : isGraded
                        ? 'Bỏ chấm phần này'
                        : 'Chấm điểm phần này'
                    }
                  >
                    {isGraded ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-400 italic pt-1">
          * Các phần luyện nhưng <strong>không chọn chấm</strong> vẫn được thu âm, hiển thị transcript và thống kê khoảng nghỉ, nhưng không tính vào điểm số đánh giá.
        </p>
      </div>

      {/* 4. Practice Mode vs Exam Simulation */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          3. Trải nghiệm luyện tập
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            onClick={() => setIsPracticeMode(true)}
            className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isPracticeMode
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
            }`}
          >
            <input
              type="radio"
              name="practiceType"
              checked={isPracticeMode}
              onChange={() => setIsPracticeMode(true)}
              className="text-amber-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Luyện tập tự do
              </p>
              <p className="text-xs text-slate-400">Có vòng xoay, xem nghĩa TV, gợi ý từ vựng, đổi đề</p>
            </div>
          </label>

          <label
            onClick={() => setIsPracticeMode(false)}
            className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              !isPracticeMode
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
            }`}
          >
            <input
              type="radio"
              name="practiceType"
              checked={!isPracticeMode}
              onChange={() => setIsPracticeMode(false)}
              className="text-indigo-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Mô phỏng phòng thi
              </p>
              <p className="text-xs text-slate-400">Chuẩn áp lực thời gian, không hiển thị gợi ý</p>
            </div>
          </label>
        </div>
      </div>

      {/* Summary Box */}
      <div className="flex items-center justify-between p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
        <div>
          <p className="font-bold">
            Dự kiến: {practiceParts.length} phần ({estQuestions} câu hỏi)
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Thời lượng ước tính: ~{estDurationMin} phút (bao gồm thời gian chuẩn bị và trả lời)
          </p>
        </div>
        <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-md font-mono font-bold text-xs">
          {gradeParts.length}/{practiceParts.length} chấm AI
        </span>
      </div>

      {/* Mic Error Alert */}
      {micError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={practiceParts.length === 0 || micChecking}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-base rounded-xl shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {micChecking ? (
          <>Đang kiểm tra quyền Micro...</>
        ) : practiceParts.length === 0 ? (
          <>Vui lòng chọn ít nhất 1 phần muốn luyện</>
        ) : (
          <>
            <Play className="w-5 h-5 fill-white" />
            BẮT ĐẦU PHIÊN LUYỆN
          </>
        )}
      </button>
    </div>
  )
}
