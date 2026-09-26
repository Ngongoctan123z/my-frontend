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
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'VNDocs-Proxy/1.0',
      },
    })

    if (!response.ok) {
      return new Response(`File not found: ${filePath}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response('Proxy error', { status: 502 })
  }
}
