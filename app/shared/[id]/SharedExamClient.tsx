'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useState } from 'react'
import { FileEdit, Loader2, Send, AlertCircle, CheckCircle2, X } from 'lucide-react'

export function SharedExamClient({ exam }: { exam: any }) {
  const [studentName, setStudentName] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [essayTask1, setEssayTask1] = useState('')
  const [essayTask2, setEssayTask2] = useState({ intro: '', body: '', conclusion: '' })
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  
  const isMultiPart = exam.examType === 'IELTS_TASK_2' || exam.examType === 'TOEIC_ESSAY'
  
  const wordCount = isMultiPart
    ? Object.values(essayTask2).join(' ').trim().split(/\s+/).filter(w => w.length > 0).length
    : essayTask1.trim().split(/\s+/).filter(w => w.length > 0).length

  let minWords = 150
  let examTitle = "Bài Thi"
  if (exam.examType.startsWith('IELTS')) {
    examTitle = "Bài Thi IELTS Writing"
    minWords = exam.examType === 'IELTS_TASK_2' ? 250 : 150
  } else if (exam.examType.startsWith('TOPIK')) {
    examTitle = "Bài Thi TOPIK Writing"
    if (exam.examType === 'TOPIK_51_52') minWords = 50
    if (exam.examType === 'TOPIK_53') minWords = 200
    if (exam.examType === 'TOPIK_54') minWords = 600
  } else if (exam.examType.startsWith('HSK')) {
    examTitle = "Bài Thi HSK Writing"
    minWords = 50
  } else if (exam.examType.startsWith('TOEIC')) {
    examTitle = "Bài Thi TOEIC Writing"
    minWords = exam.examType === 'TOEIC_ESSAY' ? 300 : 100
  }

  const gradeEssay = async () => {
    if (!studentName.trim()) {
      setError('Vui lòng nhập tên của bạn.')
      return
    }
    
    if (exam.requirePhone && !studentPhone.trim()) {
      setError('Vui lòng nhập số điện thoại.')
      return
    }

    if (exam.requireEmail && !studentEmail.trim()) {
      setError('Vui lòng nhập email.')
      return
    }

    let finalEssay = ''
    if (!isMultiPart) {
      finalEssay = essayTask1.trim()
      if (!finalEssay) {
        setError('Vui lòng viết bài trước khi nộp.')
        return
      }
    } else {
      finalEssay = `[INTRODUCTION]
${essayTask2.intro}

[BODY PARAGRAPHS]
${essayTask2.body}

[CONCLUSION]
${essayTask2.conclusion}`
      if (!essayTask2.intro.trim() || !essayTask2.body.trim() || !essayTask2.conclusion.trim()) {
        setError('Vui lòng hoàn thành cả 3 phần: Mở bài, Thân bài, Kết bài.')
        return
      }
    }

    if (wordCount < minWords) {
      if (!window.confirm(`Bài viết của bạn mới có ${wordCount} từ (yêu cầu tối thiểu ${minWords} từ). Bạn có chắc chắn muốn nộp không?`)) {
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
      setError(e.message || 'Chấm điểm thất bại.')
    } finally {
      setIsGrading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[900] tracking-tight text-slate-800 mb-2">{examTitle}</h1>
          <p className="text-slate-600">Được tạo và chia sẻ bởi giáo viên của bạn</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:sticky md:top-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-6">
              <FileEdit className="w-5 h-5 text-blue-600" /> Nội dung đề thi
            </h2>
            {!exam.imageUrl && (
              <div className="w-full p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap mb-4 max-h-[60vh] overflow-y-auto">
                {exam.content}
              </div>
            )}
            {exam.imageUrl && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-[70vh] flex items-center justify-center">
                <img src={exam.imageUrl} alt="Exam Prompt" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-[480px]">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
              Bài làm của bạn
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Họ và tên *</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder="Nhập họ và tên..." />
              </div>
              {exam.requirePhone && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại *</label>
                  <input type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder="Nhập số điện thoại..." />
                </div>
              )}
              {exam.requireEmail && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm" placeholder="Nhập địa chỉ email..." />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="font-bold text-slate-700">Nội dung bài viết</h3>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} / {minWords} từ
              </div>
            </div>
            
            {!isMultiPart ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder="Viết bài làm của bạn vào đây..."
                className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y text-sm leading-relaxed min-h-[300px]"
              />
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mở bài (Introduction)</label>
                  <textarea
                    value={essayTask2.intro}
                    onChange={(e) => setEssayTask2({ ...essayTask2, intro: e.target.value })}
                    placeholder="Viết mở bài..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-sm resize-y min-h-[100px]"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Thân bài (Body Paragraphs)</label>
                  <textarea
                    value={essayTask2.body}
                    onChange={(e) => setEssayTask2({ ...essayTask2, body: e.target.value })}
                    placeholder="Viết thân bài..."
                    className="flex-1 w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-sm resize-y min-h-[200px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kết bài (Conclusion)</label>
                  <textarea
                    value={essayTask2.conclusion}
                    onChange={(e) => setEssayTask2({ ...essayTask2, conclusion: e.target.value })}
                    placeholder="Viết kết bài..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-sm resize-y min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <button
              onClick={gradeEssay}
              disabled={isGrading}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Nộp bài & Chấm điểm
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading Modal Overlay */}
      {isGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 text-center">Đang chấm điểm...</h3>
            <p className="text-slate-500 text-center mt-2 text-sm">Hệ thống AI đang phân tích bài làm của bạn. Vui lòng đợi trong giây lát.</p>
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
    </div>
  )
}
