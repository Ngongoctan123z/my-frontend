// Each short recording has its own container header. MediaRecorder timeslice
// blobs cannot safely be submitted individually as complete audio files.
import { isEnglishSpeechText } from './speechTranscription'

export function startLiveSpeakingTranscription(options: {
  stream: MediaStream
  mimeType?: string
  isCurrent: () => boolean
  onText: (text: string, atMs: number) => void
  onError: (message: string) => void
  onServer: () => void
  startedAt: number
  activity?: () => { sampledMs: number; audibleMs: number }
}) {
  type Part = { blob: Blob; startMs: number; endMs: number; attempts: number }
  let stopped = false, enabled = false, busy = false, failures = 0
  let timer: ReturnType<typeof setTimeout> | undefined, retryTimer: ReturnType<typeof setTimeout> | undefined
  const devices = new Set<MediaRecorder>(), stopTimers = new Set<ReturnType<typeof setTimeout>>()
  let request: AbortController | undefined
  let queue: Part[] = [], afterMs = 0
  let committedUntilMs = 0, previousPartEndMs = 0, delivered = ''
  const valid = () => !stopped && options.isCurrent()
  const stop = () => {
    stopped = true; clearTimeout(timer); clearTimeout(retryTimer); queue = []; request?.abort()
    for (const timer of stopTimers) clearTimeout(timer)
    stopTimers.clear()
    for (const device of devices) {
      device.ondataavailable = null; device.onstop = null; device.onerror = null
      if (device.state === 'recording') { try { device.stop() } catch {} }
    }
    devices.clear()
  }
  const fail = (message: string) => { if (valid()) options.onError(message) }
  const send = async () => {
    if (!valid() || !enabled || busy || retryTimer !== undefined || !queue.length) return
    busy = true
    let retryDelay = 0
    const part = queue.shift()!, controller = new AbortController(); request = controller
    const timeout = setTimeout(() => controller.abort(), 18_000)
    try {
      const extension = part.blob.type.includes('mp4') ? 'm4a' : part.blob.type.includes('ogg') ? 'ogg' : 'webm'
      const form = new FormData(); form.set('action', 'transcribe_live'); form.set('audio', part.blob, `speech.${extension}`)
      const response = await fetch('/api/speaking', { method: 'POST', body: form, signal: controller.signal })
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Máy chủ nhận dạng chưa phản hồi. Bản thu vẫn tiếp tục.')
      const data = await response.json()
      if (!valid() || controller.signal.aborted) return
      // Silence is not an error and must never produce invented words.
      if (response.status === 422) { failures = 0; options.onError(''); return }
      if (!response.ok) {
        if ([401, 403, 413, 415, 429].includes(response.status)) {
          fail(data.error || 'Dịch vụ nhận dạng trực tiếp đã tạm dừng. Bản thu gốc vẫn tiếp tục.'); stop(); return
        }
        throw new Error(data.error || 'Nhận dạng trực tiếp tạm gián đoạn. Bản thu vẫn tiếp tục.')
      }
      if (typeof data.transcript === 'string' && isEnglishSpeechText(data.transcript)) {
        const words: { word: string; start: number; end: number }[] = Array.isArray(data.words) ? data.words.filter((word: any) => typeof word?.word === 'string' && Number.isFinite(word.start) && Number.isFinite(word.end) && word.start >= 0 && word.end >= word.start && word.end <= (part.endMs - part.startMs) / 1000 + 0.2) : []
        // Word timestamps distinguish an overlap from a real repeated word.
        // Older/provider responses without timings use text overlap only when
        // the two source recordings actually overlap in time.
        const fresh = words.filter(word => part.startMs + word.end * 1000 > committedUntilMs + 40)
        const text = words.length ? fresh.map(word => word.word.trim()).join(' ') : part.startMs < previousPartEndMs ? trimTranscriptOverlap(delivered, data.transcript) : data.transcript.trim()
        if (words.length) committedUntilMs = Math.max(committedUntilMs, ...words.map(word => part.startMs + word.end * 1000))
        previousPartEndMs = part.endMs
        if (text) { delivered = (delivered + ' ' + text).trim().slice(-6000); options.onText(text, part.endMs) }
        failures = 0; options.onError('')
      }
    } catch (failure: any) {
      if (valid()) {
        failures++
        fail(failure?.name === 'AbortError' ? 'Nhận dạng trực tiếp phản hồi chậm. Bản thu vẫn tiếp tục.' : failure?.message || 'Không kết nối được dịch vụ nhận dạng. Bản thu vẫn tiếp tục.')
        if (part.attempts < 1 && failures < 3) { queue.unshift({ ...part, attempts: part.attempts + 1 }); retryDelay = 1000 }
        else { fail('Nhận dạng trực tiếp vẫn đang gián đoạn. Bản thu vẫn được giữ; dừng thu để nhận dạng lại toàn bộ.'); stop() }
      }
    } finally {
      clearTimeout(timeout); if (request === controller) request = undefined
      busy = false
      if (valid()) {
        if (retryDelay) retryTimer = setTimeout(() => { retryTimer = undefined; void send() }, retryDelay)
        else void send()
      }
    }
  }
  const capture = () => {
    if (!valid()) return
    const startMs = Date.now() - options.startedAt
    const activityAtStart = options.activity?.()
    let device: MediaRecorder
    try { device = new MediaRecorder(options.stream, { ...(options.mimeType ? { mimeType: options.mimeType } : {}), audioBitsPerSecond: 64_000 }) }
    catch { fail('Trình duyệt không mở được nhận dạng trực tiếp. Bản thu vẫn tiếp tục.'); stop(); return }
    devices.add(device)
    const chunks: Blob[] = []
    device.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    device.onerror = () => { fail('Nhận dạng trực tiếp bị ngắt. Bản thu gốc vẫn tiếp tục.'); stop() }
    device.onstop = () => {
      devices.delete(device)
      if (!valid()) return
      const endMs = Date.now() - options.startedAt
      const blob = new Blob(chunks, { type: device.mimeType || options.mimeType || 'audio/webm' })
      const activityAtEnd = options.activity?.()
      // Skip only measured near-silence, not uncertain/quiet speech. Suspended
      // AudioContext or missing analysis must never prevent transcription.
      const silent = activityAtStart && activityAtEnd && activityAtEnd.sampledMs - activityAtStart.sampledMs >= (endMs - startMs) * 0.5 && activityAtEnd.audibleMs - activityAtStart.audibleMs < 60
      if (!silent && blob.size >= 500 && endMs > afterMs) queue.push({ blob, startMs, endMs, attempts: 0 })
      // Before fallback is enabled, only a recent window is needed. Native
      // recognition has already supplied the preceding words.
      if (!enabled && queue.length > 2) queue.shift()
      if (enabled && queue.length > 8) {
        fail('Nhận dạng trực tiếp đang chậm hơn bản thu. Dừng thu để nhận dạng lại toàn bộ.'); stop(); return
      }
      void send()
    }
    try {
      device.start()
      // Start the next independent file before stopping this one. One second
      // of shared audio protects words crossing a recording boundary.
      timer = setTimeout(capture, 3000)
      const stopTimer = setTimeout(() => { stopTimers.delete(stopTimer); if (valid() && device.state === 'recording') device.stop() }, 4000)
      stopTimers.add(stopTimer)
    }
    catch { fail('Không khởi động được nhận dạng trực tiếp. Bản thu vẫn tiếp tục.'); stop() }
  }
  capture()
  return {
    activate(lastNativeAtMs = 0) {
      if (!valid() || enabled) return
      enabled = true; afterMs = lastNativeAtMs; queue = queue.filter(part => part.endMs > afterMs)
      options.onServer(); void send()
    },
    stop,
  }
}

export function trimTranscriptOverlap(previous: string, incoming: string) {
  const words = incoming.trim().split(/\s+/), tail = previous.trim().split(/\s+/)
  const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  for (let count = Math.min(tail.length, words.length, 30); count >= 2; count--) {
    if (tail.slice(-count).every((word, index) => normalize(word) === normalize(words[index]))) return words.slice(count).join(' ')
  }
  return incoming.trim()
}

