'use client'
import { useEffect, useRef, type ReactNode } from 'react'

export function FloatingToolPanel({ title, onClose, children, className='' }: {title:string;onClose:()=>void;children:ReactNode;className?:string}) {
  const panel=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    panel.current?.focus({preventScroll:true})
    const resize=()=>{if(panel.current)panel.current.style.maxHeight=`${Math.max(220,(window.visualViewport?.height || window.innerHeight)-32)}px`}
    resize();window.visualViewport?.addEventListener('resize',resize)
    return()=>{window.visualViewport?.removeEventListener('resize',resize);if(previous?.isConnected)previous.focus({preventScroll:true})}
  },[])
  return <div ref={panel} role="dialog" aria-label={title} aria-modal="false" tabIndex={-1} data-tool-panel
    onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close.current()}}}
    className={`flex h-[580px] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_16px_60px_rgba(15,23,42,0.16)] outline-none ${className}`}>{children}</div>
}
