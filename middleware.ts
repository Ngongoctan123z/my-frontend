import { isRetiredPath, retiredSectionResponse } from './src/lib/siteSections'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isRetiredPath(pathname)) return retiredSectionResponse()

  // Ignore API routes, static files, and _next
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const language = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'vi'
  const headers = new Headers(request.headers)
  headers.set('x-vndocs-language', language)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Language', language)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
