'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SpeakingVoiceGate, deliveryText, pauseDots, PAUSE_START_MS, type SpeakingDelivery } from '../lib/speechDelivery'
import type { SpeakingClip, SpeakingMetrics } from '../lib/speaking'

type RecognitionLike = {
  continuous:boolean;interimResults:boolean;lang:string;maxAlternatives:number
  onresult:((event:any)=>void)|null;onerror:((event:any)=>void)|null;onend:(()=>void)|null
  start:()=>void;stop:()=>void;abort:()=>void
}
type Options = { maxDurationMs: number; onComplete: (clip: SpeakingClip) => void; onActiveChange: (active: boolean) => void; onStarted: () => void }
export function useSpeakingRecorder(options: Options) {
  const callbacks = useRef(options); callbacks.current = options
  const [recording, setRecording] = useState(false), [requesting, setRequesting] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0), [signalDetected, setSignalDetected] = useState(false), [error, setError] = useState('')
  const [liveText,setLiveText]=useState(''),[pauseMs,setPauseMs]=useState(0),[recognitionState,setRecognitionState]=useState<'unavailable'|'listening'|'interrupted'>('unavailable')
  const delivery=useRef<SpeakingDelivery>({recognitionAvailable:false,segments:[],pauses:[]}),recognition=useRef<RecognitionLike|null>(null),recognitionActive=useRef(false)
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), context = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null), frame = useRef<number | null>(null), interval = useRef<ReturnType<typeof setInterval> | null>(null), maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true), pending = useRef(false), generation = useRef(0), discard = useRef(false)
  const startedAt = useRef(0), stoppedAt = useRef(0), stats = useRef({ speechMs: 0, lastFrame: 0, silenceStarted: 0, heard: false, pauseCount: 0, longPauses: 0, pauseMs: 0 })

  const release = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (interval.current) clearInterval(interval.current)
    if (maxTimer.current) clearTimeout(maxTimer.current)
    frame.current = null; interval.current = null; maxTimer.current = null
    recognitionActive.current=false
    if(recognition.current){recognition.current.onresult=null;recognition.current.onend=null;recognition.current.onerror=null;try{recognition.current.stop()}catch{};recognition.current=null}
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
      // Waveform/timing must not block recording when Web Audio is unavailable
      // or resume() remains pending under a browser's autoplay policy.
      let audioContext: AudioContext | null = null, node: AnalyserNode | null = null
      try {
        if (AudioContextClass) {
          audioContext = new AudioContextClass() as AudioContext
          context.current = audioContext
          void audioContext.resume().catch(() => {})
          node = audioContext.createAnalyser(); node.fftSize = 1024
          audioContext.createMediaStreamSource(audioStream).connect(node); analyser.current = node
        }
      } catch { node = null; analyser.current = null }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type))
      const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
      recorder.current = mediaRecorder
      const chunks: Blob[] = []
      startedAt.current = Date.now(); stoppedAt.current = 0
      stats.current = { speechMs: 0, lastFrame: Date.now(), silenceStarted: 0, heard: false, pauseCount: 0, longPauses: 0, pauseMs: 0 }
      delivery.current={recognitionAvailable:false,segments:[],pauses:[]};setLiveText('');setPauseMs(0);setRecognitionState('unavailable')
      setSignalDetected(false); setElapsedMs(0)
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      mediaRecorder.onerror = () => { if (token !== generation.current) return; discard.current = true; stop(); if (mounted.current) { setError('Thiết bị đã ngắt thu âm. Vui lòng kiểm tra micro và thử lại.'); setRecording(false); callbacks.current.onActiveChange(false) } }
      mediaRecorder.onstop = () => {
        if (!mounted.current || token !== generation.current || discard.current) return
        release(); setRecording(false); callbacks.current.onActiveChange(false)
        const endedAt = stoppedAt.current || Date.now(), duration = Math.max(0, endedAt - startedAt.current), state = stats.current
        if (state.silenceStarted) {
          const pause = Math.max(0, endedAt - state.silenceStarted)
          state.pauseMs += pause; state.pauseCount++; if (pause >= PAUSE_START_MS) {state.longPauses++;if(delivery.current.pauses.length<120)delivery.current.pauses.push({startMs:Math.max(0,state.silenceStarted-startedAt.current),durationMs:pause})}
        }
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || mimeType || 'audio/webm' })
        if (duration < 1000 || blob.size < 500) { setError('Bản thu quá ngắn. Hãy nói ít nhất một câu rồi bấm dừng.'); return }
        const metrics: SpeakingMetrics = { totalDurationMs: duration, speechDurationMs: Math.min(duration, Math.round(state.speechMs)), pauseCount: state.pauseCount, longPauseCount: state.longPauses, totalPauseSec: Math.min(duration / 1000, +(state.pauseMs / 1000).toFixed(2)), signalDetected: state.heard }
        setElapsedMs(duration)
        setLiveText(deliveryText(delivery.current));setPauseMs(0)
        callbacks.current.onComplete({ id: crypto.randomUUID(), blob, metrics, createdAt: Date.now(),delivery:{...delivery.current,segments:delivery.current.segments.map(s=>({...s})),pauses:delivery.current.pauses.map(p=>({...p}))} })
      }
      mediaRecorder.start(250)
      const Recognition=(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if(Recognition){
        recognitionActive.current=true
        let restarts=0
        const listen=()=>{
          if(!recognitionActive.current || token!==generation.current || mediaRecorder.state!=='recording')return
          let engine: RecognitionLike
          try { engine=new Recognition() as RecognitionLike }
          catch { recognitionActive.current=false;setRecognitionState('interrupted');return }
          recognition.current=engine;engine.continuous=true;engine.interimResults=true;engine.lang='en-US';engine.maxAlternatives=1
          const positions=new Map<number,number>()
          engine.onresult=event=>{
            if(!mounted.current || !recognitionActive.current || token!==generation.current || mediaRecorder.state!=='recording')return
            for(let i=event.resultIndex;i<event.results.length;i++){
              const result=event.results[i],text=String(result[0]?.transcript || '').trim().slice(0,2000)
              if(!text)continue
              const existing=positions.get(i)
              const used=delivery.current.segments.reduce((n,s,j)=>n+(j===existing?0:s.text.length),0)
              if(used+text.length>6000)break
              if(existing!==undefined)delivery.current.segments[existing]={...delivery.current.segments[existing],text,final:!!result.isFinal}
              else if(delivery.current.segments.length<120){positions.set(i,delivery.current.segments.length);delivery.current.segments.push({text,atMs:Math.min(Date.now()-startedAt.current,stoppedAt.current?stoppedAt.current-startedAt.current:300_000),final:!!result.isFinal})}
            }
            delivery.current.recognitionAvailable=true;setRecognitionState('listening');setLiveText(deliveryText(delivery.current))
          }
          engine.onerror=event=>{if(!recognitionActive.current||token!==generation.current)return;setRecognitionState('interrupted');if(!['no-speech','network','aborted'].includes(event.error))recognitionActive.current=false}
          engine.onend=()=>{if(recognition.current===engine)recognition.current=null;if(recognitionActive.current && token===generation.current){if(restarts++<20)setTimeout(listen,500);else{recognitionActive.current=false;setRecognitionState('interrupted')}}}
          try{engine.start();setRecognitionState('listening')}catch{recognitionActive.current=false;setRecognitionState('interrupted')}
        }
        listen()
      }

      callbacks.current.onStarted(); setRecording(true); setRequesting(false); pending.current = false
      interval.current = setInterval(() => { if (mounted.current) {setElapsedMs(Date.now() - startedAt.current);const silence=stats.current.silenceStarted?Date.now()-stats.current.silenceStarted:0;setPauseMs(silence);setLiveText(deliveryText(delivery.current))} }, 250)
      maxTimer.current = setTimeout(stop, Math.min(300_000, callbacks.current.maxDurationMs))
      const buffer = new Uint8Array(node?.frequencyBinCount || 512), frequencies=new Uint8Array(node?.frequencyBinCount || 512),voiceGate=new SpeakingVoiceGate()
      const sample = () => {
        if (mediaRecorder.state !== 'recording' || !node || !audioContext) return
        node.getByteTimeDomainData(buffer)
        let sum = 0
        for (const byte of buffer) sum += ((byte - 128) / 128) ** 2
        const rms = Math.sqrt(sum / buffer.length), now = Date.now(), state = stats.current
        const delta = Math.min(200, Math.max(0, now - state.lastFrame)); state.lastFrame = now
        node.getByteFrequencyData(frequencies)
        let allEnergy=0,voiceEnergy=0
        for(let i=0;i<frequencies.length;i++){const hz=i*audioContext.sampleRate/node.fftSize,energy=frequencies[i]**2;if(hz>=40&&hz<=8000)allEnergy+=energy;if(hz>=180&&hz<=4500)voiceEnergy+=energy}
        if (voiceGate.update(rms,voiceEnergy/Math.max(1,allEnergy),now-startedAt.current)) {
          state.speechMs += delta
          if (!state.heard) { state.heard = true; setSignalDetected(true) }
          if (state.silenceStarted) {
            const pause = now - state.silenceStarted
            state.pauseMs += pause; state.pauseCount++; if (pause >= PAUSE_START_MS) {state.longPauses++;if(delivery.current.pauses.length<120)delivery.current.pauses.push({startMs:Math.max(0,state.silenceStarted-startedAt.current),durationMs:pause})}
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
  return { recording, requesting, elapsedMs, signalDetected, error, analyser, start, stop, cancel,liveText,pauseMs,pauseDots:pauseDots(pauseMs),recognitionState }
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

// A deliberate server preview works even without the browser's SpeechRecognition
// service. It does not grade, submit, or trust user-supplied transcript text.
export function useSpeakingTranscript(clip?: SpeakingClip) {
  const [transcript, setTranscript] = useState(''), [transcribing, setTranscribing] = useState(false), [transcriptError, setTranscriptError] = useState('')
  const request = useRef<AbortController | null>(null)
  const current = useRef(clip); current.current = clip
  useEffect(() => {
    setTranscript(''); setTranscriptError(''); setTranscribing(false)
    return () => { request.current?.abort(); request.current = null }
  }, [clip?.id])
  const transcribe = useCallback(async () => {
    const selected = current.current
    if (!selected || request.current) return
    const controller = new AbortController(); request.current = controller
    setTranscribing(true); setTranscriptError('')
    const timeout = setTimeout(() => controller.abort(), 90_000)
    try {
      const form = new FormData()
      const extension = selected.blob.type.includes('mp4') ? 'm4a' : selected.blob.type.includes('ogg') ? 'ogg' : 'webm'
      form.set('action', 'transcribe_audio'); form.set('audio', selected.blob, `recording.${extension}`)
      const response = await fetch('/api/speaking', { method: 'POST', body: form, signal: controller.signal })
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Máy chủ chưa phản hồi bản chữ. Bản thu vẫn được giữ; hãy thử lại.')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chưa nhận dạng được bản thu. Hãy thử lại.')
      if (typeof data.transcript !== 'string' || !data.transcript.trim()) throw new Error('Chưa nghe rõ lời nói. Hãy nghe lại micro hoặc thu lại.')
      if (!controller.signal.aborted && current.current?.id === selected.id) setTranscript(data.transcript)
    } catch (failure: any) {
      if (request.current === controller && current.current?.id === selected.id) setTranscriptError(failure?.name === 'AbortError' ? 'Nhận dạng quá lâu. Bản thu vẫn được giữ; bạn có thể thử lại.' : failure.message || 'Chưa chuyển được bản thu thành chữ.')
    } finally {
      clearTimeout(timeout)
      if (request.current === controller) { request.current = null; setTranscribing(false) }
    }
  }, [])
  return { transcript, transcribing, transcriptError, transcribe }
}

