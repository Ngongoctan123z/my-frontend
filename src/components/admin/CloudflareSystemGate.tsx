'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ShieldCheck, ShieldAlert, Lock, Loader2, RotateCcw } from 'lucide-react'
import { TurnstileWidget } from '@/src/components/common/TurnstileWidget'

// Server layouts enforce administrator identity before rendering this optional
// challenge. Client storage is never accepted as verification evidence.
export function CloudflareSystemGate({ children, systemName = 'Quản trị hệ thống', siteKey }: { children: ReactNode; systemName?: string; siteKey: string }) {
  const [verified, setVerified] = useState(false)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'failed'>('idle')
  const [attempt, setAttempt] = useState(0)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function verify(token: string) {
    if (request.current || !token) return
    const controller = new AbortController(); request.current = controller; setStatus('verifying')
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch('/api/verify-turnstile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: controller.signal })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (response.ok && data.success === true) setVerified(true)
      else setStatus('failed')
    } catch { if (request.current === controller) setStatus('failed') }
    finally { clearTimeout(timeout); if (request.current === controller) request.current = null }
  }
  if (verified) return <>{children}</>
  return <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 p-4">
    <section aria-label="Xác thực bổ sung cho quản trị" className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-lg sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Lock size={28}/></div>
      <div><h1 className="text-xl font-bold text-slate-900">Xác thực bảo mật</h1><p className="mt-2 text-sm leading-6 text-slate-600">Hoàn thành kiểm tra để tiếp tục vào {systemName}.</p></div>
      <div className="min-h-24 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div hidden={status === 'verifying'}><TurnstileWidget key={attempt} siteKey={siteKey} size="flexible" onVerify={verify} onError={() => setStatus('failed')} onExpire={() => setStatus('failed')}/></div>
        {status === 'verifying' && <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-slate-700"><Loader2 size={18} className="animate-spin"/>Đang xác thực…</p>}
      </div>
      {status === 'failed' && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><p className="flex items-center justify-center gap-2"><ShieldAlert size={17}/>Chưa thể xác thực. Vui lòng thử lại.</p><button type="button" onClick={() => {request.current?.abort();request.current=null;setStatus('idle');setAttempt(value=>value+1)}} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-4 font-semibold"><RotateCcw size={15}/>Thử lại</button></div>}
      <p className="flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><ShieldCheck size={15}/>Cloudflare Turnstile</p>
    </section>
  </div>
}
