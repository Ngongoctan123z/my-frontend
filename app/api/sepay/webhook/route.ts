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
      
      // Bắt mẫu linh hoạt cho phép không có khoảng trắng/dấu gạch nối
      const match = memo.match(/VNDOCS[\s\-\.]*(PLUS|PRO)[\s\-\.]*([A-Z0-9_\.\-@]+)/)

      if (match) {
        const plan = match[1].toLowerCase() // "plus" hoặc "pro"
        const userIdentifier = match[2].toLowerCase()
        const normId = userIdentifier.replace(/[^a-z0-9]/ig, '')
        const requiredAmount = plan === 'pro' ? 149000 : 50000

        if (transferAmount >= requiredAmount && normId.length >= 5) {
          const db = await getDb()
          // Lấy tất cả user và lọc bằng JS để đảm bảo chính xác 100% với các trường hợp ngân hàng format lại chuỗi
          const allUsers = await db.select().from(users)
          const matchedUser = allUsers.find(u => {
            if (!u.email) return false
            const normEmail = u.email.replace(/[^a-z0-9]/ig, '').toLowerCase()
            return normId.includes(normEmail) || normEmail.startsWith(normId)
          })
          
          if (matchedUser) {
            const user = matchedUser
            
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
            console.error('=> Không tìm thấy user nào khớp với thông tin:', userIdentifier)
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
