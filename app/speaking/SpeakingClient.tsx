'use client'
import {officialSpeakingSource,SPEAKING_FORMAT_SOURCES} from '@/src/data/speakingOfficialSamples'

import { useCallback, useEffect, useRef, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, History, Loader2, RefreshCw, Send, Volume2 } from 'lucide-react'
import { GraderActions } from '@/src/components/common/GraderControls'
import { OfficialSpeakingLibrary } from '@/src/components/speaking/OfficialSpeakingLibrary'
import { SpeakingDialog } from '@/src/components/speaking/SpeakingDialog'
import { SpeakingRecorder } from '@/src/components/speaking/SpeakingRecorder'
import { SpeakingResults } from '@/src/components/speaking/SpeakingResults'
import { buildSpeakingSet, fallbackCatalog, hashSpeakingAudio, mergeCatalog, PART_LABELS, SPEAKING_PARTS, formatSpeakingTime,
  type SpeakingCatalog, type SpeakingClip, type SpeakingExam, type SpeakingQuestion, type SpeakingReport, type SpeakingTab } from '@/src/lib/speaking'
import { clearSpeakingDraft, loadSpeakingAudio, loadSpeakingDraft, saveSpeakingAudio, saveSpeakingDraft } from '@/src/utils/speakingStorage'

