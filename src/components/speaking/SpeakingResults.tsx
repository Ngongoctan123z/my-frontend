'use client'

import {deliveryText} from '@/src/lib/speechDelivery'
import { useEffect, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { PART_LABELS, type SpeakingReport, type SpeakingClip } from '@/src/lib/speaking'
import { loadSpeakingAudio } from '@/src/utils/speakingStorage'
import { useSpeakingAudioUrl } from '@/src/hooks/useSpeakingRecorder'
import { SpeakingDialog } from './SpeakingDialog'
import { SpeakingChatCoach } from './SpeakingChatCoach'

export function SpeakingResults({ report, owner, open, onClose, onRetry, onNext }: {
  report: SpeakingReport | null; owner: string; open: boolean; onClose: () => void
  onRetry: (index: number) => void; onNext: () => void
}) {
  const [index, setIndex] = useState(0), [clip, setClip] = useState<SpeakingClip>(), [coachOpen, setCoachOpen] = useState(false)
  useEffect(() => { setIndex(Math.max(0, report?.items.findIndex(item => !!item.result) ?? 0)); setCoachOpen(false) }, [report?.id])
  const item = report?.items[index], result = item?.result
  useEffect(() => {
    let current = true; setClip(undefined); setCoachOpen(false)
    if (item && owner && open) loadSpeakingAudio(owner, item.id).then(value => { if (current) setClip(value) }).catch(() => {})
    return () => { current = false }
  }, [item?.id, owner, open])
  const localAudioUrl = useSpeakingAudioUrl(clip?.blob)
  const audioUrl = localAudioUrl || (item?.audioAvailable ? `/api/speaking/audio/${encodeURIComponent(item.id)}` : undefined)
  const completed = report?.items.filter(item => !!item.result) || []
  const fullyScored = report && completed.length === report.items.length && completed.every(item => item.result?.score)
  const overall = fullyScored && report.examType === 'IELTS_SPEAKING' ? Math.round(completed.reduce((n, item) => n + item.result!.score!.value, 0) / completed.length * 2) / 2 : null
  const rawTotal = fullyScored && report?.examType === 'TOEIC_SPEAKING' ? completed.reduce((n, item) => n + item.result!.score!.value, 0) : null
  const rawMax = completed.reduce((n, item) => n + (item.result?.score?.max || 0), 0)
  return <SpeakingDialog title="Nhận xét bài nói" open={open && !!report} onClose={onClose} sheet>
    <div className="flex h-[calc(100dvh_-_65px)] flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {report && <>
          <p className="mb-4 text-[11px] text-slate-400">{report.examType === 'IELTS_SPEAKING' ? 'IELTS Speaking' : 'TOEIC Speaking'} · {new Date(report.createdAt).toLocaleString('vi-VN')} · Ước tính luyện tập</p>
          {report.items.length > 1 && <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/60 p-3"><p className="text-xs font-semibold text-slate-700">{completed.length}/{report.items.length} câu đã nhận xét{report.fullTest && report.status === 'completed' ? ' · Đã hoàn thành trọn bộ' : ''}</p>{overall !== null && report.fullTest && <p className="mt-1 text-xs text-blue-600">Band ước tính toàn phiên: <strong>{overall.toFixed(1)}</strong></p>}{rawTotal !== null && report.fullTest && <p className="mt-1 text-xs text-slate-500">Tổng điểm thô các câu: {rawTotal}/{rawMax}. ETS quy đổi sang thang 200; không có mức điểm cố định từng phần trên thang 200.</p>}<label className="mt-3 block text-[11px] text-slate-400">Xem từng câu<select value={index} onChange={event => setIndex(Number(event.target.value))} className="mt-1 block w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600">{report.items.map((item, i) => <option key={item.id} value={i}>Câu {item.question.questionNumber} · {PART_LABELS[item.question.part]}{item.result ? ' · Đã nhận xét' : ' · Chưa nhận xét'}</option>)}</select></label></div>}
          {item && <p className="mb-5 text-sm font-semibold leading-relaxed text-slate-700">{item.question.questionEn}</p>}
          {result ? <>
            <div className="mb-5 flex items-center gap-4">{result.score ? <><p className="text-5xl font-bold tracking-tight text-blue-600">{result.score.value.toFixed(report.examType === 'IELTS_SPEAKING' ? 1 : 0)}</p><div><p className="text-sm font-semibold">{report.examType === 'IELTS_SPEAKING' ? 'Band tham khảo · câu luyện' : `Điểm câu luyện / ${result.score.max}`}</p><p className="mt-1 text-[11px] text-slate-400">Không phải điểm thi chính thức</p></div></> : <div><p className="text-base font-bold text-slate-700">Đã phân tích nội dung bài nói</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{result.pronunciationNote}</p></div>}</div>
            {!!result.criteria.length && <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{result.criteria.map(c => <div key={c.id} className="rounded-lg border border-slate-200 p-2.5 text-center" title={c.explanation}><p className="text-lg font-bold text-slate-600">{c.score === null ? '—' : `${c.score}/${c.max}`}</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{c.label}</p></div>)}</div>}
            <p className="text-xs leading-relaxed text-slate-600">{result.feedback}</p>{result.strengths && <p className="mt-3 rounded-lg bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-800">{result.strengths}</p>}
            {!!result.issues.length && <div className="mt-6"><h3 className="text-xs font-bold text-slate-700">Điểm yếu & cách sửa</h3><div className="mt-2 divide-y divide-slate-100">{result.issues.map((issue, i) => <div key={i} className="py-3"><p className="text-xs font-semibold">{String(i + 1).padStart(2, '0')} · {issue.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{issue.explanation}</p>{issue.original && <p className="mt-2 text-xs text-slate-400">Bạn đã nói: <span className="text-amber-700">“{issue.original}”</span></p>}{issue.suggestion && <p className="mt-1 text-xs text-blue-700">Gợi ý: “{issue.suggestion}”</p>}</div>)}</div></div>}
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-2 py-3 text-center"><div><p className="text-sm font-semibold text-slate-600">{result.fluency.wordsPerMinute}</p><p className="text-[10px] text-slate-400">Từ/phút</p></div><div><p className="text-sm font-semibold text-slate-600">{result.fluency.longPauseCount}</p><p className="text-[10px] text-slate-400">Khoảng nghỉ dài</p></div><div><p className="text-sm font-semibold text-slate-600">{result.fluency.fillerCount}</p><p className="text-[10px] text-slate-400">Từ đệm</p></div></div>
            {audioUrl ? <audio aria-label="Nghe lại bài đã chấm" controls src={audioUrl} className="mt-5 h-10 w-full min-w-0" /> : <p className="mt-4 text-[11px] text-slate-400">Bài cũ chưa đồng bộ âm thanh. Bạn vẫn có thể xem transcript và nhận xét.</p>}
            <section aria-label="Bản chữ máy dùng để chấm" className="mt-5 rounded-xl border border-blue-100 bg-blue-50/30 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-slate-700">Máy đã nghe được</h3><span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500">Chỉ đọc · dùng để chấm</span></div><p data-scored-transcript className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{result.transcript}</p><p className="mt-3 text-[10px] leading-5 text-slate-400">Bản chữ nhận dạng từ ghi âm được giữ nguyên, không thể chỉnh sửa. Hãy nghe lại để đối chiếu vì máy có thể nhận nhầm từ.</p>{item.delivery?.recognitionAvailable&&<details className="mt-3 border-t border-blue-100 pt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-500">Đối chiếu chữ trực tiếp & khoảng ngừng</summary><p data-live-transcript className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-7 text-slate-500">{deliveryText(item.delivery)}</p><p className="mt-2 text-[10px] leading-5 text-slate-400">Đây là bản tạm từ trình duyệt, có thể khác bản nhận dạng từ ghi âm. Dấu chấm ghi khoảng ngừng, không phải từ đã nói.</p></details>}</section>
            <details className="mt-3 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Vì sao có điểm này?</summary>{result.criteria.map(c=><p key={c.id} className="mt-3 text-xs leading-relaxed text-slate-500"><strong>{c.label}:</strong> {c.explanation}</p>)}</details>
            {result.modelAnswer && <details className="mt-3 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Tham khảo cách diễn đạt tốt hơn</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{result.modelAnswer}</p></details>}
            {!report.id.startsWith('legacy:') && <details key={item.id} onToggle={event => setCoachOpen(event.currentTarget.open)} className="mt-3 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Hỏi thêm AI về bài này</summary>{coachOpen && <SpeakingChatCoach recordingId={item.id} />}</details>}
          </> : <p className="rounded-lg bg-amber-50 p-4 text-xs leading-relaxed text-amber-700">Câu này chưa có kết quả. Bạn có thể tiếp tục nộp các câu còn lại từ bài đang làm.</p>}
        </>}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-200 bg-white p-4"><button type="button" onClick={() => onRetry(index)} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white"><RotateCcw className="h-3.5 w-3.5 shrink-0" />Luyện lại câu này</button><button type="button" onClick={onNext} className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600">Đề tiếp theo<ArrowRight className="h-3.5 w-3.5 shrink-0" /></button></div>
    </div>
  </SpeakingDialog>
}
