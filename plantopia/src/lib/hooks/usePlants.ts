'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from './useUser';
import type { Plant } from '@/types/plant';

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid) {
      setPlants([]);
      setLoading(false);
      return;
    }

    const plantsQuery = query(
      collection(db, 'plants'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(plantsQuery, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const uploadPhoto = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `plant-photos/${user?.uid}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const addPlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    if (!user?.uid) throw new Error('User not authenticated');

    let photoUrl: string | undefined;
    if (photo) {
      photoUrl = await uploadPhoto(photo);
    }

    const now = new Date();
    await addDoc(collection(db, 'plants'), {
      ...data,
      userId: user.uid,
      photo: photoUrl,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updatePlant = async (
    id: string,
    data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    photo?: File
  ) => {
    if (!user?.uid) throw new Error('User not authenticated');

    let photoUrl: string | undefined;
    if (photo) {
      photoUrl = await uploadPhoto(photo);
    }

    const plantRef = doc(db, 'plants', id);
    await updateDoc(plantRef, {
      ...data,
      ...(photoUrl && { photo: photoUrl }),
      updatedAt: new Date(),
    });
  };

  const deletePlant = async (id: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    const plantRef = doc(db, 'plants', id);
    await deleteDoc(plantRef);
  };

  const updateWateringDate = async (id: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    const plantRef = doc(db, 'plants', id);
    await updateDoc(plantRef, {
      lastWatered: new Date(),
      updatedAt: new Date(),
    });
  };

  return {
    plants,
    loading,
    addPlant,
    updatePlant,
    deletePlant,
    updateWateringDate,
  };
}