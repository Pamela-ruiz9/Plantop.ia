import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add matcher for paths that should be protected
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login'
  ]
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Redirect authenticated users trying to access login page
  if (request.nextUrl.pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check auth for protected routes
  if (!session) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    const url = new URL('/login', request.url);
    url.searchParams.set('from', from);
    
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}