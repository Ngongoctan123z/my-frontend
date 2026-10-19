'use client'

import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { officialSpeakingDocuments, officialSpeakingDocumentUrl } from '@/src/data/speakingOfficialDocuments'
import type { SpeakingExam } from '@/src/lib/speaking'

export function OfficialSpeakingLibrary({ exam, availablePromptIds = [], onPractice }: {
  exam?: SpeakingExam; availablePromptIds?: string[]; onPractice?: (id: string) => void
}) {
  const [preview, setPreview] = useState<{ id: string; page: number } | null>(null)
  const documents = officialSpeakingDocuments.filter(document => !exam || document.examType === exam)
  return <div className="min-w-0 space-y-4" data-official-speaking-library>
    <p className="text-xs leading-relaxed text-slate-500">Đề mẫu công khai do đơn vị ra đề phát hành. Xem nguyên bản, gồm cả ảnh và bảng thông tin; không phải kho đề được xác nhận đã dùng trong các kỳ thi. Nút luyện trên web chỉ xuất hiện ở câu đã tích hợp.</p>
    {documents.map(document => <article key={document.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3"><FileText size={20} className="mt-1 shrink-0 text-blue-600" /><div className="min-w-0"><h3 className="text-sm font-bold text-slate-800">{document.title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{document.publisher} · PDF {document.pageCount} trang · Kiểm tra nguồn {document.verifiedOn}</p></div></div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs font-semibold"><a href={document.url} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-white"><ExternalLink size={13} />Mở PDF gốc</a><a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-slate-600">Trang công bố</a></div>
      <div className="mt-3 divide-y divide-slate-100">{document.sections.map(section => <div key={section.title} className="py-3">
        <p className="text-xs font-semibold text-slate-700">{section.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 text-[11px] font-semibold"><button type="button" onClick={() => setPreview({ id: document.id, page: section.page })} className="shrink-0 rounded-md bg-slate-100 px-2.5 py-2 text-slate-600">Xem trang {section.page}</button><a href={officialSpeakingDocumentUrl(document, section.page)} target="_blank" rel="noopener noreferrer" className="shrink-0 px-2 py-2 text-blue-600 underline underline-offset-2">Mở riêng</a>{section.promptId && onPractice && availablePromptIds.includes(section.promptId) && <button type="button" onClick={() => onPractice(section.promptId!)} className="shrink-0 rounded-md bg-blue-50 px-2.5 py-2 text-blue-700">Luyện trên web</button>}</div>
      </div>)}</div>
      {preview?.id === document.id && <div className="mt-3 min-w-0 border-t border-slate-100 pt-3"><div className="mb-2 flex items-center justify-between gap-2 text-xs"><span className="text-slate-500">Bản gốc · trang PDF {preview.page}</span><button type="button" onClick={() => setPreview(null)} className="rounded-md bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-600">Đóng bản xem</button></div><p className="mb-2 text-[11px] leading-5 text-slate-400">Nếu trình duyệt không hiển thị PDF, chọn “Mở riêng” để xem bản gốc.</p><iframe key={`${document.id}:${preview.page}`} title={`${document.title} · trang ${preview.page}`} src={officialSpeakingDocumentUrl(document, preview.page)} loading="lazy" referrerPolicy="no-referrer" className="h-[55dvh] min-h-80 w-full rounded-lg border border-slate-200" /></div>}
    </article>)}
  </div>
}
