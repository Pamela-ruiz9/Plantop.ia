'use client';

import { renderHook, act } from '@testing-library/react';
import { useUser } from '../useUser';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/lib/contexts/AuthContext');
jest.mock('firebase/firestore');

describe('useUser', () => {
  const mockDate = new Date('2023-01-01T00:00:00.000Z');
  const mockFirestoreTimestamp = {
    toDate: () => mockDate,
    seconds: mockDate.getTime() / 1000,
    nanoseconds: 0
  };
  
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthContext as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('loads user profile on mount', async () => {
    const mockProfile = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      createdAt: mockFirestoreTimestamp,
      updatedAt: mockFirestoreTimestamp,
      completedOnboarding: true,
    };

    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile
    });

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.profile).toEqual({
      ...mockProfile,
      createdAt: mockDate,
      updatedAt: mockDate
    });
    expect(result.current.loading).toBe(false);
  });

  it('creates new profile for new users', async () => {
    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        completedOnboarding: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    );
    expect(result.current.loading).toBe(false);
  });

  it('handles profile updates', async () => {
    const mockProfile = {
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      createdAt: mockFirestoreTimestamp,
      updatedAt: mockFirestoreTimestamp,
      completedOnboarding: false,
    };

    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile
    });
    (setDoc as jest.Mock).mockImplementation((ref, data) => Promise.resolve());

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateProfile({ completedOnboarding: true });
    });

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        completedOnboarding: true,
        updatedAt: expect.any(Date)
      }),
      expect.anything()
    );

    expect(result.current.profile?.completedOnboarding).toBe(true);
  });

  it('handles error during profile load', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('clears profile when user is not authenticated', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});