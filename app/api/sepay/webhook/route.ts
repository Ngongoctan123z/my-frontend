import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { like, eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('[SePay Webhook] Nhận được giao dịch mới:', data)

    const { transferAmount, content, transferType } = data

    // Chỉ xử lý tiền vào
    if (transferType === 'in') {
      const memo = (content || '').toUpperCase()
      
      // Parse username (phần email phía trước @) từ memo. Vd: VNDOCS PLUS TANNGOC
      // Memo thường có dạng: VNDOCS PLUS TANNGOC123
      const isPlus = memo.includes('VNDOCS PLUS') && transferAmount >= 50000
      const isPro = memo.includes('VNDOCS PRO') && transferAmount >= 149000

      if (isPlus || isPro) {
        // Tách lấy từ cuối cùng trong memo (tên user)
        const parts = memo.split(' ')
        const userPrefix = parts[parts.length - 1] // "TANNGOC123"

        if (userPrefix) {
          // Tìm user có email bắt đầu bằng userPrefix (case insensitive)
          // Do SQLite LIKE mặc định case-insensitive với ASCII
          const userRows = await db.select().from(users).where(like(users.email, `${userPrefix.toLowerCase()}@%`)).limit(1)
          
          if (userRows.length > 0) {
            const user = userRows[0]
            const plan = isPro ? 'pro' : 'plus'
            
            // Hạn sử dụng: 30 ngày kể từ lúc nạp
            const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

            await db.update(users)
              .set({
                plan: plan,
                planExpiresAt: expiresAt
              })
              .where(eq(users.id, user.id))
            
            console.log(`=> Cấp gói ${plan.toUpperCase()} thành công cho user:`, user.email)
          } else {
            console.error('=> Không tìm thấy user nào khớp với prefix:', userPrefix)
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('[SePay Webhook] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
