import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const profileCookie = request.cookies.get('userProfile');

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/', '/api/auth/login'];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Special handling for onboarding
  const profile = profileCookie ? JSON.parse(profileCookie.value) : null;
  const isOnboardingComplete = profile?.completedOnboarding;

  // Redirect to onboarding if not completed (except if already on onboarding page)
  if (!isOnboardingComplete && request.nextUrl.pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Prevent accessing onboarding if already completed
  if (isOnboardingComplete && request.nextUrl.pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure paths that should be handled by middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};