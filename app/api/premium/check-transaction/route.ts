import { NextResponse } from 'next/server'

// MÔ HÌNH KIỂM TRA GIAO DỊCH CHỦ ĐỘNG
// Frontend sẽ gọi API này khi bấm "Tôi đã chuyển khoản"
// Tương lai: Gọi qua Northflank Backend hoặc SePay API để kiểm tra

export async function POST(req: Request) {
  try {
    const { amount, expectedContent } = await req.json()
    console.log('[Check Transaction] Yêu cầu kiểm tra:', { amount, expectedContent })

    // GIẢ LẬP: Chờ 1 giây để giống thật
    await new Promise(resolve => setTimeout(resolve, 1000))

    // TODO: Khi nối với Backend thật (Northflank / SePay), gọi API sang bên đó để kiểm tra
    // const res = await fetch(`https://northflank-backend/api/sepay/check?memo=${expectedContent}`)
    // const status = await res.json()

    // Tạm thời trả về false vì chưa có backend xử lý
    return NextResponse.json({ 
      success: true, 
      isPaid: false, 
      message: 'Chưa tìm thấy giao dịch. Vui lòng đợi thêm hoặc kiểm tra lại nội dung chuyển khoản.' 
    })
  } catch (error) {
    console.error('[Check Transaction] Lỗi:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
