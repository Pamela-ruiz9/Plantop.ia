'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import type { Plant } from '@/types/plant';
import { Input } from '@/design-system/components/Input';
import { Select } from '@/design-system/components/Select';
import { Button } from '@/design-system/components/Button';
import { Typography } from '@/design-system/components/Typography';
import { Card } from '@/design-system/components/Card';
import { Container } from '@/design-system/components/Container';

interface AddPlantFormProps {
  onSubmit: (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => Promise<void>;
  onCancel: () => void;
  initialData?: Plant;
}

const locationOptions = [
  { value: '', label: 'Select location' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
];

const healthStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'needsAttention', label: 'Needs Attention' },
  { value: 'sick', label: 'Sick' },
];

export function AddPlantForm({ onSubmit, onCancel, initialData }: AddPlantFormProps) {
  const { user, loading: userLoading } = useAuthContext();
  const { showToast } = useToast();
  const router = useRouter();
  const [commonName, setCommonName] = useState(initialData?.commonName || '');
  const [species, setSpecies] = useState(initialData?.species || '');
  const [location, setLocation] = useState<'indoor' | 'outdoor' | undefined>(initialData?.location);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'needsAttention' | 'sick' | undefined>(
    initialData?.healthStatus
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photo, setPhoto] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wateringFrequency, setWateringFrequency] = useState(
    initialData?.wateringSchedule?.frequency?.toString() || ''
  );

  // Check authentication on mount and when user state changes
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const frequency = wateringFrequency ? parseInt(wateringFrequency, 10) : 7; // Default to 7 days if not specified
      const lastWatered = initialData?.wateringSchedule?.lastWatered 
        ? new Date(initialData.wateringSchedule.lastWatered)
        : new Date();
      
      const plantData = {
        commonName,
        species,
        location,
        healthStatus,
        notes,
        wateringSchedule: {
          frequency,
          lastWatered,
        },
      } as const;

      await onSubmit(plantData, photo);
      
      showToast(
        initialData 
          ? `Successfully updated ${commonName}`
          : `Successfully added ${commonName}`,
        'success'
      );
      
      // Cierra automáticamente el formulario después de enviar exitosamente
      onCancel();
      
      // Reset form after successful submission if it's not an update
      if (!initialData) {
        setCommonName('');
        setSpecies('');
        setLocation(undefined);
        setHealthStatus(undefined);
        setNotes('');
        setWateringFrequency('');
        setPhoto(undefined);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <Container maxWidth="sm" className="p-8">
        <div className="text-center">
          <Typography>Loading...</Typography>
        </div>
      </Container>
    );
  }

  if (!user) {
    return null; // The useEffect will handle the redirect
  }

  return (
    <Card variant="elevated" className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-status-error/10 p-4">
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="commonName"
            label="Common Name *"
            value={commonName}
            onChange={(e) => setCommonName(e.target.value)}
            required
            fullWidth
          />

          <Input
            id="species"
            label="Species"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            fullWidth
          />

          <Select
            id="location"
            label="Location"
            value={location || ''}
            options={locationOptions}
            onChange={(e) => setLocation(e.target.value as 'indoor' | 'outdoor' | undefined)}
            fullWidth
          />

          <Select
            id="healthStatus"
            label="Health Status"
            value={healthStatus || ''}
            options={healthStatusOptions}
            onChange={(e) => setHealthStatus(e.target.value as 'healthy' | 'needsAttention' | 'sick' | undefined)}
            fullWidth
          />

          <Input
            id="wateringFrequency"
            type="number"
            label="Watering Frequency (days)"
            value={wateringFrequency}
            onChange={(e) => setWateringFrequency(e.target.value)}
            min="1"
            fullWidth
          />

          <div className="space-y-2">
            <Typography as="label" variant="body2" htmlFor="notes">
              Notes
            </Typography>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border-border-main bg-background-default px-3 py-2 text-base focus:border-primary-main focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="body2" htmlFor="photo">
              Photo
            </Typography>
            <Input
              type="file"
              id="photo"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0])}
              fullWidth
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {initialData ? 'Update' : 'Add'} Plant
          </Button>
        </div>
      </form>
    </Card>
  );
}