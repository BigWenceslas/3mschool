import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const user = getUserFromRequest(request)
    
    if (!user) {
      // Redirect to home page if not authenticated
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
}