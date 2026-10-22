'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  className?: string
}

const CUSTOM_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // If a real site key is provided, use Cloudflare's Turnstile script
  useEffect(() => {
    if (!CUSTOM_SITE_KEY) return

    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
    if (window.turnstile) {
      setScriptLoaded(true)
      return
    }

    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => {
      console.warn('[Cloudflare Turnstile] Could not load script.')
      if (onError) onError()
    }
    document.head.appendChild(script)
  }, [onError])

  useEffect(() => {
    if (!CUSTOM_SITE_KEY || !scriptLoaded || !containerRef.current || !window.turnstile) return

    try {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: CUSTOM_SITE_KEY,
        callback: (token: string) => onVerify(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onExpire?.(),
        theme,
        size,
      })
    } catch (e) {
      console.error('[Cloudflare Turnstile] Render error:', e)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        } catch {}
      }
    }
  }, [scriptLoaded, onVerify, onError, onExpire, theme, size])

  if (!CUSTOM_SITE_KEY) return <p role="status" className={`text-sm text-slate-600 ${className}`}>Xác thực bảo mật chưa được cấu hình. Vui lòng liên hệ quản trị viên.</p>

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      {!scriptLoaded && (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang kiểm tra bảo mật...</span>
        </div>
      )}
    </div>
  )
}

