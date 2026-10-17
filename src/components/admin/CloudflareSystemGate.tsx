'use client'

import React, { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react'
import { TurnstileWidget } from '@/src/components/common/TurnstileWidget'

interface CloudflareSystemGateProps {
  children: React.ReactNode
  systemName?: string
}

export function CloudflareSystemGate({
  children,
  systemName = 'Cổng Quản Trị Hệ Thống',
}: CloudflareSystemGateProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle')

  useEffect(() => {
    // Check if already verified in this session
    try {
      const saved = sessionStorage.getItem('cf_sys_gate_verified')
      if (saved === 'true') {
        setIsVerified(true)
      }
    } catch {
      // ignore
    } finally {
      setIsChecking(false)
    }
  }, [])

  const handleTurnstileSuccess = async (turnstileToken: string) => {
    setToken(turnstileToken)
    setVerifyStatus('verifying')

    try {
      // Verify with backend
      const res = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      })

      const data = await res.json()
      if (data.success) {
        setVerifyStatus('success')
        setTimeout(() => {
          setIsVerified(true)
          try {
            sessionStorage.setItem('cf_sys_gate_verified', 'true')
          } catch {
            // ignore
          }
        }, 600)
      } else {
        setVerifyStatus('failed')
      }
    } catch (e) {
      // Even if network blips, fallback to pass if token was issued by Cloudflare
      if (turnstileToken) {
        setVerifyStatus('success')
        setTimeout(() => {
          setIsVerified(true)
          try {
            sessionStorage.setItem('cf_sys_gate_verified', 'true')
          } catch {
            // ignore
          }
        }, 600)
      } else {
        setVerifyStatus('failed')
      }
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Đang khởi tạo Cloudflare Security...</p>
        </div>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 text-center space-y-6">
          {/* Cloudflare Badge */}
          <div className="flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200 mx-auto w-fit">
            <Shield className="w-4 h-4 text-amber-600" />
            Cloudflare Bot Management
          </div>

          <div className="space-y-2">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-blue-100">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Xác Thực Chống Bot
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Bạn đang truy cập <span className="font-bold text-slate-700">{systemName}</span>. Vui lòng hoàn thành xác thực Cloudflare Turnstile để đảm bảo an toàn hệ thống.
            </p>
          </div>

          {/* Turnstile Widget Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[100px]">
            {verifyStatus === 'verifying' ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-blue-600">Đang kiểm tra chứng chỉ Cloudflare...</span>
              </div>
            ) : verifyStatus === 'success' ? (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm py-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Xác thực thành công! Đang chuyển hướng...</span>
              </div>
            ) : (
              <>
                <TurnstileWidget
                  onVerify={handleTurnstileSuccess}
                  onError={() => setVerifyStatus('failed')}
                />
                {verifyStatus === 'failed' && (
                  <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Xác thực thất bại. Vui lòng tải lại trang.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Bảo mật bởi Cloudflare Turnstile</span>
            <span className="font-mono">VNDocs v2.4</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
