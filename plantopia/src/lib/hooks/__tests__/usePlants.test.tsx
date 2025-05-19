'use client';

import { renderHook, act } from '@testing-library/react';
import { usePlants } from '../usePlants';
import { useAuthContext } from '@/lib/contexts/AuthContext';
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

// Create mocks
jest.mock('@/lib/contexts/AuthContext');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('@/lib/firebase', () => ({
  db: {},
  storage: {}
}));

describe('usePlants', () => {
  const mockUser = { uid: 'user-1', email: 'test@example.com' };
  const mockPlants = [
    {
      id: 'plant-1',
      userId: mockUser.uid,
      commonName: 'Snake Plant',
      species: 'Sansevieria',
      location: 'indoor',
      healthStatus: 'healthy',
      notes: '',
      wateringSchedule: {
        frequency: 7,
        lastWatered: new Date(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: 'plant-2',
      userId: mockUser.uid,
      commonName: 'Monstera',
      species: 'Monstera deliciosa',
      location: 'indoor',
      healthStatus: 'healthy',
      notes: '',
      wateringSchedule: {
        frequency: 7,
        lastWatered: new Date(),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  const unsubscribeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AuthContext
    (useAuthContext as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    // Mock Firestore functions
    (collection as jest.Mock).mockReturnValue('plants-collection-ref');
    (query as jest.Mock).mockReturnValue('plants-query');
    (where as jest.Mock).mockReturnValue('plants-where');
    (orderBy as jest.Mock).mockReturnValue('plants-orderby');
    (doc as jest.Mock).mockReturnValue('plant-doc-ref');
    (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
      callback({
        docs: mockPlants.map(plant => ({
          id: plant.id,
          data: () => ({ ...plant }),
        })),
      });
      return unsubscribeMock;
    });
    (addDoc as jest.Mock).mockResolvedValue({ id: 'new-plant-id' });
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    // Mock Storage functions
    (ref as jest.Mock).mockReturnValue('storage-ref');
    (uploadBytes as jest.Mock).mockResolvedValue({ ref: 'uploaded-ref' });
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');
  });

  it('loads plants on mount', async () => {
    const { result } = renderHook(() => usePlants());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.plants).toHaveLength(mockPlants.length);
    expect(result.current.plants[0].id).toBe(mockPlants[0].id);
  });

  it('adds a new plant', async () => {
    const { result } = renderHook(() => usePlants());

    const newPlant = {
      commonName: 'New Plant',
      species: 'New Species',
      location: 'outdoor' as const,
      healthStatus: 'healthy' as const,
      notes: '',
      wateringSchedule: {
        frequency: 7,
        lastWatered: new Date(),
      },
    };

    await act(async () => {
      await result.current.addPlant(newPlant, undefined);
    });

    expect(addDoc).toHaveBeenCalledWith(
      'plants-collection-ref',
      expect.objectContaining({
        ...newPlant,
        userId: mockUser.uid,
      })
    );
  });

  it('updates an existing plant', async () => {
    const { result } = renderHook(() => usePlants());

    const plantId = 'plant-1';
    const updates = {
      commonName: 'Updated Plant Name',
      species: 'Updated Species',
      location: 'indoor' as const,
      healthStatus: 'healthy' as const,
      notes: 'Updated notes',
      wateringSchedule: {
        frequency: 7,
        lastWatered: new Date(),
      },
    };

    await act(async () => {
      await result.current.updatePlant(plantId, updates);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      'plant-doc-ref',
      expect.objectContaining({
        commonName: 'Updated Plant Name',
      })
    );
  });

  it('deletes a plant', async () => {
    const { result } = renderHook(() => usePlants());

    await act(async () => {
      await result.current.deletePlant('plant-1');
    });

    expect(deleteDoc).toHaveBeenCalledWith('plant-doc-ref');
  });

  it('updates watering date', async () => {
    const { result } = renderHook(() => usePlants());

    const plantId = 'plant-1';

    await act(async () => {
      await result.current.updateWateringDate(plantId);
    });

    expect(updateDoc).toHaveBeenCalledWith(
      'plant-doc-ref',
      expect.objectContaining({
        'wateringSchedule.lastWatered': expect.any(Date),
      })
    );
  });

  it('handles errors during plant operations', async () => {
    (addDoc as jest.Mock).mockRejectedValueOnce(new Error('Failed to add plant'));

    const { result } = renderHook(() => usePlants());

    const newPlant = {
      commonName: 'Error Plant',
      species: 'Error Species',
      location: 'indoor' as const,
      healthStatus: 'healthy' as const,
      notes: '',
      wateringSchedule: {
        frequency: 7,
        lastWatered: new Date(),
      },
    };

    await expect(result.current.addPlant(newPlant, undefined)).rejects.toThrow('Failed to add plant');
  });

  it('cleans up snapshot listener on unmount', () => {
    const { unmount } = renderHook(() => usePlants());
    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
