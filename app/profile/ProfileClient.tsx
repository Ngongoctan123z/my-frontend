'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Crown, Shield, User, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type ProfileData = {
  name: string
  email: string
  image: string
  plan: 'free' | 'plus' | 'pro'
  planExpiresAt: number | null
  usageCount: number
  limit: number
}

export function ProfileClient() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error)
          setProfile(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [status])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!profile) return null

  const getPlanName = (plan: string) => {
    if (plan === 'pro') return 'VNDocs Pro'
    if (plan === 'plus') return 'VNDocs Plus'
    return 'VNDocs Free'
  }

  const getPlanColor = (plan: string) => {
    if (plan === 'pro') return 'from-amber-400 to-orange-500 text-white'
    if (plan === 'plus') return 'from-blue-500 to-cyan-400 text-white'
    return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  }

  const getPlanIcon = (plan: string) => {
    if (plan === 'pro') return <Crown size={16} />
    if (plan === 'plus') return <Shield size={16} />
    return <User size={16} />
  }

  const usagePercent = Math.min(100, Math.round((profile.usageCount / profile.limit) * 100))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-8">Hồ sơ cá nhân</h1>

        {/* User Card */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 relative">
            {profile.image ? (
              <img src={profile.image} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-md">
                <User size={40} className="text-slate-400" />
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm bg-gradient-to-r ${getPlanColor(profile.plan)}`}>
              {getPlanIcon(profile.plan)} {profile.plan.toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{profile.email}</p>
          </div>
        </div>

        {/* Plan Details & Limits */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Gói cước hiện tại</h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-gradient-to-r ${getPlanColor(profile.plan)} mb-4`}>
                {getPlanIcon(profile.plan)} {getPlanName(profile.plan)}
              </div>
              {profile.plan !== 'free' && profile.planExpiresAt && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ngày hết hạn: <strong className="text-slate-700 dark:text-slate-200">{new Date(profile.planExpiresAt).toLocaleDateString('vi-VN')}</strong>
                </p>
              )}
            </div>
            
            {profile.plan === 'free' && (
              <Link href="/premium" className="mt-6 w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20">
                Nâng cấp Premium <ArrowRight size={18} />
              </Link>
            )}
          </div>

          <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Mức sử dụng AI trong ngày</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500 dark:text-slate-400">Đã dùng: {profile.usageCount} lượt</span>
                <span className="text-slate-700 dark:text-slate-300">{profile.limit} lượt</span>
              </div>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    usagePercent >= 90 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: \`\${usagePercent}%\` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-right">
                {profile.limit - profile.usageCount} lượt còn lại hôm nay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
