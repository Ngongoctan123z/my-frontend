import { z } from 'zod'

export const adminUploadSchema = z.object({
  examType: z.enum(['VAO_10', 'THPT']),
  subject: z.string().min(1, 'Vui lòng chọn môn'),
  province: z.string().min(1, 'Vui lòng chọn tỉnh'),
  year: z.string().min(1, 'Vui lòng chọn năm'),
  file: z.any()
    .refine((files) => files?.length === 1, 'Cần chọn 1 file PDF, Ảnh, Word, Excel, PowerPoint, ZIP hoặc RAR.')
    .refine((files) => {
      if (!files?.[0]) return false
      const name = files[0].name
      return /\.(pdf|png|jpe?g|webp|docx?|zip|rar|pptx?|xlsx?)$/i.test(name)
    }, 'Định dạng file đề thi không được hỗ trợ.'),
  title: z.string().optional(),
  schoolName: z.string().optional(),
  isOfficial: z.boolean().optional(),
  hasAnswers: z.boolean().optional(),
  description: z.string().optional(),
  answerFile: z.any().optional()
    .refine((files) => {
      if (!files || files.length === 0) return true
      const name = files[0].name
      return /\.(pdf|png|jpe?g|webp|docx?|zip|rar|pptx?|xlsx?)$/i.test(name)
    }, 'Định dạng file đáp án không được hỗ trợ.'),
  thumbnailFile: z.any().optional()
    .refine((files) => {
      if (!files || files.length === 0) return true
      const name = files[0].name
      return /\.(png|jpe?g|webp)$/i.test(name)
    }, 'Ảnh bìa chỉ chấp nhận định dạng ảnh (PNG, JPG, WEBP).')
})

export type AdminUploadFormValues = z.infer<typeof adminUploadSchema>
