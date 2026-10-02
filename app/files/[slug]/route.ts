import { NextRequest } from 'next/server'
import { BASE_URL } from '../../../src/utils/constants'

// Note: slug is actually slugIdentifier or examCode, not the URL slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  
  const searchParams = request.nextUrl.searchParams
  const urlParam = searchParams.get('url')
  
  let targetUrl = ''
  // If the frontend passed the actual file URL in the query string, use it
  if (urlParam) {
    targetUrl = urlParam.startsWith('http') ? urlParam : `${BASE_URL.replace('/api/v1', '')}${urlParam}`
  } else {
    // Fallback: try to fetch by slug (might fail if backend doesn't support it, but it's a best effort)
    targetUrl = `${BASE_URL.replace('/api/v1', '')}/files/${slug}`
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
    })
    
    if (!response.ok) {
      return new Response('File not found or backend error', { status: 404 })
    }
    
    // Create a new response with the file stream
    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex') // SPEC P1-4: X-Robots-Tag: noindex
    
    // Add aggressive cache for images since filenames are UUIDs
    const contentType = headers.get('content-type')
    if (contentType && contentType.startsWith('image/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }
    
    // If we have the slug, we can use it for the downloaded file name instead of the backend's UUID
    const contentDisposition = headers.get('content-disposition')
    if (contentDisposition && slug && !targetUrl.includes('seo-')) {
      const ext = urlParam ? urlParam.split('.').pop() : 'pdf'
      headers.set('content-disposition', `attachment; filename="${slug}.${ext}"`)
    }
    
    return new Response(response.body, {
      status: response.status,
      headers
    })
  } catch (error) {
    console.error('Error proxying file download:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
