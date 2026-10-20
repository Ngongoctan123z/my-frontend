'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Check, Crown, Zap, Shield, ChevronRight, X, RefreshCcw, CheckCircle2, Loader2, Copy } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'

type Package = {
  id: string
  name: string
  price: number
  priceStr: string
  period: string
  color: string
  badgeColor: string
  buttonClass: string
  icon: React.ReactNode
  features: string[]
  isPopular?: boolean
  description: string
}

const getPackages = (isEn: boolean): Package[] => [
  {
    id: 'plus',
    name: 'VNDocs Plus',
    price: 50000,
    priceStr: '50.000đ',
    period: isEn ? '/ 30 days' : '/ 30 ngày',
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    badgeColor: 'text-blue-500',
    buttonClass: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-blue-500/50 dark:bg-slate-900 dark:text-white dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-blue-500/50',
    icon: <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
    description: isEn ? 'Great for daily self-study.' : 'Tuyệt vời cho học sinh tự học hàng ngày.',
    features: isEn ? [
      'Up to 50 requests / day',
      'Share exam links with others',
      'View detailed results from shared links',
      'Priority customer support',
    ] : [
      'Tối đa 50 lượt chấm / ngày',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Hỗ trợ khách hàng ưu tiên',
    ],
  },
  {
    id: 'pro',
    name: 'VNDocs Pro',
    price: 149000,
    priceStr: '149.000đ',
    period: isEn ? '/ 30 days' : '/ 30 ngày',
    color: 'from-amber-500/20 to-orange-500/20 border-orange-500/50',
    badgeColor: 'text-orange-500',
    buttonClass: 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-orange-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
    icon: <Crown className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
    description: isEn ? 'For teachers and exam centers.' : 'Dành cho giáo viên và trung tâm luyện thi.',
    isPopular: true,
    features: isEn ? [
      'Up to 200 requests / day',
      'Create custom exams',
      'Share exam links with others',
      'View detailed results from shared links',
      'Early access to newest features',
    ] : [
      'Lên đến 200 lượt chấm / ngày',
      'Tự tạo đề thi tuỳ chỉnh (Custom Exam)',
      'Chia sẻ link đề thi cho người khác',
      'Xem chi tiết kết quả người làm qua link',
      'Truy cập sớm các tính năng và công cụ mới nhất',
    ],
  }
]

