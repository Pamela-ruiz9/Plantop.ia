import { describe, it, expect } from 'vitest';
import { readPlantForm, fillPlantForm, fillFormFromCatalog } from './plant-form';
import type { Plant } from '../types/database';
import type { PlantCatalog } from '../types/catalog';

function makeForm(fields: Record<string, string>): HTMLFormElement {
  const form = document.createElement('form');
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  return form;
}

const FORM_FIELDS = [
  'common_name', 'species', 'location', 'health_status', 'notes',
  'substrate_mix', 'substrate_ph', 'substrate_last_changed',
  'light_type', 'light_hours_per_day', 'light_placement',
  'watering_frequency_days', 'last_watered',
  'fertilizing_frequency_days', 'last_fertilized',
  'current_phase', 'current_phase_started_at',
  'species_id',
] as const;

function makeEmptyForm(): HTMLFormElement {
  return makeForm(Object.fromEntries(FORM_FIELDS.map((f) => [f, ''])));
}

describe('readPlantForm', () => {
  it('reads common_name and current_phase', () => {
    const form = makeForm({ common_name: 'Monstera', current_phase: 'vegetative', current_phase_started_at: '2026-01-01' });
    const result = readPlantForm(form);
    expect(result.common_name).toBe('Monstera');
    expect(result.current_phase).toBe('vegetative');
  });

  it('returns null for empty optional fields', () => {
    const form = makeEmptyForm();
    (form.elements.namedItem('common_name') as HTMLInputElement).value = 'Cactus';
    (form.elements.namedItem('current_phase') as HTMLInputElement).value = 'dormancy';
    const result = readPlantForm(form);
    expect(result.species).toBeNull();
    expect(result.substrate_mix).toBeNull();
    expect(result.watering_frequency_days).toBeNull();
    expect(result.species_id).toBeNull();
  });

  it('parses numeric fields correctly', () => {
    const form = makeEmptyForm();
    (form.elements.namedItem('common_name') as HTMLInputElement).value = 'Ficus';
    (form.elements.namedItem('current_phase') as HTMLInputElement).value = 'vegetative';
    (form.elements.namedItem('watering_frequency_days') as HTMLInputElement).value = '7';
    (form.elements.namedItem('substrate_ph') as HTMLInputElement).value = '6.5';
    const result = readPlantForm(form);
    expect(result.watering_frequency_days).toBe(7);
    expect(result.substrate_ph).toBe(6.5);
  });

  it('trims whitespace from text fields', () => {
    const form = makeForm({ common_name: '  Orquídea  ', current_phase: 'flowering', current_phase_started_at: '2026-01-01' });
    expect(readPlantForm(form).common_name).toBe('Orquídea');
  });

  it('defaults current_phase_started_at to today if missing', () => {
    const form = makeForm({ common_name: 'Pothos', current_phase: 'vegetative' });
    const result = readPlantForm(form);
    expect(result.current_phase_started_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('reads species_id from form', () => {
    const form = makeEmptyForm();
    (form.elements.namedItem('common_name') as HTMLInputElement).value = 'Monstera';
    (form.elements.namedItem('current_phase') as HTMLInputElement).value = 'vegetative';
    (form.elements.namedItem('species_id') as HTMLInputElement).value = 'abc-123';
    const result = readPlantForm(form);
    expect(result.species_id).toBe('abc-123');
  });
});

describe('fillPlantForm + readPlantForm roundtrip', () => {
  it('fills a form and reads back identical values including species_id', () => {
    const plant: Plant = {
      id: 'abc',
      user_id: 'user1',
      common_name: 'Pothos',
      species: 'Epipremnum aureum',
      photo_url: null,
      species_id: 'catalog-uuid-123',
      location: 'indoor',
      health_status: 'healthy',
      notes: 'Crece rápido',
      substrate_mix: 'turba + perlita',
      substrate_ph: 6.0,
      substrate_last_changed: '2026-03-01',
      light_type: 'low_indirect',
      light_hours_per_day: 4,
      light_placement: 'ventana norte',
      watering_frequency_days: 7,
      last_watered: '2026-07-20',
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-07-01',
      current_phase: 'vegetative',
      current_phase_started_at: '2026-01-15',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-07-20T00:00:00Z',
    };

    const form = makeEmptyForm();
    fillPlantForm(form, plant);
    const result = readPlantForm(form);

    expect(result.common_name).toBe('Pothos');
    expect(result.species).toBe('Epipremnum aureum');
    expect(result.species_id).toBe('catalog-uuid-123');
    expect(result.location).toBe('indoor');
    expect(result.health_status).toBe('healthy');
    expect(result.notes).toBe('Crece rápido');
    expect(result.substrate_mix).toBe('turba + perlita');
    expect(result.substrate_ph).toBe(6.0);
    expect(result.substrate_last_changed).toBe('2026-03-01');
    expect(result.light_type).toBe('low_indirect');
    expect(result.light_hours_per_day).toBe(4);
    expect(result.light_placement).toBe('ventana norte');
    expect(result.watering_frequency_days).toBe(7);
    expect(result.last_watered).toBe('2026-07-20');
    expect(result.fertilizing_frequency_days).toBe(30);
    expect(result.last_fertilized).toBe('2026-07-01');
    expect(result.current_phase).toBe('vegetative');
    expect(result.current_phase_started_at).toBe('2026-01-15');
  });
});

describe('fillFormFromCatalog', () => {
  it('fills form fields from a catalog plant', () => {
    const form = makeEmptyForm();
    const catalog: PlantCatalog = {
      id: 'cat-id-456',
      common_name: 'Costilla de Adán',
      popular_name: 'Monstera',
      scientific_name: 'Monstera deliciosa',
      plant_type: 'tropical',
      origin: 'México',
      description: null,
      reference_photo_url: null,
      light_type: 'bright_indirect',
      light_hours_per_day: 6,
      humidity: 'medium',
      watering_frequency_days: 10,
      substrate_mix: 'tierra negra + perlita',
      substrate_ph_min: 5.5,
      substrate_ph_max: 7.0,
      fertilizing_frequency_days: 30,
      min_temperature_celsius: 12,
      care_difficulty: 'medium',
      toxic_to_pets: true,
      toxic_to_children: true,
      flowering_season: 'year_round',
      adult_size: 'large',
      location: 'indoor',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    fillFormFromCatalog(form, catalog);

    expect((form.elements.namedItem('species_id') as HTMLInputElement).value).toBe('cat-id-456');
    expect((form.elements.namedItem('common_name') as HTMLInputElement).value).toBe('Monstera');
    expect((form.elements.namedItem('species') as HTMLInputElement).value).toBe('Monstera deliciosa');
    expect((form.elements.namedItem('light_type') as HTMLInputElement).value).toBe('bright_indirect');
    expect((form.elements.namedItem('watering_frequency_days') as HTMLInputElement).value).toBe('10');
    expect((form.elements.namedItem('substrate_mix') as HTMLInputElement).value).toBe('tierra negra + perlita');
    expect((form.elements.namedItem('substrate_ph') as HTMLInputElement).value).toBe('5.5');
    expect((form.elements.namedItem('fertilizing_frequency_days') as HTMLInputElement).value).toBe('30');
  });

  it('uses common_name when popular_name is null', () => {
    const form = makeEmptyForm();
    const catalog = {
      id: 'cat-id-789',
      common_name: 'Nopal',
      popular_name: null,
      scientific_name: 'Opuntia spp.',
      plant_type: 'cactus' as const,
      origin: 'México',
      description: null,
      reference_photo_url: null,
      light_type: 'direct' as const,
      light_hours_per_day: 7,
      humidity: 'low' as const,
      watering_frequency_days: 14,
      substrate_mix: 'cactus',
      substrate_ph_min: 6.0,
      substrate_ph_max: 7.5,
      fertilizing_frequency_days: 90,
      min_temperature_celsius: -10,
      care_difficulty: 'easy' as const,
      toxic_to_pets: false,
      toxic_to_children: false,
      flowering_season: 'spring' as const,
      adult_size: 'large' as const,
      location: 'outdoor' as const,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    fillFormFromCatalog(form, catalog);

    expect((form.elements.namedItem('common_name') as HTMLInputElement).value).toBe('Nopal');
  });
});
