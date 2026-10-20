import { isEnglishSpeechText } from './speechTranscription'
import type { SpeakingDelivery } from './speechDelivery'

type Engine = {
  continuous: boolean; interimResults: boolean; lang: string; maxAlternatives: number
  onstart: (() => void) | null; onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null; onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
export type GoogleSpeechState = 'starting' | 'listening' | 'reconnecting' | 'unavailable'
/** Chrome implements this Web Speech interface using Google's speech service.
 * Use the supported microphone start() path, never an experimental audioTrack.
 */
export function startGoogleWebSpeech(options: {
  Recognition: new () => Engine; startedAt: number; isCurrent: () => boolean
  onSegments: (segments: SpeakingDelivery['segments']) => void
  onState: (state: GoogleSpeechState) => void
  onUnavailable: (message: string) => void
}) {
  let engine: Engine | null = null, wanted = true, disposed = false, finishing = false
  let restart: ReturnType<typeof setTimeout> | undefined, drain: ReturnType<typeof setTimeout> | undefined, connectionTimer: ReturnType<typeof setTimeout> | undefined
  let resolveFinish: (() => void) | undefined, finishPromise: Promise<void> | undefined
  let networkFailures = 0, rapidEnds = 0
  const completed: SpeakingDelivery['segments'] = []
  let current = new Map<number, SpeakingDelivery['segments'][number]>()
  const valid = () => !disposed && options.isCurrent()
  const emit = () => {
    if (!valid()) return
    let used = 0
    const segments: SpeakingDelivery['segments'] = []
    for (const segment of [...completed, ...current.values()]) {
      if (used >= 6000 || segments.length >= 120) break
      const text = segment.text.slice(0, 6000 - used); used += text.length
      segments.push({ ...segment, text })
    }
    options.onSegments(segments)
  }
  const detach = (item: Engine) => { clearTimeout(connectionTimer);connectionTimer=undefined;item.onstart = null; item.onresult = null; item.onerror = null; item.onend = null }
  const settle = () => { clearTimeout(drain); drain = undefined; finishing = false; resolveFinish?.(); resolveFinish = undefined }
  const abort = () => {
    disposed = true; wanted = false; clearTimeout(restart); restart = undefined
    if (engine) { const item = engine; engine = null; detach(item); try { item.abort() } catch {} }
    settle()
  }
  const unavailable = (message: string) => {
    if (!valid()) return
    wanted = false; clearTimeout(restart); restart = undefined
    if (engine) { const item = engine; engine = null; detach(item); try { item.abort() } catch {} }
    options.onState('unavailable'); options.onUnavailable(message); settle()
  }
  const listen = () => {
    restart = undefined
    if (!valid() || !wanted || finishing) return
    let item: Engine
    try { item = new options.Recognition() }
    catch { unavailable('Không mở được nhận dạng Google. Hãy thử Chrome mới nhất và kiểm tra quyền micro.'); return }
    engine = item; current = new Map(); let problem = '', started = Date.now(), received = false
    const connected = () => {clearTimeout(connectionTimer);connectionTimer=undefined}
    item.continuous = true; item.interimResults = true; item.lang = 'en-US'; item.maxAlternatives = 1
    item.onstart = () => { if (valid() && engine === item) { connected(); started = Date.now(); options.onState('listening') } }
    item.onresult = event => {
      if (!valid() || engine !== item) return
      connected()
      const results = event.results
      for (const index of current.keys()) if (index >= results.length) current.delete(index)
      for (let index = event.resultIndex || 0; index < results.length; index++) {
        const result = results[index], text = String(result[0]?.transcript || '').trim().slice(0, 2000)
        if (!isEnglishSpeechText(text)) { current.delete(index); continue }
        const previous = current.get(index)
        current.set(index, { text, final: !!result.isFinal, atMs: previous?.atMs ?? Math.max(0, Date.now() - options.startedAt) })
        received = true; networkFailures = 0; rapidEnds = 0
      }
      emit()
    }
    item.onerror = event => {
      if (!valid() || engine !== item) return
      connected()
      problem = String(event?.error || 'network')
      if (finishing) return
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(problem)) {
        unavailable(problem === 'audio-capture' ? 'Google không mở được micro. Kiểm tra thiết bị thu âm trong Chrome.' : 'Chrome chưa cho phép nhận dạng Google. Kiểm tra quyền micro và mở bằng Chrome.'); return
      }
      if (!['no-speech', 'aborted'].includes(problem) && ++networkFailures >= 3) unavailable('Không kết nối được nhận dạng Google sau 3 lần thử. Kiểm tra mạng hoặc bấm thử lại Google.')
    }
    item.onend = () => {
      if (!valid() || engine !== item) return
      connected()
      completed.push(...current.values()); current = new Map(); engine = null; detach(item); emit()
      if (finishing || !wanted) { settle(); return }
      if (!received && Date.now() - started < 750 && problem !== 'no-speech') rapidEnds++
      else rapidEnds = 0
      if (rapidEnds >= 5) { unavailable('Nhận dạng Google bị ngắt liên tục. Kiểm tra quyền micro và bấm thử lại Google.'); return }
      options.onState('reconnecting')
      restart = setTimeout(listen, problem === 'network' ? Math.min(3000, 500 * 2 ** networkFailures) : 250)
    }
    options.onState('starting')
    connectionTimer=setTimeout(()=>{if(valid() && engine===item)unavailable('Google chưa mở được nhận dạng giọng nói. Kiểm tra Chrome và quyền micro, rồi bấm thử lại Google.')},5000)
    try { item.start() } catch { unavailable('Chrome chưa khởi động được nhận dạng Google. Bấm thử lại Google để kết nối.'); return }
  }
  listen()
  return {
    abort,
    finish() {
      if (finishPromise) return finishPromise
      wanted = false; clearTimeout(restart); restart = undefined
      if (disposed || !engine) return Promise.resolve()
      finishing = true
      finishPromise = new Promise<void>(resolve => { resolveFinish = resolve })
      // stop() asks Google for its final result; abort()/detaching first loses
      // the final words. Bound the wait so an unavailable service cannot hang.
      drain = setTimeout(() => { emit(); if (engine) { const item = engine; engine = null; detach(item); try { item.abort() } catch {} } settle() }, 1500)
      try { engine.stop() } catch { settle() }
      return finishPromise
    },
  }
}
