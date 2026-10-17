'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { 
  Loader2, RefreshCw, ArrowDownLeft, CheckCircle2, 
  Clock, Search, ShieldCheck, DollarSign, Wallet, FileText 
} from 'lucide-react'

export default function BankHookAdminPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTransactions = async (isSync = false) => {
    if (syncing) return
    if (isSync) setSyncing(true)
    else setLoading(true)
    
    setError(null)
    try {
      const res = await fetch('/api/admin/bankhook')
      const data = await res.json()
      if (data.success) {
        // Chỉ nhận những giao dịch cộng tiền vào (+)
        const inOnly = (data.transactions || []).filter((tx: any) => 
          tx.direction === 'IN' || tx.direction === 'CREDIT' || (!tx.direction && tx.amount > 0)
        )
        setTransactions(inOnly)
      } else {
        setError(data.error || 'Có lỗi xảy ra')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    const interval = setInterval(() => {
      fetchTransactions(true)
    }, 30000) // 30s auto refresh
    return () => clearInterval(interval)
  }, [])

  // Thống kê nhanh
  const stats = useMemo(() => {
    let totalInAmount = 0
    let matchedCount = 0
    let pendingCount = 0

    transactions.forEach(tx => {
      totalInAmount += Number(tx.amount) || 0
      if (tx.status === 'matched') matchedCount++
      else if (tx.status === 'unmatched') pendingCount++
    })

    return {
      totalInAmount,
      totalCount: transactions.length,
      matchedCount,
      pendingCount
    }
  }, [transactions])

  // Lọc theo search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions
    const term = searchTerm.toLowerCase()
    return transactions.filter(tx => 
      (tx.transactionId || '').toLowerCase().includes(term) ||
      (tx.content || '').toLowerCase().includes(term) ||
      (tx.bank || '').toLowerCase().includes(term) ||
      String(tx.amount || '').includes(term)
    )
  }, [transactions, searchTerm])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Giao Dịch Tiền Vào (BankHook)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Chỉ ghi nhận và theo dõi các biến động số dư cộng vào (+) để nâng cấp tài khoản
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => fetchTransactions(true)} 
          disabled={syncing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200"
        >
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Đồng bộ giao dịch mới
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3">
          <div className="font-bold">Lưu ý:</div>
          <div>{error} (Nếu BankHook backend đang ngủ trên Render, việc đồng bộ có thể mất đến 30 giây hoặc lỗi timeout, nhưng dữ liệu cũ vẫn được giữ).</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng tiền nhận (+)</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              +{stats.totalInAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số GD tiền vào</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {stats.totalCount} giao dịch
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã khớp tự động</div>
            <div className="text-xl font-black text-indigo-600 mt-0.5">
              {stats.matchedCount} đơn
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chờ đối soát</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {stats.pendingCount} đơn
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-800">
              Lịch sử giao dịch tiền vào (+)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ lưu và hiển thị tiền cộng vào tài khoản, các giao dịch trừ tiền bị loại trừ hoàn toàn.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm mã GD, nội dung, tiền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-200 transition-all font-medium"
            />
          </div>
        </div>

        <div className="p-0">
          {loading && !syncing ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-sm font-medium">Đang tải lịch sử giao dịch tiền vào...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Ngân hàng</th>
                    <th className="p-4">Mã GD</th>
                    <th className="p-4">Số tiền nhận</th>
                    <th className="p-4">Nội dung chuyển khoản</th>
                    <th className="p-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-500">Chưa có giao dịch tiền vào nào phù hợp</p>
                        <p className="text-xs text-slate-400 mt-1">Các giao dịch trừ tiền (-) đã được loại bỏ theo cài đặt.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {new Date(tx.receivedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-black text-slate-700 border border-slate-200">
                            {tx.bank}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600 select-all">
                          {tx.transactionId}
                        </td>
                        <td className="p-4 font-black text-base text-emerald-600 whitespace-nowrap">
                          +{Number(tx.amount || 0).toLocaleString('vi-VN')} <span className="text-xs font-semibold text-emerald-700">{tx.currency}</span>
                        </td>
                        <td className="p-4 max-w-sm truncate text-xs font-medium text-slate-700" title={tx.content}>
                          {tx.content}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          {tx.status === 'matched' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold text-xs py-1 px-3">
                              ✓ Đã nâng cấp gói
                            </Badge>
                          ) : tx.status === 'ignored' ? (
                            <Badge className="bg-slate-100 text-slate-600 border-none font-medium text-xs py-1 px-3">
                              Bỏ qua
                            </Badge>
                          ) : (
                            <Badge className="text-amber-700 border border-amber-300 bg-amber-50 font-bold text-xs py-1 px-3">
                              Chờ khớp nội dung
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
