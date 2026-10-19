import type { SpeakingClip, SpeakingExam, SpeakingQuestion, SpeakingReport, SpeakingTab } from '../lib/speaking'

export type SpeakingDraft = {
  owner: string; exam: SpeakingExam; tab: SpeakingTab; mode: 'practice' | 'exam'; questions: SpeakingQuestion[]
  clips: Record<string, SpeakingClip>; index: number; feedbackLang: string
  clientSubmissionId: string; report?: SpeakingReport | null; submissionId?: string | null; updatedAt: number
}
let opening: Promise<IDBDatabase> | null = null
function database() {
  if (opening) return opening
  opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('vndocs-speaking-v2', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('drafts', { keyPath: 'owner' })
      const audio = request.result.createObjectStore('audio', { keyPath: 'key' }); audio.createIndex('owner', 'owner')
    }
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); opening = null }; resolve(request.result) }
    request.onerror = () => { opening = null; reject(request.error) }
    request.onblocked = () => { opening = null; reject(new Error('SPEAKING_STORAGE_BLOCKED')) }
  })
  return opening
}
async function transaction<T>(name: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode), request = operation(tx.objectStore(name))
    tx.oncomplete = () => resolve(request.result as T)
    tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error)
  })
}
export const loadSpeakingDraft = (owner: string) => transaction<SpeakingDraft | undefined>('drafts', 'readonly', store => store.get(owner))
export const saveSpeakingDraft = (draft: SpeakingDraft) => transaction('drafts', 'readwrite', store => store.put(draft))
export const clearSpeakingDraft = (owner: string) => transaction('drafts', 'readwrite', store => store.delete(owner))
export const saveSpeakingAudio = (owner: string, recordingId: string, clip: SpeakingClip) => transaction('audio', 'readwrite', store => store.put({ key: `${owner}:${recordingId}`, owner, clip, createdAt: Date.now() }))
export const loadSpeakingAudio = async (owner: string, recordingId: string): Promise<SpeakingClip | undefined> => {
  const value = await transaction<{ owner: string; clip: SpeakingClip } | undefined>('audio', 'readonly', store => store.get(`${owner}:${recordingId}`))
  return value?.owner === owner ? value.clip : undefined
}
