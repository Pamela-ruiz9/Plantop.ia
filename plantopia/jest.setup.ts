import '@testing-library/jest-dom';

// Mock Firebase
// Mock Firebase
jest.mock('@/lib/firebase', () => {
  const mockDoc = jest.fn();
  const mockCollection = jest.fn(() => ({
    doc: mockDoc,
  }));
  
  return {
    auth: {
      signInWithPopup: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChanged: jest.fn((callback) => {
        callback({ uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' });
        return () => {};
      }),
    },
    db: {
      collection: mockCollection,
      doc: mockDoc,
    },
  };
});

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}));