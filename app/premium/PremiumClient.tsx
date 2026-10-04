'use client'

import React, { useState } from 'react'
import { Check, Crown, Zap, Shield, ChevronRight, X, QrCode, RefreshCcw } from 'lucide-react'
import { useSession } from 'next-auth/react'

type Package = {
  id: string
  name: string
  price: number
  priceStr: string
  period: string
  color: string
  icon: React.ReactNode
  features: string[]
  isPopular?: boolean
}

const packages: Package[] = [
  {
    id: 'plus',
    name: 'VNDocs Plus',
    price: 50000,
    priceStr: '50.000đ',
    period: '/ tháng',
    color: 'from-blue-500 to-cyan-400',
    icon: <Shield className="w-6 h-6 text-white" />,
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
    color: 'from-amber-400 to-orange-500',
    icon: <Crown className="w-6 h-6 text-white" />,
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

  // THÔNG TIN TÀI KHOẢN (Cần cấu hình thật sau này với VietQR / SePay)
  const BANK_ID = 'MB' // Mã ngân hàng (vd: MB, VCB, TCB)
  const ACCOUNT_NO = '1234567890' // Số tài khoản
  const ACCOUNT_NAME = 'NGUYEN VAN A' // Tên chủ tài khoản

  const handleCheckout = (pkg: Package) => {
    if (!session?.user) {
      alert('Vui lòng đăng nhập để tiến hành mua gói!')
      return
    }
    setSelectedPkg(pkg)
    setIsChecking(false)
  }

  const checkPayment = () => {
    setIsChecking(true)
    // Giả lập check payment (Sau này gọi API backend / SePay webhook)
    setTimeout(() => {
      setIsChecking(false)
      alert('Chưa tìm thấy giao dịch. Vui lòng đợi trong giây lát hoặc kiểm tra lại thông tin chuyển khoản.')
    }, 2000)
  }

  const qrUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-print.png?amount=${selectedPkg.price}&addInfo=VNDOCS%20${selectedPkg.id.toUpperCase()}%20${session?.user?.email?.split('@')[0] || 'USER'}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] py-16 px-4 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Nâng tầm học tập với <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Premium</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Mở khoá sức mạnh AI chấm điểm và các công cụ giáo dục tốt nhất. Đầu tư cho tương lai ngay hôm nay.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`relative bg-white dark:bg-[#161B22] rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                pkg.isPopular 
                  ? 'border-amber-400 shadow-xl shadow-amber-500/10 scale-105 z-10' 
                  : 'border-slate-200 dark:border-slate-800 shadow-md'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Zap size={14} className="fill-white" /> Phổ biến nhất
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-inner`}>
                  {pkg.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{pkg.name}</h3>
                </div>
              </div>

              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{pkg.priceStr}</span>
                <span className="text-slate-500 font-medium">{pkg.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 bg-blue-100 dark:bg-blue-900/30 p-0.5 rounded-full">
                      <Check size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(pkg)}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  pkg.isPopular
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                }`}
              >
                Mua ngay <ChevronRight size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-slate-400">
          * Gói cước sẽ được gia hạn tự động. Bạn có thể huỷ bất cứ lúc nào. Hệ thống thanh toán được bảo mật 100%.
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161B22] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className={`p-6 bg-gradient-to-r ${selectedPkg.color} text-white flex items-center justify-between`}>
              <div>
                <h3 className="text-2xl font-bold">Thanh toán {selectedPkg.name}</h3>
                <p className="opacity-90 font-medium">{selectedPkg.priceStr} {selectedPkg.period}</p>
              </div>
              <button 
                onClick={() => setSelectedPkg(null)} 
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0 bg-white p-2 rounded-2xl border-4 border-slate-100 shadow-sm relative group">
                <img src={qrUrl} alt="VietQR" className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-xl" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl pointer-events-none">
                  <QrCode size={48} className="text-white opacity-80" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 text-sm font-medium">
                  Vui lòng dùng app ngân hàng quét mã QR bên cạnh để thanh toán nhanh.
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Ngân hàng:</span>
                    <strong className="dark:text-white">{BANK_ID}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="dark:text-white">{ACCOUNT_NAME}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Số tiền:</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold text-lg">{selectedPkg.price.toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nội dung:</span>
                    <strong className="dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm tracking-wide">
                      VNDOCS {selectedPkg.id.toUpperCase()} {session?.user?.email?.split('@')[0] || 'USER'}
                    </strong>
                  </div>
                </div>

                <button 
                  onClick={checkPayment}
                  disabled={isChecking}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {isChecking ? (
                    <><RefreshCcw className="animate-spin w-5 h-5" /> Đang kiểm tra...</>
                  ) : (
                    'Tôi đã chuyển khoản'
                  )}
                </button>
                <p className="text-xs text-center text-slate-400">Hệ thống sẽ tự động kích hoạt tài khoản trong vòng 1-3 phút sau khi chuyển khoản thành công.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
