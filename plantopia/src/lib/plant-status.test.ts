import { describe, it, expect } from 'vitest';
import {
  isCareOverdue,
  isWateringOverdue,
  isFertilizingOverdue,
  countCareOverdue,
  isWateringDueSoon,
  isFertilizingDueSoon,
  isCareDueSoon,
  countCareDueSoon,
} from './plant-status';

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

  it('treats a frequency of 0 (water every day) as a valid schedule, not "unset"', () => {
    expect(isWateringOverdue({ watering_frequency_days: 0, last_watered: '2026-08-15' }, TODAY)).toBe(false);
    expect(isWateringOverdue({ watering_frequency_days: 0, last_watered: '2026-08-14' }, TODAY)).toBe(true);
  });
});

describe('isWateringDueSoon', () => {
  it('returns false when watering_frequency_days is null', () => {
    expect(isWateringDueSoon({ watering_frequency_days: null, last_watered: '2026-08-14' }, 2, TODAY)).toBe(false);
  });

  it('returns false when last_watered is null', () => {
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: null }, 2, TODAY)).toBe(false);
  });

  it('returns true when due today (until === 0)', () => {
    // last_watered 7 días atrás, frecuencia 7 -> until = 0
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-08' }, 2, TODAY)).toBe(true);
  });

  it('returns true right at the edge of the window (until === daysAhead)', () => {
    // last_watered 5 días atrás, frecuencia 7 -> until = 2
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-10' }, 2, TODAY)).toBe(true);
  });

  it('returns false just outside the window (until === daysAhead + 1)', () => {
    // last_watered 4 días atrás, frecuencia 7 -> until = 3
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-11' }, 2, TODAY)).toBe(false);
  });

  it('returns false when already overdue (until < 0) — not "due soon", already late', () => {
    // last_watered 8 días atrás, frecuencia 7 -> until = -1
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-07' }, 2, TODAY)).toBe(false);
  });

  it('uses a default window of 2 days when daysAhead is omitted', () => {
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-10' }, undefined, TODAY)).toBe(true);
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

describe('isFertilizingDueSoon', () => {
  it('returns false when fertilizing_frequency_days is null', () => {
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: null, last_fertilized: '2026-07-20' }, 2, TODAY)).toBe(false);
  });

  it('returns false when last_fertilized is null', () => {
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: null }, 2, TODAY)).toBe(false);
  });

  it('returns true within the window', () => {
    // last_fertilized 29 días atrás, frecuencia 30 -> until = 1
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: '2026-07-17' }, 2, TODAY)).toBe(true);
  });

  it('returns false when already overdue', () => {
    // last_fertilized 31 días atrás, frecuencia 30 -> until = -1
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: '2026-07-15' }, 2, TODAY)).toBe(false);
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

describe('countCareOverdue', () => {
  const overdue = {
    watering_frequency_days: 7,
    last_watered: '2026-08-01',
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };
  const notOverdue = {
    watering_frequency_days: 7,
    last_watered: '2026-08-15',
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };

  it('returns 0 for an empty list', () => {
    expect(countCareOverdue([], TODAY)).toBe(0);
  });

  it('returns 0 when no plant is overdue', () => {
    expect(countCareOverdue([notOverdue, notOverdue], TODAY)).toBe(0);
  });

  it('counts only the overdue plants', () => {
    expect(countCareOverdue([overdue, notOverdue, overdue], TODAY)).toBe(2);
  });
});

describe('isCareDueSoon', () => {
  it('returns true when only watering is due soon', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-10', // until = 2, due soon
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01', // until = 16, not due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(true);
  });

  it('returns true when only fertilizing is due soon', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15', // recién regada, until = 7
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-07-17', // until = 1, due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(true);
  });

  it('returns false when nothing is due soon or overdue', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15',
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01',
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(false);
  });

  it('returns false when watering is already overdue (overdue, not "due soon")', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-01', // until = -6, overdue
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01', // until = 16, not due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(false);
  });
});

describe('countCareDueSoon', () => {
  const dueSoon = {
    watering_frequency_days: 7,
    last_watered: '2026-08-10', // until = 2
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };
  const notDueSoon = {
    watering_frequency_days: 7,
    last_watered: '2026-08-15',
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };

  it('returns 0 for an empty list', () => {
    expect(countCareDueSoon([], 2, TODAY)).toBe(0);
  });

  it('counts only the due-soon plants', () => {
    expect(countCareDueSoon([dueSoon, notDueSoon, dueSoon], 2, TODAY)).toBe(2);
  });
});
