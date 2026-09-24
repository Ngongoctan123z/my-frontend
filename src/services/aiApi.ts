import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

// Create axios instance for AI calls
const aiApiClient: AxiosInstance = axios.create({
  baseURL: '/api/ai-grader',
  timeout: 300000 // 5 phút (đợi AI chấm điểm)
})

// Response interceptor: Handle errors cleanly
aiApiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Hệ thống AI đang quá tải hoặc phản hồi chậm. Vui lòng thử lại sau.'))
    }
    
    // Pass through backend error messages if available
    const data = error.response?.data as { error?: string } | undefined
    if (data?.error) {
      return Promise.reject(new Error(data.error))
    }

    return Promise.reject(new Error('Lỗi kết nối đến máy chủ AI.'))
  }
)

export const aiService = {
  generatePrompt: async (type: string) => {
    const res = await aiApiClient.post('/', { action: 'generate_prompt', type })
    return res.data
  },
  
  gradeEssay: async (type: string, prompt: string, essay: string) => {
    const res = await aiApiClient.post('/', { action: 'grade_essay', type, prompt, essay })
    return res.data
  }
}
