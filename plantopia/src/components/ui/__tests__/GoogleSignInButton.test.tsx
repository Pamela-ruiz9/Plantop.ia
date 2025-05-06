'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn()
  })),
  signInWithPopup: jest.fn()
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
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'mock-token' })
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