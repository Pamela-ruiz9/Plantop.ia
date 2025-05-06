'use client';

import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/user';
import Cookies from 'js-cookie';

export function useUser() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setProfile({
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          });
          // Store profile in cookie for middleware
          Cookies.set('userProfile', JSON.stringify(data), { secure: true });
        } else {
          // Create initial profile
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || undefined,
            completedOnboarding: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
          Cookies.set('userProfile', JSON.stringify(newProfile), { secure: true });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...profile,
        ...data,
        updatedAt: new Date()
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      setProfile(updatedProfile);
      Cookies.set('userProfile', JSON.stringify(updatedProfile), { secure: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return { profile, loading, updateProfile };
}