import { NextResponse } from 'next/server';
import { createSessionCookie, verifyIdToken } from '@/lib/auth-edge';

export const runtime = 'experimental-edge';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'No ID token provided' }, 
        { status: 400 }
      );
    }

    // Verify the Firebase ID token first
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    let sessionCookie;
    try {
      sessionCookie = await createSessionCookie(idToken, expiresIn);
    } catch (error) {
      console.error('Session creation failed:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const userProfile = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      completedOnboarding: false // This will be updated during onboarding
    };

    const response = NextResponse.json({ status: 'success' });

    // Set cookies in the response
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    response.cookies.set('userProfile', JSON.stringify(userProfile), {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}