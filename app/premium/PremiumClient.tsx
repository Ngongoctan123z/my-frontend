'use client'

import React, { useState } from 'react'
import { Check, Crown, Zap, Shield, ChevronRight, X, QrCode, RefreshCcw, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'

type Package = {
  id: string
  name: string
  price: number
  priceStr: string
  period: string
  color: string
  shadow: string
  icon: React.ReactNode
  features: string[]
  isPopular?: boolean
  description: string
}

const packages: Package[] = [
  {
    id: 'plus',
    name: 'VNDocs Plus',
    price: 50000,
    priceStr: '50.000đ',
    period: '/ tháng',
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    shadow: 'shadow-blue-500/20',
    icon: <Shield className="w-6 h-6 text-white" />,
    description: 'Tuyệt vời cho học sinh tự học hàng ngày.',
    features: [
      '1000 lượt chấm bài / tháng',
      'Tối đa 50 lượt chấm / ngày',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Hỗ trợ khách hàng ưu tiên',
    ],
  },
  {
    id: 'pro',
    name: 'VNDocs Pro',
    price: 149000,
    priceStr: '149.000đ',
    period: '/ tháng',
    color: 'from-amber-300 via-orange-500 to-rose-500',
    shadow: 'shadow-orange-500/30',
    icon: <Crown className="w-6 h-6 text-white" />,
    description: 'Dành cho giáo viên và trung tâm luyện thi.',
    isPopular: true,
    features: [
      '3000 lượt chấm bài / tháng',
      'Lên đến 200 lượt chấm / ngày',
      'Tự tạo đề thi tuỳ chỉnh (Custom Exam)',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Truy cập sớm các tính năng AI mới nhất',
    ],
  }
]

export function PremiumClient() {
  const { data: session } = useSession()
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const BANK_ID = 'MB' 
  const ACCOUNT_NO = '0565683172' 
  const ACCOUNT_NAME = 'NGO NGOC TAN'

  const handleCheckout = (pkg: Package) => {
    if (!session?.user) {
      alert('Vui lòng đăng nhập để tiến hành mua gói!')
      return
    }
    setSelectedPkg(pkg)
    setIsChecking(false)
  }

  const checkPayment = async () => {
    setIsChecking(true)
    try {
      const expectedContent = `VNDOCS ${selectedPkg?.id.toUpperCase()} ${session?.user?.email?.split('@')[0] || 'USER'}`
      const res = await fetch('/api/premium/check-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedPkg?.price, expectedContent })
      })
      const data = await res.json()
      
      if (data.isPaid) {
        alert('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp.')
        setSelectedPkg(null)
      } else {
        alert(data.message || 'Chưa tìm thấy giao dịch. Vui lòng đợi trong giây lát hoặc kiểm tra lại thông tin chuyển khoản.')
      }
    } catch (e) {
      alert('Lỗi kết nối khi kiểm tra giao dịch.')
    } finally {
      setIsChecking(false)
    }
  }

  const qrUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${selectedPkg.price}&addInfo=VNDOCS%20${selectedPkg.id.toUpperCase()}%20${session?.user?.email?.split('@')[0] || 'USER'}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] py-16 px-4 font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/20 dark:bg-orange-600/20 rounded-full blur-[150px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000 delay-1000" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

      <div className="max-w-6xl mx-auto space-y-20 relative z-10 w-full">
        {/* Header */}
        <div className="text-center space-y-6 mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 backdrop-blur-md mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
            <Sparkles size={16} className="text-amber-500" /> Nâng cấp trải nghiệm AI của bạn
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            Trở thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 drop-shadow-sm">Premium</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Đầu tư nhỏ, bứt phá lớn. Mở khoá công nghệ AI chấm điểm độc quyền và các công cụ giáo dục đỉnh cao nhất dành riêng cho bạn.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative rounded-3xl p-8 transition-all duration-500 flex flex-col ${
                pkg.isPopular 
                  ? 'bg-white dark:bg-[#1A202C]/80 border border-orange-500/50 dark:border-orange-500/30 backdrop-blur-xl shadow-2xl shadow-orange-500/20 scale-100 md:scale-105 z-10' 
                  : 'bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-lg shadow-xl hover:shadow-2xl hover:-translate-y-2'
              }`}
            >
              {/* Popular Badge */}
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs px-5 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  <Zap size={14} className="fill-white" /> Phổ biến nhất
                </div>
              )}
              
              <div className="flex items-center gap-5 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-lg ${pkg.shadow} shrink-0`}>
                  {pkg.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight">{pkg.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{pkg.description}</p>
                </div>
              </div>

              <div className="mb-8 flex items-end gap-1.5 pb-8 border-b border-slate-200 dark:border-slate-800">
                <span className="text-5xl font-black tracking-tighter">{pkg.priceStr}</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold mb-1">{pkg.period}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 group">
                    <div className="mt-0.5 shrink-0 bg-blue-100 dark:bg-blue-500/10 p-1 rounded-full group-hover:scale-110 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-all">
                      <Check size={14} className="text-blue-600 dark:text-blue-400 font-bold" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(pkg)}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                  pkg.isPopular
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:scale-[1.02] active:scale-95 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95'
                }`}
              >
                Nâng cấp ngay <ChevronRight size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm font-medium text-slate-500 dark:text-slate-400/80 bg-white/50 dark:bg-black/20 backdrop-blur-sm max-w-fit mx-auto px-6 py-3 rounded-full border border-slate-200 dark:border-white/5">
          * Gói cước sẽ được gia hạn tự động. Bạn có thể huỷ bất cứ lúc nào. Hệ thống thanh toán bảo mật 100%.
        </div>
      </div>

      {/* Checkout Modal (Glassmorphism) */}
      {selectedPkg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-xl w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 zoom-in-95 duration-400">
            <div className={`p-8 bg-gradient-to-r ${selectedPkg.color} text-white flex items-center justify-between relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={20} className="text-white/80" />
                  <span className="text-white/80 font-bold uppercase tracking-widest text-sm">Thanh toán an toàn</span>
                </div>
                <h3 className="text-3xl font-black">{selectedPkg.name}</h3>
                <p className="opacity-90 font-medium mt-1 text-lg">{selectedPkg.priceStr} {selectedPkg.period}</p>
              </div>
              <button 
                onClick={() => setSelectedPkg(null)} 
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors relative z-10 backdrop-blur-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row gap-8 items-center bg-gradient-to-b from-white/50 to-transparent dark:from-white/5">
              <div className="shrink-0 bg-white p-3 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl relative group">
                <img src={qrUrl} alt="VietQR" className="w-52 h-52 md:w-60 md:h-60 object-contain rounded-2xl" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-3xl pointer-events-none backdrop-blur-sm">
                  <QrCode size={48} className="text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform duration-300" />
                </div>
              </div>
              
              <div className="flex-1 space-y-5 w-full">
                <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 p-4 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 text-sm font-semibold flex items-start gap-3">
                  <div className="mt-0.5 shrink-0"><Zap size={18} className="text-amber-500" /></div>
                  <p>Mở ứng dụng Ngân hàng và quét mã QR bên cạnh để thanh toán tự động với độ chính xác 100%.</p>
                </div>
                
                <div className="space-y-4 bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Ngân hàng</span>
                    <strong className="dark:text-white font-bold">{BANK_ID}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Chủ tài khoản</span>
                    <strong className="dark:text-white font-bold">{ACCOUNT_NAME}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Số tiền</span>
                    <strong className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-black text-xl">{selectedPkg.price.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Nội dung</span>
                    <strong className="text-slate-800 dark:text-white bg-slate-200/50 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm tracking-wider font-mono border border-slate-300/50 dark:border-white/10 shadow-sm">
                      VNDOCS {selectedPkg.id.toUpperCase()} {session?.user?.email?.split('@')[0] || 'USER'}
                    </strong>
                  </div>
                </div>

                <button 
                  onClick={checkPayment}
                  disabled={isChecking}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-xl shadow-slate-900/20 dark:shadow-white/10"
                >
                  {isChecking ? (
                    <><RefreshCcw className="animate-spin w-5 h-5" /> Đang kiểm tra giao dịch...</>
                  ) : (
                    'Tôi đã chuyển khoản thành công'
                  )}
                </button>
                <p className="text-xs text-center font-medium text-slate-400">Hệ thống sẽ tự động kích hoạt tài khoản trong vòng 1-3 phút sau khi nhận được chuyển khoản.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
