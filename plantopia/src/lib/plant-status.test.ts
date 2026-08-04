import { describe, it, expect } from 'vitest';
import { isCareOverdue, isWateringOverdue, isFertilizingOverdue } from './plant-status';

const TODAY = new Date('2026-08-15T12:00:00');

describe('isWateringOverdue', () => {
  it('returns false when watering_frequency_days is null', () => {
    expect(isWateringOverdue({ watering_frequency_days: null, last_watered: '2026-08-01' }, TODAY)).toBe(false);
  });

  it('returns false when last_watered is null', () => {
    expect(isWateringOverdue({ watering_frequency_days: 7, last_watered: null }, TODAY)).toBe(false);
  });

  it('returns false exactly on the frequency boundary', () => {
    // 2026-08-08 -> 2026-08-15 is exactly 7 days
    expect(isWateringOverdue({ watering_frequency_days: 7, last_watered: '2026-08-08' }, TODAY)).toBe(false);
  });

  it('returns true one day past the frequency boundary', () => {
    expect(isWateringOverdue({ watering_frequency_days: 7, last_watered: '2026-08-07' }, TODAY)).toBe(true);
  });

  it('returns false when watered today', () => {
    expect(isWateringOverdue({ watering_frequency_days: 7, last_watered: '2026-08-15' }, TODAY)).toBe(false);
  });
});

describe('isFertilizingOverdue', () => {
  it('returns false when fertilizing_frequency_days is null', () => {
    expect(isFertilizingOverdue({ fertilizing_frequency_days: null, last_fertilized: '2026-08-01' }, TODAY)).toBe(false);
  });

  it('returns false when last_fertilized is null', () => {
    expect(isFertilizingOverdue({ fertilizing_frequency_days: 30, last_fertilized: null }, TODAY)).toBe(false);
  });

  it('returns true when overdue', () => {
    expect(isFertilizingOverdue({ fertilizing_frequency_days: 30, last_fertilized: '2026-07-01' }, TODAY)).toBe(true);
  });
});

describe('isCareOverdue', () => {
  it('returns false when neither watering nor fertilizing is overdue', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15',
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01',
    };
    expect(isCareOverdue(plant, TODAY)).toBe(false);
  });

  it('returns true when only watering is overdue', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-01',
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01',
    };
    expect(isCareOverdue(plant, TODAY)).toBe(true);
  });

  it('returns true when only fertilizing is overdue', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15',
      fertilizing_frequency_days: 10,
      last_fertilized: '2026-08-01',
    };
    expect(isCareOverdue(plant, TODAY)).toBe(true);
  });

  it('returns false when no schedule data is set at all', () => {
    const plant = {
      watering_frequency_days: null,
      last_watered: null,
      fertilizing_frequency_days: null,
      last_fertilized: null,
    };
    expect(isCareOverdue(plant, TODAY)).toBe(false);
  });
});
