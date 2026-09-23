import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { PROVINCES, SUBJECTS, YEARS } from '../../utils/constants'
import { adminUploadSchema } from '../../schemas/adminUpload.schema'
import type { AdminUploadFormValues } from '../../schemas/adminUpload.schema'
import { useExamUpload } from '../../hooks/useExamUpload'

export default function UploadExamForm({ onSuccess }: { onSuccess?: () => void }) {
  const { upload, isLoading, uploadProgress } = useExamUpload()

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<AdminUploadFormValues>({
    resolver: zodResolver(adminUploadSchema),
    defaultValues: {
      examType: 'VAO_10',
      subject: SUBJECTS[0],
      province: PROVINCES[0],
      year: String(YEARS[0]),
      isOfficial: true,
      hasAnswers: false
    }
  })

  const currentExamType = watch('examType')
  const currentIsOfficial = watch('isOfficial')
  const isOfficialBool = currentIsOfficial === true || String(currentIsOfficial) === 'true'

  // Logic hiển thị trường:
  // - Đề thi thử (isOfficial = false): Hiển thị cả Tỉnh và Trường
  // - Đề chính thức (isOfficial = true): 
  //    + Vào 10: Hiện Tỉnh, Ẩn Trường
  //    + THPT: Ẩn Tỉnh, Ẩn Trường
  const showProvince = !isOfficialBool || currentExamType === 'VAO_10'
  const showSchoolName = !isOfficialBool

  const onSubmit = (data: AdminUploadFormValues) => {
    const form = new FormData()
    form.append('examType', data.examType)
    form.append('subject', data.subject)
    
    // Ghi đè Tỉnh thành "Bộ GD&ĐT" nếu là đề chính thức THPT (ẩn Tỉnh)
    form.append('province', showProvince ? data.province : 'Bộ GD&ĐT')
    form.append('year', data.year)

    // Backend tự xử lý ảnh -> PDF, Frontend chỉ gửi thẳng file lên!
    form.append('file', data.file[0])

    if (data.title) form.append('title', data.title)
    
    // Chỉ gửi Tên trường nếu trường này được hiển thị
    if (showSchoolName && data.schoolName) {
      form.append('schoolName', data.schoolName)
    }
    
    form.append('isOfficial', isOfficialBool ? 'true' : 'false')
    form.append('hasAnswers', data.hasAnswers === true || String(data.hasAnswers) === 'true' ? 'true' : 'false')
    if (data.description) form.append('description', data.description)

    if (data.answerFile && data.answerFile.length > 0) {
      form.append('answerFile', data.answerFile[0])
    }

    if (data.thumbnailFile && data.thumbnailFile.length > 0) {
      form.append('thumbnailFile', data.thumbnailFile[0])
    }

    upload(form, {
      onSuccess: () => {
        reset()
        if (onSuccess) onSuccess()
      }
    })
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Thêm đề thi mới</h2>
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
          
          {showProvince && (
            <label className="block text-sm">
              Tỉnh
              <select {...register('province')} className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3">
                {PROVINCES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              {errors.province && <p className="mt-1 text-xs text-color-danger">{errors.province.message}</p>}
            </label>
          )}
          
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
          Tiêu đề đề thi (Mặc định sẽ tự động tạo từ Tỉnh + Môn + Năm)
          <input
            type="text"
            {...register('title')}
            placeholder="Ví dụ: Đề thi thử trường KHTN - Lần 1"
            className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3"
          />
        </label>

        {showSchoolName && (
          <label className="block text-sm">
            Tên trường ra đề (Không bắt buộc)
            <input
              type="text"
              {...register('schoolName')}
              className="border-line bg-page mt-1 min-h-11 w-full rounded-xl border px-3"
            />
          </label>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-line py-4">
          <div>
            <label className="block text-sm font-bold mb-2">Tính chất đề thi</label>
            <div className="flex flex-col gap-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  {...register('isOfficial')}
                  className="border-line"
                />
                <span className="text-sm">Đề chính thức</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  {...register('isOfficial')}
                  className="border-line"
                />
                <span className="text-sm">Đề thi thử</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">Tùy chọn khác</label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                {...register('hasAnswers')}
                className="rounded border-line"
              />
              <span className="text-sm">Đề thi có đáp án</span>
            </label>
          </div>
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
            {errors.answerFile && <p className="mt-1 text-xs text-color-danger">{String(errors.answerFile.message)}</p>}
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink-muted">Ảnh bìa (Không bắt buộc)</span>
            <input {...register('thumbnailFile')} type="file" accept=".png,.jpg,.jpeg,.webp" className="mt-2 w-full text-sm" />
            {errors.thumbnailFile && <p className="mt-1 text-xs text-color-danger">{String(errors.thumbnailFile.message)}</p>}
          </label>
        </div>

        <div className="rounded-xl border border-line bg-page p-3 text-xs text-ink-muted flex items-start gap-2">
          <span className="text-primary font-bold">💡 Tối ưu:</span>
          <span>
            Hệ thống giờ đây sẽ tự động xử lý mượt mà. File ảnh (PNG, JPG) sẽ được chuyển đổi sang PDF cực nhanh ở phía Server, không còn lo treo máy!
          </span>
        </div>

        {isLoading && uploadProgress !== null && (
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-primary">Đang tải lên...</span>
              <span className="font-mono text-primary">{uploadProgress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-primary transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Đang xử lý...' : 'Đăng Đề Thi'}
        </Button>
      </form>
    </Card>
  )
}
