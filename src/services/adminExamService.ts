import apiClient from './adminApi'

export const adminExamService = {
  // Upload exam with files
  uploadExam: async (data: FormData, onUploadProgress?: (e: any) => void) => {
    return apiClient.post('/admin/exams', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    })
  },

  // Delete exam
  deleteExam: async (id: number) => {
    return apiClient.delete(`/admin/exams/${id}`)
  }
}
