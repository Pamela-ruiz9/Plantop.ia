'use client';

import { format } from 'date-fns';
import type { Plant } from '@/types/plant';

interface PlantCardProps {
  plant: Plant;
  onWater: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlantCard({ plant, onWater, onEdit, onDelete }: PlantCardProps) {
  const getHealthStatusColor = () => {
    switch (plant.healthStatus) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'needsAttention':
        return 'bg-yellow-100 text-yellow-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="relative h-48">
        {plant.photo ? (
          <img
            src={plant.photo}
            alt={plant.commonName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <svg
              className="h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{plant.commonName}</h3>
            {plant.species && (
              <p className="text-sm text-gray-600 italic">{plant.species}</p>
            )}
          </div>
          {plant.healthStatus && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getHealthStatusColor()}`}
            >
              {plant.healthStatus}
            </span>
          )}
        </div>

        {plant.location && (
          <p className="mb-2 text-sm text-gray-600">
            Location: {plant.location}
          </p>
        )}

        {plant.lastWatered && (
          <p className="mb-2 text-sm text-gray-600">
            Last watered: {format(plant.lastWatered, 'PP')}
          </p>
        )}

        {plant.notes && (
          <p className="mb-4 text-sm text-gray-600">
            Notes: {plant.notes}
          </p>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onWater}
            className="inline-flex items-center rounded bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
          >
            Water
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center rounded bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center rounded bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}