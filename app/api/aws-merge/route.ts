import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // BẮT BUỘC dùng cổng 80 vì Cloudflare Workers chặn TẤT CẢ các cổng khác khi gọi ra ngoài (kể cả 8080)
    const targetUrl = 'http://3.145.155.167:80/api/merge';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
      // Đặt timeout hoặc các cấu hình khác nếu cần
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(
        JSON.stringify({ message: `Lỗi từ AWS Server: ${response.status} - ${errorText}` }), 
        { status: response.status }
      );
    }
    
    const blob = await response.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream'
      }
    });
  } catch (err: any) {
    console.error("Lỗi proxy:", err);
    return new NextResponse(
      JSON.stringify({ message: "Không thể kết nối đến AWS Server. Hãy chắc chắn API đã được chạy với quyền sudo trên cổng 80 nhé!" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
