'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthContext } from '../contexts/AuthContext';
import type { Plant } from '@/types/plant';

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user?.uid) {
      setPlants([]);
      setLoading(false);
      return undefined;
    }

    const plantsQuery = query(
      collection(db, 'plants'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      plantsQuery,
      (snapshot) => {
        const plantsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastWatered: doc.data().lastWatered?.toDate(),
          wateringSchedule: doc.data().wateringSchedule
            ? {
                ...doc.data().wateringSchedule,
                lastWatered: doc.data().wateringSchedule.lastWatered?.toDate(),
              }
            : undefined,
        })) as Plant[];
        setPlants(plantsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching plants:', error);
        setError('Error connecting to the database. Please check your internet connection.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const uploadPhoto = async (file: File): Promise<string> => {
    if (!user?.uid) throw new Error('Please log in again to upload photos');
    
    try {
      const storageRef = ref(storage, `plant-photos/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo. Please check your internet connection.');
    }
  };

  const addPlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    if (!user?.uid) throw new Error('Please log in again to add a plant');

    try {
      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      await addDoc(collection(db, 'plants'), {
        ...data,
        userId: user.uid,
        photo: photoUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding plant:', error);
      throw new Error('Failed to add plant. Please check your internet connection and try again.');
    }
  };

  const updatePlant = async (
    id: string,
    data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    photo?: File
  ) => {
    if (!user?.uid) throw new Error('Please log in again to update your plant');

    try {
      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const plantRef = doc(db, 'plants', id);
      await updateDoc(plantRef, {
        ...data,
        ...(photoUrl && { photo: photoUrl }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating plant:', error);
      throw new Error('Failed to update plant. Please try again.');
    }
  };

  const deletePlant = async (id: string) => {
    if (!user?.uid) throw new Error('Please log in again to delete your plant');

    try {
      const plantRef = doc(db, 'plants', id);
      await deleteDoc(plantRef);
    } catch (error) {
      console.error('Error deleting plant:', error);
      throw new Error('Failed to delete plant. Please try again.');
    }
  };
  const updateWateringDate = async (id: string) => {
    if (!user?.uid) throw new Error('Please log in again to update watering date');

    try {
      const plantRef = doc(db, 'plants', id);
      await updateDoc(plantRef, {
        'wateringSchedule.lastWatered': new Date(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating watering date:', error);
      throw new Error('Failed to update watering date. Please try again.');
    }
  };

  return {
    plants,
    loading,
    error,
    addPlant,
    updatePlant,
    deletePlant,
    updateWateringDate,
  };
}