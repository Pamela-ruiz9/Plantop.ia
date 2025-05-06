import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    // Create a session cookie that lasts 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    // Set the cookie in the response
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}