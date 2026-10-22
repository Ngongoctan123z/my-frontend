'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { safeLoginRedirect } from '@/src/lib/loginRedirect'
import { ArrowLeft, Loader2 } from 'lucide-react'

function LoginContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = safeLoginRedirect(searchParams.get('callbackUrl'))
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(callbackUrl)
    }
  }, [status, session, callbackUrl, router])

  const handleGoogleLogin = async () => {
    if (loading) return
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
        
        {/* Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image
            src="/logo.jpg"
            alt="VNDocs Logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
            priority
          />
          <span className="text-xl font-black text-slate-800 tracking-tight">VNDocs</span>
        </Link>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">
            Đăng nhập
          </h1>
          <p className="text-xs text-slate-500">
            Đăng nhập để luyện Writing và đồng bộ bài thi của bạn
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Đang kết nối Google...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3.1l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 15.8C3.7 19.6 7.5 23 12 23z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
            </>
          )}
        </button>

        {/* Note */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của VNDocs.
        </p>

        {/* Back Link */}
        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

