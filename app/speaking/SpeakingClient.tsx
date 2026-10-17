'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, Square, Play, RotateCcw, Volume2, ChevronRight,
  Clock, AlertCircle, CheckCircle2, Loader2,
  MessageSquare, Sparkles, BookOpen, BarChart3, HelpCircle,
  ThumbsUp, ThumbsDown, ArrowLeft
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'

import {
  IELTS_PART1_PROMPTS, IELTS_PART2_PROMPTS, IELTS_PART3_PROMPTS,
  TOEIC_Q1_2_PROMPTS, TOEIC_Q3_PROMPTS, TOEIC_Q4_6_PROMPTS,
  TOEIC_Q7_9_PROMPTS, TOEIC_Q10_11_PROMPTS,
  SpeakingPrompt, PART_META, SpeakingPart, getLinkedIeltsPart3
} from '@/src/data/speakingPrompts'

import { SessionSetup, SessionConfig } from '@/src/components/speaking/SessionSetup'
import { WheelSpinner } from '@/src/components/speaking/WheelSpinner'
import { SquarePromptCard } from '@/src/components/speaking/SquarePromptCard'
import { SpeakingChatCoach } from '@/src/components/speaking/SpeakingChatCoach'
import { SessionSummaryReport, SessionResultItem } from '@/src/components/speaking/SessionSummaryReport'

// ─── Constants & Types ────────────────────────────────────────────────────────

const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean', 'sort of', 'kind of', 'basically', 'actually', 'literally', 'right', 'okay so']
const SILENCE_THRESHOLD = 0.02
const PAUSE_LOG_THRESHOLD_MS = 1500  // Khoảng nghỉ trên 1.5s được ghi thành pause event
const AUTO_END_SILENCE_MS = 3500     // Tự kết thúc sau 3.5s im lặng (chỉ sau khi đã có tiếng nói)
const MIN_SPEECH_DURATION_MS = 1000  // Ít nhất 1s tiếng nói thực tế

type AppScreen = 'setup' | 'wheel' | 'prompt' | 'result' | 'summary'

interface PauseEvent {
  startMs: number
  endMs: number
  durationMs: number
}

interface MisheardWord {
  heard: string
  suggested: string
  reason: string
  confirmed: boolean | null
}

interface AIFluencyResult {
  speech_duration_seconds?: number
  total_duration_seconds?: number
  pause_count?: number
  long_pause_count?: number
  total_pause_seconds?: number
  words_per_minute?: number
  repetition_count?: number
  filler_count?: number
  level?: string
}

interface AIResult {
  valid: boolean
  transcript_clean?: string
  fluency?: AIFluencyResult
  possible_misheard_words?: MisheardWord[]
  feedback_vi?: string
  strengths_vi?: string
  next_question_en?: string
  next_question_vi?: string
  _sessionId?: string
  error?: string
}

// ─── Main Speaking Client Component ──────────────────────────────────────────

