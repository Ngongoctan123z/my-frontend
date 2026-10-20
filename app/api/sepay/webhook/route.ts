import { NextResponse } from 'next/server'
export function GET(){return NextResponse.json({error:'Luồng thanh toán cũ đã ngừng. Vui lòng tải lại trang Premium.',provider:'gpmpay'},{status:410,headers:{'Cache-Control':'no-store'}})}
export const POST=GET
