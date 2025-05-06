import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthContext';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/lib/hooks/useAuth');

const TestComponent = () => {
  const { user, loading } = useAuthContext();
  return (
    <div>
      {loading ? 'Loading...' : user ? `User: ${user.email}` : 'Not logged in'}
    </div>
  );
};

describe('AuthContext', () => {
  it('provides loading state', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('provides authenticated user state', () => {
    const mockUser = { email: 'test@example.com' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
  });

  it('provides unauthenticated state', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });
});