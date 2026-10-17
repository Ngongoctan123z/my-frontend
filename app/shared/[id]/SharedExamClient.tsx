'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useState } from 'react'
import { FileEdit, Loader2, Send, AlertCircle, CheckCircle2, X, Maximize2, Minimize2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function SharedExamClient({ exam }: { exam: any }) {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en')
  const [studentName, setStudentName] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [essay, setEssay] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [isEditorExpanded, setIsEditorExpanded] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  
  const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length

  let minWords = 150
  let examTitle = isEn ? "Exam" : "Bài Thi"
  if (exam.examType.startsWith('IELTS')) {
    examTitle = isEn ? "IELTS Writing Exam" : "Bài Thi IELTS Writing"
    minWords = exam.examType === 'IELTS_TASK_2' ? 250 : 150
  } else if (exam.examType.startsWith('TOPIK')) {
    examTitle = isEn ? "TOPIK Writing Exam" : "Bài Thi TOPIK Writing"
    if (exam.examType === 'TOPIK_51_52' || exam.examType === 'TOPIK_51' || exam.examType === 'TOPIK_52') minWords = 20
    if (exam.examType === 'TOPIK_53') minWords = 200
    if (exam.examType === 'TOPIK_54') minWords = 600
  } else if (exam.examType.startsWith('HSK')) {
    examTitle = isEn ? "HSK Writing Exam" : "Bài Thi HSK Writing"
    minWords = 50
  } else if (exam.examType.startsWith('TOEIC')) {
    examTitle = isEn ? "TOEIC Writing Exam" : "Bài Thi TOEIC Writing"
    minWords = exam.examType === 'TOEIC_ESSAY' ? 300 : 100
  }

  const gradeEssay = async () => {
    if (!studentName.trim()) {
      setError(isEn ? 'Please enter your name.' : 'Vui lòng nhập tên của bạn.')
      return
    }
    
    if (exam.requirePhone && !studentPhone.trim()) {
      setError(isEn ? 'Please enter your phone number.' : 'Vui lòng nhập số điện thoại.')
      return
    }

    if (exam.requireEmail && !studentEmail.trim()) {
      setError(isEn ? 'Please enter your email.' : 'Vui lòng nhập email.')
      return
    }

    const finalEssay = essay.trim()
    if (!finalEssay) {
      setError(isEn ? 'Please write your essay before submitting.' : 'Vui lòng viết bài trước khi nộp.')
      return
    }

    if (wordCount < minWords) {
      if (!window.confirm(`${isEn ? 'Your essay only has' : 'Bài viết của bạn mới có'} ${wordCount} ${isEn ? 'words (minimum' : 'từ (yêu cầu tối thiểu'} ${minWords} ${isEn ? 'words). Are you sure you want to submit?' : 'từ). Bạn có chắc chắn muốn nộp không?'}`)) {
        return
      }
    }

    setError(null)
    setIsGrading(true)
    setResult(null)

    try {
      const res = await fetch('/api/shared-exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedExamId: exam.id,
          studentName,
          studentPhone,
          studentEmail,
          essay: finalEssay
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result)
    } catch (e: any) {
      setError(e.message || (isEn ? 'Grading failed.' : 'Chấm điểm thất bại.'))
    } finally {
      setIsGrading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[900] tracking-tight text-slate-800 mb-2">{examTitle}</h1>
          <p className="text-slate-600">{isEn ? 'Created and shared by your teacher' : 'Được tạo và chia sẻ bởi giáo viên của bạn'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className={isEditorExpanded ? "fixed inset-0 z-50 bg-slate-100 p-4 md:p-6 flex flex-col md:flex-row gap-6 h-screen overflow-hidden" : "grid grid-cols-1 md:grid-cols-2 gap-6 items-start"}>
          <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col ${isEditorExpanded ? 'w-full md:w-1/2 h-full overflow-y-auto' : 'md:sticky md:top-6'}`}>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-6">
              <FileEdit className="w-5 h-5 text-blue-600" /> {isEn ? 'Exam Prompt' : 'Nội dung đề thi'}
            </h2>
            {!exam.imageUrl && (
              <div className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap mb-4 max-h-[60vh] overflow-y-auto">
                {exam.content}
              </div>
            )}
            {exam.imageUrl && (
              <div className="relative group">
                <div 
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-[70vh] flex items-center justify-center cursor-zoom-in"
                  onClick={() => setIsFullscreenImage(true)}
                >
                  <img src={exam.imageUrl} alt="Exam Prompt" className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 p-2 rounded-full shadow-lg transition-all transform scale-95 group-hover:scale-100">
                      <Maximize2 className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col transition-all duration-300 ${isEditorExpanded ? 'w-full md:w-1/2 h-full overflow-y-auto' : 'min-h-[480px]'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                {isEn ? 'Your Essay' : 'Bài làm của bạn'}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={isEn ? (isEditorExpanded ? 'Minimize' : 'Maximize') : (isEditorExpanded ? 'Thu nhỏ' : 'Phóng to')}
                >
                  {isEditorExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Full Name *' : 'Họ và tên *'}</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder={isEn ? 'Enter your full name...' : 'Nhập họ và tên...'} />
              </div>
              {exam.requirePhone && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Phone Number *' : 'Số điện thoại *'}</label>
                  <input type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder={isEn ? 'Enter your phone number...' : 'Nhập số điện thoại...'} />
                </div>
              )}
              {exam.requireEmail && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isEn ? 'Email *' : 'Email *'}</label>
                  <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder={isEn ? 'Enter your email address...' : 'Nhập địa chỉ email...'} />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="font-bold text-slate-700">{isEn ? 'Essay Content' : 'Nội dung bài viết'}</h3>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} / {minWords} {isEn ? 'words' : 'từ'}
              </div>
            </div>
            
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={isEn ? 'Write your essay here...' : 'Viết bài làm của bạn vào đây...'}
              className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y text-base leading-relaxed font-sans min-h-[300px]"
            />

            <button
              onClick={gradeEssay}
              disabled={isGrading}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isEn ? 'Submit & Grade' : 'Nộp bài & Chấm điểm'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading Modal Overlay */}
      {isGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 text-center">{isEn ? 'Grading...' : 'Đang chấm điểm...'}</h3>
            <p className="text-slate-500 text-center mt-2 text-sm">{isEn ? 'Analyzing your essay according to the rubric. Please wait a moment.' : 'Hệ thống đang phân tích bài làm của bạn theo tiêu chuẩn khảo thí. Vui lòng đợi trong giây lát.'}</p>
          </div>
        </div>
      )}


    
      <GradingResultModal 
        isOpen={isGrading || !!result} 
        onClose={() => { if (!isGrading) setResult(null) }} 
        isGrading={isGrading} 
        result={result} 
        examType={exam.examType || 'IELTS'} 
      />

      {/* Fullscreen Image Overlay */}
      {isFullscreenImage && exam.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsFullscreenImage(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreenImage(false)
            }}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={exam.imageUrl} 
            alt="Exam Prompt Fullscreen" 
            className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
