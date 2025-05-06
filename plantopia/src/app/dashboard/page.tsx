'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { usePlants } from '@/lib/hooks/usePlants';
import { PlantCard } from '@/components/ui/PlantCard';
import { AddPlantForm } from '@/components/ui/AddPlantForm';
import { Toast } from '@/components/ui/Toast';
import type { Plant } from '@/types/plant';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function DashboardPage() {
  const { profile } = useUser();
  const { plants, loading, addPlant, updatePlant, deletePlant, updateWateringDate } = usePlants();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
  };

  const handleAddPlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    try {
      await addPlant(data, photo);
      setShowAddForm(false);
      showToast('Plant added successfully');
    } catch (error) {
      showToast('Failed to add plant', 'error');
    }
  };

  const handleUpdatePlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, photo?: File) => {
    if (!editingPlant) return;
    try {
      await updatePlant(editingPlant.id, data, photo);
      setEditingPlant(null);
      showToast('Plant updated successfully');
    } catch (error) {
      showToast('Failed to update plant', 'error');
    }
  };

  const handleDeletePlant = async (id: string) => {
    if (confirm('Are you sure you want to delete this plant?')) {
      try {
        await deletePlant(id);
        showToast('Plant deleted successfully');
      } catch (error) {
        showToast('Failed to delete plant', 'error');
      }
    }
  };

  const handleWaterPlant = async (id: string) => {
    try {
      await updateWateringDate(id);
      showToast('Watering date updated');
    } catch (error) {
      showToast('Failed to update watering date', 'error');
    }
  };

  if (!profile?.completedOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Complete Your Profile</h2>
          <p className="mt-2 text-gray-600">Please complete the onboarding process to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading your plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile.displayName}</h1>
            <p className="mt-1 text-gray-600">Manage your plant collection</p>
          </div>
          {!showAddForm && !editingPlant && (
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Add New Plant
            </button>
          )}
        </div>

        {(showAddForm || editingPlant) && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold">
              {editingPlant ? 'Edit Plant' : 'Add New Plant'}
            </h2>
            <AddPlantForm
              onSubmit={editingPlant ? handleUpdatePlant : handleAddPlant}
              onCancel={() => {
                setShowAddForm(false);
                setEditingPlant(null);
              }}
              initialData={editingPlant || undefined}
            />
          </div>
        )}

        {plants.length === 0 && !showAddForm ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h3 className="text-lg font-medium">No plants yet</h3>
            <p className="mt-2 text-gray-600">Add your first plant to get started!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Add Plant
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onWater={() => handleWaterPlant(plant.id)}
                onEdit={() => setEditingPlant(plant)}
                onDelete={() => handleDeletePlant(plant.id)}
              />
            ))}
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}