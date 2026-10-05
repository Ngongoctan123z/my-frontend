import React, { useEffect, useState } from 'react'
import { Loader2, Search, Trash2, Ban, CheckCircle, Edit, ShieldAlert } from 'lucide-react'

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/admin?type=users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
  }

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
    if (!confirm(`Bạn có chắc chắn muốn ${newStatus === 'blocked' ? 'chặn' : 'bỏ chặn'} người dùng này?`)) return
    
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_user_status', payload: { id, status: newStatus } })
    })
    fetchUsers()
  }

  const handleUpdatePlan = async (id: string, newPlan: string) => {
    if (!confirm(`Xác nhận đổi gói của người dùng thành ${newPlan.toUpperCase()}?`)) return
    
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_user_plan', payload: { id, plan: newPlan } })
    })
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng này?')) return
    
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_user', payload: { id } })
    })
    fetchUsers()
  }

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Danh Sách Người Dùng</h2>
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Tìm kiếm tên, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 rounded-tl-lg">Người Dùng</th>
              <th className="px-6 py-3">Vai Trò</th>
              <th className="px-6 py-3">Gói (Plan)</th>
              <th className="px-6 py-3">Trạng Thái</th>
              <th className="px-6 py-3 text-right rounded-tr-lg">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Không tìm thấy người dùng nào.</td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} className={`bg-white border-b hover:bg-gray-50 ${u.status === 'blocked' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img src={u.image} alt={u.name} className="w-10 h-10 rounded-full border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {u.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-purple-600 bg-purple-100 px-2 py-1 rounded w-fit text-xs">
                        <ShieldAlert size={14} /> Admin
                      </span>
                    ) : (
                      <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">Member</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.plan || 'free'}
                      onChange={(e) => handleUpdatePlan(u.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1.5 rounded border focus:outline-none focus:ring-2 ${
                        u.plan === 'pro' ? 'bg-orange-100 text-orange-700 border-orange-200 focus:ring-orange-500' :
                        u.plan === 'plus' ? 'bg-blue-100 text-blue-700 border-blue-200 focus:ring-blue-500' :
                        'bg-gray-100 text-gray-700 border-gray-200 focus:ring-gray-500'
                      }`}
                    >
                      <option value="free">FREE</option>
                      <option value="plus">PLUS</option>
                      <option value="pro">PRO</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {u.status === 'blocked' ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold bg-red-100 px-2 py-1 rounded w-fit text-xs">
                        <Ban size={14} /> Đã chặn
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded w-fit text-xs">
                        <CheckCircle size={14} /> Đang hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(u.id, u.status)}
                        className={`p-2 rounded-lg transition-colors ${u.status === 'blocked' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                        title={u.status === 'blocked' ? 'Bỏ chặn' : 'Chặn'}
                      >
                        {u.status === 'blocked' ? <CheckCircle size={16} /> : <Ban size={16} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Xóa người dùng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
