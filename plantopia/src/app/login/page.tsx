import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Plantop.ia',
  description: 'Sign in to your Plantop.ia account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome to Plantop.ia</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to start managing your plant care journey
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}