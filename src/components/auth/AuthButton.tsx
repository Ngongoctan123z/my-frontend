'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { LogOut, LogIn } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"></div>
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image ? (
          <Link href="/profile" className="block hover:opacity-80 transition-opacity" title="Hồ sơ cá nhân">
            <Image 
              src={session.user.image} 
              alt={session.user.name || "User"} 
              width={32} 
              height={32} 
              className="rounded-full"
            />
          </Link>
        ) : (
          <Link href="/profile" className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:opacity-80 transition-opacity" title="Hồ sơ cá nhân">
            <span className="font-bold text-slate-500 text-xs">{session.user.name?.charAt(0) || 'U'}</span>
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
    >
      <LogIn size={16} />
      Đăng nhập
    </button>
  )
}
