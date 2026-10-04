import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// MÔ HÌNH KIỂM TRA GIAO DỊCH CHỦ ĐỘNG (Frontend gọi API này)
// Thay vì phải kết nối SePay, ta chỉ cần kiểm tra xem trong Database
// user đã được webhook update lên Plus/Pro chưa.

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, expectedContent } = await req.json()
    console.log('[Check Transaction] Yêu cầu kiểm tra:', { email: session.user.email, amount })

    // Đợi 2 giây cho SePay IPN Webhook xử lý nếu vừa chuyển xong
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Kiểm tra database xem user đã được nâng cấp chưa
    const userRows = await db.select().from(users).where(eq(users.email, session.user.email))
    
    if (userRows.length > 0) {
      const user = userRows[0]
      if (user.plan !== 'free') {
        return NextResponse.json({ 
          success: true, 
          isPaid: true, 
          message: `Thanh toán thành công. Đã nâng cấp lên gói ${user.plan.toUpperCase()}!` 
        })
      }
    }

    // Nếu chưa nâng cấp
    return NextResponse.json({ 
      success: true, 
      isPaid: false, 
      message: 'Chưa tìm thấy giao dịch. Vui lòng đợi trong giây lát hoặc kiểm tra lại thông tin chuyển khoản (quá trình xử lý tự động có thể mất 1-3 phút).' 
    })
  } catch (error) {
    console.error('[Check Transaction] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
