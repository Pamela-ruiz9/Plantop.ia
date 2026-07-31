import { describe, it, expect, vi, beforeEach } from 'vitest';

// Storage mock defined at module scope so it can be referenced in vi.mock factory
const mockStorage = {
  upload: vi.fn().mockResolvedValue({ data: { path: 'user1/plant1.jpg' }, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/plant-photos/user1/plant1.jpg' },
  }),
  remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
};

// Mock chain for .from('plants') queries
const mockChain = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  in: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
};

// Mock supabase BEFORE importing plants
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
    storage: {
      from: vi.fn(() => mockStorage),
    },
  },
}));

import {
  listPlants,
  getPlant,
  createPlant,
  updatePlant,
  deletePlant,
  uploadPlantPhoto,
  deletePlantPhoto,
} from './plants';

const MOCK_PLANT = {
  id: '1',
  user_id: 'user1',
  common_name: 'Pothos',
  species: 'Epipremnum aureum',
  photo_url: null,
  species_id: null,
  location: 'indoor' as const,
  health_status: 'healthy' as const,
  notes: null,
  substrate_mix: null,
  substrate_ph: null,
  substrate_last_changed: null,
  light_type: null,
  light_hours_per_day: null,
  light_placement: null,
  watering_frequency_days: null,
  last_watered: null,
  fertilizing_frequency_days: null,
  last_fertilized: null,
  current_phase: 'vegetative' as const,
  current_phase_started_at: '2026-01-01',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  plant_catalog: null,
};

beforeEach(() => {
  vi.clearAllMocks();

  // Reset chain defaults
  mockChain.select.mockReturnThis();
  mockChain.order.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });
  mockChain.insert.mockReturnThis();
  mockChain.update.mockReturnThis();
  mockChain.delete.mockReturnThis();
  mockChain.single.mockResolvedValue({ data: null, error: null });
  mockChain.in.mockReturnThis();
  mockChain.is.mockReturnThis();

  // Reset storage defaults
  mockStorage.upload.mockResolvedValue({ data: { path: 'user1/plant1.jpg' }, error: null });
  mockStorage.getPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/plant-photos/user1/plant1.jpg' },
  });
  mockStorage.remove.mockResolvedValue({ data: {}, error: null });
});

describe('listPlants', () => {
  it('returns an array of plants including plant_catalog field', async () => {
    mockChain.order.mockResolvedValueOnce({ data: [MOCK_PLANT], error: null });

    const result = await listPlants('user1');

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty('plant_catalog');
    expect(result[0].plant_catalog).toBeNull();
  });

  it('returns [] when data is null', async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: null });

    const result = await listPlants('user1');
    expect(result).toEqual([]);
  });

  it('throws when there is an error', async () => {
    mockChain.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

    await expect(listPlants('user1')).rejects.toThrow('DB error');
  });
});

describe('getPlant', () => {
  it('returns a plant with plant_catalog field', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: MOCK_PLANT, error: null });

    const result = await getPlant('user1', '1');

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('plant_catalog');
    expect(result!.plant_catalog).toBeNull();
  });

  it('returns null when not found', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getPlant('user1', '999');
    expect(result).toBeNull();
  });

  it('throws when there is an error', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

    await expect(getPlant('user1', '1')).rejects.toThrow('DB error');
  });
});

describe('createPlant', () => {
  it('inserts a plant and returns it', async () => {
    const newPlant = { ...MOCK_PLANT };
    mockChain.single.mockResolvedValueOnce({ data: newPlant, error: null });

    const result = await createPlant('user1', {
      common_name: 'Pothos',
      species: null,
      photo_url: null,
      species_id: null,
      location: null,
      health_status: null,
      notes: null,
      substrate_mix: null,
      substrate_ph: null,
      substrate_last_changed: null,
      light_type: null,
      light_hours_per_day: null,
      light_placement: null,
      watering_frequency_days: null,
      last_watered: null,
      fertilizing_frequency_days: null,
      last_fertilized: null,
      current_phase: 'vegetative',
      current_phase_started_at: '2026-01-01',
    });

    expect(result.common_name).toBe('Pothos');
  });
});

describe('updatePlant', () => {
  it('updates and returns the plant', async () => {
    const updated = { ...MOCK_PLANT, common_name: 'Updated Pothos' };
    mockChain.single.mockResolvedValueOnce({ data: updated, error: null });

    const result = await updatePlant('1', { common_name: 'Updated Pothos' });
    expect(result.common_name).toBe('Updated Pothos');
  });
});

describe('deletePlant', () => {
  it('deletes without throwing', async () => {
    mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

    await expect(deletePlant('1')).resolves.toBeUndefined();
  });
});

describe('uploadPlantPhoto', () => {
  it('returns a public URL string after upload', async () => {
    const file = new File(['photo'], 'plant.jpg', { type: 'image/jpeg' });

    const url = await uploadPlantPhoto(file, 'user1', 'plant1');

    expect(typeof url).toBe('string');
    expect(url).toContain('plant-photos');
    expect(url).toContain('user1/plant1.jpg');
  });

  it('throws when upload fails', async () => {
    mockStorage.upload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed') });

    const file = new File(['photo'], 'plant.jpg', { type: 'image/jpeg' });

    await expect(uploadPlantPhoto(file, 'user1', 'plant1')).rejects.toThrow('Upload failed');
  });
});

describe('deletePlantPhoto', () => {
  it('calls storage remove with the path extracted from URL', async () => {
    const url = 'https://supabase.co/storage/v1/object/public/plant-photos/user1/plant1.jpg';

    await deletePlantPhoto(url);

    expect(mockStorage.remove).toHaveBeenCalledWith(['user1/plant1.jpg']);
  });

  it('throws when remove fails', async () => {
    mockStorage.remove.mockResolvedValueOnce({ data: null, error: new Error('Remove failed') });

    const url = 'https://supabase.co/storage/v1/object/public/plant-photos/user1/plant1.jpg';

    await expect(deletePlantPhoto(url)).rejects.toThrow('Remove failed');
  });

  it('deletePlantPhoto throws on unexpected URL format', async () => {
    await expect(deletePlantPhoto('https://example.com/not-storage/file.jpg')).rejects.toThrow('Unexpected photo URL format');
  });
});
