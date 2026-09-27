import { describe, it, expect } from 'vitest';
import { groupPlantsByAgenda, agendaActions } from './dashboard-agenda';

const TODAY = new Date('2026-09-27T12:00:00');

const wateringOverdue = {
  watering_frequency_days: 7,
  last_watered: '2026-09-10', // 17 días atrás -> atrasado
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const wateringDueToday = {
  watering_frequency_days: 7,
  last_watered: '2026-09-20', // exactamente 7 días atrás -> vence hoy
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const wateringDueInThreeDays = {
  watering_frequency_days: 7,
  last_watered: '2026-09-23', // 4 días atrás, frecuencia 7 -> vence en 3 días
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const nothingDueSoon = {
  watering_frequency_days: 30,
  last_watered: '2026-09-07', // 20 días atrás, frecuencia 30 -> vence en 10 días (fuera de la ventana de 7)
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const bothOverdueAndFertDueInThreeDays = {
  watering_frequency_days: 7,
  last_watered: '2026-09-10', // atrasado
  fertilizing_frequency_days: 30,
  last_fertilized: '2026-08-31', // 27 días atrás, frecuencia 30 -> vence en 3 días
};

describe('groupPlantsByAgenda', () => {
  it('returns empty groups for an empty list', () => {
    expect(groupPlantsByAgenda([], TODAY)).toEqual({ overdue: [], today: [], this_week: [] });
  });

  it('puts an overdue plant in "overdue"', () => {
    const groups = groupPlantsByAgenda([wateringOverdue], TODAY);
    expect(groups.overdue).toEqual([wateringOverdue]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('puts a plant due exactly today in "today"', () => {
    const groups = groupPlantsByAgenda([wateringDueToday], TODAY);
    expect(groups.today).toEqual([wateringDueToday]);
    expect(groups.overdue).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('puts a plant due within the next 7 days (but not today) in "this_week"', () => {
    const groups = groupPlantsByAgenda([wateringDueInThreeDays], TODAY);
    expect(groups.this_week).toEqual([wateringDueInThreeDays]);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
  });

  it('excludes a plant that is not due within 7 days from every group', () => {
    const groups = groupPlantsByAgenda([nothingDueSoon], TODAY);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('prioritizes "overdue" when one axis is overdue and the other is due soon', () => {
    const groups = groupPlantsByAgenda([bothOverdueAndFertDueInThreeDays], TODAY);
    expect(groups.overdue).toEqual([bothOverdueAndFertDueInThreeDays]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('sorts multiple plants into their respective groups', () => {
    const groups = groupPlantsByAgenda(
      [wateringOverdue, wateringDueToday, wateringDueInThreeDays, nothingDueSoon],
      TODAY
    );
    expect(groups.overdue).toEqual([wateringOverdue]);
    expect(groups.today).toEqual([wateringDueToday]);
    expect(groups.this_week).toEqual([wateringDueInThreeDays]);
  });
});

describe('agendaActions', () => {
  it('returns no actions when nothing is due', () => {
    expect(agendaActions(nothingDueSoon, TODAY)).toEqual([]);
  });

  it('returns only the watered action when only watering is overdue', () => {
    expect(agendaActions(wateringOverdue, TODAY)).toEqual([{ eventType: 'watered', label: '💧' }]);
  });

  it('returns both actions when watering is overdue and fertilizing is due soon', () => {
    expect(agendaActions(bothOverdueAndFertDueInThreeDays, TODAY)).toEqual([
      { eventType: 'watered', label: '💧' },
      { eventType: 'fertilized', label: '🌿' },
    ]);
  });

  it('returns the fertilized action for a plant due today on that axis', () => {
    const fertDueToday = {
      watering_frequency_days: null,
      last_watered: null,
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-28', // exactamente 30 días atrás
    };
    expect(agendaActions(fertDueToday, TODAY)).toEqual([{ eventType: 'fertilized', label: '🌿' }]);
  });
});
