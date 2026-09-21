import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminExamService } from '../services/adminExamService'
import { useNotify } from '../context/NotificationContext'

export function useExamUpload() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { notify } = useNotify()

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      setUploadProgress(0)
      return adminExamService.uploadExam(data, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        }
      })
    },
    onSuccess: () => {
      notify('Tải đề thi lên thành công!', 'success')
      setUploadProgress(null)
      // Invalid queries if needed, though Admin component triggers a refresh state manually
      queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
    onError: (error: any) => {
      setUploadProgress(null)
      console.error('Upload error:', error)
      
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message
      
      if (error.message?.includes('Phiên đăng nhập hết hạn')) {
        notify('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'danger')
      } else if (error.message?.includes('timeout')) {
        notify('Upload timeout - Kiểm tra lại kết nối mạng của bạn', 'danger')
      } else if (error.response?.status === 413) {
        notify('File quá lớn (Tối đa 50MB)', 'danger')
      } else {
        notify(`Upload thất bại: ${errorMsg}`, 'danger')
      }
    }
  })

  return {
    upload: mutation.mutate,
    isLoading: mutation.isPending,
    uploadProgress,
    error: mutation.error
  }
}
