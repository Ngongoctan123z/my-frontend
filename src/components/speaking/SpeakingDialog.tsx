'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function SpeakingDialog({ open, onClose, title, children, sheet = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; sheet?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null), close = useRef(onClose); close.current = onClose
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [open])
  return <dialog ref={ref} aria-label={title} onCancel={() => close.current()} onClose={() => close.current()}
    onClick={event => { const r = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close.current() }}
    className={`${sheet ? 'fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full sm:max-w-xl sm:rounded-l-2xl' : 'm-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-xl rounded-2xl'} border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]`}>
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><h2 className="text-base font-bold">{title}</h2><button type="button" onClick={() => close.current()} aria-label={`Đóng ${title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button></div>
    {open && children}
  </dialog>
}
