import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin for Edge Runtime
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

export function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
}