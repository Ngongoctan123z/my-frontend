import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { boundedJson, RequestBodyError } from '@/src/lib/requestBody'
import { checkRateLimit } from '@/src/lib/rateLimit'
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin')
    if (origin && origin !== new URL(req.url).origin) return NextResponse.json({success:false},{status:403})
    const ip = req.headers.get('cf-connecting-ip') || 'unknown'
    if (!checkRateLimit('turnstile:'+ip,10,60000).allowed) return NextResponse.json({success:false},{status:429})
    const {token} = await boundedJson(req,8192)
    if (typeof token !== 'string' || !token || token.length > 2048 || ['turnstile-fallback-token','cf-verified-session-token'].includes(token) || token.startsWith('XXXX.')) return NextResponse.json({success:false,error:'Mã xác thực không hợp lệ.'},{status:400})
    let secret = process.env.TURNSTILE_SECRET_KEY
    try { const {env} = await getCloudflareContext(); secret = (env as any).TURNSTILE_SECRET_KEY || secret } catch {}
    // Cloudflare's public test keys must never validate production requests.
    if (!secret || /^\dx0{8,}/i.test(secret)) return NextResponse.json({success:false,error:'Xác thực bảo mật chưa được cấu hình.'},{status:503})
    const body = new URLSearchParams({secret,response:token})
    if (ip !== 'unknown') body.set('remoteip',ip)
    const upstream = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(8000)})
    if (!upstream.ok) return NextResponse.json({success:false,error:'Không thể kiểm tra xác thực.'},{status:502})
    const outcome = await upstream.json() as {success?:boolean;hostname?:string}
    const host = new URL(req.url).hostname
    if (outcome.success !== true || outcome.hostname !== host) return NextResponse.json({success:false,error:'Xác thực không thành công.'},{status:403})
    return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}})
  } catch (error) {
    return NextResponse.json({success:false,error:error instanceof RequestBodyError?error.message:'Không thể kiểm tra xác thực.'},{status:error instanceof RequestBodyError?error.status:502})
  }
}
