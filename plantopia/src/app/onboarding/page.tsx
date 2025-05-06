'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';

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
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingForm) => {
    await updateProfile({
      ...data,
      completedOnboarding: true,
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Plantop.ia</h1>
          <p className="mt-2 text-gray-600">Let's personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Location
            </label>
            <input
              type="text"
              {...register('location')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter your city"
            />
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