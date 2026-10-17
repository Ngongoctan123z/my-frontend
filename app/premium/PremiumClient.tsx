'use client'

import React, { useState, useEffect } from 'react'
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  ChevronRight, 
  X, 
  QrCode, 
  RefreshCcw, 
  CheckCircle2, 
  Download, 
  Copy, 
  CreditCard, 
  Smartphone
} from 'lucide-react'
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
      '1000 grading requests / month',
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
      '3000 grading requests / month',
      'Up to 200 requests / day',
      'Create custom exams',
      'Share exam links with others',
      'View detailed results from shared links',
      'Early access to newest features',
    ] : [
      '3000 lượt chấm bài / tháng',
      'Lên đến 200 lượt chấm / ngày',
      'Tự tạo đề thi tuỳ chỉnh (Custom Exam)',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Truy cập sớm các tính năng và công cụ mới nhất',
    ],
  }
]

export function PremiumClient({ isEn = false }: { isEn?: boolean }) {
  const { data: session } = useSession()
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [mobileTab, setMobileTab] = useState<'qr' | 'manual'>('qr')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  const BANK_ID = 'MB' 
  const ACCOUNT_NO = '0565683172' 
  const ACCOUNT_NAME = 'NGO NGOC TAN'

  const handleCheckout = (pkg: Package) => {
    if (!session?.user) {
      alert(isEn ? 'Please log in to proceed with the payment!' : 'Vui lòng đăng nhập để tiến hành mua gói!')
      return
    }
    setSelectedPkg(pkg)
    setIsSuccess(false)
    setMobileTab('qr')
    setIsQrLoading(true)
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

  const transferMemo = selectedPkg
    ? `vndocs-${selectedPkg.id.toLowerCase()}-${session?.user?.email || 'user'}`
    : ''

  const qrUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${selectedPkg.price}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : ''

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDownloadQr = async () => {
    if (!qrUrl) return
    setIsDownloading(true)
    try {
      const res = await fetch(qrUrl)
      if (!res.ok) throw new Error('Fetch failed')
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `vndocs-qr-${selectedPkg?.id || 'payment'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(qrUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden flex items-center justify-center">
      {/* Sleek, minimal background effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[8000ms] delay-1000" />
      
      {/* Grain overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isEn ? 'Become ' : 'Trở thành '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Premium</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">
            {isEn 
              ? 'Unlock smart grading and top educational tools.' 
              : 'Mở khoá chấm điểm thông minh và công cụ học tập đỉnh cao.'}
          </p>
          <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl inline-block">
            <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
              ⚠️ {isEn 
                ? 'Only supports Vietnamese bank accounts (VietQR).' 
                : 'Chỉ hỗ trợ thanh toán qua ngân hàng Việt Nam (VietQR).'}
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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[860px] max-h-[92dvh] rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Mobile Header (Sticky on phone) */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 md:hidden bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedPkg.color} border flex items-center justify-center shrink-0`}>
                  {selectedPkg.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedPkg.name}</h3>
                  <p className="text-xs font-bold text-orange-500">{selectedPkg.priceStr} {selectedPkg.period}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPkg(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 mx-3 sm:mx-6 mt-3 mb-1 rounded-xl shrink-0 md:hidden">
              <button
                onClick={() => setMobileTab('qr')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'qr'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <QrCode size={14} /> {isEn ? 'QR Code' : 'Mã QR thanh toán'}
              </button>
              <button
                onClick={() => setMobileTab('manual')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <CreditCard size={14} /> {isEn ? 'Bank Transfer' : 'Chuyển khoản thủ công'}
              </button>
            </div>

            {/* Modal Body: Scrollable area containing QR Pane and Details Pane */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              
              {/* Left Side: QR Code Area */}
              <div className={`${
                mobileTab === 'qr' ? 'flex' : 'hidden'
              } md:flex md:w-5/12 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 md:p-8 flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 shrink-0`}>
                
                {/* QR Container */}
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 w-52 h-52 sm:w-60 sm:h-60 relative group flex items-center justify-center">
                  {isQrLoading && (
                    <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                      <RefreshCcw className="w-6 h-6 animate-spin text-orange-500" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isEn ? 'Generating QR...' : 'Đang tạo mã QR...'}
                      </span>
                    </div>
                  )}
                  <img 
                    src={qrUrl} 
                    alt="VietQR" 
                    onLoad={() => setIsQrLoading(false)}
                    onError={() => setIsQrLoading(false)}
                    className="w-full h-full object-contain rounded-xl select-none" 
                  />
                </div>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3 font-medium px-2 leading-relaxed max-w-xs">
                  {isEn 
                    ? 'Scan with any banking app to complete payment automatically.' 
                    : 'Quét bằng app ngân hàng để thanh toán tự động.'}
                </p>

                {/* Download QR Button with proper blob download */}
                <button
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                  className="mt-3 w-full max-w-[240px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isDownloading ? (
                    <RefreshCcw size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {isEn ? 'Download QR Image' : 'Tải mã QR về máy'}
                </button>

                {/* Mobile helper notice */}
                <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 rounded-xl w-full max-w-[240px] text-center md:hidden">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium flex items-center justify-center gap-1">
                    <Smartphone size={12} className="shrink-0" />
                    {isEn 
                      ? 'Tip: Save QR image & select "Scan from Photos" in bank app'
                      : 'Mẹo: Lưu ảnh QR rồi vào app ngân hàng quét từ thư viện ảnh'}
                  </p>
                </div>

                {/* Switch to manual transfer shortcut on mobile */}
                <button
                  onClick={() => setMobileTab('manual')}
                  className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline md:hidden"
                >
                  {isEn ? 'Or view bank account details →' : 'Hoặc xem số tài khoản chuyển khoản →'}
                </button>
              </div>

              {/* Right Side: Payment Details */}
              <div className={`${
                mobileTab === 'manual' ? 'flex' : 'hidden'
              } md:flex md:w-7/12 p-5 sm:p-6 md:p-8 flex-col relative`}>
                
                {/* Desktop Close Button */}
                <button 
                  onClick={() => setSelectedPkg(null)} 
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden md:block bg-slate-100 dark:bg-slate-800 rounded-full"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>

                {/* Plan Header Info (Desktop) */}
                <div className="mb-5 hidden md:block">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={16} className={selectedPkg.badgeColor} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedPkg.badgeColor}`}>
                      {isEn ? 'Secure Payment' : 'Thanh toán an toàn'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPkg.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{selectedPkg.priceStr} {selectedPkg.period}</p>
                </div>

                {/* Payment Fields with 1-click Copy */}
                <div className="space-y-3 mb-6">
                  {/* Ngân hàng */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{isEn ? 'Bank' : 'Ngân hàng'}</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                      {BANK_ID} (MBBank)
                    </span>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{isEn ? 'Account Name' : 'Chủ tài khoản'}</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{ACCOUNT_NAME}</span>
                  </div>

                  {/* Số tài khoản */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{isEn ? 'Account No.' : 'Số tài khoản'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{ACCOUNT_NO}</span>
                      <button
                        onClick={() => handleCopy(ACCOUNT_NO, 'account')}
                        className="p-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
                        title={isEn ? 'Copy account number' : 'Sao chép STK'}
                      >
                        {copiedKey === 'account' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span className="text-[11px] font-medium hidden xs:inline">
                          {copiedKey === 'account' ? (isEn ? 'Copied' : 'Đã chép') : (isEn ? 'Copy' : 'Sao chép')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Số tiền */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{isEn ? 'Amount' : 'Số tiền'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base ${selectedPkg.badgeColor}`}>
                        {selectedPkg.price.toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        onClick={() => handleCopy(String(selectedPkg.price), 'amount')}
                        className="p-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
                        title={isEn ? 'Copy amount' : 'Sao chép số tiền'}
                      >
                        {copiedKey === 'amount' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span className="text-[11px] font-medium hidden xs:inline">
                          {copiedKey === 'amount' ? (isEn ? 'Copied' : 'Đã chép') : (isEn ? 'Copy' : 'Sao chép')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 gap-2">
                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                      {isEn ? 'Transfer Memo' : 'Nội dung chuyển khoản'}
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                        *{isEn ? 'Must be exact for automatic upgrade' : 'Bắt buộc chính xác để kích hoạt tự động'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white break-all max-w-[220px]">
                        {transferMemo}
                      </div>
                      <button
                        onClick={() => handleCopy(transferMemo, 'memo')}
                        className="p-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 shrink-0"
                        title={isEn ? 'Copy memo' : 'Sao chép nội dung'}
                      >
                        {copiedKey === 'memo' ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span className="text-[11px] font-medium hidden xs:inline">
                          {copiedKey === 'memo' ? (isEn ? 'Copied' : 'Đã chép') : (isEn ? 'Copy' : 'Sao chép')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Back to QR shortcut on mobile */}
                <div className="md:hidden mb-4 text-center">
                  <button
                    onClick={() => setMobileTab('qr')}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    {isEn ? '← Back to QR Code scanner' : '← Quay lại xem mã QR'}
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="mt-auto pt-2">
                  {isSuccess ? (
                    <div className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300 shadow-sm shadow-emerald-500/20">
                      <CheckCircle2 size={18} /> {isEn ? 'Payment Successful! Upgraded.' : 'Thanh toán thành công! Gói đã kích hoạt.'}
                    </div>
                  ) : (
                    <div className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2">
                      <RefreshCcw className="animate-spin w-4 h-4 text-orange-500 shrink-0" />
                      <span>{isEn ? 'Automatically checking transaction...' : 'Đang tự động kiểm tra giao dịch qua BankHook...'}</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  )
}

