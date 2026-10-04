import { NextResponse } from 'next/server'

// MÔ HÌNH NHẬN WEBHOOK TỪ SEPAY (IPN)
// Cấu hình trên SePay: trỏ Webhook URL về https://yourdomain.com/api/sepay/webhook

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('[SePay Webhook] Nhận được giao dịch mới:', data)

    // Dữ liệu mẫu SePay trả về:
    // {
    //   "id": 12345,
    //   "gateway": "MB",
    //   "transactionDate": "2026-10-04 19:50:00",
    //   "accountNumber": "123456789",
    //   "code": null,
    //   "content": "VNDOCS PLUS NGUYENVANA",
    //   "transferType": "in",
    //   "transferAmount": 50000,
    //   "accumulated": 100000,
    //   "referenceCode": "FT2627889123"
    // }

    const { transferAmount, content, transferType } = data

    // Chỉ xử lý tiền vào
    if (transferType === 'in') {
      const memo = (content || '').toUpperCase()
      
      // Xử lý nạp VIP Plus
      if (memo.includes('VNDOCS PLUS') && transferAmount >= 50000) {
        // TODO: Cập nhật database cấp quyền Plus cho user
        console.log('=> Cấp gói PLUS thành công cho user dựa trên content:', memo)
      }
      
      // Xử lý nạp VIP Pro
      if (memo.includes('VNDOCS PRO') && transferAmount >= 149000) {
        // TODO: Cập nhật database cấp quyền Pro cho user
        console.log('=> Cấp gói PRO thành công cho user dựa trên content:', memo)
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' })
  } catch (error) {
    console.error('[SePay Webhook] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
