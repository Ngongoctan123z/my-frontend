import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { checkAdmin } from '@/src/lib/adminAccess'
import { WritingExamsAdmin } from '@/src/components/admin/WritingExamsAdmin'

export const metadata = { title:'Quản lý đề thi · VNDocs',robots:{index:false,follow:false} }
export default async function ExamManagementPage() {
  try { await checkAdmin() }
  catch(error) {
    if(error instanceof Error && error.message==='Unauthorized')redirect('/login?callbackUrl=%2Fquan-ly-de-thi-123')
    if(error instanceof Error && error.message==='Forbidden')notFound()
    throw error
  }
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-8"><div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-800">Quản lý đề thi</h1><Link href="/quan-ly-he-thong-123" className="shrink-0 text-xs font-semibold text-blue-600">Quản trị hệ thống</Link></div><WritingExamsAdmin/></main>
}
