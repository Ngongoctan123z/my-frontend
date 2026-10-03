import { NextRequest, NextResponse } from 'next/server'

const VPS_API_URL = 'http://3.145.155.167.nip.io:8000'

export const maxDuration = 60 // 60 giây timeout cho file lớn

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArr } = await params
  const path = pathArr.join('/')
  const targetUrl = `${VPS_API_URL}/api/${path}`

  try {
    const formData = await request.formData()
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { detail: `Lỗi từ máy chủ: ${errorText}` },
        { status: response.status }
      )
    }

    // Stream file về cho client
    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || ''

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Lỗi kết nối tới máy chủ convert: ${error.message}` },
      { status: 502 }
    )
  }
}
