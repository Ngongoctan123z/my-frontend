import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore API routes, static files, and _next
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const country = request.headers.get('cf-ipcountry') || 'VN'
  const isEnRoute = pathname.startsWith('/en/') || pathname === '/en'

  // If user is from VN and not on /en/ route, let them be.
  if (country === 'VN') {
    return NextResponse.next()
  }

  // If user is NOT from VN and is NOT on an English route yet
  if (country !== 'VN' && !isEnRoute) {
    // Only AI Grader and Tools are supported for non-VN users
    if (pathname.startsWith('/ai-grader') || pathname.startsWith('/tools')) {
      const url = request.nextUrl.clone()
      url.pathname = `/en${pathname}`
      return NextResponse.redirect(url)
    } else if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = `/en/ai-grader`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
