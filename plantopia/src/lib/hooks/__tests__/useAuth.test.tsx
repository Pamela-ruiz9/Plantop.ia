'use client';

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

describe('useAuth', () => {
  let authStateCallback: (user: User | null) => void;

  beforeEach(() => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      authStateCallback = callback;
      return () => {};
    });
  });

  it('initializes with loading state and no user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('updates state when auth state changes', () => {
    const { result } = renderHook(() => useAuth());
    const mockUser = { uid: '123', email: 'test@example.com' } as User;

    act(() => {
      authStateCallback(mockUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(mockUser);
  });

  it('handles sign out', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authStateCallback(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('cleans up listener on unmount', () => {
    const unsubscribeMock = jest.fn();
    (auth.onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});