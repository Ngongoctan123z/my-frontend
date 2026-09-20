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
import { convertImageToPdf, isImageFile } from '../utils/fileUtils'
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

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
    setUploadProgress(0)
    setStatusMessage('Đang chuẩn bị file...')

    try {
      const form = new FormData()
      form.append('examType', data.examType)
      form.append('subject', data.subject)
      form.append('province', data.province)
      form.append('year', data.year)

      // Tự động chuyển đổi ảnh sang PDF chuẩn nếu người dùng tải lên file ảnh
      let examFile = data.file[0]
      if (isImageFile(examFile)) {
        setStatusMessage('Đang tự động chuyển đổi ảnh đề thi sang PDF chuẩn...')
        examFile = await convertImageToPdf(examFile)
      }
      form.append('file', examFile)

      if (data.title) form.append('title', data.title)
      if (data.schoolName) form.append('schoolName', data.schoolName)
      form.append('isOfficial', data.isOfficial === true ? 'true' : 'false')
      form.append('hasAnswers', data.hasAnswers === true ? 'true' : 'false')
      if (data.description) form.append('description', data.description)

      if (data.answerFile && data.answerFile.length > 0) {
        let ansFile = data.answerFile[0]
        if (isImageFile(ansFile)) {
          setStatusMessage('Đang tự động chuyển đổi ảnh đáp án sang PDF...')
          ansFile = await convertImageToPdf(ansFile)
        }
        form.append('answerFile', ansFile)
      }

      if (data.thumbnailFile && data.thumbnailFile.length > 0) {
        form.append('thumbnailFile', data.thumbnailFile[0])
      }

      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại')
      }

      setStatusMessage('Đang tải dữ liệu lên máy chủ...')

      // Gửi bằng XMLHttpRequest để theo dõi tiến độ % theo thời gian thực
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE}/admin/exams`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
            if (percent >= 100) {
              setStatusMessage('Đang lưu dữ liệu vào hệ thống...')
            } else {
              setStatusMessage(`Đang tải lên: ${percent}%`)
            }
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            let errorMsg = `Lỗi ${xhr.status}`
            try {
              const res = JSON.parse(xhr.responseText)
              errorMsg = res.message || res.error || errorMsg
            } catch {
              errorMsg = `Upload failed (${xhr.status}): ${xhr.statusText}`
            }
            reject(new Error(errorMsg))
          }
        }

        xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải lên'))
        xhr.send(form)
      })

      notify('Đã tải đề lên thành công', 'success')
      reset()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMsg = error.message || 'Upload thất bại. Kiểm tra backend.'
      notify(errorMsg, 'danger')
    } finally {
      setBusy(false)
      setUploadProgress(null)
      setStatusMessage('')
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

        <div className="rounded-xl border border-line bg-page p-3 text-xs text-ink-muted flex items-start gap-2">
          <span className="text-primary font-bold">💡 Mẹo:</span>
          <span>
            Hệ thống tự động chuyển đổi file ảnh (PNG, JPG) thành PDF chuẩn. File Word (.docx) và PDF đều được hỗ trợ xem trực tiếp và xuất PDF chuẩn trên trang chi tiết đề thi.
          </span>
        </div>

        {busy && (
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-primary">{statusMessage || 'Đang xử lý...'}</span>
              {uploadProgress !== null && <span className="font-mono text-primary">{uploadProgress}%</span>}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress ?? 100}%` }}
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? (statusMessage || 'Đang xử lý...') : 'Đăng Đề Thi'}
        </Button>
      </form>
    </Card>
  )
}

export function Admin() {
  const [activeTab, setActiveTab] = useState<'list' | 'upload'>('list')
  const [adminPassword, setAdminPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'))
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { notify } = useNotify()

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

      console.log('Login response status:', res.status)

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
      console.log('Login success:', data)

      if (!data.token) {
        throw new Error('Không nhận được token từ server')
      }

      localStorage.setItem('adminToken', data.token)
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
