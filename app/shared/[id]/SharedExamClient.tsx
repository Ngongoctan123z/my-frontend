'use client'

import { GradingResultModal } from '@/src/components/common/GradingResultModal'
import React, { useEffect, useId, useRef, useState } from 'react'
import { FileEdit, Loader2, Send, AlertCircle, X, Maximize2, Minimize2, Users, Clock3, UserRound, PenLine } from 'lucide-react'
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
  const fieldId = useId(), request = useRef<AbortController | null>(null), requestBusy = useRef(false)
  const editorPanel = useRef<HTMLDivElement>(null), imagePanel = useRef<HTMLDivElement>(null)
  const expiredAt = exam.expiresAt ? new Date(exam.expiresAt).getTime() : NaN
  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => {
    if (!isEditorExpanded && !isFullscreenImage) return
    const previous = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    const panel = isFullscreenImage ? imagePanel.current : editorPanel.current
    document.body.style.overflow = 'hidden'
    if (isFullscreenImage) panel?.querySelector<HTMLButtonElement>('button')?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (isFullscreenImage) setIsFullscreenImage(false); else setIsEditorExpanded(false); return }
      if (event.key !== 'Tab') return
      const items = Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]') || []).filter(item => item.getClientRects().length)
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', close); if (previousFocus?.isConnected) previousFocus.focus() }
  }, [isEditorExpanded, isFullscreenImage])

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length
  const examType = String(exam.examType || '')
  let minWords = 150
  let examTitle = isEn ? 'Writing assignment' : 'Bài tập Writing'
  if (examType.startsWith('IELTS')) {
    examTitle = 'IELTS Writing'
    minWords = examType === 'IELTS_TASK_2' ? 250 : 150
  } else if (examType.startsWith('TOPIK')) {
    examTitle = 'TOPIK Writing'
    if (['TOPIK_51_52', 'TOPIK_51', 'TOPIK_52'].includes(examType)) minWords = 20
    if (examType === 'TOPIK_53') minWords = 200
    if (examType === 'TOPIK_54') minWords = 600
  } else if (examType.startsWith('HSK')) {
    examTitle = 'HSK Writing'
    minWords = 50
  } else if (examType.startsWith('TOEIC')) {
    examTitle = 'TOEIC Writing'
    minWords = examType === 'TOEIC_ESSAY' ? 300 : 100
  }

  const gradeEssay = async () => {
    if (requestBusy.current) return
    if (!studentName.trim()) { setError(isEn ? 'Please enter your name.' : 'Vui lòng nhập tên của bạn.'); return }
    if (exam.requirePhone && !studentPhone.trim()) { setError(isEn ? 'Please enter your phone number.' : 'Vui lòng nhập số điện thoại.'); return }
    if (exam.requireEmail && !studentEmail.trim()) { setError(isEn ? 'Please enter your email.' : 'Vui lòng nhập email.'); return }
    const finalEssay = essay.trim()
    if (!finalEssay) { setError(isEn ? 'Please write your essay before submitting.' : 'Vui lòng viết bài trước khi nộp.'); return }
    if (wordCount < minWords && !window.confirm(isEn ? `Your answer has ${wordCount} words (recommended ${minWords}). Submit this answer?` : `Bài làm có ${wordCount} từ (khuyến nghị ${minWords}). Bạn muốn nộp bài này?`)) return

    const controller = new AbortController()
    request.current = controller; requestBusy.current = true
    setError(null); setResult(null); setIsGrading(true)
    try {
      const response = await fetch('/api/shared-exams/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ sharedExamId: exam.id, studentName: studentName.trim(), studentPhone: studentPhone.trim(), studentEmail: studentEmail.trim(), essay: finalEssay })
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) throw new Error(data.error || (isEn ? 'Grading failed. Please try again.' : 'Chưa chấm được bài. Vui lòng thử lại.'))
      if (!data.result) throw new Error(isEn ? 'The grading response was incomplete. Please try again.' : 'Chưa nhận đủ kết quả chấm. Vui lòng thử lại.')
      setResult(data.result)
    } catch (failure: any) {
      if (!controller.signal.aborted) setError(failure?.message || (isEn ? 'Grading failed. Your response has been kept.' : 'Chưa chấm được bài. Nội dung bài làm vẫn được giữ lại.'))
    } finally {
      if (request.current === controller) { request.current = null; requestBusy.current = false; if (!controller.signal.aborted) setIsGrading(false) }
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl py-6 sm:py-10">
      <header className="mb-6 space-y-3 px-1">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600"><Users size={15} />{isEn ? 'Student assignment' : 'Bài tập được giao'}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{examTitle}</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">{isEn ? 'Read the prompt, enter your details and complete the assignment. You do not need a VNDocs account.' : 'Đọc đề, điền thông tin và làm bài ngay trên trang này. Bạn không cần tạo tài khoản VNDocs.'}</p>
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-6 text-slate-500"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-slate-400" /><span>{Number.isFinite(expiredAt) ? (isEn ? 'Link expires: ' : 'Liên kết hết hạn: ') + new Date(expiredAt).toLocaleString(isEn ? 'en-US' : 'vi-VN') + '. ' : ''}{isEn ? 'Grading uses the assigning account’s allowance. AI scores are practice estimates.' : 'Lượt chấm được tính vào hạn mức tài khoản giao bài. Điểm AI chỉ phục vụ luyện tập.'}</span></div>
      </header>

      <div ref={editorPanel} className={isEditorExpanded ? 'fixed inset-0 z-[150] grid min-w-0 grid-rows-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 overflow-hidden bg-slate-100 p-3 md:grid-cols-2 md:grid-rows-1 md:gap-5 md:p-6' : 'grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'}>
        <section aria-label={isEn ? 'Exam prompt' : 'Đề bài được giao'} className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white ${isEditorExpanded ? 'min-h-0 overflow-y-auto' : 'lg:sticky lg:top-20'}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 sm:px-5"><FileEdit size={17} className="text-blue-600"/><h2 className="text-sm font-semibold text-slate-800">{isEn ? 'Exam prompt' : 'Đề bài được giao'}</h2></div>
          <div className="space-y-4 p-4 sm:p-5">
            {!!exam.content && <div className="max-h-[60dvh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{exam.content}</div>}
            {exam.imageUrl && <button type="button" onClick={() => setIsFullscreenImage(true)} aria-label={isEn ? 'Enlarge exam image' : 'Phóng to ảnh đề bài'} className="group block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left focus-visible:outline-2 focus-visible:outline-blue-500"><img src={exam.imageUrl} alt={isEn ? 'Exam prompt image' : 'Hình minh họa đề bài'} className="max-h-[60dvh] w-full object-contain"/><span className="flex items-center justify-center gap-1.5 border-t border-slate-200 py-2 text-[11px] text-slate-500"><Maximize2 size={13}/>{isEn ? 'Open full image' : 'Xem ảnh đầy đủ'}</span></button>}
          </div>
        </section>

        <form onSubmit={event => { event.preventDefault(); void gradeEssay() }} aria-label={isEn ? 'Student response' : 'Bài làm học viên'} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white ${isEditorExpanded ? 'min-h-0 overflow-y-auto' : ''}`}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><div className="flex items-center gap-2"><PenLine size={17} className="text-blue-600"/><h2 className="text-sm font-semibold text-slate-800">{isEn ? 'Your response' : 'Bài làm của bạn'}</h2></div><button type="button" onClick={() => setIsEditorExpanded(value => !value)} aria-label={isEn ? isEditorExpanded ? 'Restore editor' : 'Expand editor' : isEditorExpanded ? 'Thu nhỏ phần làm bài' : 'Mở rộng phần làm bài'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-600">{isEditorExpanded ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button></div>
          <div className="space-y-5 p-4 sm:p-5">
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            <fieldset disabled={isGrading} className="grid min-w-0 gap-3 sm:grid-cols-2"><legend className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><UserRound size={14}/>{isEn ? '1. Student details' : '1. Thông tin học viên'}</legend><label htmlFor={fieldId + '-name'} className="block min-w-0 text-xs font-medium text-slate-600">{isEn ? 'Full name' : 'Họ và tên'} <span className="text-red-500">*</span><input id={fieldId + '-name'} name="studentName" type="text" autoComplete="name" required value={studentName} onChange={event=>setStudentName(event.target.value)} placeholder={isEn ? 'Enter your full name' : 'Nhập họ và tên của bạn'} className="mt-1.5 block min-h-10 w-full min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"/></label>
              {exam.requirePhone && <label htmlFor={fieldId + '-phone'} className="block min-w-0 text-xs font-medium text-slate-600">{isEn ? 'Phone number' : 'Số điện thoại'} <span className="text-red-500">*</span><input id={fieldId + '-phone'} name="studentPhone" type="tel" autoComplete="tel" required value={studentPhone} onChange={event=>setStudentPhone(event.target.value)} placeholder={isEn ? 'Enter your phone number' : 'Nhập số điện thoại'} className="mt-1.5 block min-h-10 w-full min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"/></label>}
              {exam.requireEmail && <label htmlFor={fieldId + '-email'} className="block min-w-0 text-xs font-medium text-slate-600">Email <span className="text-red-500">*</span><input id={fieldId + '-email'} name="studentEmail" type="email" autoComplete="email" required value={studentEmail} onChange={event=>setStudentEmail(event.target.value)} placeholder={isEn ? 'Enter your email address' : 'Nhập địa chỉ email'} className="mt-1.5 block min-h-10 w-full min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"/></label>}
            </fieldset>
            <div className="border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between gap-2"><label htmlFor={fieldId + '-essay'} className="text-xs font-semibold text-slate-600">{isEn ? '2. Write your response' : '2. Viết bài làm'}</label><span className={`shrink-0 text-[11px] tabular-nums ${wordCount >= minWords ? 'text-emerald-600' : 'text-slate-400'}`}>{wordCount} / {minWords} {isEn ? 'words' : 'từ'}</span></div><textarea id={fieldId + '-essay'} name="essay" aria-label={isEn ? 'Your essay' : 'Nội dung bài làm'} required disabled={isGrading} value={essay} onChange={event=>setEssay(event.target.value)} placeholder={isEn ? 'Write your response here…' : 'Viết bài làm của bạn tại đây…'} className="min-h-72 w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"/></div>
            <p className="text-[11px] leading-6 text-slate-400">{isEn ? 'Your name, requested contact details and response will be visible to the account that assigned this exam. Submit only the information requested.' : 'Tên, thông tin liên hệ được yêu cầu và bài làm sẽ hiển thị cho tài khoản giao bài. Chỉ nhập thông tin cần thiết cho bài tập.'}</p>
            <button type="submit" disabled={isGrading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-wait disabled:opacity-50">{isGrading ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {isGrading ? isEn ? 'Submitting for feedback…' : 'Đang nộp để nhận xét…' : isEn ? 'Submit & Grade' : 'Nộp bài & Chấm điểm'}</button>
          </div>
        </form>
      </div>

      <GradingResultModal isOpen={isGrading || !!result} onClose={() => { if (!isGrading) setResult(null) }} isGrading={isGrading} result={result} examType={exam.examType || 'IELTS'} />

      {isFullscreenImage && exam.imageUrl && <div ref={imagePanel} role="dialog" aria-modal="true" aria-label={isEn ? 'Exam image' : 'Ảnh đề bài'} className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4" onClick={()=>setIsFullscreenImage(false)}><button type="button" onClick={()=>setIsFullscreenImage(false)} aria-label={isEn ? 'Close image' : 'Đóng ảnh'} className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><X size={22}/></button><img src={exam.imageUrl} alt={isEn ? 'Full exam image' : 'Ảnh đề bài đầy đủ'} className="max-h-[90dvh] max-w-full object-contain" onClick={event=>event.stopPropagation()}/></div>}
    </div>
  )
}