async function requestSpeaking(body?: object | FormData, signal?: AbortSignal) {
  const controller = new AbortController(), abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  const timer = setTimeout(abort, 190_000)
  try {
    const response = await fetch('/api/speaking', body ? { method: 'POST', headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }, body: body instanceof FormData ? body : JSON.stringify(body), signal: controller.signal } : { signal: controller.signal })
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Máy chủ chưa phản hồi. Bản thu vẫn được giữ để bạn gửi lại.')
    const data = await response.json()
    if (!response.ok) {
      const wait = Number(response.headers.get('retry-after'))
      throw new Error((data.error || 'Chưa xử lý được yêu cầu.') + (wait > 0 ? ` Có thể thử lại sau ${wait} giây.` : ''))
    }
    return data
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

export function SpeakingClient() {
  const { data: session, status } = useSession(), search = useSearchParams(), tabParam = search.get('tab')
  const initialExam: SpeakingExam = tabParam === 'toeic' ? 'TOEIC_SPEAKING' : 'IELTS_SPEAKING'
  const initialTab: SpeakingTab = initialExam === 'IELTS_SPEAKING' ? 'PART_2' : 'Q11'
  const owner = session?.user?.email?.trim().toLowerCase() || ''
  const [exam, setExam] = useState<SpeakingExam>(initialExam), [tab, setTab] = useState<SpeakingTab>(initialTab)
  const [catalogs, setCatalogs] = useState<Record<SpeakingExam, SpeakingCatalog>>(() => ({ IELTS_SPEAKING: fallbackCatalog('IELTS_SPEAKING'), TOEIC_SPEAKING: fallbackCatalog('TOEIC_SPEAKING') }))
  const [questions, setQuestions] = useState<SpeakingQuestion[]>(() => buildSpeakingSet(initialExam, initialTab, fallbackCatalog(initialExam), undefined, () => 0))
  const [index, setIndex] = useState(0), [clips, setClips] = useState<Record<string, SpeakingClip>>({})
  const [mode, setMode] = useState<'practice' | 'exam'>('practice'), [examStarted, setExamStarted] = useState(false)
  const [active, setActive] = useState(false), [busy, setBusy] = useState(false), [processing, setProcessing] = useState(''), [error, setError] = useState('')
  const [feedbackLang, setFeedbackLang] = useState('Tiếng Việt'), [clientId, setClientId] = useState(() => crypto.randomUUID())
  const [submissionId, setSubmissionId] = useState<string | null>(null), [report, setReport] = useState<SpeakingReport | null>(null)
  const [displayReport, setDisplayReport] = useState<SpeakingReport | null>(null), [resultOpen, setResultOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false), [history, setHistory] = useState<SpeakingReport[]>([]), [historyLoading, setHistoryLoading] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false), [officialOnly, setOfficialOnly] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false), [keyword, setKeyword] = useState(''), [showTranslation, setShowTranslation] = useState(false), [showVocabulary, setShowVocabulary] = useState(false)
  const [restoring, setRestoring] = useState(true), [storageStatus, setStorageStatus] = useState(''), [restoredNotice, setRestoredNotice] = useState(false)
  const [usage, setUsage] = useState({ count: 0, limit: 5 })
  const current = questions[index], currentClip = current ? clips[current.id] : undefined
  const strict = mode === 'exam', ready = questions.length > 0 && questions.every((q, i) => !!clips[q.id] || !!report?.items[i]?.result)
  const completed = report?.status === 'completed'
  const locked = active || busy || restoring
  const ownerRef = useRef(owner); ownerRef.current = owner
  const touched = useRef(false), pipeline = useRef<AbortController | null>(null), audioHashes = useRef(new Map<string, string>()), loadedOwner = useRef<string | null>(null), queryRef = useRef(tabParam)
  const restoredOwner = useRef<string | null>(null)
  const snapshot = useRef({ exam, tab, mode, questions, clips, index, feedbackLang, clientSubmissionId: clientId, report, submissionId })
  snapshot.current = { exam, tab, mode, questions, clips, index, feedbackLang, clientSubmissionId: clientId, report, submissionId }

  const resetAssessment = useCallback(() => { setClientId(crypto.randomUUID()); setSubmissionId(null); setReport(null); setError('') }, [])
  const login = () => { void signIn('google', { callbackUrl: window.location.href }) }
  const allowDiscard = () => !Object.keys(clips).length || completed || window.confirm('Bạn còn bản thu chưa nộp. Đổi đề sẽ bỏ bài đang làm trên màn hình này. Tiếp tục?')
  const changeSet = (nextExam = exam, nextTab = tab, selectedId?: string, nextMode: 'practice' | 'exam' = 'practice') => {
    if (locked || !allowDiscard()) return
    touched.current = true
    setExam(nextExam); setTab(nextTab); setMode(nextMode); setExamStarted(false)
    setQuestions(buildSpeakingSet(nextExam, nextTab, catalogs[nextExam], selectedId)); setIndex(0); setClips({})
    setShowTranslation(false); setShowVocabulary(false); setRestoredNotice(false); resetAssessment()
  }
  useEffect(() => {
    if (tabParam) return
    try {
      const last = JSON.parse(localStorage.getItem('vndocs-speaking-last-part') || 'null')
      if (last && SPEAKING_PARTS[last.exam as SpeakingExam] && (last.tab === 'FULL' || SPEAKING_PARTS[last.exam as SpeakingExam].includes(last.tab))) {
        setExam(last.exam); setTab(last.tab); setQuestions(buildSpeakingSet(last.exam, last.tab))
      }
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('vndocs-speaking-last-part', JSON.stringify({ exam, tab })) } catch {} }, [exam, tab])
  useEffect(() => {
    if (tabParam !== queryRef.current && !locked) {
      queryRef.current = tabParam
      const nextExam = tabParam === 'toeic' ? 'TOEIC_SPEAKING' : 'IELTS_SPEAKING'
      if (nextExam !== exam) changeSet(nextExam, nextExam === 'IELTS_SPEAKING' ? 'PART_2' : 'Q11')
    }
  }, [tabParam, locked])
  useEffect(() => {
    const controller = new AbortController()
    requestSpeaking({ action: 'catalog', examType: exam }, controller.signal).then(data => {
      if (controller.signal.aborted) return
      const catalog = data.source === 'database' ? data.catalog : mergeCatalog(exam, data.catalog)
      setCatalogs(previous => ({ ...previous, [exam]: catalog }))
      if (!touched.current && !Object.keys(snapshot.current.clips).length) setQuestions(buildSpeakingSet(exam, snapshot.current.tab, catalog))
    }).catch(() => {})
    return () => controller.abort()
  }, [exam])
  useEffect(() => {
    if (status === 'loading' || loadedOwner.current === owner) return
    loadedOwner.current = owner; restoredOwner.current = null; pipeline.current?.abort(); touched.current = false
    setDisplayReport(null); setResultOpen(false); setHistoryOpen(false); setPickerOpen(false); setRestoredNotice(false)
    setActive(false); setBusy(false); setExamStarted(false); setClips({}); resetAssessment(); setRestoring(true); setHistory([])
    let live = true
    if (!owner) { setRestoring(false); return }
    loadSpeakingDraft(owner).then(draft => {
      if (!live || ownerRef.current !== owner) return
      if (draft?.owner === owner && draft.questions?.length && draft.clips && draft.updatedAt > Date.now() - 7 * 86_400_000 && draft.report?.status !== 'completed') {
        touched.current = true; setExam(draft.exam); setTab(draft.tab); setMode(draft.mode); setQuestions(draft.questions)
        setClips(draft.clips); setIndex(Math.min(draft.index, draft.questions.length - 1)); setFeedbackLang(draft.feedbackLang)
        setClientId(draft.clientSubmissionId); setSubmissionId(draft.submissionId || null); setReport(draft.report || null); setRestoredNotice(true)
      }
    }).catch(() => { if (live) setStorageStatus('Trình duyệt chưa cho lưu bản thu tự động. Hãy giữ trang này mở trong khi luyện.') }).finally(() => { if (live && ownerRef.current === owner) { restoredOwner.current = owner; setRestoring(false) } })
    requestSpeaking().then(data => { if (live && ownerRef.current === owner) setUsage({ count: data.count, limit: data.limit }) }).catch(() => {})
    return () => { live = false }
  }, [owner, status, resetAssessment])
  useEffect(() => {
    if (!owner || restoring || restoredOwner.current !== owner) return
    if (report?.status === 'completed' || !Object.keys(clips).length) { void clearSpeakingDraft(owner).catch(() => {}); return }
    const timer = setTimeout(() => {
      saveSpeakingDraft({ owner, ...snapshot.current, updatedAt: Date.now() }).then(() => { if (ownerRef.current === owner) setStorageStatus('Bản thu đã lưu trên thiết bị này.') })
        .catch(() => { if (ownerRef.current === owner) setStorageStatus('Chưa lưu được bản thu tự động. Hãy giữ trang này mở để tránh mất bài.') })
    }, 120)
    return () => clearTimeout(timer)
  }, [owner, restoring, exam, tab, mode, questions, clips, index, feedbackLang, clientId, report, submissionId])
  useEffect(() => () => pipeline.current?.abort(), [])
  useEffect(() => { setShowTranslation(false); setShowVocabulary(false) }, [current?.id])

  const loadHistory = async () => {
    if (!owner) { login(); return }
    setHistoryLoading(true)
    try { const data = await requestSpeaking({ action: 'report' }); if (ownerRef.current === owner) setHistory(data.reports || []) }
    catch (failure: any) { setError(failure.message) }
    finally { setHistoryLoading(false) }
  }
  const clearCurrent = () => {
    if (!current) return
    touched.current = true; setClips(previous => { const next = { ...previous }; delete next[current.id]; return next }); resetAssessment()
  }
  const recorded = (clip: SpeakingClip) => {
    if (!current || ownerRef.current !== owner) return
    touched.current = true; setClips(previous => ({ ...previous, [current.id]: clip })); setError('')
    if (strict && examStarted) {
      if (index < questions.length - 1) setIndex(index + 1)
      else setExamStarted(false)
    }
  }
  const submit = async () => {
    if (!owner) { login(); return }
    if (active || busy) return
    if (completed) { setDisplayReport(report); setResultOpen(true); return }
    const missing = questions.findIndex((q, i) => !clips[q.id] && !report?.items[i]?.result)
    if (missing >= 0) { setIndex(missing); setError('Hãy thu câu này trước. Các bản thu khác vẫn được giữ.'); return }
    const controller = new AbortController(); pipeline.current?.abort(); pipeline.current = controller
    const requestOwner = owner
    setBusy(true); setError(''); setProcessing('Đang chuẩn bị bài nộp')
    try {
      let id = submissionId, updated = report
      if (!id) {
        const items = []
        for (const question of questions) {
          const clip = clips[question.id]
          let audioHash = audioHashes.current.get(clip.id)
          if (!audioHash) { audioHash = await hashSpeakingAudio(clip.blob); audioHashes.current.set(clip.id, audioHash) }
          items.push({ question, audioHash, metrics: clip.metrics, delivery: clip.delivery })
        }
        const data = await requestSpeaking({ action: 'begin_submission', clientSubmissionId: clientId, examType: exam, mode, fullTest: tab === 'FULL', feedbackLang, items }, controller.signal)
        if (controller.signal.aborted || ownerRef.current !== requestOwner) throw new DOMException('Aborted', 'AbortError')
        id = data.id; updated = data.report; setSubmissionId(id); setReport(updated); setUsage({ count: data.count, limit: data.limit })
      } else updated = (await requestSpeaking({ action: 'report', submissionId: id }, controller.signal)).report
      if (!id || !updated) throw new Error('Chưa tạo được bài nộp. Bản thu vẫn được giữ.')
      // Persist all recordings before any provider call, so a failed first grade
      // cannot strand the remaining recordings on this device.
      for (let i = 0; i < questions.length; i++) {
        if (updated.items[i]?.audioAvailable) continue
        const clip = clips[questions[i].id]
        if (!clip) continue
        setProcessing(`Đang lưu bản thu ${i + 1}/${questions.length}`)
        const form = new FormData()
        form.append('action', 'upload_audio'); form.append('submissionId', id); form.append('itemIndex', String(i)); form.append('audio', clip.blob, 'recording.webm')
        await requestSpeaking(form, controller.signal)
        if (controller.signal.aborted || ownerRef.current !== requestOwner) throw new DOMException('Aborted', 'AbortError')
        updated = { ...updated, items: updated.items.map((item, n) => n === i ? { ...item, audioAvailable: true } : item) }
        setReport(updated)
      }
      for (let i = 0; i < questions.length; i++) {
        if (controller.signal.aborted || ownerRef.current !== requestOwner) throw new DOMException('Aborted', 'AbortError')
        const clip = clips[questions[i].id]
        if (clip) await saveSpeakingAudio(requestOwner, `${id}:${i}`, clip).catch(() => { setStorageStatus('Chưa lưu được âm thanh vào lịch sử thiết bị.') })
        if (updated.items[i]?.result) continue
        setProcessing(`Đang nhận xét câu ${i + 1}/${questions.length}`)
        const form = new FormData(), extension = clip.blob.type.includes('mp4') ? 'm4a' : clip.blob.type.includes('ogg') ? 'ogg' : 'webm'
        form.append('action', 'submit_audio'); form.append('submissionId', id); form.append('itemIndex', String(i)); form.append('audio', clip.blob, `recording.${extension}`)
        const data = await requestSpeaking(form, controller.signal)
        if (ownerRef.current !== requestOwner) throw new DOMException('Aborted', 'AbortError')
        updated = { ...updated, items: updated.items.map((item, n) => n === i ? { ...item, result: data.result, status: 'completed' } : item) }
        setReport(updated)
      }
      updated = (await requestSpeaking({ action: 'report', submissionId: id }, controller.signal)).report
      if (ownerRef.current !== requestOwner) return
      setReport(updated); setDisplayReport(updated); setResultOpen(true); setRestoredNotice(false)
      await clearSpeakingDraft(requestOwner).catch(() => {})
      void loadHistory()
    } catch (failure: any) {
      if (ownerRef.current === requestOwner) setError(failure?.name === 'AbortError' ? 'Đã dừng gửi. Bản thu và các câu đã chấm vẫn được giữ; bạn có thể tiếp tục nộp.' : failure.message || 'Chưa chấm được bài. Bản thu vẫn được giữ để gửi lại.')
    } finally { if (ownerRef.current === requestOwner) { setBusy(false); setProcessing('') } }
  }
  const advance = () => {
    if (!owner) { login(); return }
    if (completed || ready) { void submit(); return }
    if (!currentClip && !report?.items[index]?.result) { setError('Hãy thu câu trả lời trước khi chuyển câu.'); return }
    const next = index + 1 < questions.length ? index + 1 : questions.findIndex((q, i) => !clips[q.id] && !report?.items[i]?.result)
    if (next >= 0) { setIndex(next); setError('') }
  }
  const resume = async (source: SpeakingReport) => {
    if (locked || (source.id !== submissionId && !allowDiscard())) return
    const requestOwner = owner
    const nextClips: Record<string, SpeakingClip> = {}
    for (const item of source.items) {
      let clip = await loadSpeakingAudio(owner, item.id).catch(() => undefined)
      if (!clip && !item.result && item.audioAvailable && item.metrics) {
        try {
          const response = await fetch(`/api/speaking/audio/${encodeURIComponent(item.id)}`)
          if (response.ok) clip = { id: item.id, blob: await response.blob(), metrics: item.metrics, delivery: item.delivery, createdAt: source.createdAt }
        } catch { /* Keep the explicit missing-audio message below. */ }
      }
      if (clip) nextClips[item.question.id] = clip
    }
    if (ownerRef.current !== requestOwner) return
    setExam(source.examType); setTab(source.fullTest ? 'FULL' : source.items[0].question.part); setMode(source.mode)
    setQuestions(source.items.map(item => item.question)); setClips(nextClips); setReport(source); setSubmissionId(source.id); setFeedbackLang(source.feedbackLang)
    setIndex(Math.max(0, source.items.findIndex(item => !item.result))); setHistoryOpen(false); setRestoredNotice(true); touched.current = true
    if (source.items.some(item => !item.result && !nextClips[item.question.id])) setError('Bản thu chưa chấm được lưu trên thiết bị đã thu. Hãy tiếp tục nộp trên thiết bị đó. Thu lại sẽ tạo một lần nộp mới.')
  }
  const retryResult = (resultIndex: number) => {
    const question = displayReport?.items[resultIndex]?.question
    if (!question || locked || !allowDiscard()) return
    touched.current = true; setExam(question.examType); setTab(question.part); setMode('practice'); setQuestions([question]); setIndex(0); setClips({}); setExamStarted(false)
    resetAssessment(); setResultOpen(false)
  }
  const pickPart = tab === 'FULL' ? exam === 'IELTS_SPEAKING' ? 'PART_2' : 'Q11' : tab
  const choices = (catalogs[exam][pickPart] || []).filter(prompt => (tab !== 'FULL' || exam !== 'IELTS_SPEAKING' || (prompt.setId && catalogs[exam].PART_3?.some(p => p.setId === prompt.setId && (p.subQuestions?.length || 0) >= 2))) && (!officialOnly || !!officialSpeakingSource(prompt.id, prompt.questionEn)) && `${prompt.topic} ${prompt.questionEn}`.toLowerCase().includes(keyword.trim().toLowerCase()))

  if (status === 'loading' || loadedOwner.current !== owner) return <p className="p-6 text-center text-sm text-slate-500">Đang chuẩn bị đề Speaking…</p>
  if (!current) return <div className="space-y-4 p-6 text-center"><p className="text-sm text-slate-500">Phần này chưa có bộ đề đã xuất bản đủ câu. Hãy chọn phần khác.</p><div className="flex gap-2 overflow-x-auto">{SPEAKING_PARTS[exam].map(part => <button type="button" key={part} onClick={() => changeSet(exam, part)} className="shrink-0 rounded-lg border px-3 py-2 text-sm">{PART_LABELS[part]}</button>)}</div></div>
  return <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 sm:space-y-5">
    <header className="rounded-none border-y border-slate-200 bg-white p-4 shadow-xs sm:rounded-xl sm:border sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-xl font-bold tracking-tight text-slate-800">Phòng Luyện Speaking</h1><p className="mt-1 text-xs text-slate-500">Chọn đề, nói thử và cải thiện từng câu trả lời.</p></div><div className="flex items-center justify-between gap-2 sm:justify-end"><select aria-label="Kỳ thi Speaking" value={exam} disabled={locked} onChange={event => { const value = event.target.value as SpeakingExam; changeSet(value, value === 'IELTS_SPEAKING' ? 'PART_2' : 'Q11') }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"><option value="IELTS_SPEAKING">IELTS Speaking</option><option value="TOEIC_SPEAKING">TOEIC Speaking</option></select><button type="button" disabled={locked} onClick={() => { if (!owner) { login(); return }; setHistoryOpen(true); void loadHistory() }} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 disabled:opacity-40"><History className="h-3.5 w-3.5 text-blue-600" />Lịch sử</button></div></div>
      <nav aria-label="Phần luyện Speaking" className="mt-5 flex min-w-0 items-center gap-2 overflow-x-auto pb-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">{(['FULL', ...SPEAKING_PARTS[exam]] as SpeakingTab[]).map(part => <button key={part} type="button" aria-current={tab === part ? 'page' : undefined} disabled={locked} onClick={() => changeSet(exam, part)} className={`min-h-10 shrink-0 snap-start whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${tab === part ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{part === 'FULL' ? 'Trọn bộ' : PART_LABELS[part]}</button>)}</nav>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400"><button type="button" disabled={locked} onClick={() => setSourcesOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 disabled:opacity-40"><BookOpen size={14} />Đề mẫu chính thức</button><span className="min-w-0">PDF gốc từ ETS / IELTS</span></div>
    </header>
    {restoredNotice && <div className="mx-4 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700 sm:mx-0"><span>Đã khôi phục bài đang làm và các bản thu trên thiết bị này.</span><button type="button" onClick={() => setRestoredNotice(false)} aria-label="Ẩn thông báo khôi phục" className="shrink-0 px-2 py-1">×</button></div>}
    {tab === 'FULL' && <div className="mx-4 flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:mx-0"><p className="text-xs leading-relaxed text-slate-500"><strong className="font-semibold text-slate-700">{strict ? 'Thi thử' : 'Luyện trọn bộ'}</strong> · {questions.length} câu · {strict ? 'Đúng thời gian từng câu, nhận xét cuối bài.' : 'Thu từng câu, nghe lại và nộp cả bài.'}</p><button type="button" disabled={locked} onClick={() => changeSet(exam, 'FULL', undefined, strict ? 'practice' : 'exam')} className="shrink-0 whitespace-nowrap rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-500 disabled:opacity-40">{strict ? 'Luyện tập' : 'Thi thử'}</button></div>}
    {error && <div role="alert" className="mx-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-relaxed text-red-600 sm:mx-0"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p>{error}</p>{report?.items.some(item => item.result) && <button type="button" onClick={() => { setDisplayReport(report); setResultOpen(true) }} className="mt-2 font-semibold underline">Xem các câu đã nhận xét</button>}</div></div>}
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 sm:gap-5">
      <section aria-label="Đề bài Speaking" className="min-w-0 rounded-none border-y border-slate-200 bg-white shadow-xs sm:rounded-xl sm:border"><div className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đề bài</p><p className="mt-1 text-xs font-semibold text-blue-600">{PART_LABELS[current.part]}{questions.length > 1 ? ` · Câu ${index + 1}/${questions.length}` : ''}</p></div><div className="flex shrink-0 items-center gap-1.5"><button type="button" disabled={locked || strict} onClick={() => { setKeyword(''); setOfficialOnly(false); setPickerOpen(true) }} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40">Chọn đề</button><button type="button" aria-label="Đổi đề Speaking" disabled={locked || strict} onClick={() => changeSet()} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-blue-600 disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" />Đổi đề</button></div></div>
        <div className="p-4 sm:p-5"><p className="mb-3 text-xs text-slate-400">{current.topic}</p><h2 className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">{current.questionEn}</h2>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">{officialSpeakingSource(current.id,current.questionEn)?'Câu mẫu chính thức · ':'Đề luyện · cấu trúc tham chiếu '}<a className="text-blue-600 underline underline-offset-2" href={(officialSpeakingSource(current.id,current.questionEn)||SPEAKING_FORMAT_SOURCES[exam]).url} target="_blank" rel="noopener noreferrer">{officialSpeakingSource(current.id,current.questionEn)?.title||SPEAKING_FORMAT_SOURCES[exam].title}</a>{officialSpeakingSource(current.id,current.questionEn)&&` · trang PDF ${officialSpeakingSource(current.id,current.questionEn)!.page}`}</p>
          {current.cueCard && <div className="mt-4 whitespace-pre-wrap rounded-r-lg border-l-[3px] border-blue-200 bg-blue-50/40 p-4 text-sm leading-relaxed text-slate-600">{current.cueCard}</div>}
          {current.informationText && <div className="mt-4 whitespace-pre-wrap rounded-lg border border-blue-100 bg-blue-50/30 p-4 text-xs leading-7 text-slate-600">{current.informationText}</div>}
          {current.imageUrl && <img src={current.imageUrl} alt="Ảnh đề TOEIC Speaking" className="mt-4 max-h-80 w-full rounded-lg border border-slate-100 object-contain" loading="lazy" />}
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400"><span>Chuẩn bị <strong className="font-semibold text-slate-600">{formatSpeakingTime(current.prepTimeSec * 1000)}{current.readingTimeSec ? ` + ${current.readingTimeSec}s đọc thông tin` : ''}</strong></span><span>Nói {strict ? 'tối đa' : 'khuyến nghị'} <strong className="font-semibold text-slate-600">{formatSpeakingTime(current.speakTimeSec * 1000)}</strong></span></div>
          {!strict && <><div className="mt-4 flex items-center gap-2">{!!current.questionVi && <button type="button" onClick={() => setShowTranslation(value => !value)} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">Dịch đề</button>}{!!current.suggestedVocabulary?.length && <button type="button" onClick={() => setShowVocabulary(value => !value)} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">Gợi ý từ vựng</button>}<button type="button" aria-label="Đọc câu hỏi" onClick={() => { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(current.questionEn); utterance.lang = 'en-US'; speechSynthesis.speak(utterance) } }} className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-50"><Volume2 className="h-4 w-4" /></button></div>{showTranslation && <p className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">{current.questionVi}</p>}{showVocabulary && <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3 text-xs leading-relaxed text-slate-500">{current.suggestedVocabulary?.join(' · ')}</p>}<details key={current.id} className="mt-4"><summary className="cursor-pointer text-xs text-slate-400">Ghi chú / dàn ý của bạn</summary><textarea aria-label="Ghi chú bài nói" placeholder="Ghi nhanh các ý chính..." maxLength={2500} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-600 outline-none focus:border-blue-400" /></details></>}
          {questions.length > 1 && <label className="mt-5 block border-t border-slate-100 pt-4 text-[11px] text-slate-400">Các câu trong bài<select aria-label="Chọn câu trong bài Speaking" value={index} disabled={locked || strict} onChange={event => { setIndex(Number(event.target.value)); setError('') }} className="mt-1.5 block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600 disabled:opacity-60">{questions.map((question, i) => <option key={question.id} value={i}>Câu {i + 1} · {PART_LABELS[question.part]}{clips[question.id] || report?.items[i]?.result ? ' · Đã thu' : ''}</option>)}</select></label>}
        </div>
      </section>
      <SpeakingRecorder key={`${owner}:${current.id}:${strict}`} question={current} clip={currentClip} strict={strict} autoStart={strict && examStarted} canRecord={!!owner && status === 'authenticated'} busy={busy} processing={processing}
        onLogin={login} onComplete={recorded} onClear={clearCurrent} onActiveChange={value => { if (value) touched.current = true; setActive(value) }} onStartExam={() => { touched.current = true; setExamStarted(true) }} onAutoError={() => setExamStarted(false)}
        footer={<><GraderActions value={feedbackLang} onChange={value => { setFeedbackLang(value); resetAssessment() }} languages={['Tiếng Việt', 'English']} isEn={false} disabled={locked || !!submissionId}><div className="flex flex-col gap-2">{index > 0 && !strict && <button type="button" disabled={locked} onClick={() => setIndex(index - 1)} className="flex items-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-500 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" />Câu trước</button>}<button type="button" onClick={advance} disabled={locked || (!!owner && !currentClip && !report?.items[index]?.result)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : completed ? <BookOpen className="h-4 w-4" /> : ready || questions.length === 1 ? <Send className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{completed ? 'Xem kết quả' : !owner ? 'Đăng nhập để luyện' : ready || questions.length === 1 ? questions.length > 1 ? 'Nộp bài & Nhận xét trọn bộ' : 'Nộp bài & Nhận xét' : 'Lưu & Câu tiếp theo'}</button></div></GraderActions><p className="mt-2 text-right text-[10px] text-slate-400">Lượt chấm hôm nay: {usage.count}/{usage.limit} · Tính khi nộp bài</p>{!!storageStatus && Object.keys(clips).length > 0 && <p className="mt-1 text-[10px] text-slate-400">{storageStatus}</p>}{busy && <button type="button" onClick={() => pipeline.current?.abort()} className="mt-2 text-[11px] text-slate-400 underline">Dừng gửi và giữ bản thu</button>}</>} />
    </div>
    <p className="px-4 text-[11px] leading-relaxed text-slate-400 sm:px-0">Mẹo nhỏ: Nói tự nhiên, dành thời gian nghĩ và bấm dừng khi bạn nói xong. Nếu chưa hiện chữ trực tiếp, bấm Chuyển bản thu thành chữ sau khi dừng. Bản thu được gửi khi bạn bấm nhận dạng hoặc nộp bài.</p>
    <SpeakingDialog open={pickerOpen} title="Chọn đề Speaking" onClose={() => setPickerOpen(false)}><div className="p-4"><input autoFocus aria-label="Tìm chủ đề Speaking" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tìm theo chủ đề hoặc nội dung đề..." className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /><label className="mb-4 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={officialOnly} onChange={event => setOfficialOnly(event.target.checked)} />Chỉ câu mẫu chính thức</label><div className="max-h-[55dvh] space-y-2 overflow-y-auto">{choices.map(prompt => <button key={prompt.id} type="button" onClick={() => { setPickerOpen(false); changeSet(exam, tab, prompt.id) }} className="block w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"><p className="text-xs font-semibold text-slate-700">{prompt.topic}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{prompt.questionEn}</p></button>)}{!choices.length && <p className="py-6 text-center text-xs text-slate-400">Không tìm thấy chủ đề phù hợp.</p>}</div></div></SpeakingDialog>
    <SpeakingDialog open={sourcesOpen} title="Đề mẫu Speaking chính thức" onClose={() => setSourcesOpen(false)} sheet><div className="max-h-[calc(100dvh_-_5rem)] overflow-y-auto p-4"><OfficialSpeakingLibrary exam={exam} availablePromptIds={Object.values(catalogs[exam]).flat().filter(prompt => !!officialSpeakingSource(prompt.id, prompt.questionEn)).map(prompt => prompt.id)} onPractice={id => { const prompt = Object.values(catalogs[exam]).flat().find(row => row.id === id); if (prompt) { changeSet(exam, prompt.part as SpeakingTab, id); setSourcesOpen(false) } }} /></div></SpeakingDialog>
    <SpeakingDialog open={historyOpen} title="Lịch sử Speaking" onClose={() => setHistoryOpen(false)}><div className="max-h-[70dvh] space-y-3 overflow-y-auto p-4">{historyLoading ? <p className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử…</p> : history.length ? history.map(item => <div key={item.id} className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-700">{item.examType === 'IELTS_SPEAKING' ? 'IELTS Speaking' : 'TOEIC Speaking'} · {item.fullTest ? 'Trọn bộ' : PART_LABELS[item.items[0]?.question.part]}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')} · {item.items.filter(i => i.result).length}/{item.items.length} câu đã nhận xét</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => { setHistoryOpen(false); setDisplayReport(item); setResultOpen(true) }} className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">Xem kết quả</button>{item.status !== 'completed' && !item.id.startsWith('legacy:') && <button type="button" onClick={() => void resume(item)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Tiếp tục nộp</button>}</div></div>) : <p className="py-8 text-center text-xs text-slate-400">Chưa có bài Speaking đã nộp.</p>}</div></SpeakingDialog>
    <SpeakingResults owner={owner} report={displayReport} open={resultOpen} onClose={() => setResultOpen(false)} onRetry={retryResult} onNext={() => { setResultOpen(false); changeSet() }} />
  </div>
}

