'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlants } from '@/lib/hooks/usePlants';
import { Typography } from '@/design-system/components/Typography';
import { Container } from '@/design-system/components/Container';
import { Button } from '@/design-system/components/Button';
import { PlantCard } from '@/components/ui/PlantCard';
import { useToast } from '@/lib/contexts/ToastContext';

export default function PlantsPage() {
  const { plants, loading, error, deletePlant, updateWateringDate } = usePlants();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isWatering, setIsWatering] = useState<string | null>(null);

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h1" className="mb-6 text-center text-green-700">
          My Plants
        </Typography>
        <div className="text-center">
          <Typography>Loading your plants...</Typography>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Typography variant="h1" className="mb-6 text-center text-green-700">
          My Plants
        </Typography>
        <div className="rounded-md bg-status-error/10 p-4">
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </div>
      </Container>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        setIsDeleting(id);
        await deletePlant(id);
        showToast(`${name} has been deleted`, 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete plant';
        showToast(errorMessage, 'error');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleWatering = async (id: string, name: string) => {
    try {
      setIsWatering(id);
      await updateWateringDate(id);
      showToast(`Watering recorded for ${name}`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update watering date';
      showToast(errorMessage, 'error');
    } finally {
      setIsWatering(null);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h1" className="text-green-700">
          My Plants
        </Typography>
        <Link href="/plants/add">
          <Button variant="primary">
            Add New Plant
          </Button>
        </Link>
      </div>

      {plants.length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-lg">
          <Typography variant="h3" className="mb-4 text-green-700">
            No plants yet
          </Typography>
          <Typography variant="body1" className="mb-6">
            Start building your collection by adding your first plant.
          </Typography>
          <Link href="/plants/add">
            <Button variant="primary">
              Add Your First Plant
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onDelete={() => handleDelete(plant.id, plant.commonName)}
              onWater={() => handleWatering(plant.id, plant.commonName)}
              onEdit={() => `/plants/edit/${plant.id}`}
              isDeleting={isDeleting === plant.id}
              isWatering={isWatering === plant.id}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
