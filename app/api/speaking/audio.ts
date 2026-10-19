import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SpeakingRequestError } from './validation'
import type { SpeakingStore } from './store'

// Deliberately structural: no runtime dependency on Cloudflare's global types.
export interface AudioBucket {
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }): Promise<unknown>
  get(key: string): Promise<{ body: ReadableStream; size: number; httpEtag: string; arrayBuffer(): Promise<ArrayBuffer> } | null>
}
export async function speakingBucket(): Promise<AudioBucket> {
  const { env } = await getCloudflareContext({ async: true })
  const bucket = (env as unknown as { SPEAKING_AUDIO?: AudioBucket }).SPEAKING_AUDIO
  if (!bucket) throw new SpeakingRequestError(503, 'Kho ghi âm chưa được kết nối. Bản thu vẫn ở thiết bị; vui lòng thử lại sau.')
  return bucket
}
export async function persistSpeakingAudio(store: SpeakingStore, recordingId: string, audio: File, hash: string) {
  if (await store.audio(recordingId)) return
  const bucket = await speakingBucket(), key = `speaking/${recordingId.replace(':', '/')}/${hash}`
  // Write the object first. A failed write never creates a misleading D1 pointer;
  // a failed D1 write is safely retried against the same immutable object key.
  await bucket.put(key, await audio.arrayBuffer(), { httpMetadata: { contentType: audio.type }, customMetadata: { hash } })
  await store.saveAudio(recordingId, key, audio.type, audio.size)
}