type Order = { code:string; plan:string; amount:number; bank:string; accountNumber:string; accountName:string; status:string; expiresAt:number; qrUrl:string }
export function PremiumClient({ isEn=false }: { isEn?:boolean }) {
 const {data:session,status}=useSession(),owner=status==='authenticated'?session?.user?.email:null
 const [ready,setReady]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[order,setOrder]=useState<Order|null>(null),[error,setError]=useState(''),[copied,setCopied]=useState('')
 const request=useRef<{plan:string;id:string}|null>(null),generation=useRef(0),activeRequest=useRef<AbortController|null>(null),locked=useRef(false)
 const text=(vi:string,en:string)=>isEn?en:vi
 useEffect(()=>{let live=true;fetch('/api/gpmpay/config').then(async res=>{if(!res.ok)throw new Error();return res.json()}).then(data=>{if(live)setReady(data.ready===true)}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[])
 useEffect(()=>{
  const token=++generation.current;activeRequest.current?.abort();locked.current=false;setBusy(false);setOrder(null);setError('');request.current=null
  if(owner){const code=sessionStorage.getItem('vndocs-payment:'+owner);if(code&&/^(?:[A-Z0-9]{6}|VD[A-F0-9]{20})$/.test(code))void fetch('/api/gpmpay/status?code='+code).then(res=>res.ok?res.json():null).then(data=>{if(token===generation.current&&data?.order)setOrder(data.order)}).catch(()=>{})}
  return()=>{generation.current++;activeRequest.current?.abort()}
 },[owner])
 useEffect(()=>{
  if(!order||order.status!=='pending'||!owner)return
  let live=true,timer:ReturnType<typeof setTimeout>;const controller=new AbortController()
  const poll=async()=>{try{const res=await fetch('/api/gpmpay/status?code='+order.code,{signal:controller.signal});const data=await res.json();if(live){if(!res.ok)throw new Error(data.error||'Không kiểm tra được đơn hàng.');setOrder(data.order);setError('');if(data.order.status==='paid')sessionStorage.removeItem('vndocs-payment:'+owner)}}catch(e:any){if(live&&e.name!=='AbortError')setError(e.message||'Chưa kiểm tra được thanh toán.')}finally{if(live)timer=setTimeout(poll,5000)}}
  timer=setTimeout(poll,2000);return()=>{live=false;clearTimeout(timer);controller.abort()}
 },[order?.code,order?.status,owner])
 useEffect(()=>{if(!order)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOrder(null)};document.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close)}},[order?.code])
 async function checkout(pkg:Package){
  if(!owner){void signIn('google',{callbackUrl:location.href});return}
  if(locked.current||!ready)return
  locked.current=true;setBusy(true);setError('');const token=generation.current,controller=new AbortController();activeRequest.current=controller
  if(request.current?.plan!==pkg.id)request.current={plan:pkg.id,id:crypto.randomUUID()}
  try{const res=await fetch('/api/gpmpay/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:pkg.id,requestId:request.current.id}),signal:controller.signal});const data=await res.json();if(token!==generation.current)return;if(!res.ok)throw new Error(data.error||'Chưa tạo được đơn.');setOrder(data.order);sessionStorage.setItem('vndocs-payment:'+owner,data.order.code)}catch(e:any){if(token===generation.current&&e.name!=='AbortError')setError(e.message||'Chưa tạo được đơn. Vui lòng thử lại.')}finally{if(token===generation.current){setBusy(false);locked.current=false;activeRequest.current=null}}
 }
 async function copy(value:string){try{await navigator.clipboard.writeText(value);setCopied(value)}catch{setError(text('Chưa sao chép được. Bạn có thể chọn và sao chép thủ công.','Please select and copy the text manually.'))}}
 return <div className="mx-auto w-full max-w-5xl px-3 py-10 sm:px-6 sm:py-16">
  <header className="mx-auto mb-8 max-w-xl text-center"><p className="text-xs font-semibold uppercase tracking-widest text-blue-600">VNDocs Premium</p><h1 className="mt-3 text-3xl font-bold text-slate-900">{text('Chọn gói học tập phù hợp','Choose your study plan')}</h1><p className="mt-3 text-sm leading-7 text-slate-500">{text('Thanh toán chuyển khoản bằng VietQR. GPMPay xác nhận giao dịch và kích hoạt đúng tài khoản mua gói.','Pay by Vietnamese bank transfer using VietQR. GPMPay confirms the transfer for your purchase.')}</p></header>
  {!loading&&!ready&&<p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{text('Thanh toán đang được cấu hình. Bạn có thể xem gói và quay lại mua sau.','Payments are being configured. You can browse plans and return later.')}</p>}
  {error&&!order&&<p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  <div className="grid gap-5 md:grid-cols-2">{getPackages(isEn).map(pkg=><section key={pkg.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3">{pkg.icon}<h2 className="text-xl font-bold text-slate-900">{pkg.name}</h2></div><p className="mt-3 text-sm text-slate-500">{pkg.description}</p><p className="my-6 text-3xl font-bold text-slate-900">{pkg.priceStr}<span className="ml-2 text-sm font-normal text-slate-500">{pkg.period}</span></p><ul className="mb-7 flex-1 space-y-3">{pkg.features.map(feature=><li key={feature} className="flex items-start gap-2 text-sm leading-6 text-slate-600"><Check className="mt-1 h-4 w-4 shrink-0 text-blue-600"/>{feature}</li>)}</ul><button type="button" disabled={loading||busy||status==='loading'||(!!owner&&!ready)} onClick={()=>void checkout(pkg)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<ChevronRight className="h-4 w-4"/>}{!owner?text('Đăng nhập để mua gói','Sign in to purchase'):loading?text('Đang kiểm tra…','Checking…'):!ready?text('Thanh toán chưa sẵn sàng','Payments unavailable'):text('Mua gói bằng VietQR','Pay with VietQR')}</button></section>)}</div>
  <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-500">{text('Mỗi lần mua có thời hạn 30 ngày, không tự động trừ tiền gia hạn. Gia hạn cùng gói giữ lại thời gian còn hiệu lực. Khi nâng gói, gói mới có hiệu lực 30 ngày từ lúc xác nhận; không quy đổi phần còn lại của gói cũ.','Each purchase lasts 30 days and does not renew automatically. Renewing the same plan preserves its remaining time. Upgrades start a new 30-day term without converting the previous plan’s remainder.')}</p>
  {order&&<div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3" onMouseDown={event=>{if(event.target===event.currentTarget)setOrder(null)}}><section role="dialog" aria-modal="true" aria-label={text('Thanh toán gói VNDocs','VNDocs payment')} className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 sm:p-7"><button type="button" aria-label={text('Đóng thanh toán','Close payment')} onClick={()=>setOrder(null)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-500"><X className="h-5 w-5"/></button><h2 className="pr-8 text-xl font-bold">{order.status==='paid'?text('Thanh toán thành công','Payment confirmed'):text('Thanh toán VNDocs ','Pay for VNDocs ')+order.plan.toUpperCase()}</h2>
   {order.status==='paid'?<div role="status" className="py-7 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600"/><p className="mt-4 text-sm leading-7">{text('Đã xác nhận giao dịch và cập nhật gói cho tài khoản của bạn.','Your payment is confirmed and your plan has been updated.')}</p><a href={isEn?'/en/profile':'/profile'} className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">{text('Xem gói của tôi','View my plan')}</a></div>:order.status==='pending'?<><p className="mt-3 text-sm text-slate-500">{text('Chuyển đúng số tiền và giữ nguyên nội dung bên dưới.','Transfer the exact amount and keep the payment reference unchanged.')}</p><img src={order.qrUrl} alt={text('Mã VietQR thanh toán đơn hàng','Order payment VietQR')} className="mx-auto my-4 w-full max-w-72 rounded-xl border border-slate-200"/><dl className="space-y-3 text-sm">{[[text('Ngân hàng','Bank'),order.bank],[text('Tài khoản','Account'),order.accountNumber],[text('Chủ tài khoản','Account holder'),order.accountName],[text('Số tiền','Amount'),order.amount.toLocaleString('vi-VN')+' đ'],[text('Nội dung','Reference'),order.code]].map(([label,value])=><div key={label} className="flex min-w-0 items-start justify-between gap-3"><dt className="shrink-0 text-slate-500">{label}</dt><dd className="min-w-0 break-all text-right font-semibold"><button type="button" onClick={()=>void copy(value)} className="inline-flex items-center gap-1">{value}<Copy className="h-3 w-3 shrink-0"/></button></dd></div>)}</dl>{copied&&<p role="status" className="mt-3 text-xs text-emerald-700">{text('Đã sao chép','Copied')}</p>}<p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-700"><RefreshCcw className="h-4 w-4 shrink-0"/>{text('Đang chờ GPMPay xác nhận. Đơn có hiệu lực đến ','Waiting for GPMPay confirmation. Valid until ')+new Date(order.expiresAt).toLocaleTimeString(isEn?'en-US':'vi-VN')}</p></>:<p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-800">{order.status==='review'?text('Giao dịch đã được ghi nhận nhưng cần hỗ trợ kiểm tra gói hiện tại. Vui lòng liên hệ hỗ trợ, không chuyển lại tiền.','Your payment needs manual review. Contact support and do not pay again.'):text('Đơn đã hết hạn. Hãy đóng cửa sổ và tạo đơn mới trước khi chuyển khoản.','This order has expired. Close this window and create a new order before paying.')}</p>}
   {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  </section></div>}
 </div>
}
