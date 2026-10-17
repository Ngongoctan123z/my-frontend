import React, { useState, useRef, useEffect } from 'react'
import { Clock, Play, Pause, Square } from 'lucide-react'

interface ExamTimerProps {
  isEn: boolean
  examPhase: 'setup' | 'reading' | 'writing' | 'finished'
  timeLeft: number
  isPaused: boolean
  onStart: () => void
  onPauseToggle: () => void
  onEndEarly: () => void
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  isEn,
  examPhase,
  timeLeft,
  isPaused,
  onStart,
  onPauseToggle,
  onEndEarly
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg text-red-600">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">
            {examPhase === 'setup' || examPhase === 'finished' ? (isEn ? 'Exam Not Started' : 'Chưa bắt đầu') : formatTime(timeLeft)}
          </h3>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {examPhase === 'setup' ? (isEn ? 'Setup Phase' : 'Thiết lập đề') : 
             examPhase === 'reading' ? (isEn ? 'Reading Phase' : 'Thời gian đọc đề') : 
             examPhase === 'finished' ? (isEn ? 'Finished' : 'Đã kết thúc') :
             (isEn ? 'Writing Phase' : 'Thời gian làm bài')}
             {isPaused && (isEn ? ' (PAUSED)' : ' (TẠM DỪNG)')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {examPhase === 'setup' || examPhase === 'finished' ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm"
          >
            <Play className="w-5 h-5" /> {isEn ? 'Start Exam' : 'Bắt đầu làm bài'}
          </button>
        ) : (
          <>
            <button
              onClick={onPauseToggle}
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors shadow-sm border ${
                isPaused 
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' 
                : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? (isEn ? 'Resume' : 'Tiếp tục') : (isEn ? 'Pause' : 'Tạm dừng')}
            </button>
            <button
              onClick={onEndEarly}
              className="flex items-center gap-2 px-4 py-2 font-bold bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg transition-colors border border-gray-300"
            >
              <Square className="w-4 h-4" /> {isEn ? 'End Exam' : 'Kết thúc'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
