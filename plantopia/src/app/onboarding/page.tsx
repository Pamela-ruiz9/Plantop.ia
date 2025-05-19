'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useUser';
import { useEffect, useState } from 'react';
import { useToast } from '@/lib/contexts/ToastContext';

const onboardingSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert'], {
    required_error: 'Please select your experience level'
  }),
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
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { register, handleSubmit, setValue, formState: { errors, isValid } } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      experienceLevel: profile?.experienceLevel || undefined,
      location: profile?.location || '',
      preferredPlants: profile?.preferredPlants || []
    }
  });

  const detectLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeather API key is not configured:', process.env);
      setLocationError('Location detection is temporarily unavailable. Please enter your location manually.');
      setIsLoadingLocation(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLoadingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('Geolocation error:', error);
            reject(new Error('Failed to get your location. Please allow location access.'));
          },
          { timeout: 10000, maximumAge: 0 }
        );
      });

      const url = new URL('https://api.openweathermap.org/geo/1.0/reverse');
      url.searchParams.append('lat', position.coords.latitude.toString());
      url.searchParams.append('lon', position.coords.longitude.toString());
      url.searchParams.append('limit', '1');
      url.searchParams.append('appid', apiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const locationData = data[0];
        setValue('location', `${locationData.name}, ${locationData.country}`, { 
          shouldValidate: true 
        });
      } else {
        setLocationError('Could not detect your location. Please enter it manually.');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setLocationError('Failed to detect location. Please enter it manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };
  const onSubmit = async (data: OnboardingForm) => {
    if (!profile) {
      showToast('Please sign in to continue', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        location: data.location,
        experienceLevel: data.experienceLevel,
        preferredPlants: data.preferredPlants,
        completedOnboarding: true,
      });
      showToast('¡Configuración completada exitosamente!', 'success');
      
      // Mostrar un breve retardo antes de redirigir para que el usuario vea el mensaje
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error al completar la configuración. Por favor intenta de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (profile?.completedOnboarding) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                className="text-sm text-green-600 hover:text-green-700 disabled:text-gray-400"
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>
            <input
              type="text"
              {...register('location')}
              className={`mt-1 block w-full rounded-md border ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
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
              className={`mt-1 block w-full rounded-md border ${
                errors.experienceLevel ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
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
          </div>          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={`w-full rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              isSubmitting || !isValid
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
          {/* Botón fuera del formulario para evitar conflictos con la validación */}
        <div className="mt-4">
          <Link href="/" passHref>
            <div className="w-full rounded-md bg-white border border-green-600 px-4 py-2 text-green-600 hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center cursor-pointer">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al Menú Principal
            </div>
          </Link>
        </div>

        <div className="mt-6 flex justify-center">
          <Link href="/" passHref>
            <div className="text-green-600 hover:text-green-700 font-medium flex items-center cursor-pointer">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancelar y volver
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}