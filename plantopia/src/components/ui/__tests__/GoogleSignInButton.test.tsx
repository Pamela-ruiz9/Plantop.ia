'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Firebase Auth
const mockProvider = {
  addScope: jest.fn(),
  setCustomParameters: jest.fn(),
};

const mockGoogleAuthProvider = jest.fn(() => mockProvider);

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: function() {
    return mockProvider;
  },
  signInWithPopup: jest.fn()
}));

// Mock Firebase instance
jest.mock('@/lib/firebase', () => ({
  auth: {}
}));

describe('GoogleSignInButton', () => {
  const mockSignInWithPopup = signInWithPopup as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithPopup.mockResolvedValue({
      user: {
        getIdToken: () => Promise.resolve('mock-token')
      }
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders sign in button', () => {
    render(<GoogleSignInButton />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('handles sign in click and redirects to dashboard', async () => {
    render(<GoogleSignInButton />);
    const button = screen.getByText('Sign in with Google');
    
    await fireEvent.click(button);

    await waitFor(() => {
      expect(mockProvider.addScope).toHaveBeenCalledWith('https://www.googleapis.com/auth/userinfo.profile');
      expect(mockProvider.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
      expect(mockSignInWithPopup).toHaveBeenCalledWith({}, mockProvider);      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: 'mock-token' })
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles sign in error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSignInWithPopup.mockRejectedValueOnce(new Error('Auth error'));

    render(<GoogleSignInButton />);
    const button = screen.getByText('Sign in with Google');
    
    await fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing in with Google:', expect.any(Error));
      expect(mockPush).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});