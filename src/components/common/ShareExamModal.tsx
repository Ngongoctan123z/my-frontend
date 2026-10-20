'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { X, Copy, Check, Loader2, Share2, Clock3, ArrowRight, Link2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface ShareExamModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (requirePhone: boolean, requireEmail: boolean) => Promise<string | void>
}

export function ShareExamModal({ isOpen, onClose, onConfirm }: ShareExamModalProps) {
  const pathname = usePathname(), isEn = pathname === '/en' || pathname.startsWith('/en/')
  const [requirePhone, setRequirePhone] = useState(false), [requireEmail, setRequireEmail] = useState(false)
  const [isCreating, setIsCreating] = useState(false), [link, setLink] = useState(''), [copied, setCopied] = useState(false), [error, setError] = useState('')
  const titleId = useId(), panel = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null), linkInput = useRef<HTMLInputElement>(null)
  const generation = useRef(0), close = useRef(onClose), copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  close.current = onClose

  useEffect(() => {
    if (!isOpen) return
    generation.current++; setLink(''); setCopied(false); setError(''); setIsCreating(false)
    const previousFocus = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'; closeButton.current?.focus()
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); return }
      if (event.key !== 'Tab') return
      const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]') || []).filter(el => el.getClientRects().length)
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keyboard, true)
    return () => { generation.current++; document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard, true); previousFocus?.focus(); if (copyTimer.current) clearTimeout(copyTimer.current) }
  }, [isOpen])

  const handleCreate = async () => {
    if (isCreating) return
    const token = generation.current
    setIsCreating(true); setError('')
    try {
      const generated = await onConfirm(requirePhone, requireEmail)
      if (token !== generation.current) return
      if (typeof generated !== 'string' || !generated.trim()) throw new Error(isEn ? 'The link could not be created. Please try again.' : 'Chưa tạo được liên kết. Vui lòng thử lại.')
      setLink(generated)
    } catch (failure: any) { if (token === generation.current) setError(failure?.message || (isEn ? 'Could not create the link.' : 'Chưa tạo được liên kết.')) }
    finally { if (token === generation.current) setIsCreating(false) }
  }
  const copyToClipboard = async () => {
    setError('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(link); setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch { linkInput.current?.focus(); linkInput.current?.select(); setError(isEn ? 'Copy was blocked. The link is selected so you can copy it manually.' : 'Trình duyệt chưa cho sao chép. Liên kết đã được chọn để bạn sao chép thủ công.') }
  }
  if (!isOpen) return null

  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Share2 size={20} /></span><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-600">VNDocs · Plus / Pro</p><h2 id={titleId} className="text-lg font-bold text-slate-900">{isEn ? 'Share an assignment' : 'Giao bài cho học viên'}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{isEn ? 'Create a link for the prompt you have selected.' : 'Tạo liên kết cho đề bài bạn đang chọn.'}</p></div></div>
        <button ref={closeButton} type="button" onClick={onClose} aria-label={isEn ? 'Close sharing' : 'Đóng chia sẻ đề'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500"><X size={20} /></button>
      </header>
      <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Clock3 size={15} />{isEn ? 'Available for 24 hours' : 'Liên kết có hiệu lực 24 giờ'}</p><p className="mt-2 text-xs leading-6 text-slate-500">{isEn ? 'Students can answer without signing in. Each grading request uses your account allowance. Only send this link to the intended learners.' : 'Học viên làm bài không cần đăng nhập. Mỗi lượt chấm sử dụng hạn mức của tài khoản bạn. Chỉ gửi liên kết cho học viên bạn muốn giao bài.'}</p></div>
        {!link ? <>
          <fieldset className="space-y-3" disabled={isCreating}><legend className="mb-3 text-sm font-semibold text-slate-800">{isEn ? 'Information students must provide' : 'Thông tin học viên cần điền'}</legend><div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"><div><p className="text-sm font-medium text-slate-700">{isEn ? 'Full name' : 'Họ và tên'}</p><p className="mt-1 text-xs text-slate-400">{isEn ? 'Included in every submission' : 'Có trong mọi bài nộp'}</p></div><span className="text-xs font-semibold text-slate-500">{isEn ? 'Required' : 'Bắt buộc'}</span></div>{[{checked:requirePhone,set:setRequirePhone,label:isEn?'Phone number':'Số điện thoại',detail:isEn?'For identifying or contacting the learner':'Để nhận diện hoặc liên hệ học viên'},{checked:requireEmail,set:setRequireEmail,label:'Email',detail:isEn?'For identifying or contacting the learner':'Để nhận diện hoặc liên hệ học viên'}].map(item=><label key={item.label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"><input type="checkbox" checked={item.checked} onChange={event=>item.set(event.target.checked)} className="h-4 w-4 shrink-0 accent-blue-600"/><span><span className="block text-sm font-medium text-slate-700">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{item.detail}</span></span></label>)}</fieldset>
          <button type="button" onClick={() => void handleCreate()} disabled={isCreating} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50">{isCreating ? <Loader2 size={17} className="animate-spin" /> : <Link2 size={17} />}{isCreating ? isEn ? 'Creating link…' : 'Đang tạo liên kết…' : isEn ? 'Create assignment link' : 'Tạo liên kết giao bài'}</button>
        </> : <section className="space-y-4" aria-label={isEn ? 'Created assignment link' : 'Liên kết giao bài đã tạo'}>
          <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"><Check size={18} className="mt-0.5 shrink-0 text-emerald-600"/><div><p role="status" className="text-sm font-semibold text-emerald-800">{isEn ? 'Your assignment link is ready' : 'Liên kết giao bài đã sẵn sàng'}</p><p className="mt-1 text-xs leading-5 text-emerald-700">{isEn ? 'Copy the link and send it to your students.' : 'Sao chép liên kết và gửi cho học viên.'}</p></div></div>
          <label className="block text-xs font-semibold text-slate-600">{isEn ? 'Assignment link' : 'Liên kết làm bài'}<input ref={linkInput} type="text" readOnly value={link} onFocus={event=>event.target.select()} className="mt-2 block min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 outline-none focus:border-blue-500"/></label>
          <button type="button" onClick={() => void copyToClipboard()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? isEn ? 'Link copied' : 'Đã sao chép liên kết' : isEn ? 'Copy assignment link' : 'Sao chép liên kết'}</button>
          <a href={link} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600">{isEn ? 'Preview student view' : 'Xem giao diện học viên'}<ArrowRight size={14}/></a>
        </section>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-700">{error}</p>}
      </div>
    </div>
  </div>
}
