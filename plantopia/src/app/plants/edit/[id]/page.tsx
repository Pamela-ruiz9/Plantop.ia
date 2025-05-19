'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlants } from '@/lib/hooks/usePlants';
import { AddPlantForm } from '@/components/ui/AddPlantForm';
import { Typography } from '@/design-system/components/Typography';
import { Container } from '@/design-system/components/Container';
import { Button } from '@/design-system/components/Button';
import type { Plant } from '@/types/plant';

interface EditPlantPageProps {
  params: {
    id: string;
  };
}

export default function EditPlantPage({ params }: EditPlantPageProps) {
  const { id } = params;
  const { plants, updatePlant, loading: plantsLoading } = usePlants();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!plantsLoading) {
      const foundPlant = plants.find(p => p.id === id);
      if (foundPlant) {
        setPlant(foundPlant);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
  }, [id, plants, plantsLoading]);

  const handleUpdatePlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    try {
      await updatePlant(id, data, photo);
      router.push('/plants');
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  };

  if (loading || plantsLoading) {
    return (
      <Container maxWidth="md" className="py-8">
        <Typography>Loading plant data...</Typography>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="md" className="py-8">
        <div className="text-center">
          <Typography variant="h2" className="mb-4 text-status-error">
            Plant Not Found
          </Typography>
          <Typography className="mb-6">
            The plant you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          <Button variant="primary" onClick={() => router.push('/plants')}>
            Back to Plants
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h1" className="mb-6 text-center text-green-700">
        Edit Plant: {plant?.commonName}
      </Typography>
      
      {plant && (
        <AddPlantForm 
          onSubmit={handleUpdatePlant}
          onCancel={() => router.push('/plants')}
          initialData={plant}
        />
      )}
    </Container>
  );
}
