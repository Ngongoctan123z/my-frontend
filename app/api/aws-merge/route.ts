import { NextResponse } from 'next/server'
export function POST() {
  return NextResponse.json({ error: 'Công cụ chuyển đổi tệp đã ngừng hoạt động.' }, { status: 410, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}
