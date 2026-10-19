import {redirect,notFound} from 'next/navigation'
import {checkAdmin} from '@/src/lib/adminAccess'
export const metadata={title:'Quản lý đề thi · VNDocs',robots:{index:false,follow:false}}
export default async function ExamManagementPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 try{await checkAdmin()}catch(error){if(error instanceof Error&&error.message==='Unauthorized')redirect('/login?callbackUrl=%2Fquan-ly-de-thi-123');if(error instanceof Error&&error.message==='Forbidden')notFound();throw error}
 const incoming=await searchParams,query=new URLSearchParams({tab:'writing'})
 for(const key of ['exam','view','level','type','set','picture']){const value=incoming[key];if(typeof value==='string')query.set(key,value)}
 if(!query.has('exam')&&(query.has('set')||query.has('picture')))query.set('exam','TOEIC')
 redirect('/quan-ly-he-thong-123?'+query)
}
