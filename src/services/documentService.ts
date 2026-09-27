import axios from 'axios'
import { BASE_URL } from '../utils/constants'

const API = `${BASE_URL}/api/v1/documents`

export interface DocumentItem {
  id: number
  title: string
  author: string | null
  description: string | null
  category: string | null
  level: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  fileSize: number | null
  downloadCount: number
  viewCount: number
  isFeatured: boolean
  sourceUrl: string | null
  createdAt: string
}

export interface DocumentListResponse {
  data: DocumentItem[]
  total: number
  page: number
  limit: number
}

export const DOCUMENT_CATEGORIES: Record<string, string> = {
  TOAN: 'Toán',
  NGU_VAN: 'Ngữ Văn',
  TIENG_ANH: 'Tiếng Anh',
  VAT_LY: 'Vật Lý',
  HOA_HOC: 'Hóa Học',
  SINH_HOC: 'Sinh Học',
  LICH_SU: 'Lịch Sử',
  DIA_LY: 'Địa Lý',
  GDCD: 'GDCD',
  KHAC: 'Khác',
}

export const DOCUMENT_LEVELS: Record<string, string> = {
  THCS: 'THCS',
  THPT: 'THPT',
  LUYEN_THI: 'Luyện thi',
  CHUNG_CHI: 'Chứng chỉ',
}

export async function getDocuments(params: {
  category?: string
  level?: string
  q?: string
  page?: number
  limit?: number
}): Promise<DocumentListResponse> {
  const { data } = await axios.get(API, { params })
  return data
}

export async function recordDocumentView(id: number) {
  await axios.post(`${API}/${id}/view`).catch(() => {})
}

export async function recordDocumentDownload(id: number) {
  await axios.post(`${API}/${id}/download`).catch(() => {})
}
