'use client';

import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function DashboardPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome to your Plant Dashboard</h1>
            <p className="mt-2 text-gray-600">Hello, {user.displayName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
        
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Your Plants</h2>
            <p className="mt-2 text-gray-600">Start adding your plants to track their care.</p>
          </div>
          
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Today's Tasks</h2>
            <p className="mt-2 text-gray-600">No pending tasks for today.</p>
          </div>
          
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Weather</h2>
            <p className="mt-2 text-gray-600">Weather information coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}