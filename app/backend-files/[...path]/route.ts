import { NextRequest } from 'next/server'

const NORTHFLANK_BASE = 'https://p01--backend--4j4v4pb6yj96.code.run'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')
  const targetUrl = `${NORTHFLANK_BASE}/files/${filePath}`

  try {
    // Forward Range header (hỗ trợ byte-range cho PDF viewer, giảm lượng dữ liệu tải)
    const rangeHeader = request.headers.get('range')
    const upstreamHeaders: HeadersInit = {
      'User-Agent': 'VNDocs-Proxy/1.0',
    }
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const response = await fetch(targetUrl, {
      headers: upstreamHeaders,
    })

    if (!response.ok && response.status !== 206) {
      return new Response(`Upstream error: ${response.status}`, { status: response.status })
    }

    // Stream body trực tiếp — không buffer toàn bộ vào RAM Worker
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    }

    // Forward các header quan trọ ng cho client
    const contentLength = response.headers.get('content-length')
    if (contentLength) responseHeaders['Content-Length'] = contentLength

    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition) responseHeaders['Content-Disposition'] = contentDisposition

    const contentRange = response.headers.get('content-range')
    if (contentRange) responseHeaders['Content-Range'] = contentRange

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (err) {
    return new Response('Proxy error', { status: 502 })
  }
}
