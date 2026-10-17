import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { CloudflareSystemGate } from '@/src/components/admin/CloudflareSystemGate'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  let authError = "";
  try {
    session = await auth()
  } catch (e: any) {
    authError = e.message;
  }
  
  // Danh sách Admin có quyền tối cao (Master Admin)
  const rootAdmins = [
    'ngongoctan282005@gmail.com',
    'ngotan1911@gmail.com',
    'ngongoctan432005@gmail.com',
    'admin@vndocs.net'
  ]

  if (authError) {
    return (
      <div className="p-10 text-red-500 font-bold">
        <h1>LỖI SERVER:</h1>
        <p>{authError}</p>
      </div>
    )
  }

  // Yêu cầu đăng nhập nếu chưa có session (chỉ dẫn đến trang đăng nhập người dùng)
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/quan-ly-he-thong-123')
  }

  // Khóa hoàn toàn với những email không nằm trong danh sách
  if (!rootAdmins.includes(session.user.email)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-5 border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">TỪ CHỐI TRUY CẬP</h1>
            <p className="text-slate-600 leading-relaxed text-sm">
              Khu vực này được bảo mật mã hóa và chỉ dành riêng cho Ban Quản Trị Hệ Thống.
            </p>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            Tài khoản hiện tại: <span className="font-bold text-slate-800">{session.user.email}</span>
            <br/>
            <span className="text-red-500 font-semibold mt-1 inline-block">Quyền: Học sinh (Bị chặn)</span>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <a href="/api/auth/signout" className="px-8 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-all w-full">
              Đăng xuất tài khoản này
            </a>
            <a href="/" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg w-full">
              Quay về Trang Chủ
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Nếu là rootAdmin, yêu cầu xác thực Cloudflare Bot Protection trước khi mở giao diện
  return (
    <CloudflareSystemGate systemName="Quản Trị Người Dùng & Hệ Thống">
      {children}
    </CloudflareSystemGate>
  )
}
