'use client'
import {SPEAKING_FORMAT_SOURCES,officialSpeakingSource} from '@/src/data/speakingOfficialSamples'

import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Edit2, Loader2, RefreshCw } from 'lucide-react'
import { PART_LABELS, SPEAKING_PARTS, canonicalPart, type SpeakingExam, type PracticePart } from '@/src/lib/speaking'
import { OfficialSpeakingLibrary } from '@/src/components/speaking/OfficialSpeakingLibrary'
import { SpeakingDialog } from '@/src/components/speaking/SpeakingDialog'

type Row = {
  id: string; examType: SpeakingExam; part: PracticePart; topic: string; questionEn: string; questionVi: string
  cueCard: string; subQuestions: string[]; suggestedVocabulary: string[]; imageUrl: string
  difficulty: string; setId: string; isPublished: boolean
}
const empty = (): Row => ({ id: '', examType: 'IELTS_SPEAKING', part: 'PART_1', topic: '', questionEn: '', questionVi: '', cueCard: '', subQuestions: [], suggestedVocabulary: [], imageUrl: '', difficulty: 'medium', setId: '', isPublished: true })
const normalize = (row: any): Row => {
  const list = (value: any): string[] => { try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [] } catch { return [] } }
  return { ...empty(), ...row, part: canonicalPart(row.part), subQuestions: list(row.subQuestions), suggestedVocabulary: list(row.suggestedVocabulary), isPublished: !!row.isPublished }
}
async function adminRequest(action?: string, payload?: unknown) {
  const response = await fetch(action ? '/api/admin' : '/api/admin?type=speaking_prompts', action ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) } : undefined)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Không lưu được kho đề Speaking. Vui lòng thử lại.')
  return data
}
const inputClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400'
export function SpeakingAdminTab() {
  const [rows, setRows] = useState<Row[]>([]), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [exam, setExam] = useState('ALL'), [part, setPart] = useState('ALL'), [query, setQuery] = useState('')
  const [tab, setTab] = useState('bank'), [form, setForm] = useState<Row | null>(null)
  async function load() {
    setLoading(true); setError('')
    try { const result = await adminRequest(); if (!Array.isArray(result)) throw new Error('Phản hồi kho đề không hợp lệ.'); setRows(result.map(normalize)) }
    catch (failure: any) { setError(failure.message) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form || saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const saved = normalize(await adminRequest(form.id ? 'update_speaking_prompt' : 'add_speaking_prompt', form))
      setRows(previous => [saved, ...previous.filter(row => row.id !== saved.id)])
      setForm(null); setNotice('Đã lưu đề Speaking vào Cloudflare D1.')
    } catch (failure: any) { setError(failure.message) } finally { setSaving(false) }
  }
  async function mutate(row: Row, remove: boolean) {
    if (saving || (remove && !window.confirm('Xoá đề này khỏi kho đề Speaking?'))) return
    setSaving(true); setError(''); setNotice('')
    try {
      const result = await adminRequest(remove ? 'delete_speaking_prompt' : 'toggle_speaking_prompt_publish', { id: row.id, isPublished: !row.isPublished })
      setRows(previous => remove ? previous.filter(p => p.id !== row.id) : previous.map(p => p.id === row.id ? normalize(result) : p))
      setNotice(remove ? 'Đã xoá đề.' : result.isPublished ? 'Đã xuất bản đề.' : 'Đã ẩn đề khỏi trang luyện tập.')
    } catch (failure: any) { setError(failure.message) } finally { setSaving(false) }
  }
  const filtered = rows.filter(row => (exam === 'ALL' || row.examType === exam) && (part === 'ALL' || row.part === part) && `${row.topic} ${row.questionEn} ${row.setId}`.toLowerCase().includes(query.toLowerCase()))
  const sets = [...new Set(rows.filter(row => row.setId).map(row => row.setId))]
  const update = (value: Partial<Row>) => setForm(previous => previous ? { ...previous, ...value } : previous)
  return <div className="min-w-0 space-y-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-800">Kho đề Speaking</h2><p className="mt-1 text-xs text-slate-500">{rows.length} đề · {rows.filter(row => row.isPublished).length} đã xuất bản</p></div><button type="button" disabled={loading || saving} onClick={() => { setError(''); setForm(empty()) }} className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Plus size={16} />Thêm đề</button></div>
    <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{[['bank','Ngân hàng đề'],['sets','Bộ đề liên kết'],['official','Đề mẫu chính thức'],['rubric','Cấu trúc & thời gian']].map(([id,label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`shrink-0 snap-start rounded-lg px-3 py-2 text-sm font-semibold ${tab === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>{label}</button>)}</div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    {tab === 'bank' && <>
      <div className="flex gap-2 overflow-x-auto pb-1"><select aria-label="Lọc kỳ thi" value={exam} onChange={e => { setExam(e.target.value); setPart('ALL') }} className="shrink-0 rounded-lg border p-2 text-sm"><option value="ALL">Tất cả kỳ thi</option><option value="IELTS_SPEAKING">IELTS Speaking</option><option value="TOEIC_SPEAKING">TOEIC Speaking</option></select><select aria-label="Lọc phần thi" value={part} onChange={e => setPart(e.target.value)} className="shrink-0 rounded-lg border p-2 text-sm"><option value="ALL">Tất cả phần thi</option>{(exam === 'ALL' ? [...SPEAKING_PARTS.IELTS_SPEAKING, ...SPEAKING_PARTS.TOEIC_SPEAKING] : SPEAKING_PARTS[exam as SpeakingExam]).map(p => <option key={p} value={p}>{PART_LABELS[p]}</option>)}</select><input aria-label="Tìm đề Speaking" placeholder="Tìm chủ đề, bộ đề…" value={query} onChange={e => setQuery(e.target.value)} className="min-w-40 rounded-lg border px-3 text-sm" /><button type="button" aria-label="Tải lại kho đề" onClick={() => void load()} disabled={loading || saving} className="shrink-0 rounded-lg border px-3"><RefreshCw size={16} /></button></div>
      {loading ? <p className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />Đang tải kho đề D1…</p> : <div className="space-y-3">{filtered.map(row => <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-blue-600">{row.examType === 'IELTS_SPEAKING' ? 'IELTS' : 'TOEIC'} · {PART_LABELS[row.part]}{row.setId ? ` · Bộ ${row.setId}` : ''}</p><h3 className="mt-1 break-words text-sm font-semibold">{row.topic}</h3></div><button type="button" disabled={saving} onClick={() => void mutate(row, false)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${row.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.isPublished ? 'Đã xuất bản' : 'Đang ẩn'}</button></div><p className="mt-2 text-[11px] text-slate-400">{officialSpeakingSource(row.id,row.questionEn)?'Câu mẫu chính thức · ':'Đề luyện · '}<a href={(officialSpeakingSource(row.id,row.questionEn)||SPEAKING_FORMAT_SOURCES[row.examType]).url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Nguồn cấu trúc / đề mẫu</a></p><p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm text-slate-600">{row.questionEn}</p><div className="mt-3 flex items-center gap-3"><span className="mr-auto text-xs text-slate-400">{1 + row.subQuestions.length} câu trong nhóm</span><button type="button" disabled={saving} onClick={() => { setError(''); setForm({ ...row }) }} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"><Edit2 size={13} />Sửa</button><button type="button" aria-label={`Xoá ${row.topic}`} disabled={saving} onClick={() => void mutate(row, true)} className="rounded-lg border p-2 text-red-500"><Trash2 size={14} /></button></div></article>)}{!filtered.length && <p className="p-6 text-center text-sm text-slate-400">Chưa có đề phù hợp.</p>}</div>}
    </>}
    {tab === 'official' && <OfficialSpeakingLibrary />}
    {tab === 'sets' && <div className="space-y-3"><p className="text-sm text-slate-500">IELTS Part 2 và Part 3 dùng cùng mã bộ đề. Nhóm Part 1 cần 4 câu, Part 3 cần ít nhất 3 câu; nhóm TOEIC câu 5–7 và 8–10 cần 3 câu để thi trọn bộ.</p>{sets.map(id => <div key={id} className="rounded-xl border p-4"><h3 className="text-sm font-semibold">{id}</h3>{rows.filter(row => row.setId === id).map(row => <p key={row.id} className="mt-2 text-xs text-slate-500">{PART_LABELS[row.part]} · {row.topic} · {row.isPublished ? 'Đã xuất bản' : 'Đang ẩn'}</p>)}{!rows.some(row => row.setId === id && row.part === 'PART_2' && row.isPublished) || !rows.some(row => row.setId === id && row.part === 'PART_3' && row.isPublished && row.subQuestions.length >= 2) ? <p className="mt-2 text-xs text-amber-600">Chưa đủ cặp Part 2/3 đã xuất bản để ghép thi IELTS trọn bộ.</p> : null}</div>)}</div>}
    {tab === 'rubric' && <div className="space-y-3 rounded-xl border p-4 text-sm leading-relaxed text-slate-600"><p>IELTS: Part 1 hỏi đáp; Part 2 chuẩn bị 60 giây, nói tối đa 120 giây; Part 3 thảo luận liên kết chủ đề Part 2.</p><p>TOEIC: câu 1–2 đọc thành tiếng (45 giây chuẩn bị / 45 giây nói); câu 3–4 mô tả ảnh (45/30); câu 5–7 trả lời (15/15/30 giây); câu 8–10 dùng thông tin cho sẵn (45 giây đọc, trả lời 15/15/30 giây); câu 11 nêu ý kiến (45/60).</p><p>Nhận xét phát âm và điểm nói chỉ có khi dịch vụ phân tích âm thanh hoạt động. Phân tích từ transcript được ghi rõ là nhận xét nội dung.</p></div>}
    <SpeakingDialog open={!!form} onClose={() => { if (!saving) setForm(null) }} title={form?.id ? 'Sửa đề Speaking' : 'Thêm đề Speaking'}>
      {form && <form onSubmit={save} className="max-h-[75dvh] space-y-4 overflow-y-auto p-5">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Kỳ thi<select value={form.examType} onChange={e => { const value=e.target.value as SpeakingExam; update({ examType:value, part:SPEAKING_PARTS[value][0] }) }} className={inputClass}><option value="IELTS_SPEAKING">IELTS Speaking</option><option value="TOEIC_SPEAKING">TOEIC Speaking</option></select></label><label className="text-xs font-semibold">Phần thi<select value={form.part} onChange={e => update({ part:e.target.value as PracticePart })} className={inputClass}>{SPEAKING_PARTS[form.examType].map(p => <option key={p} value={p}>{PART_LABELS[p]}</option>)}</select></label></div>
        <label className="block text-xs font-semibold">Chủ đề<input required maxLength={200} value={form.topic} onChange={e => update({topic:e.target.value})} className={inputClass} /></label>
        <label className="block text-xs font-semibold">Câu hỏi / nội dung tiếng Anh<textarea required rows={5} maxLength={12000} value={form.questionEn} onChange={e => update({questionEn:e.target.value})} className={inputClass} /></label>
        {form.part === 'Q8_10' && <p className="text-xs leading-relaxed text-slate-500">Nhập lịch trình / bảng thông tin ở đầu nội dung, sau đó ghi “Question 8: …”. Câu 9 và 10 nhập ở ô câu hỏi tiếp theo.</p>}
        <label className="block text-xs font-semibold">Câu hỏi tiếp theo (mỗi dòng một câu)<textarea rows={3} value={form.subQuestions.join('\n')} onChange={e => update({subQuestions:e.target.value.split('\n')})} className={inputClass} /></label>
        <label className="block text-xs font-semibold">Bản dịch tiếng Việt<textarea rows={3} value={form.questionVi || ''} onChange={e => update({questionVi:e.target.value})} className={inputClass} /></label>
        {form.part === 'PART_2' && <label className="block text-xs font-semibold">Cue card<textarea rows={4} value={form.cueCard || ''} onChange={e => update({cueCard:e.target.value})} className={inputClass} /></label>}
        <label className="block text-xs font-semibold">Ảnh minh hoạ (HTTPS hoặc /đường-dẫn)<input value={form.imageUrl || ''} onChange={e => update({imageUrl:e.target.value})} className={inputClass} /></label>
        <label className="block text-xs font-semibold">Từ vựng gợi ý (mỗi dòng một mục)<textarea rows={3} value={form.suggestedVocabulary.join('\n')} onChange={e => update({suggestedVocabulary:e.target.value.split('\n')})} className={inputClass} /></label>
        <label className="block text-xs font-semibold">Mã bộ đề liên kết<input maxLength={150} value={form.setId || ''} onChange={e => update({setId:e.target.value})} className={inputClass} /></label>
        <label className="block text-xs font-semibold">Độ khó<select value={form.difficulty} onChange={e => update({difficulty:e.target.value})} className={inputClass}><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={e => update({isPublished:e.target.checked})} />Xuất bản trên trang luyện tập</label>
        <p className="text-xs text-slate-400">Thời gian được áp dụng tự động theo phần thi.</p>
        <button type="submit" disabled={saving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Đang lưu…' : 'Lưu đề Speaking'}</button>
      </form>}
    </SpeakingDialog>
  </div>
}
