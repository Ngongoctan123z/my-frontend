import { NextRequest } from 'next/server'
import { POST as speakingPostHandler } from '../route'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    return speakingPostHandler(req)
  }

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json()
      if (!body.action) {
        body.action = action
      }
      const clonedReq = new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(body),
      })
      return speakingPostHandler(clonedReq)
    } catch {
      return speakingPostHandler(req)
    }
  }

  return speakingPostHandler(req)
}
