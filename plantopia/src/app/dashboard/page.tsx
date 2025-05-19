'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { usePlants } from '@/lib/hooks/usePlants';
import { PlantCard } from '@/components/ui/PlantCard';
import { AddPlantForm } from '@/components/ui/AddPlantForm';
import { Typography } from '@/design-system/components/Typography';
import { Button } from '@/design-system/components/Button';
import { Container } from '@/design-system/components/Container';
import { useToast } from '@/lib/contexts/ToastContext';
import type { Plant } from '@/types/plant';

export default function DashboardPage() {
  const { profile, updateProfile } = useUser();
  const { showToast } = useToast();
  const { plants, loading, addPlant, updatePlant, deletePlant, updateWateringDate } = usePlants();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [skipOnboarding, setSkipOnboarding] = useState(false);

  const handleAddPlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    try {
      await addPlant(data, photo);
      setShowAddForm(false);
      showToast('Planta añadida exitosamente', 'success');
    } catch (error) {
      showToast('Error al añadir la planta', 'error');
    }
  };

  const handleUpdatePlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    if (!editingPlant) return;
    try {
      await updatePlant(editingPlant.id, data, photo);
      setEditingPlant(null);
      showToast('Planta actualizada exitosamente', 'success');
    } catch (error) {
      showToast('Error al actualizar la planta', 'error');
    }
  };

  const handleDeletePlant = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta planta?')) {
      try {
        await deletePlant(id);
        showToast('Planta eliminada exitosamente', 'success');
      } catch (error) {
        showToast('Error al eliminar la planta', 'error');
      }
    }
  };

  const handleWaterPlant = async (id: string) => {
    try {
      await updateWateringDate(id);
      showToast('Fecha de riego actualizada', 'success');
    } catch (error) {
      showToast('Error al actualizar la fecha de riego', 'error');
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      await updateProfile({
        ...profile,
        completedOnboarding: true,
      });
      setSkipOnboarding(true);
      showToast('Dashboard accesible ahora', 'success');
    } catch (error) {
      showToast('Error al actualizar el perfil', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <Typography variant="body2" className="mt-2 text-gray-600">Cargando tus plantas...</Typography>
        </div>
      </Container>
    );
  }

  if (!profile?.completedOnboarding && !skipOnboarding) {
    return (
      <Container maxWidth="sm" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Typography variant="h3" className="mb-4">Completa tu Perfil</Typography>
          <Typography variant="body1" color="secondary" className="mb-6">
            Para una mejor experiencia, recomendamos completar la configuración inicial de tu perfil.
          </Typography>
          <div className="space-y-4">
            <Button
              variant="primary"
              onClick={() => window.location.href = '/onboarding'}
              className="w-full"
            >
              Ir a Configuración
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipOnboarding}
              className="w-full"
            >
              Saltar por ahora
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <Container maxWidth="2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Typography variant="h2">Bienvenido, {profile?.displayName}</Typography>
            <Typography variant="body1" color="secondary" className="mt-1">
              Gestiona tu colección de plantas
            </Typography>
          </div>
          {!showAddForm && !editingPlant && (
            <Button
              variant="primary"
              onClick={() => setShowAddForm(true)}
            >
              Añadir Planta
            </Button>
          )}
        </div>

        {showAddForm && (
          <div className="mb-8">
            <AddPlantForm
              onSubmit={handleAddPlant}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {editingPlant && (
          <div className="mb-8">
            <AddPlantForm
              initialData={editingPlant}
              onSubmit={handleUpdatePlant}
              onCancel={() => setEditingPlant(null)}
            />
          </div>
        )}

        {!showAddForm && !editingPlant && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={() => handleWaterPlant(plant.id)}
                onEdit={() => setEditingPlant(plant)}
                onDelete={() => handleDeletePlant(plant.id)}
              />
            ))}
            {plants.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Typography variant="h4" className="mb-2">No tienes plantas aún</Typography>
                <Typography variant="body1" color="secondary">
                  Comienza añadiendo tu primera planta
                </Typography>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}