import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

// Firebase uses this URL for their JWKs
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

// Convert string to Uint8Array for the secret key
function stringToUint8Array(str: string): Uint8Array {
  return Uint8Array.from(str.split('').map(char => char.charCodeAt(0)));
}

// A secret key for signing our session cookies
const SESSION_SECRET = stringToUint8Array(
  process.env.SESSION_SECRET || 'your-session-secret-at-least-32-characters-long'
);

export async function verifyIdToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });

    // Firebase specific claims
    if (!payload.sub || !payload.auth_time || !payload.iat || !payload.exp) {
      throw new Error('Invalid token claims');
    }

    return {
      uid: payload.sub,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
  try {
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      throw new Error('Invalid token payload');
    }
    
    // Create a JWT session token
    const sessionToken = await new SignJWT({ 
      ...decodedToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn / 1000,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn / 1000)
      .sign(SESSION_SECRET);
    
    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

export async function verifySessionCookie(sessionCookie: string) {
  try {
    const { payload } = await jwtVerify(sessionCookie, SESSION_SECRET, {
      algorithms: ['HS256'],
    });
    
    if (!payload.uid) {
      throw new Error('Invalid session token');
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying session:', error);
    throw new Error('Invalid session');
  }
}