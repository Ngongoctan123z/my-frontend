'use client'

import React, { useState, useEffect } from 'react'
import { Check, Crown, Zap, Shield, ChevronRight, X, QrCode, RefreshCcw, Sparkles, CheckCircle2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import confetti from 'canvas-confetti'

type Package = {
  id: string
  name: string
  price: number
  priceStr: string
  period: string
  color: string
  badgeColor: string
  buttonClass: string
  icon: React.ReactNode
  features: string[]
  isPopular?: boolean
  description: string
}

const getPackages = (isEn: boolean): Package[] => [
  {
    id: 'plus',
    name: 'VNDocs Plus',
    price: 50000,
    priceStr: '50.000đ',
    period: isEn ? '/ month' : '/ tháng',
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    badgeColor: 'text-blue-500',
    buttonClass: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-blue-500/50 dark:bg-slate-900 dark:text-white dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-blue-500/50',
    icon: <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
    description: isEn ? 'Great for daily self-study.' : 'Tuyệt vời cho học sinh tự học hàng ngày.',
    features: isEn ? [
      '1000 AI grading requests / month',
      'Up to 50 requests / day',
      'Share exam links with others',
      'View detailed results from shared links',
      'Priority customer support',
    ] : [
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
    period: isEn ? '/ month' : '/ tháng',
    color: 'from-amber-500/20 to-orange-500/20 border-orange-500/50',
    badgeColor: 'text-orange-500',
    buttonClass: 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-orange-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
    icon: <Crown className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
    description: isEn ? 'For teachers and exam centers.' : 'Dành cho giáo viên và trung tâm luyện thi.',
    isPopular: true,
    features: isEn ? [
      '3000 AI grading requests / month',
      'Up to 200 requests / day',
      'Create custom exams',
      'Share exam links with others',
      'View detailed results from shared links',
      'Early access to newest AI features',
    ] : [
      '3000 lượt chấm bài / tháng',
      'Lên đến 200 lượt chấm / ngày',
      'Tự tạo đề thi tuỳ chỉnh (Custom Exam)',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Truy cập sớm các tính năng AI mới nhất',
    ],
  }
]

export function PremiumClient({ isEn = false }: { isEn?: boolean }) {
  const { data: session } = useSession()
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const BANK_ID = 'MB' 
  const ACCOUNT_NO = '0565683172' 
  const ACCOUNT_NAME = 'NGO NGOC TAN'

  const handleCheckout = (pkg: Package) => {
    if (!session?.user) {
      alert(isEn ? 'Please log in to proceed with the payment!' : 'Vui lòng đăng nhập để tiến hành mua gói!')
      return
    }
    setSelectedPkg(pkg)
    setIsChecking(true)
    setIsSuccess(false)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (selectedPkg && !isSuccess) {
      interval = setInterval(async () => {
        try {
          const expectedContent = `vndocs-${selectedPkg.id.toLowerCase()}-${session?.user?.email || 'user'}`
          const res = await fetch('/api/premium/check-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: selectedPkg.price, expectedContent })
          })
          const data = await res.json()
          
          if (data.isPaid) {
            setIsSuccess(true)
            setIsChecking(false)
            clearInterval(interval)
            
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const intervalConfetti: any = setInterval(function() {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(intervalConfetti);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
          }
        } catch (e) {
          console.error('Lỗi check transaction', e)
        }
      }, 5000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [selectedPkg, isSuccess, session])

  const qrUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${selectedPkg.price}&addInfo=vndocs-${selectedPkg.id.toLowerCase()}-${session?.user?.email || 'user'}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden flex items-center justify-center">
      {/* Sleek, minimal background effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms] delay-1000" />
      
      {/* Grain overlay for texture */}
      <div className="absolute inset-0 bg-[url(''https://grainy-gradients.vercel.app/noise.svg'')] opacity-[0.03] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
            <Sparkles size={14} className="text-orange-500" /> 
            <span>{isEn ? 'Upgrade your AI experience' : 'Nâng cấp trải nghiệm AI'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isEn ? 'Become ' : 'Trở thành '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Premium</span>
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            {isEn 
              ? 'A small investment for a big breakthrough. Unlock exclusive AI grading technologies and ultimate educational tools.' 
              : 'Đầu tư nhỏ, bứt phá lớn. Mở khoá công nghệ AI chấm điểm độc quyền và các công cụ giáo dục đỉnh cao nhất dành riêng cho bạn.'}
          </p>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl inline-block">
            <p className="text-sm text-amber-700 dark:text-amber-500 font-medium">
              ⚠️ {isEn 
                ? 'Note: We currently only support payments via Vietnamese bank accounts (VietQR). International payments are not yet supported.' 
                : 'Lưu ý: Hiện tại hệ thống chỉ hỗ trợ thanh toán tự động qua tài khoản ngân hàng Việt Nam (Quét mã VietQR).'}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {getPackages(isEn).map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative rounded-[2rem] p-8 transition-all duration-300 flex flex-col bg-white dark:bg-slate-900 border shadow-sm hover:shadow-xl ${
                pkg.isPopular 
                  ? 'border-orange-500/50 shadow-orange-500/5' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <Zap size={12} className="fill-white" /> {isEn ? 'Most Popular' : 'Phổ biến nhất'}
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} border flex items-center justify-center shrink-0`}>
                  {pkg.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{pkg.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{pkg.description}</p>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-1 pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{pkg.priceStr}</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{pkg.period}</span>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 group text-sm">
                    <div className="mt-0.5 shrink-0">
                      <Check size={16} className={`${pkg.badgeColor} opacity-80`} />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(pkg)}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${pkg.buttonClass}`}
              >
                {isEn ? 'Upgrade Now' : 'Nâng cấp ngay'} <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs font-medium text-slate-400 dark:text-slate-500 max-w-md">
          * {isEn ? 'Plans will auto-renew (soon). You can cancel anytime. 100% secure payment.' : 'Gói cước sẽ được gia hạn tự động. Bạn có thể huỷ bất cứ lúc nào. Hệ thống thanh toán an toàn 100%.'}
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[850px] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            
            {/* Left side: QR Code Area */}
            <div className="md:w-5/12 bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative">
              <button 
                onClick={() => setSelectedPkg(null)} 
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors md:hidden"
              >
                <X size={20} />
              </button>
              
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 w-48 h-48 relative group">
                <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain rounded-xl" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <QrCode size={32} className="text-slate-900/50" />
                </div>
              </div>
              <p className="text-xs text-center text-slate-500 mt-6 font-medium px-4">
                Mở ứng dụng ngân hàng và quét mã QR để thanh toán tự động.
              </p>
            </div>
            
            {/* Right side: Payment Details */}
            <div className="md:w-7/12 p-8 flex flex-col relative">
              <button 
                onClick={() => setSelectedPkg(null)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden md:block bg-slate-100 dark:bg-slate-800 rounded-full"
              >
                <X size={16} />
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className={selectedPkg.badgeColor} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${selectedPkg.badgeColor}`}>Thanh toán an toàn</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPkg.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{selectedPkg.priceStr} {selectedPkg.period}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 text-sm">Ngân hàng</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">{BANK_ID}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 text-sm">Chủ tài khoản</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">{ACCOUNT_NAME}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 text-sm">Số tiền</span>
                  <span className={`font-bold text-base ${selectedPkg.badgeColor}`}>{selectedPkg.price.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-start py-2">
                  <span className="text-slate-500 text-sm mt-1">Nội dung</span>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 break-all max-w-[200px] text-right">
                    vndocs-{selectedPkg.id.toLowerCase()}-{session?.user?.email || 'user'}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                {isSuccess ? (
                  <div className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300 shadow-sm shadow-emerald-500/20">
                    <CheckCircle2 size={18} /> Thanh toán thành công!
                  </div>
                ) : (
                  <div className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <RefreshCcw className="animate-spin w-4 h-4 opacity-70" /> Đang kiểm tra giao dịch...
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
