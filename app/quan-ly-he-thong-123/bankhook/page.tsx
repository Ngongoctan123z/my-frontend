'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

export default function BankHookAdminPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async (isSync = false) => {
    if (isSync) setSyncing(true)
    else setLoading(true)
    
    setError(null)
    try {
      const res = await fetch('/api/admin/bankhook')
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions)
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Giao dịch BankHook</h1>
        <Button onClick={() => fetchTransactions(true)} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Đồng bộ ngay
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error} (Lưu ý: Nếu BankHook backend đang ngủ, việc đồng bộ có thể mất đến 30 giây hoặc lỗi timeout, nhưng dữ liệu cũ vẫn được giữ).
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch (100 gần nhất)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !syncing ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Ngân hàng</th>
                    <th className="p-3">Mã GD</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Nội dung</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="p-3 whitespace-nowrap">
                          {new Date(tx.receivedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-semibold">{tx.bank}</td>
                        <td className="p-3">{tx.transactionId}</td>
                        <td className={`p-3 font-bold ${tx.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.direction === 'IN' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                        </td>
                        <td className="p-3 max-w-xs truncate" title={tx.content}>
                          {tx.content}
                        </td>
                        <td className="p-3">
                          {tx.status === 'matched' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Đã đối soát</Badge>
                          ) : tx.status === 'ignored' ? (
                            <Badge variant="secondary">Bỏ qua</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Chờ xử lý</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
