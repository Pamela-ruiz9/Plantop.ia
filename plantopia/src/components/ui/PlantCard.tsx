'use client';

import { format } from 'date-fns';
import type { Plant } from '@/types/plant';
import { Card } from '@/design-system/components/Card';
import { Typography } from '@/design-system/components/Typography';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Avatar } from '@/design-system/components/Avatar';

interface PlantCardProps {
  plant: Plant;
  onWater: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const healthStatusVariants = {
  healthy: 'success',
  needsAttention: 'warning',
  sick: 'error',
  unknown: 'default',
} as const;

const healthStatusLabels = {
  healthy: 'Healthy',
  needsAttention: 'Needs Attention',
  sick: 'Sick',
  unknown: 'Unknown Status',
} as const;

export function PlantCard({ plant, onWater, onEdit, onDelete }: PlantCardProps) {
  const healthStatus = plant.healthStatus || 'unknown';
  const badgeVariant = healthStatusVariants[healthStatus] as 'success' | 'warning' | 'error' | 'default';
  const statusLabel = healthStatusLabels[healthStatus];

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="relative h-48">
        {plant.photo ? (
          <img
            src={plant.photo}
            alt={plant.commonName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Avatar
              src={null}
              alt={plant.commonName}
              size="xl"
              fallback={plant.commonName}
              className="h-24 w-24"
            />
          </div>
        )}
      </div>

      <Card.Content>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Typography variant="h4" className="mb-1">{plant.commonName}</Typography>
            {plant.species && (
              <Typography variant="body2" color="secondary" className="italic">
                {plant.species}
              </Typography>
            )}
          </div>
          {plant.healthStatus && (
            <Badge variant={badgeVariant} size="sm">
              {statusLabel}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {plant.location && (
            <div className="flex items-center gap-2">
              <Typography variant="body2" color="secondary">
                Location:
              </Typography>
              <Typography variant="body2">
                {plant.location === 'indoor' ? 'Indoor' : 'Outdoor'}
              </Typography>
            </div>
          )}

          {plant.wateringSchedule?.lastWatered && (
            <div className="flex items-center gap-2">
              <Typography variant="body2" color="secondary">
                Last watered:
              </Typography>
              <Typography variant="body2">
                {format(new Date(plant.wateringSchedule.lastWatered), 'PP')}
              </Typography>
            </div>
          )}

          {plant.notes && (
            <div className="mt-4">
              <Typography variant="body2" color="secondary">
                Notes:
              </Typography>
              <Typography variant="body2" className="mt-1">
                {plant.notes}
              </Typography>
            </div>
          )}
        </div>
      </Card.Content>

      <Card.Footer className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onWater}
        >
          Water Plant
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          color="error"
          onClick={onDelete}
        >
          Delete
        </Button>
      </Card.Footer>
    </Card>
  );
}