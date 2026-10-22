import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/src/lib/rateLimit'
import { boundedJson, RequestBodyError } from '@/src/lib/requestBody'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon'
    const rl = checkRateLimit(`trans:${ip}`, 6, 2000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Thao tác dịch quá nhanh. Vui lòng chờ ${rl.retryAfterSeconds} giây.` },
        { status: 429 }
      )
    }

    const origin = req.headers.get('origin')
    if (origin && origin !== new URL(req.url).origin) return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403})
    const { text, from = 'auto', to = 'vi' } = await boundedJson(req)
    const languages = ['en','vi','zh-CN','ko','ja','fr','de','ru','es']
    if (typeof from !== 'string' || typeof to !== 'string' || (from !== 'auto' && !languages.includes(from)) || !languages.includes(to)) return NextResponse.json({error:'Ngôn ngữ không hợp lệ.'},{status:400})

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Nội dung dịch không được để trống' }, { status: 400 })
    }

    const cleanText = text.trim()
    if (cleanText.length > 5000) {
      return NextResponse.json({ error: 'Đoạn văn quá dài (tối đa 5000 ký tự)' }, { status: 400 })
    }

    // 1. Google Chrome Dict API (Rất ổn định, không chặn IP, trả về JSON chuẩn)
    try {
      const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&q=${encodeURIComponent(cleanText)}`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(7000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          if (typeof data[0] === 'string') {
            return NextResponse.json({ translatedText: data[0], detectedLang: data[1] || from, source: 'google-dict' })
          }
          if (Array.isArray(data[0]) && typeof data[0][0] === 'string') {
            return NextResponse.json({ translatedText: data[0][0], detectedLang: data[0][1] || from, source: 'google-dict' })
          }
        }
      }
    } catch (e) {
      console.warn('Google dict endpoint failed:', e)
    }

    // 2. Google Translate GTX
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(cleanText)}`
      const res = await fetch(googleUrl, { signal: AbortSignal.timeout(7000) })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedText = data[0].map((item: any) => item[0] || '').join('')
          if (translatedText) {
            return NextResponse.json({ translatedText, detectedLang: data[2] || from, source: 'google-gtx' })
          }
        }
      }
    } catch (e) {
      console.warn('Google GTX endpoint failed:', e)
    }

    // 3. MyMemory API
    try {
      const pair = `${from === 'auto' ? 'en' : from}|${to}`
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(pair)}`
      const fbRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(7000) })
      if (fbRes.ok) {
        const fbData = await fbRes.json()
        const translatedText = fbData?.responseData?.translatedText || ''
        if (translatedText) {
          return NextResponse.json({ translatedText, detectedLang: from, source: 'mymemory' })
        }
      }
    } catch (e) {
      console.error('All translation providers failed:', e)
    }

    return NextResponse.json({ error: 'Không thể dịch vào lúc này. Vui lòng thử lại sau.' }, { status: 500 })
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof RequestBodyError ? error.message : 'Không thể dịch vào lúc này.' }, { status: error instanceof RequestBodyError ? error.status : 500 })
  }
}

