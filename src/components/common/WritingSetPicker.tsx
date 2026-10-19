'use client'
import {useEffect,useRef,useState} from 'react'
import type {WritingExam} from '@/src/lib/writingBank'
type Item={id:string;title:string}
export function WritingSetPicker({exam,currentId='',onChoose,disabled=false,autoLoad=false,isEn=false}:{exam:WritingExam;currentId?:string;onChoose:(id:string)=>void;disabled?:boolean;autoLoad?:boolean;isEn?:boolean}){
 const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0),autoRequested=useRef(false),choose=useRef(onChoose),current=useRef(currentId)
 choose.current=onChoose;current.current=currentId
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setItems([])
  fetch('/api/ai-grader',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_writing_catalog',exam}),signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'Không tải được danh sách đề.');return data}).then(data=>{setItems(data.sets||[]);if(autoLoad&&!current.current&&!autoRequested.current&&data.sets?.length){autoRequested.current=true;choose.current(data.sets[0].id)}}).catch(failure=>{if(failure.name!=='AbortError')setError(failure.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[exam,attempt,autoLoad])
 return <div className="min-w-0 space-y-2"><label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center"><span className="shrink-0">{isEn?'Practice set':'Bộ đề luyện'}{!loading?' · '+items.length:''}</span><select aria-label={isEn?'Choose a Writing practice set':'Chọn bộ đề Writing'} value={items.some(row=>row.id===currentId)?currentId:''} onChange={event=>{if(event.target.value)onChoose(event.target.value)}} disabled={disabled||loading} className="min-h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 sm:flex-1"><option value="">{loading?(isEn?'Loading…':'Đang tải…'):(isEn?'Choose a complete set…':'Chọn một bộ đề đầy đủ…')}</option>{items.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{error&&<p role="alert" className="text-xs text-red-600">{error} <button type="button" onClick={()=>{autoRequested.current=false;setAttempt(n=>n+1)}} className="underline">{isEn?'Retry':'Thử lại'}</button></p>}</div>
}
