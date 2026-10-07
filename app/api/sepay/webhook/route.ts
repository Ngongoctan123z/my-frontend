import { NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { users } from '@/src/db/schema'
import { like, eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('[SePay Webhook] Nhận được giao dịch mới:', data)

    const { transferAmount, content, transferType } = data

    // Chỉ xử lý tiền vào
    if (transferType === 'in') {
      const memo = (content || '').toUpperCase()
      
      // Parse email bằng Regex để tránh trường hợp ngân hàng nối thêm chữ
      // Tìm mẫu: vndocs-plus-<email> hoặc vndocs-pro-<email>
      const match = memo.match(/VNDOCS-(PLUS|PRO)-([A-Z0-9_\.\-]+@[A-Z0-9_\.\-]+)/)

      if (match) {
        const plan = match[1].toLowerCase() // "plus" hoặc "pro"
        const userEmail = match[2].toLowerCase()
        const requiredAmount = plan === 'pro' ? 149000 : 50000

        if (transferAmount >= requiredAmount) {
          const db = await getDb()
          // Tìm user theo email
          const userRows = await db.select().from(users).where(eq(users.email, userEmail)).limit(1)
          
          if (userRows.length > 0) {
            const user = userRows[0]
            
            // Hạn sử dụng: 30 ngày kể từ lúc nạp
            const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

            await db.update(users)
              .set({
                plan: plan,
                planExpiresAt: new Date(expiresAt)
              })
              .where(eq(users.id, user.id))
            
            console.log(`=> Cấp gói ${plan.toUpperCase()} thành công cho user:`, user.email)
          } else {
            console.error('=> Không tìm thấy user nào khớp với prefix:', userPrefix)
          }
        } else {
          console.error(`=> Số tiền không đủ. Yêu cầu: ${requiredAmount}, nhận được: ${transferAmount}`)
        }
      } else {
         console.error('=> Nội dung không đúng cú pháp:', memo)
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('[SePay Webhook] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
