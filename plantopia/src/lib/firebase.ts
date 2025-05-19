'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6yNWUWyLO84RFVtIsRu4Ws0eBuBGls5w",
  authDomain: "plantopia-94db3.firebaseapp.com",
  projectId: "plantopia-94db3",
  storageBucket: "plantopia-94db3.firebasestorage.app",
  messagingSenderId: "785311279974",
  appId: "1:785311279974:web:a133403e0742a56a0076a7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);