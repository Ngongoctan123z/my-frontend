export interface GradedEssayHistory {
  email: string
  id: string
  examType: string
  prompt: string
  essay: string
  result: any
  timestamp: number
}

const GUEST_STORAGE_KEY = 'vndocs_guest_essay_history'

function getGuestHistory(): GradedEssayHistory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveGuestHistory(list: GradedEssayHistory[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(list.slice(0, 30)))
  } catch {}
}

/**
 * Lưu lịch sử bài làm:
 * - Nếu người dùng ĐÃ ĐĂNG NHẬP: Lưu trực tiếp vào Database Cloudflare D1 qua API có phân quyền email.
 * - Nếu người dùng CHƯA ĐĂNG NHẬP (Khách/anonymous): Mới lưu tạm vào localStorage trên trình duyệt.
 */
export const saveEssayHistory = async (essay: Omit<GradedEssayHistory, 'id' | 'timestamp'>): Promise<void> => {
  const isGuest = !essay.email || essay.email === 'anonymous'

  if (isGuest) {
    // Khách chưa đăng nhập: lưu tạm trên trình duyệt
    const list = getGuestHistory()
    const item: GradedEssayHistory = {
      ...essay,
      id: 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now()
    }
    list.unshift(item)
    saveGuestHistory(list)
    return
  }

  // Đã đăng nhập: Lưu thẳng vào Database D1
  try {
    const res = await fetch('/api/essay-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(essay)
    })
    if (!res.ok) {
      const errText = await res.text()
      console.warn('Lỗi lưu lịch sử lên Database:', errText)
    }
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử vào DB:', error)
  }
}

/**
 * Tải danh sách lịch sử bài làm:
 * - Đã đăng nhập: Tự động di chuyển lịch sử khách (nếu có) lên DB rồi lấy trực tiếp từ Database D1 qua API.
 * - Chưa đăng nhập: Lấy từ localStorage tạm thời của trình duyệt.
 */
export const getEssayHistory = async (email?: string, examTypePrefix?: string): Promise<GradedEssayHistory[]> => {
  const isGuest = !email || email === 'anonymous'

  if (isGuest) {
    const list = getGuestHistory()
    if (examTypePrefix) {
      return list.filter(h => h.examType.startsWith(examTypePrefix))
    }
    return list
  }

  // Nếu người dùng đã đăng nhập và trên máy còn bài làm của khách -> Tự động đồng bộ lên Database
  try {
    const guestItems = getGuestHistory()
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        await fetch('/api/essay-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examType: item.examType,
            prompt: item.prompt,
            essay: item.essay,
            result: item.result
          })
        }).catch(() => {})
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY)
      }
    }
  } catch (e) {
    console.warn('Lỗi đồng bộ guest history lên DB:', e)
  }

  // Đã đăng nhập: Fetch trực tiếp từ Database D1
  try {
    const url = examTypePrefix ? `/api/essay-history?type=${encodeURIComponent(examTypePrefix)}` : '/api/essay-history'
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      return Array.isArray(data.history) ? data.history : []
    }
  } catch (error) {
    console.error('Lỗi khi tải lịch sử từ DB:', error)
  }
  return []
}

/**
 * Xóa lịch sử bài làm:
 * - Đã đăng nhập: Xóa trên Database D1.
 * - Chưa đăng nhập: Xóa key localStorage.
 */
export const clearEssayHistory = async (email?: string): Promise<void> => {
  const isGuest = !email || email === 'anonymous'

  if (isGuest) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY)
    }
    return
  }

  try {
    await fetch('/api/essay-history', {
      method: 'DELETE'
    })
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY)
    }
  } catch (error) {
    console.error('Lỗi khi xoá lịch sử:', error)
  }
}
