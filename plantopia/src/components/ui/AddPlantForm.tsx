'use client';

import { useState } from 'react';
import type { Plant } from '@/types/plant';

interface AddPlantFormProps {
  onSubmit: (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => Promise<void>;
  onCancel: () => void;
  initialData?: Plant;
}

export function AddPlantForm({ onSubmit, onCancel, initialData }: AddPlantFormProps) {
  const [commonName, setCommonName] = useState(initialData?.commonName || '');
  const [species, setSpecies] = useState(initialData?.species || '');
  const [location, setLocation] = useState<'indoor' | 'outdoor' | undefined>(initialData?.location);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'needsAttention' | 'sick' | undefined>(
    initialData?.healthStatus
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photo, setPhoto] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [wateringFrequency, setWateringFrequency] = useState(
    initialData?.wateringSchedule?.frequency?.toString() || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonName) return;

    setLoading(true);
    try {
      await onSubmit(
        {
          commonName,
          species: species || undefined,
          location,
          healthStatus,
          notes: notes || undefined,
          wateringSchedule: wateringFrequency
            ? {
                frequency: parseInt(wateringFrequency, 10),
                lastWatered: new Date(),
              }
            : undefined,
        },
        photo
      );
    } catch (error) {
      console.error('Error submitting plant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="commonName" className="block text-sm font-medium text-gray-700">
          Common Name *
        </label>
        <input
          type="text"
          id="commonName"
          value={commonName}
          onChange={(e) => setCommonName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="species" className="block text-sm font-medium text-gray-700">
          Species
        </label>
        <input
          type="text"
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <select
          id="location"
          value={location || ''}
          onChange={(e) => setLocation(e.target.value as 'indoor' | 'outdoor' | undefined)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="">Select location</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </div>

      <div>
        <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700">
          Health Status
        </label>
        <select
          id="healthStatus"
          value={healthStatus || ''}
          onChange={(e) => setHealthStatus(e.target.value as 'healthy' | 'needsAttention' | 'sick' | undefined)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="">Select status</option>
          <option value="healthy">Healthy</option>
          <option value="needsAttention">Needs Attention</option>
          <option value="sick">Sick</option>
        </select>
      </div>

      <div>
        <label htmlFor="wateringFrequency" className="block text-sm font-medium text-gray-700">
          Watering Frequency (days)
        </label>
        <input
          type="number"
          id="wateringFrequency"
          value={wateringFrequency}
          onChange={(e) => setWateringFrequency(e.target.value)}
          min="1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
          Photo
        </label>
        <input
          type="file"
          id="photo"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0])}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-100"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !commonName}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Plant' : 'Add Plant'}
        </button>
      </div>
    </form>
  );
}