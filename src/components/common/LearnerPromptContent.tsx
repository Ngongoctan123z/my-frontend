'use client'
import { learnerPromptContent } from '@/src/lib/publicWritingPrompt'

export function LearnerPromptContent({ content, isEn = false }: { content: string; isEn?: boolean }) {
  const safe = learnerPromptContent(content)
  let structured: any; try { structured = JSON.parse(safe) } catch {}
  const picture = (url: string, label: string) => url ? <img src={url} alt={label} className="max-h-[60dvh] w-full rounded-lg border border-slate-200 object-contain" /> : null
  if (structured?.questions) return <div className="space-y-5"><p className="font-semibold">{structured.title}</p>{structured.questions.map((q: any) => <section key={q.id} className="space-y-3"><h3 className="font-semibold">{isEn ? 'Question' : 'Câu'} {q.id}</h3>{picture(q.imageUrl, `${isEn ? 'Picture for question' : 'Ảnh câu'} ${q.id}`)}<p className="font-semibold text-blue-700">{q.keywords.join(' / ')}</p></section>)}</div>
  if (structured?.part1) return <div className="space-y-5"><h3 className="font-semibold">{structured.title}</h3><section className="space-y-2">{structured.part1.map((q: any) => <p key={q.id}>{q.id}. {q.words}</p>)}</section><section className="space-y-2"><h3 className="font-semibold">{isEn ? 'Question' : 'Câu'} {structured.part2.id}</h3><p>{structured.part2.requirement}</p><p className="font-semibold text-blue-700">{structured.part2.keywords?.join(' · ')}</p></section><section className="space-y-2"><h3 className="font-semibold">{isEn ? 'Question' : 'Câu'} {structured.part3.id}</h3><p>{structured.part3.requirement}</p>{picture(structured.part3.imageUrl, isEn ? 'Question image' : 'Ảnh đề bài')}</section></div>
  return <div className="whitespace-pre-wrap break-words">{safe}</div>
}
