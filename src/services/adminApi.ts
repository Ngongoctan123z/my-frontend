import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'
import { API_BASE } from '../utils/constants'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 300000 // 5 phút (cho upload file lớn)
})

// Request interceptor: Add JWT token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor: Handle 401, 403
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken')
      // Tự động reload để UI trở về trang đăng nhập
      window.location.reload()
      return Promise.reject(new Error('Phiên đăng nhập hết hạn'))
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Lỗi kết nối mạng - Bị gián đoạn do quá tải (timeout)'))
    }

    return Promise.reject(error)
  }
)

export default apiClient
