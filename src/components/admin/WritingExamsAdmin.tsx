'use client'
import { useState } from 'react'
import { ToeicExamSetsAdmin } from './ToeicExamSetsAdmin'
import { PromptsTab } from './PromptsTab'
import { ToeicEmailBankAdmin } from './ToeicEmailBankAdmin'
import { ToeicPictureBankAdmin } from './ToeicPictureBankAdmin'
export function WritingExamsAdmin() {
  const [tab,setTab]=useState('sets')
  return <div className="space-y-5"><div className="flex snap-x gap-2 overflow-x-auto border-b border-slate-200 pb-2 [scrollbar-width:none]">{[['sets','Bộ đề ghép'],['photos','TOEIC · Bộ ảnh'],['emails','TOEIC · Email 6/7'],['questions','Kho câu hỏi']].map(([id,label])=><button type="button" key={id} onClick={()=>setTab(id)} className={`shrink-0 snap-start rounded-lg px-4 py-2 text-sm font-semibold ${tab===id?'bg-blue-50 text-blue-600':'text-slate-500'}`}>{label}</button>)}</div>{tab==='sets'?<ToeicExamSetsAdmin/>:tab==='photos'?<ToeicPictureBankAdmin/>:tab==='emails'?<ToeicEmailBankAdmin/>:<PromptsTab/>}</div>
}
