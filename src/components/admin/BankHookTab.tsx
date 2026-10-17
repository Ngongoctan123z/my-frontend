'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { Button } from '@/src/components/ui/Button'
import { 
  Loader2, RefreshCw, ArrowDownLeft, CheckCircle2, 
  Clock, Search, ShieldCheck, DollarSign, Wallet, FileText, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export function BankHookTab() {
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
    <div className="space-y-6">
      {/* Top Header of Tab */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800">
              Lịch Sử Giao Dịch Tiền Vào (BankHook)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống chỉ lưu và đối soát các giao dịch nạp tiền cộng vào (+). Giao dịch trừ tiền bị loại trừ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/quan-ly-he-thong-123/bankhook"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Mở toàn màn hình
          </Link>
          <Button 
            onClick={() => fetchTransactions(true)} 
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Đồng bộ ngay
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2">
          <span className="font-bold">Lưu ý:</span>
          <span>{error} (Nếu BankHook backend đang ngủ trên Render, đồng bộ có thể mất 30 giây hoặc timeout, dữ liệu cũ vẫn bảo lưu).</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiền nạp (+)</div>
            <div className="text-lg font-black text-emerald-600">
              +{stats.totalInAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số GD tiền vào</div>
            <div className="text-lg font-black text-slate-800">
              {stats.totalCount} giao dịch
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã khớp tự động</div>
            <div className="text-lg font-black text-indigo-600">
              {stats.matchedCount} đơn
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ đối soát</div>
            <div className="text-lg font-black text-amber-600">
              {stats.pendingCount} đơn
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600">
            Hiển thị <span className="text-slate-900 font-black">{filteredTransactions.length}</span> giao dịch tiền vào
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm mã GD, nội dung, tiền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          {loading && !syncing ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs font-medium">Đang tải lịch sử giao dịch...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3.5">Thời gian</th>
                    <th className="p-3.5">Ngân hàng</th>
                    <th className="p-3.5">Mã GD</th>
                    <th className="p-3.5">Số tiền nhận</th>
                    <th className="p-3.5">Nội dung</th>
                    <th className="p-3.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-500">Chưa có giao dịch tiền vào nào</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 whitespace-nowrap text-slate-500 font-medium">
                          {new Date(tx.receivedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-black text-slate-700 border border-slate-200">
                            {tx.bank}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 select-all">
                          {tx.transactionId}
                        </td>
                        <td className="p-3.5 font-black text-sm text-emerald-600 whitespace-nowrap">
                          +{Number(tx.amount || 0).toLocaleString('vi-VN')} <span className="text-[10px] text-emerald-700">{tx.currency}</span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate font-medium text-slate-700" title={tx.content}>
                          {tx.content}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {tx.status === 'matched' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] py-0.5 px-2.5">
                              ✓ Đã nâng cấp
                            </Badge>
                          ) : tx.status === 'ignored' ? (
                            <Badge className="bg-slate-100 text-slate-600 border-none font-medium text-[10px] py-0.5 px-2.5">
                              Bỏ qua
                            </Badge>
                          ) : (
                            <Badge className="text-amber-700 border border-amber-300 bg-amber-50 font-bold text-[10px] py-0.5 px-2.5">
                              Chờ khớp
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
      </div>
    </div>
  )
}