export function SpeakingClient() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Screen Flow
  const [screen, setScreen] = useState<AppScreen>('setup')
  const [initialExamType, setInitialExamType] = useState<'IELTS_SPEAKING' | 'TOEIC_SPEAKING'>(
    tabParam === 'toeic' ? 'TOEIC_SPEAKING' : 'IELTS_SPEAKING'
  )

  useEffect(() => {
    if (tabParam === 'toeic') setInitialExamType('TOEIC_SPEAKING')
    else if (tabParam === 'ielts') setInitialExamType('IELTS_SPEAKING')
  }, [tabParam])

  // Session Queue
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [questionsQueue, setQuestionsQueue] = useState<SpeakingPrompt[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [sessionResults, setSessionResults] = useState<SessionResultItem[]>([])

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false)

  // Recording & Audio State
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingMs, setRecordingMs] = useState(0)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [speechDetected, setSpeechDetected] = useState(false)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Current Question Output
  const [transcript, setTranscript] = useState('')
  const [pauseEvents, setPauseEvents] = useState<PauseEvent[]>([])
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [misheardWords, setMisheardWords] = useState<MisheardWord[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startTimeRef = useRef<number>(0)
  const speechStartRef = useRef<number>(0)
  const speechDurationRef = useRef<number>(0)
  const pauseCountRef = useRef<number>(0)
  const longPauseCountRef = useRef<number>(0)
  const totalPauseMsRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const inSilenceRef = useRef<boolean>(false)
  const pauseEventsRef = useRef<PauseEvent[]>([])

  const currentPrompt: SpeakingPrompt | null = questionsQueue[currentIndex] || null

  // ── Helper: Generate Session Queue with Linked Prompts ───────────────────────
  const generateQueue = (config: SessionConfig): SpeakingPrompt[] => {
    const queue: SpeakingPrompt[] = []

    if (config.examType === 'IELTS_SPEAKING') {
      // IELTS logic: Handle linked Part 2 and Part 3
      const hasPart1 = config.practiceParts.includes('PART_1')
      const hasPart2 = config.practiceParts.includes('PART_2')
      const hasPart3 = config.practiceParts.includes('PART_3')

      if (hasPart1) {
        const rand = IELTS_PART1_PROMPTS[Math.floor(Math.random() * IELTS_PART1_PROMPTS.length)]
        queue.push(rand)
      }

      if (hasPart2 && hasPart3) {
        // Link Part 2 and Part 3 by topic/set
        const part2 = IELTS_PART2_PROMPTS[Math.floor(Math.random() * IELTS_PART2_PROMPTS.length)]
        if (part2) {
          const linkedPart3 = getLinkedIeltsPart3(part2) || IELTS_PART3_PROMPTS[0]
          queue.push(part2)
          if (linkedPart3) queue.push(linkedPart3)
        }
      } else if (hasPart2) {
        const part2 = IELTS_PART2_PROMPTS[Math.floor(Math.random() * IELTS_PART2_PROMPTS.length)]
        queue.push(part2)
      } else if (hasPart3) {
        const part3 = IELTS_PART3_PROMPTS[Math.floor(Math.random() * IELTS_PART3_PROMPTS.length)]
        queue.push(part3)
      }
    } else {
      // TOEIC logic: Add in natural sequence
      const order: SpeakingPart[] = ['Q1_2', 'Q3', 'Q4_6', 'Q7_9', 'Q10_11']
      order.forEach((part) => {
        if (config.practiceParts.includes(part)) {
          let pool: SpeakingPrompt[] = []
          if (part === 'Q1_2') pool = TOEIC_Q1_2_PROMPTS
          else if (part === 'Q3') pool = TOEIC_Q3_PROMPTS
          else if (part === 'Q4_6') pool = TOEIC_Q4_6_PROMPTS
          else if (part === 'Q7_9') pool = TOEIC_Q7_9_PROMPTS
          else if (part === 'Q10_11') pool = TOEIC_Q10_11_PROMPTS

          if (pool.length > 0) {
            const rand = pool[Math.floor(Math.random() * pool.length)]
            queue.push(rand)
          }
        }
      })
    }

    return queue
  }

  // ── Start Session Handler ──────────────────────────────────────────────────
  const handleStartSession = (config: SessionConfig) => {
    setSessionConfig(config)
    const queue = generateQueue(config)
    setQuestionsQueue(queue)
    setCurrentIndex(0)
    setSessionResults([])
    resetQuestionState()

    if (config.source === 'random') {
      setScreen('wheel')
    } else {
      setScreen('prompt')
    }
  }

  const resetQuestionState = () => {
    setIsRecording(false)
    setIsProcessing(false)
    setRecordingMs(0)
    setSpeechDetected(false)
    setAudioUrl(null)
    setTranscript('')
    setPauseEvents([])
    setAiResult(null)
    setMisheardWords([])
    setErrorMsg('')
    pauseEventsRef.current = []
  }

  // ── Wheel Logic ─────────────────────────────────────────────────────────────
  // Extract all topics for current part to populate wheel slices
  const currentPartTopics = (() => {
    if (!currentPrompt) return ['Topic A', 'Topic B', 'Topic C', 'Topic D']
    let pool: SpeakingPrompt[] = []
    if (currentPrompt.examType === 'IELTS_SPEAKING') {
      if (currentPrompt.part === 'PART_1') pool = IELTS_PART1_PROMPTS
      else if (currentPrompt.part === 'PART_2') pool = IELTS_PART2_PROMPTS
      else pool = IELTS_PART3_PROMPTS
    } else {
      if (currentPrompt.part === 'Q1_2') pool = TOEIC_Q1_2_PROMPTS
      else if (currentPrompt.part === 'Q3') pool = TOEIC_Q3_PROMPTS
      else if (currentPrompt.part === 'Q4_6') pool = TOEIC_Q4_6_PROMPTS
      else if (currentPrompt.part === 'Q7_9') pool = TOEIC_Q7_9_PROMPTS
      else pool = TOEIC_Q10_11_PROMPTS
    }
    const set = new Set(pool.map((p) => p.topic).filter(Boolean))
    const list = Array.from(set)
    if (list.length < 3) list.push('General Topic', 'Daily Life', 'Career')
    return list
  })()

  const wheelTargetIndex = Math.max(0, currentPartTopics.indexOf(currentPrompt?.topic || ''))

  const handleSpinClick = () => {
    if (isSpinning) return
    setIsSpinning(true)
  }

  const handleSpinEnd = () => {
    setIsSpinning(false)
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
      })
    } catch {}

    setTimeout(() => {
      setScreen('prompt')
    }, 1300)
  }

  const handleQuickPick = () => {
    setIsSpinning(false)
    try {
      confetti({ particleCount: 30, spread: 40 })
    } catch {}
    setScreen('prompt')
  }

  // ── Card Expired (15s grace expired without speaking) ────────────────────────
  const handleCardExpired = () => {
    // Exactly as required:
    // Hết khoảng chờ mà người dùng chưa bấm thu âm:
    // Thu gọn thẻ đề bằng animation, ghi trạng thái "Hết thời gian bắt đầu", không gọi STT hoặc chấm điểm.
  }

  // ── Start Recording ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    setErrorMsg('')
    resetQuestionState()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      })
      streamRef.current = stream

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 2048
      analyserNode.smoothingTimeConstant = 0.8
      source.connect(analyserNode)
      analyserRef.current = analyserNode
      setAnalyser(analyserNode)

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg;codecs=opus'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        processAudio(blob)
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      speechStartRef.current = 0
      speechDurationRef.current = 0
      pauseCountRef.current = 0
      longPauseCountRef.current = 0
      totalPauseMsRef.current = 0
      pauseStartRef.current = 0
      inSilenceRef.current = false
      pauseEventsRef.current = []

      setIsRecording(true)
      setRecordingMs(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingMs(Date.now() - startTimeRef.current)
      }, 100)

      // Maximum speaking duration safety limit
      const maxSpeakMs = ((currentPrompt?.speakTimeSec || 45) + 3) * 1000
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, maxSpeakMs)

      // VAD Loop with separated thresholds
      const bufferLength = analyserNode.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const vadLoop = () => {
        if (mediaRecorderRef.current?.state !== 'recording') return
        analyserNode.getByteTimeDomainData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128
          sum += norm * norm
        }
        const rms = Math.sqrt(sum / bufferLength)
        setVolumeLevel(Math.min(1, rms * 5))

        const isSpeaking = rms > SILENCE_THRESHOLD

        if (isSpeaking) {
          setSpeechDetected(true)
          if (!speechStartRef.current) speechStartRef.current = Date.now()

          if (inSilenceRef.current) {
            // End of a silence pause
            const pauseDuration = Date.now() - pauseStartRef.current
            totalPauseMsRef.current += pauseDuration
            pauseCountRef.current++

            if (pauseDuration >= PAUSE_LOG_THRESHOLD_MS) {
              longPauseCountRef.current++
              pauseEventsRef.current.push({
                startMs: pauseStartRef.current - startTimeRef.current,
                endMs: Date.now() - startTimeRef.current,
                durationMs: pauseDuration,
              })
            }
            inSilenceRef.current = false
          }

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        } else {
          // Silence detected
          if (!inSilenceRef.current && speechStartRef.current) {
            pauseStartRef.current = Date.now()
            inSilenceRef.current = true

            // Auto-stop ONLY after AUTO_END_SILENCE_MS (3.5s) continuous silence
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                  stopRecording()
                }
              }, AUTO_END_SILENCE_MS)
            }
          }
        }

        requestAnimationFrame(vadLoop)
      }

      vadLoop()
    } catch (err: any) {
      setErrorMsg('Không thể mở microphone. Vui lòng kiểm tra quyền thiết bị trong trình duyệt.')
      setIsRecording(false)
    }
  }

  // ── Stop Recording ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setAnalyser(null)
    analyserRef.current = null
    setIsRecording(false)
  }, [])

  // ── Process Audio & Call STT / AI Analysis ──────────────────────────────────
  const processAudio = async (blob: Blob) => {
    setIsProcessing(true)
    setErrorMsg('')

    const totalDurationMs = Date.now() - startTimeRef.current
    const speechDurMs = totalDurationMs - totalPauseMsRef.current

    if (totalDurationMs < MIN_SPEECH_DURATION_MS || blob.size < 1500 || !speechStartRef.current) {
      setErrorMsg('Hệ thống chưa ghi nhận được âm thanh nói hợp lệ (quá ngắn hoặc im lặng). Không chấm điểm bài này.')
      setIsProcessing(false)
      return
    }

    try {
      // 1. Transcribe via backend STT (Groq Whisper)
      const fd = new FormData()
      fd.append('audio', blob, 'recording.webm')
      fd.append('action', 'transcribe')

      const transcribeRes = await fetch('/api/speaking', {
        method: 'POST',
        body: fd,
      })
      const transcribeData = await transcribeRes.json()

      if (!transcribeRes.ok || transcribeData.error) {
        setErrorMsg(transcribeData.message || 'Lỗi chuyển giọng nói thành văn bản. Hãy thử nói lại to và rõ ràng hơn.')
        setIsProcessing(false)
        return
      }

      const rawTranscript = transcribeData.transcript
      if (!rawTranscript || rawTranscript.split(/\s+/).length < 2) {
        setErrorMsg('Transcript chưa đủ nội dung để đánh giá. Vui lòng nói thành câu hoàn chỉnh.')
        setIsProcessing(false)
        return
      }

      setTranscript(rawTranscript)
      setPauseEvents([...pauseEventsRef.current])

      // Calculate Fluency Metrics
      const words = rawTranscript.split(/\s+/).filter((w: string) => w.length > 0)
      const speechSec = Math.max(1, speechDurMs / 1000)
      const wpm = Math.min(250, Math.round((words.length / speechSec) * 60))

      const lower = rawTranscript.toLowerCase()
      const fillerCount = FILLER_WORDS.reduce((acc, f) => acc + (lower.match(new RegExp(`\\b${f}\\b`, 'g')) ?? []).length, 0)
      let repetitionCount = 0
      for (let i = 1; i < words.length; i++) {
        if (words[i].toLowerCase() === words[i - 1].toLowerCase() && words[i].length > 2) repetitionCount++
      }

      const fData = {
        speechDurationMs: speechDurMs,
        totalDurationMs,
        pauseCount: pauseCountRef.current,
        longPauseCount: longPauseCountRef.current,
        totalPauseSec: +(totalPauseMsRef.current / 1000).toFixed(1),
        wpm,
        fillerCount,
        repetitionCount,
      }

      // Check whether this specific part was selected for GRADING
      const isGraded = Boolean(
        currentPrompt && sessionConfig?.gradeParts.includes(currentPrompt.part as SpeakingPart)
      )

      let aiResp: any = null
      let newSessionId = crypto.randomUUID()

      // Call AI Grader / Feedback
      if (isGraded && currentPrompt) {
        const analyzeRes = await fetch('/api/speaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze',
            sessionId: newSessionId,
            examType: currentPrompt.examType,
            part: currentPrompt.part,
            promptEn: currentPrompt.questionEn,
            promptVi: currentPrompt.questionVi,
            transcript: rawTranscript,
            fluencyData: fData,
          }),
        })

        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json()
          aiResp = analyzeData.result
          if (aiResp?.possible_misheard_words) {
            setMisheardWords(aiResp.possible_misheard_words)
          }
        }
      }

      setAiResult(aiResp)
      setCurrentSessionId(newSessionId)

      // Add to Session Results
      if (currentPrompt) {
        const resultItem: SessionResultItem = {
          promptId: currentPrompt.id,
          examType: currentPrompt.examType,
          part: currentPrompt.part,
          topic: currentPrompt.topic,
          questionEn: currentPrompt.questionEn,
          transcript: rawTranscript,
          audioUrl: URL.createObjectURL(blob),
          wpm,
          speechDurationSec: Math.round(speechSec),
          pauseCount: pauseCountRef.current,
          longPauseCount: longPauseCountRef.current,
          isGraded,
          aiResult: aiResp,
        }
        setSessionResults((prev) => [...prev, resultItem])
      }

      setScreen('result')
    } catch (err: any) {
      setErrorMsg('Có lỗi xảy ra trong quá trình xử lý bài nói. Hãy thử lại.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Misheard Confirmation ──────────────────────────────────────────────────
  const handleConfirmMisheard = (heard: string, confirmed: boolean) => {
    setMisheardWords((prev) =>
      prev.map((w) => (w.heard === heard ? { ...w, confirmed } : w))
    )
  }

  // ── Next Question / Finish Session ──────────────────────────────────────────
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questionsQueue.length) {
      setCurrentIndex((prev) => prev + 1)
      resetQuestionState()
      if (sessionConfig?.source === 'random') {
        setScreen('wheel')
      } else {
        setScreen('prompt')
      }
    } else {
      setScreen('summary')
    }
  }

  const handleRetryCurrent = () => {
    resetQuestionState()
    setScreen('prompt')
  }

  // ── Render Screens ──────────────────────────────────────────────────────────

  // SCREEN 1: Setup
  if (screen === 'setup') {
    return <SessionSetup initialExamType={initialExamType} onStartSession={handleStartSession} />
  }

  // SCREEN 2: Wheel Spinner
  if (screen === 'wheel' && currentPrompt) {
    const isIelts = currentPrompt.examType === 'IELTS_SPEAKING'
    const meta = PART_META[currentPrompt.part as SpeakingPart]
    const partName = meta ? meta.labelEn : currentPrompt.part
    const examName = isIelts ? 'IELTS Speaking' : 'TOEIC Speaking'

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setScreen('setup')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại thiết lập
          </button>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            {examName} • {partName}
          </span>
        </div>

        <WheelSpinner
          topics={currentPartTopics}
          targetIndex={wheelTargetIndex}
          isSpinning={isSpinning}
          onSpinClick={handleSpinClick}
          onSpinEnd={handleSpinEnd}
          onQuickPick={handleQuickPick}
          currentPartLabel={`${examName} — ${partName}`}
          progressLabel={`Câu ${currentIndex + 1} / ${questionsQueue.length}`}
        />
      </div>
    )
  }

  // SCREEN 3: Square Prompt Card
  if (screen === 'prompt' && currentPrompt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            Tiến độ: Câu {currentIndex + 1} / {questionsQueue.length}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {sessionConfig?.isPracticeMode ? 'Chế độ luyện tập có gợi ý' : 'Chế độ mô phỏng chuẩn phòng thi'}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">{errorMsg}</p>
              <p className="text-xs text-red-700 mt-1">Bạn có thể bấm &quot;Thử lại&quot; bên dưới hoặc chuyển câu hỏi khác.</p>
            </div>
          </div>
        )}

        <SquarePromptCard
          prompt={currentPrompt}
          isPracticeMode={sessionConfig?.isPracticeMode ?? true}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onSkipOrReroll={handleNextQuestion}
          onCardExpired={handleCardExpired}
          isRecording={isRecording}
          isProcessing={isProcessing}
          recordingMs={recordingMs}
          volumeLevel={volumeLevel}
          speechDetected={speechDetected}
          analyser={analyser}
        />
      </div>
    )
  }

  // SCREEN 4: Result & Feedback & Chat Coach
  if (screen === 'result' && currentPrompt) {
    const isGraded = Boolean(sessionConfig?.gradeParts.includes(currentPrompt.part as SpeakingPart))
    const isLast = currentIndex + 1 >= questionsQueue.length

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md mr-2">
                {currentPrompt.examType === 'IELTS_SPEAKING' ? 'IELTS' : 'TOEIC'} • {currentPrompt.part}
              </span>
              <span className="text-xs font-semibold text-slate-500">Chủ đề: {currentPrompt.topic}</span>
            </div>
            {isGraded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm điểm AI theo Rubric
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                <HelpCircle className="w-3.5 h-3.5" /> Phần luyện tập (Không tính điểm chính thức)
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">{currentPrompt.questionEn}</h2>
          {currentPrompt.questionVi && (
            <p className="text-sm text-slate-500 italic mb-4">{currentPrompt.questionVi}</p>
          )}

          {/* Audio Replay */}
          {audioUrl && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                <Volume2 className="w-4 h-4 text-indigo-600" /> Nghe lại bài nói:
              </span>
              <audio controls src={audioUrl} className="w-full h-8" />
            </div>
          )}
        </div>

        {/* Read-only Transcript Viewer with Pause Tooltips */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Transcript đã nhận dạng (Chỉ đọc)
            </span>
            <span className="text-[11px] text-slate-400 italic">Dấu &quot;...&quot; thể hiện khoảng nghỉ trên 1.5s</span>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-sm leading-relaxed text-slate-800 select-none">
            {transcript ? (
              transcript.split(/\s+/).map((word, i) => (
                <span key={i} className="inline-block mr-1">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">Không có transcript.</span>
            )}

            {pauseEvents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-sans text-slate-500 flex flex-wrap gap-2 items-center">
                <span className="font-bold text-slate-700">Các khoảng nghỉ dài đã ghi nhận:</span>
                {pauseEvents.map((pe, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded text-[11px] font-semibold"
                    title={`Nghỉ từ giây thứ ${(pe.startMs / 1000).toFixed(1)}s đến ${(pe.endMs / 1000).toFixed(1)}s`}
                  >
                    Nghỉ {(pe.durationMs / 1000).toFixed(1)}s
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fluency Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-indigo-600">
              {aiResult?.fluency?.words_per_minute || 0}
              <span className="text-xs font-bold text-slate-400 ml-1">WPM</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Tốc độ nói</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-purple-600">{pauseEvents.length}</p>
            <p className="text-xs text-slate-500 mt-1">Khoảng nghỉ dài (&gt;1.5s)</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-amber-600">{aiResult?.fluency?.filler_count ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Từ đệm (um/uh/like)</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-1">
              {aiResult?.fluency?.level ? aiResult.fluency.level.toUpperCase() : 'KHÁ TỐT'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Độ trôi chảy (Fluency)</p>
          </div>
        </div>

        {/* AI Feedback if graded */}
        {isGraded && aiResult && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Đánh giá chi tiết từ AI Examiner
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Đánh giá AI tham khảo — không phải điểm chính thức
              </span>
            </div>

            {aiResult.feedback_vi && (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-950 leading-relaxed">
                <span className="font-bold text-indigo-900 block mb-1">Nhận xét tổng quan:</span>
                {aiResult.feedback_vi}
              </div>
            )}

            {aiResult.strengths_vi && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-950 leading-relaxed">
                <span className="font-bold text-emerald-900 block mb-1">Điểm nổi bật:</span>
                {aiResult.strengths_vi}
              </div>
            )}
          </div>
        )}

        {/* Possible Misheard Words Card */}
        {misheardWords.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Từ có thể bị hệ thống nghe sai (Contextual Check)
            </h4>
            <p className="text-xs text-amber-800">
              Dựa vào ngữ cảnh đề bài, hệ thống ghi nhận một số từ phát âm tương tự từ mục tiêu:
            </p>

            <div className="space-y-2 mt-2">
              {misheardWords.map((item, idx) => (
                <div key={idx} className="bg-white border border-amber-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-slate-500">Hệ thống nghe:</span>{' '}
                    <strong className="text-red-600 font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{item.heard}</strong>
                    {' → '}
                    <span className="text-slate-500">Có thể là:</span>{' '}
                    <strong className="text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{item.suggested}</strong>
                    {item.reason && <p className="text-[11px] text-slate-500 mt-1 italic">{item.reason}</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmMisheard(item.heard, true)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        item.confirmed === true
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 inline mr-1" /> Đúng ý tôi
                    </button>
                    <button
                      onClick={() => handleConfirmMisheard(item.heard, false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                        item.confirmed === false
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3 inline mr-1" /> Không đúng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedded AI Speaking Chat Coach */}
        <SpeakingChatCoach
          sessionId={currentSessionId}
          examType={currentPrompt.examType}
          part={currentPrompt.part}
          promptEn={currentPrompt.questionEn}
          transcript={transcript}
          aiFeedback={aiResult?.feedback_vi}
          isScored={isGraded}
        />

        {/* Action Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleRetryCurrent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Luyện lại câu này
          </button>

          <button
            onClick={handleNextQuestion}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all hover:scale-[1.01]"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Xem báo cáo phiên
              </>
            ) : (
              <>
                Câu tiếp theo ({questionsQueue[currentIndex + 1]?.part || 'Part'}) <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // SCREEN 5: Summary Report
  if (screen === 'summary') {
    return (
      <SessionSummaryReport
        examType={sessionConfig?.examType || 'IELTS_SPEAKING'}
        results={sessionResults}
        onNewSession={() => {
          setScreen('setup')
          setQuestionsQueue([])
          setSessionResults([])
          resetQuestionState()
        }}
      />
    )
  }

  return null
}
