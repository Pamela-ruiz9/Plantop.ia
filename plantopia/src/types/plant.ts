export interface Plant {
  id: string;
  userId: string;
  commonName: string;
  species?: string;
  photo?: string;
  location?: 'indoor' | 'outdoor';
  healthStatus?: 'healthy' | 'needsAttention' | 'sick';
  notes?: string;
  lastWatered?: Date;
  wateringSchedule?: {
    frequency: number; // in days
    lastWatered: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}