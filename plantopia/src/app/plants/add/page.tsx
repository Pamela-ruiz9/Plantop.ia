'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddPlantForm } from '@/components/ui/AddPlantForm';
import { usePlants } from '@/lib/hooks/usePlants';
import { Typography } from '@/design-system/components/Typography';
import { Container } from '@/design-system/components/Container';

export default function AddPlantPage() {
  const { addPlant } = usePlants();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPlant = async (data: any, photo?: File) => {
    setIsSubmitting(true);
    try {
      await addPlant(data, photo);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding plant:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h1" className="mb-6 text-center text-green-700">
        Add New Plant
      </Typography>
      
      <AddPlantForm 
        onSubmit={handleAddPlant}
        onCancel={() => router.push('/dashboard')}
      />
    </Container>
  );
}
