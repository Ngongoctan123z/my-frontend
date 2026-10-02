export interface GradedEssayHistory {
  id: string
  email: string
  examType: string
  prompt: string
  essay: string
  result: any
  timestamp: number
}

const DB_NAME = 'VNDocsAiGraderDB'
const STORE_NAME = 'essays'
const DB_VERSION = 2

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('email', 'email', { unique: false })
      } else {
        // Upgrade from v1 to v2
        const store = event.target.transaction.objectStore(STORE_NAME)
        if (!store.indexNames.contains('email')) {
          store.createIndex('email', 'email', { unique: false })
        }
      }
    }
  })
}

export const saveEssayHistory = async (essay: Omit<GradedEssayHistory, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const record: GradedEssayHistory = {
      ...essay,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.add(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Lỗi khi lưu lịch sử vào IndexedDB:', error)
  }
}

export const getEssayHistory = async (email: string): Promise<GradedEssayHistory[]> => {
  if (!email) return [];
  try {
    const db = await initDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('email')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(email)
      request.onsuccess = () => {
        const sorted = (request.result as GradedEssayHistory[]).sort((a, b) => b.timestamp - a.timestamp)
        resolve(sorted)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Lỗi khi tải lịch sử từ IndexedDB:', error)
    return []
  }
}

export const clearEssayHistory = async (email: string): Promise<void> => {
  if (!email) return;
  try {
    const db = await initDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('email')
    
    return new Promise((resolve, reject) => {
      const request = index.getAllKeys(email)
      request.onsuccess = () => {
        const keys = request.result
        keys.forEach(key => store.delete(key))
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Lỗi khi xoá lịch sử IndexedDB:', error)
  }
}

