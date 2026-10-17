import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { checkRateLimit } from '@/src/lib/rateLimit'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rl = checkRateLimit(`txcheck:${session.user.email}`, 3, 5000)
    if (!rl.allowed) {
      return NextResponse.json({
        success: true,
        isPaid: false,
        message: `Vui lòng đợi ${rl.retryAfterSeconds} giây trước khi bấm kiểm tra tiếp.`
      })
    }

    const { amount, expectedContent } = await req.json()
    console.log('[Check Transaction] Yêu cầu kiểm tra:', { email: session.user.email, amount })

    // Gọi BankHook sync để lấy giao dịch mới nhất
    await syncBankTransactions()

    // Kiểm tra database xem user đã được nâng cấp chưa
    const db = await getDb()
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
      message: 'Chưa tìm thấy giao dịch. Vui lòng đợi trong giây lát hoặc kiểm tra lại thông tin chuyển khoản (BankHook xử lý mỗi 15 giây).' 
    })
  } catch (error) {
    console.error('[Check Transaction] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
