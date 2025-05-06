'use client';

import { renderHook, act } from '@testing-library/react';
import { useUser } from '../useUser';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock dependencies
jest.mock('@/lib/contexts/AuthContext');
jest.mock('firebase/firestore');

describe('useUser', () => {
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
      id: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      createdAt: new Date(),
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

    expect(result.current.profile).toEqual(mockProfile);
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
        id: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        completedOnboarding: false
      })
    );
    expect(result.current.loading).toBe(false);
  });

  it('handles profile updates', async () => {
    const mockProfile = {
      id: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      createdAt: new Date(),
      completedOnboarding: false,
    };

    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile
    });
    (setDoc as jest.Mock).mockImplementation((ref, data) => {
      mockProfile.completedOnboarding = data.completedOnboarding;
      return Promise.resolve();
    });

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
        completedOnboarding: true
      })
    );
    expect(result.current.profile?.completedOnboarding).toBe(true);
  });

  it('handles updateProfile when user is not authenticated', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.updateProfile({ completedOnboarding: true });
    });

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('handles loading state while fetching profile', async () => {
    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 100));
    (getDoc as jest.Mock).mockReturnValue(loadingPromise);

    const { result } = renderHook(() => useUser());
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await loadingPromise;
    });
  });

  it('handles error during profile fetch', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user profile:', expect.any(Error));
    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toBe(null);

    consoleErrorSpy.mockRestore();
  });

  it('handles error during profile update', async () => {
    const mockProfile = {
      id: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      createdAt: new Date(),
      completedOnboarding: false,
    };

    (doc as jest.Mock).mockReturnValue({ id: 'test-doc' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (setDoc as jest.Mock).mockRejectedValue(new Error('Update error'));

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateProfile({ completedOnboarding: true });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating user profile:', expect.any(Error));
    expect(result.current.profile?.completedOnboarding).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});