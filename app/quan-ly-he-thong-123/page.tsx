'use client'
import {useEffect,useState} from 'react'
import {Users,Settings,FileText,MessageSquare,Wallet,ArrowDownLeft,Mic} from 'lucide-react'
import Link from 'next/link'
import {UsersTab} from '@/src/components/admin/UsersTab'
import {ModelsTab} from '@/src/components/admin/ModelsTab'
import {PromptRelationsTab} from '@/src/components/admin/PromptRelationsTab'
import {SpeakingAdminTab} from '@/src/components/admin/SpeakingAdminTab'
import {SeoTab} from '@/src/components/admin/SeoTab'
import {ChatTab} from '@/src/components/admin/ChatTab'
import {PaymentsTab} from '@/src/components/admin/PaymentsTab'
import {writingAdminSelection,type WritingAdminSelection} from '@/src/lib/adminWritingNavigation'
const navigation=[{id:'writing',label:'Quản Lý Writing',icon:FileText},{id:'speaking',label:'Quản Lý Speaking',icon:Mic},{id:'users',label:'Người Dùng',icon:Users},{id:'models',label:'Cấu hình Groq AI',icon:Settings},{id:'seo',label:'Cấu hình SEO',icon:FileText},{id:'chat',label:'Hỗ Trợ Khách',icon:MessageSquare},{id:'payments',label:'Thanh toán GPMPay',icon:Wallet}]
export default function AdminPage(){
 const[activeTab,setActiveTab]=useState('writing'),[selection,setSelection]=useState<WritingAdminSelection|null>(null)
 useEffect(()=>{const query=new URLSearchParams(window.location.search),chosen=writingAdminSelection(query);setSelection(chosen);const tab=query.get('tab')==='bankhook'?'payments':query.get('tab');if(tab&&navigation.some(item=>item.id===tab)&&tab!=='writing')setActiveTab(tab);else{const url=new URL(location.href);url.searchParams.set('tab','writing');url.searchParams.set('exam',chosen.exam);url.searchParams.set('view',chosen.view);if(chosen.exam==='HSK')url.searchParams.set('level',chosen.promptType||'HSK_5');history.replaceState(null,'',url)}},[])
 function openTab(tab:string){if(tab==='writing')setSelection(writingAdminSelection(new URLSearchParams(location.search)));setActiveTab(tab);const url=new URL(location.href);url.searchParams.set('tab',tab);history.replaceState(null,'',url)}
 return <div className="mx-auto mt-6 max-w-7xl space-y-5 p-3 sm:mt-10 sm:p-6">
  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><h1 className="text-2xl font-black text-slate-800 sm:text-3xl">Quản Trị Hệ Thống</h1><Link href="/quan-ly-he-thong-123?tab=payments" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700"><ArrowDownLeft size={16}/>Cấu hình GPMPay</Link></div>
  <nav aria-label="Quản trị hệ thống" className="flex snap-x items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1 [scrollbar-width:none]">{navigation.map(item=><button type="button" key={item.id} onClick={()=>openTab(item.id)} aria-pressed={activeTab===item.id} className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${activeTab===item.id?'border-indigo-600 text-indigo-600':'border-transparent text-slate-500 hover:text-slate-800'}`}><item.icon size={18}/>{item.label}</button>)}</nav>
  <div className="min-h-[500px] min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
   {activeTab==='writing'&&selection&&<PromptRelationsTab key={selection.exam+'-'+selection.view+'-'+selection.promptType} initialExam={selection.exam} initialView={selection.view} initialPromptType={selection.promptType}/>}
   {activeTab==='writing'&&!selection&&<p className="p-6 text-sm text-slate-400">Đang mở kho đề…</p>}
   {activeTab==='speaking'&&<SpeakingAdminTab/>}{activeTab==='users'&&<UsersTab/>}{activeTab==='models'&&<ModelsTab/>}{activeTab==='seo'&&<SeoTab/>}{activeTab==='chat'&&<ChatTab/>}{activeTab==='payments'&&<PaymentsTab/>}
  </div>
 </div>
}

