import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useNotify } from '../context/NotificationContext'
import { API_BASE, PROVINCES, SUBJECTS, YEARS } from '../utils/constants'
import ExamListAdmin from '../components/admin/ExamListAdmin'
import EditExamModal from '../components/admin/EditExamModal'
import type { Exam } from '../types/exam'

// The upload form schema
const adminSchema = z.object({
  examType: z.enum(['VAO_10', 'THPT']),
  subject: z.string().min(1, 'Vui lòng chọn môn'),
  province: z.string().min(1, 'Vui lòng chọn tỉnh'),
  year: z.string().min(1, 'Vui lòng chọn năm'),
  file: z.any()
    .refine((files) => files?.length === 1, 'Cần chọn 1 file PDF, Ảnh, Word, Excel, PowerPoint, ZIP hoặc RAR.')
    .refine((files) => {
      if (!files?.[0]) return false
      const name = files[0].name.toLowerCase()
      return name.match(/\.(pdf|png|jpe?g|webp|docx?|zip|rar|pptx?|xlsx?)$/)
    }, 'Định dạng file không được hỗ trợ.'),
  title: z.string().optional(),
  schoolName: z.string().optional(),
  isOfficial: z.boolean().optional(),
  hasAnswers: z.boolean().optional(),
  description: z.string().optional(),
  answerFile: z.any().optional()
    .refine((files) => {
      if (!files || files.length === 0) return true
      const name = files[0].name.toLowerCase()
      return name.match(/\.(pdf|png|jpe?g|webp|docx?|zip|rar|pptx?|xlsx?)$/)
    }, 'Định dạng file không được hỗ trợ.'),
  thumbnailFile: z.any().optional()
    .refine((files) => {
      if (!files || files.length === 0) return true
      const name = files[0].name.toLowerCase()
      return name.match(/\.(png|jpe?g|webp)$/)
    }, 'Ảnh bìa chỉ chấp nhận định dạng ảnh (PNG, JPG, WEBP).')
})

type AdminFormValues = z.infer<typeof adminSchema>

function UploadExamForm({ onSuccess }: { onSuccess?: () => void }) {
  const { notify } = useNotify()
  const [busy, setBusy] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      examType: 'VAO_10',
      subject: SUBJECTS[0],
      province: PROVINCES[0],
      year: String(YEARS[0]),
      isOfficial: true,
      hasAnswers: false
    }
  })

  const onSubmit = async (data: AdminFormValues) => {
    setBusy(true)
    const form = new FormData()
    form.append('examType', data.examType)
    form.append('subject', data.subject)
    form.append('province', data.province)
    form.append('year', data.year)
    form.append('file', data.file[0])

    if (data.title) form.append('title', data.title)
    if (data.schoolName) form.append('schoolName', data.schoolName)
    form.append('isOfficial', String(data.isOfficial))
    form.append('hasAnswers', String(data.hasAnswers))
    if (data.description) form.append('description', data.description)
    if (data.answerFile && data.answerFile.length > 0) form.append('answerFile', data.answerFile[0])
    if (data.thumbnailFile && data.thumbnailFile.length > 0) form.append('thumbnailFile', data.thumbnailFile[0])

    try {
      const response = await fetch(`${API_BASE}/admin/exams`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
        body: form,
      })
      if (!response.ok) throw new Error('Upload failed')
      notify('Đã tải đề lên thành công', 'success')
      reset()
      if (onSuccess) onSuccess()
    } catch {
      notify('Upload thất bại. Kiểm tra backend và mật khẩu admin.', 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Tải đề thi mới</h1>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm">
            Loại đề
            <select {...register('examType')} className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3">
              <option value="VAO_10">Vào 10</option>
              <option value="THPT">THPT</option>
            </select>
            {errors.examType && <p className="mt-1 text-xs text-color-danger">{errors.examType.message}</p>}
          </label>
          <label className="block text-sm">
            Môn
            <select {...register('subject')} className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3">
              {SUBJECTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            {errors.subject && <p className="mt-1 text-xs text-color-danger">{errors.subject.message}</p>}
          </label>
          <label className="block text-sm">
            Tỉnh
            <select {...register('province')} className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3">
              {PROVINCES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            {errors.province && <p className="mt-1 text-xs text-color-danger">{errors.province.message}</p>}
          </label>
          <label className="block text-sm">
            Năm
            <select {...register('year')} className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3">
              {YEARS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            {errors.year && <p className="mt-1 text-xs text-color-danger">{errors.year.message}</p>}
          </label>
        </div>

        <label className="block text-sm">
          Tên trường ra đề (Không bắt buộc)
          <input
            type="text"
            {...register('schoolName')}
            className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3"
          />
        </label>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('isOfficial')} className="rounded border-line" />
            Là đề thi chính thức
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('hasAnswers')} className="rounded border-line" />
            Đề thi có đáp án
          </label>
        </div>

        <label className="block text-sm">
          Ghi chú
          <textarea
            {...register('description')}
            className="border-line bg-page mt-1 min-h-20 w-full rounded-xl border p-3"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-page p-4 rounded-xl border border-line">
          <label className="block text-sm">
            <span className="font-semibold">File đề thi (Bắt buộc)</span>
            <input {...register('file')} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.zip,.rar,.ppt,.pptx,.xls,.xlsx" className="mt-2 w-full text-sm" />
            {errors.file && <p className="mt-1 text-xs text-color-danger">{String(errors.file.message)}</p>}
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink-muted">File đáp án (Không bắt buộc)</span>
            <input {...register('answerFile')} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.zip,.rar,.ppt,.pptx,.xls,.xlsx" className="mt-2 w-full text-sm" />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink-muted">Ảnh bìa (Không bắt buộc)</span>
            <input {...register('thumbnailFile')} type="file" accept=".png,.jpg,.jpeg,.webp" className="mt-2 w-full text-sm" />
            {errors.thumbnailFile && <p className="mt-1 text-xs text-color-danger">{String(errors.thumbnailFile.message)}</p>}
          </label>
        </div>

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Đang tải lên...' : 'Đăng Đề Thi'}
        </Button>
      </form>
    </Card>
  )
}

export function Admin() {
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'))
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { notify } = useNotify()

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })
      if (!res.ok) throw new Error('Sai mật khẩu')
      const data = await res.json()
      localStorage.setItem('adminToken', data.token)
      setIsAuthenticated(true)
      notify('Đăng nhập thành công', 'success')
    } catch (e) {
      notify('Sai mật khẩu admin', 'danger')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
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
        <Button className="w-full" onClick={handleLogin}>Đăng nhập</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl mt-8">
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
      </div>

      {activeTab === 'list' && (
        <ExamListAdmin
          key={refreshTrigger}
          onEdit={setEditingExam}
        />
      )}

      {activeTab === 'upload' && (
        <UploadExamForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
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
