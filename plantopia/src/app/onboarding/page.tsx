'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { useEffect, useState } from 'react';

const onboardingSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert']),
  preferredPlants: z.array(z.string()).min(1, 'Select at least one plant type'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const plantTypes = [
  'Indoor Plants',
  'Succulents',
  'Herbs',
  'Vegetables',
  'Flowers',
  'Tropical Plants',
  'Air Plants',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useUser();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
  });

  const detectLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const locationData = data[0];
          setValue('location', `${locationData.name}, ${locationData.country}`);
        } else {
          setValue('location', '');
          setLocationError('Could not detect your location. Please enter it manually.');
          console.error('Location data not found:', data);
        }
      } else {
        setLocationError('Geolocation is not supported by your browser.');
      }
    } catch (error) {
      setLocationError('Failed to detect location. Please enter it manually.');
      console.error('Error detecting location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const onSubmit = async (data: OnboardingForm) => {
    await updateProfile({
      ...data,
      completedOnboarding: true,
    });
    router.push('/dashboard');
  };

  useEffect(() => {
    if (profile?.completedOnboarding) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Plantop.ia</h1>
          <p className="mt-2 text-gray-600">Let's personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Your Location
              </label>
              <button
                type="button"
                onClick={detectLocation}
                className="text-sm text-green-600 hover:text-green-700"
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>
            <input
              type="text"
              {...register('location')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter your city"
            />
            {locationError && (
              <p className="mt-1 text-sm text-red-600">{locationError}</p>
            )}
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Experience Level
            </label>
            <select
              {...register('experienceLevel')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Select your experience level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            {errors.experienceLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.experienceLevel.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preferred Plant Types
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {plantTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    value={type}
                    {...register('preferredPlants')}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{type}</span>
                </label>
              ))}
            </div>
            {errors.preferredPlants && (
              <p className="mt-1 text-sm text-red-600">{errors.preferredPlants.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}