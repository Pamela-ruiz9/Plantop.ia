import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));