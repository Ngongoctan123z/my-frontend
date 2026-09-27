'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { useNotify } from '../context/NotificationContext'
import { API_BASE } from '../utils/constants'
import ExamListAdmin from '../components/admin/ExamListAdmin'
import EditExamModal from '../components/admin/EditExamModal'
import UploadExamForm from '../components/admin/UploadExamForm'
import { DocumentAdminTab } from '../components/admin/DocumentAdminTab'
import type { Exam } from '../types/exam'

export function Admin() {
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'documents'>('list')
  const [adminPassword, setAdminPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { notify } = useNotify()

  useEffect(() => {
    setIsMounted(true)
    const token = localStorage.getItem('adminToken')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogin = async () => {
    if (!adminPassword.trim()) {
      notify('Vui lòng nhập mật khẩu', 'danger')
      return
    }

    setLoggingIn(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMsg = errorData.message || errorData.error || `Lỗi ${res.status}`
        
        if (res.status === 401 || res.status === 403) {
          throw new Error('Sai mật khẩu admin')
        } else {
          throw new Error('Lỗi kết nối - ' + errorMsg)
        }
      }

      const data = await res.json()
      if (!data.token) {
        throw new Error('Không nhận được token từ server')
      }

      (typeof window !== 'undefined' ? localStorage.setItem.bind(localStorage) : () => {})('adminToken', data.token)
      setIsAuthenticated(true)
      setAdminPassword('')
      notify('Đăng nhập thành công', 'success')
    } catch (e: any) {
      console.error('Login error:', e)
      notify(e.message || 'Lỗi đăng nhập', 'danger')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
  }

  if (!isMounted) {
    return <div className="mx-auto max-w-sm mt-20 p-6 text-center">Đang tải...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-sm mt-20 p-6 border border-line rounded-xl bg-page">
        <h2 className="text-xl font-bold mb-4 text-center">Đăng nhập Admin</h2>
        <input 
          type="password"
          className="border border-line bg-page w-full min-h-11 rounded-xl px-3 mb-4"
          placeholder="Mật khẩu Admin..."
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <Button className="w-full" onClick={handleLogin} disabled={loggingIn}>
          {loggingIn ? 'Đang xử lý...' : 'Đăng nhập'}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl py-12 md:py-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản trị viên</h1>
        <button 
          onClick={handleLogout}
          className="text-sm text-color-danger hover:underline"
        >
          Đăng xuất
        </button>
      </div>
      
      <div className="flex gap-4 mb-6 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`font-medium pb-2 ${activeTab === 'list' ? 'text-primary border-b-2 border-primary' : 'text-ink-muted'}`}
        >
          Danh sách đề
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`font-medium pb-2 ${activeTab === 'upload' ? 'text-primary border-b-2 border-primary' : 'text-ink-muted'}`}
        >
          Thêm đề thi
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`font-medium pb-2 ${activeTab === 'documents' ? 'text-primary border-b-2 border-primary' : 'text-ink-muted'}`}
        >
          Tài liệu tổng hợp
        </button>
      </div>

      {activeTab === 'list' && (
        <ExamListAdmin
          key={refreshTrigger}
          onEdit={setEditingExam}
        />
      )}

      {activeTab === 'upload' && (
        <UploadExamForm onSuccess={() => {
          setActiveTab('list')
          setRefreshTrigger(prev => prev + 1)
        }} />
      )}

      {activeTab === 'documents' && (
        <DocumentAdminTab />
      )}

      {editingExam && (
        <EditExamModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSuccess={() => {
            setEditingExam(null)
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}
    </div>
  )
}

