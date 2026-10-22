'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, params: { sitekey: string; callback?: (token: string) => void; 'error-callback'?: () => void; 'expired-callback'?: () => void; theme?: 'light' | 'dark' | 'auto'; size?: 'normal' | 'compact' | 'flexible' }) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}
let scriptPromise: Promise<void> | null = null
function loadScript() {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]')
    const existing = !!script
    if (!script) {script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true}
    const element=script
    const cleanup=()=>{clearTimeout(timer);element.removeEventListener('load',loaded);element.removeEventListener('error',failed)}
    const loaded=()=>{cleanup();if(window.turnstile)resolve();else{element.remove();reject(new Error('Turnstile API unavailable'))}}
    const failed=()=>{cleanup();element.remove();reject(new Error('Turnstile script unavailable'))}
    const timer=setTimeout(failed,12000)
    element.addEventListener('load',loaded);element.addEventListener('error',failed)
    if(!existing)document.head.appendChild(element)
  }).catch(error=>{scriptPromise=null;throw error})
  return scriptPromise
}
interface Props {
  siteKey?: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  className?: string
}
export function TurnstileWidget({ siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, onVerify, onError, onExpire, theme='auto', size='normal', className='' }: Props) {
  const container=useRef<HTMLDivElement>(null),callbacks=useRef({onVerify,onError,onExpire})
  callbacks.current={onVerify,onError,onExpire}
  const [loading,setLoading]=useState(!!siteKey),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    if(!siteKey)return
    let cancelled=false,id:string|undefined
    setLoading(true);setFailed(false)
    loadScript().then(()=>{
      if(cancelled||!container.current||!window.turnstile)return
      const widgetSize=size==='flexible' && container.current.clientWidth<300?'compact':size
      id=window.turnstile.render(container.current,{sitekey:siteKey,theme,size:widgetSize,callback:token=>{if(!cancelled)callbacks.current.onVerify(token)},'error-callback':()=>{if(!cancelled){setFailed(true);callbacks.current.onError?.()}},'expired-callback':()=>{if(!cancelled)callbacks.current.onExpire?.()}})
      setLoading(false)
    }).catch(()=>{if(!cancelled){setLoading(false);setFailed(true);callbacks.current.onError?.()}})
    return()=>{cancelled=true;if(id&&window.turnstile){try{window.turnstile.remove(id)}catch{}}}
  },[siteKey,theme,size,attempt])
  if(!siteKey)return <p role="status" className={`text-sm text-slate-600 ${className}`}>Xác thực bảo mật chưa được cấu hình.</p>
  return <div className={`flex w-full min-w-0 flex-col items-center justify-center ${className}`}>
    <div ref={container} className="flex min-h-16 w-full min-w-0 items-center justify-center"/>
    {loading&&<p role="status" className="flex items-center gap-2 py-2 text-sm text-slate-600"><Loader2 size={16} className="animate-spin"/>Đang tải xác thực…</p>}
    {failed&&<button type="button" onClick={()=>setAttempt(value=>value+1)} className="mt-2 min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">Tải lại xác thực</button>}
  </div>
}
