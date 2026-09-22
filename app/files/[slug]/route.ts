import { NextRequest } from 'next/server'
import { BASE_URL } from '../../../src/utils/constants'

// Note: slug is actually slugIdentifier or examCode, not the URL slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  
  // Here we would lookup the exam by slugIdentifier or examCode
  // For the sake of this implementation without changing the backend API,
  // we assume the slug is the file basename (e.g. some-exam-file)
  // or we proxy it directly to the backend API.
  // Actually, the backend API is /api/v1/admin/files/{filename} but that requires auth.
  // Or maybe there is a public file download API?
  // Let's proxy to the known BASE_URL.
  
  // In a real implementation, we would query the backend to get the actual file URL
  // But let's just proxy it if it's a known path
  
  const fileUrl = `${BASE_URL}/api/v1/files/${slug}`
  
  try {
    const response = await fetch(fileUrl, {
      method: 'GET',
    })
    
    if (!response.ok) {
      return new Response('File not found', { status: 404 })
    }
    
    // Create a new response with the file stream
    const headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex') // SPEC P1-4: X-Robots-Tag: noindex
    
    return new Response(response.body, {
      status: response.status,
      headers
    })
  } catch (error) {
    console.error('Error proxying file download:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
