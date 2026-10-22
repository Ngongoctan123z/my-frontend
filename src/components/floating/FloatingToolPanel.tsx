'use client'
import { useEffect, useRef, type ReactNode } from 'react'

export function FloatingToolPanel({ title, onClose, children, className='' }: {title:string;onClose:()=>void;children:ReactNode;className?:string}) {
  const panel=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    panel.current?.focus({preventScroll:true})
    const resize=()=>{if(panel.current)panel.current.style.maxHeight=`${Math.max(220,(window.visualViewport?.height || window.innerHeight)-32)}px`}
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!document.querySelector('dialog[open]'))close.current()}
    resize();window.visualViewport?.addEventListener('resize',resize)
    document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('keydown',escape);window.visualViewport?.removeEventListener('resize',resize);if(previous?.isConnected)previous.focus({preventScroll:true})}
  },[])
  return <div ref={panel} role="dialog" aria-label={title} aria-modal="false" tabIndex={-1} data-tool-panel
    onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();close.current()}}}
    className={`flex h-[580px] w-[380px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-[0_20px_70px_rgba(2,6,23,0.4)] outline-none ${className}`}>{children}</div>
}

