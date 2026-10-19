import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { SpeakingStore, type SpeakingD1 } from '../../store'
import { speakingBucket } from '../../audio'
import { SpeakingRequestError } from '../../validation'

export async function GET(req: Request, context: { params: Promise<{ recordingId: string }> }) {
  try {
    const session = await auth(), email = session?.user?.email?.trim().toLowerCase()
    if (!email) return Response.json({ error: 'Vui lòng đăng nhập để nghe bản thu.' }, { status: 401 })
    const { recordingId } = await context.params
    const db = await getDb(), store = new SpeakingStore(db.$client as SpeakingD1)
    await store.ensure()
    await store.recording(email, recordingId)
    const audio = await store.audio(recordingId)
    if (!audio) return Response.json({ error: 'Bài cũ chưa có bản thu trên Cloudflare.' }, { status: 404 })
    const object = await (await speakingBucket()).get(audio.objectKey)
    if (!object) return Response.json({ error: 'Không tìm thấy bản thu.' }, { status: 404 })
    const headers = new Headers({ 'Content-Type': audio.mimeType, 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', 'ETag': object.httpEtag })
    const range = req.headers.get('range')
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${object.size}` } })
      const start = match[1] ? Number(match[1]) : Math.max(0, object.size - Number(match[2]))
      const end = match[1] && match[2] ? Math.min(object.size - 1, Number(match[2])) : object.size - 1
      if (start > end || start >= object.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${object.size}` } })
      const bytes = (await object.arrayBuffer()).slice(start, end + 1)
      headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`); headers.set('Content-Length', String(bytes.byteLength))
      return new Response(bytes, { status: 206, headers })
    }
    headers.set('Content-Length', String(object.size))
    return new Response(object.body, { headers })
  } catch (error) {
    return Response.json({ error: error instanceof SpeakingRequestError ? error.message : 'Chưa tải được bản thu. Vui lòng thử lại.' }, { status: error instanceof SpeakingRequestError ? error.status : 503 })
  }
}
