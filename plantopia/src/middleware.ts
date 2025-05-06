import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from './lib/auth-edge';

export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const profileCookie = request.cookies.get('userProfile');

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/', '/api/auth/login', '/api/auth/logout'];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    // If user is already authenticated and tries to access login, redirect to dashboard
    if (sessionCookie && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Check authentication
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the session cookie
    await verifySessionCookie(sessionCookie.value);
  } catch (error) {
    console.error('Error verifying session:', error);
    // If session is invalid, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    response.cookies.delete('userProfile');
    return response;
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};