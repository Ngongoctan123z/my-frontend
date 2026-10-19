'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpeakingClip, SpeakingMetrics } from '../lib/speaking'

type Options = { maxDurationMs: number; onComplete: (clip: SpeakingClip) => void; onActiveChange: (active: boolean) => void; onStarted: () => void }
export function useSpeakingRecorder(options: Options) {
  const callbacks = useRef(options); callbacks.current = options
  const [recording, setRecording] = useState(false), [requesting, setRequesting] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0), [signalDetected, setSignalDetected] = useState(false), [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), context = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null), frame = useRef<number | null>(null), interval = useRef<ReturnType<typeof setInterval> | null>(null), maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true), pending = useRef(false), generation = useRef(0), discard = useRef(false)
  const startedAt = useRef(0), stoppedAt = useRef(0), stats = useRef({ speechMs: 0, lastFrame: 0, silenceStarted: 0, heard: false, pauseCount: 0, longPauses: 0, pauseMs: 0 })

  const release = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (interval.current) clearInterval(interval.current)
    if (maxTimer.current) clearTimeout(maxTimer.current)
    frame.current = null; interval.current = null; maxTimer.current = null
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null
    if (context.current && context.current.state !== 'closed') void context.current.close().catch(() => {})
    context.current = null; analyser.current = null
  }, [])
  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') { stoppedAt.current = Date.now(); recorder.current.stop() }
    release()
  }, [release])
  const cancel = useCallback(() => {
    generation.current++; discard.current = true; pending.current = false
    stop()
    if (mounted.current) { setRequesting(false); setRecording(false); setElapsedMs(0); callbacks.current.onActiveChange(false) }
  }, [stop])
  const start = useCallback(async () => {
    if (pending.current || recorder.current?.state === 'recording') return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Trình duyệt chưa hỗ trợ thu âm. Hãy mở trang bằng Chrome, Edge hoặc Safari phiên bản mới qua HTTPS.'); return
    }
    const token = ++generation.current
    pending.current = true; discard.current = false; setRequesting(true); setError('')
    callbacks.current.onActiveChange(true)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
      if (!mounted.current || token !== generation.current) { audioStream.getTracks().forEach(track => track.stop()); return }
      stream.current = audioStream
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass() as AudioContext
      context.current = audioContext
      await audioContext.resume()
      if (!mounted.current || token !== generation.current) { audioStream.getTracks().forEach(track => track.stop()); if (audioContext.state !== 'closed') void audioContext.close().catch(() => {}); return }
      const node = audioContext.createAnalyser(); node.fftSize = 1024
      audioContext.createMediaStreamSource(audioStream).connect(node); analyser.current = node
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type))
      const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
      recorder.current = mediaRecorder
      const chunks: Blob[] = []
      startedAt.current = Date.now(); stoppedAt.current = 0
      stats.current = { speechMs: 0, lastFrame: Date.now(), silenceStarted: 0, heard: false, pauseCount: 0, longPauses: 0, pauseMs: 0 }
      setSignalDetected(false); setElapsedMs(0)
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      mediaRecorder.onerror = () => { if (token !== generation.current) return; discard.current = true; stop(); if (mounted.current) { setError('Thiết bị đã ngắt thu âm. Vui lòng kiểm tra micro và thử lại.'); setRecording(false); callbacks.current.onActiveChange(false) } }
      mediaRecorder.onstop = () => {
        if (!mounted.current || token !== generation.current || discard.current) return
        release(); setRecording(false); callbacks.current.onActiveChange(false)
        const endedAt = stoppedAt.current || Date.now(), duration = Math.max(0, endedAt - startedAt.current), state = stats.current
        if (state.silenceStarted) {
          const pause = Math.max(0, endedAt - state.silenceStarted)
          state.pauseMs += pause; state.pauseCount++; if (pause >= 1500) state.longPauses++
        }
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || mimeType || 'audio/webm' })
        if (duration < 1000 || blob.size < 500) { setError('Bản thu quá ngắn. Hãy nói ít nhất một câu rồi bấm dừng.'); return }
        const metrics: SpeakingMetrics = { totalDurationMs: duration, speechDurationMs: Math.min(duration, Math.round(state.speechMs)), pauseCount: state.pauseCount, longPauseCount: state.longPauses, totalPauseSec: Math.min(duration / 1000, +(state.pauseMs / 1000).toFixed(2)), signalDetected: state.heard }
        setElapsedMs(duration)
        callbacks.current.onComplete({ id: crypto.randomUUID(), blob, metrics, createdAt: Date.now() })
      }
      mediaRecorder.start(250)
      callbacks.current.onStarted(); setRecording(true); setRequesting(false); pending.current = false
      interval.current = setInterval(() => { if (mounted.current) setElapsedMs(Date.now() - startedAt.current) }, 250)
      maxTimer.current = setTimeout(stop, Math.min(300_000, callbacks.current.maxDurationMs))
      const buffer = new Uint8Array(node.frequencyBinCount)
      const sample = () => {
        if (mediaRecorder.state !== 'recording') return
        node.getByteTimeDomainData(buffer)
        let sum = 0
        for (const byte of buffer) sum += ((byte - 128) / 128) ** 2
        const rms = Math.sqrt(sum / buffer.length), now = Date.now(), state = stats.current
        const delta = Math.min(200, Math.max(0, now - state.lastFrame)); state.lastFrame = now
        if (rms > 0.018) {
          state.speechMs += delta
          if (!state.heard) { state.heard = true; setSignalDetected(true) }
          if (state.silenceStarted) {
            const pause = now - state.silenceStarted
            state.pauseMs += pause; state.pauseCount++; if (pause >= 1500) state.longPauses++
            state.silenceStarted = 0
          }
        } else if (state.heard && !state.silenceStarted) state.silenceStarted = now
        frame.current = requestAnimationFrame(sample)
      }
      sample()
    } catch (failure: any) {
      if (mounted.current && token === generation.current) {
        release(); pending.current = false
        setRecording(false); setRequesting(false); callbacks.current.onActiveChange(false)
        setError(failure?.name === 'NotAllowedError' ? 'Chưa được cấp quyền micro. Hãy bật quyền micro trên thanh địa chỉ rồi thử lại.' : 'Không mở được micro. Hãy kiểm tra thiết bị và thử lại.')
      }
    }
  }, [release, stop])
  useEffect(() => {
    mounted.current = true
    const beforeUnload = (event: BeforeUnloadEvent) => { if (pending.current || recorder.current?.state === 'recording') { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => { mounted.current = false; generation.current++; discard.current = true; stop(); window.removeEventListener('beforeunload', beforeUnload) }
  }, [stop])
  return { recording, requesting, elapsedMs, signalDetected, error, analyser, start, stop, cancel }
}

export function useSpeakingAudioUrl(blob?: Blob | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) { setUrl(null); return }
    const next = URL.createObjectURL(blob); setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}
