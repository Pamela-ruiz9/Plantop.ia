// Serialización entre el <form id="plant-form"> (ver PlantForm.astro) y el tipo Plant.
import type { Plant, PlantLocation, HealthStatus, LightType, GrowthPhase } from '../types/database';
import type { PlantCatalog } from '../types/catalog';
import type { PlantInsert } from './plants';

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// Retorna todos los campos del form excepto photo_url (manejada por las páginas).
export type PlantFormData = Omit<PlantInsert, 'photo_url'>;

function setVal(form: HTMLFormElement, name: string, value: string | number | null | undefined): void {
  const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (el) el.value = value === null || value === undefined ? '' : String(value);
}

// Assumes the full PlantForm is present — not safe for partial forms (health_status and current_phase default to non-null values).
export function readPlantForm(form: HTMLFormElement): PlantFormData {
  const fd = new FormData(form);
  return {
    common_name: String(fd.get('common_name') ?? '').trim(),
    species: strOrNull(fd.get('species')),
    location: (strOrNull(fd.get('location')) as PlantLocation | null) ?? null,
    health_status: (strOrNull(fd.get('health_status')) as HealthStatus | null) ?? 'healthy',
    notes: strOrNull(fd.get('notes')),

    substrate_mix: strOrNull(fd.get('substrate_mix')),
    substrate_ph: numOrNull(fd.get('substrate_ph')),
    substrate_last_changed: strOrNull(fd.get('substrate_last_changed')),

    light_type: (strOrNull(fd.get('light_type')) as LightType | null) ?? null,
    light_hours_per_day: numOrNull(fd.get('light_hours_per_day')),
    light_placement: strOrNull(fd.get('light_placement')),

    watering_frequency_days: numOrNull(fd.get('watering_frequency_days')),
    last_watered: strOrNull(fd.get('last_watered')),

    fertilizing_frequency_days: numOrNull(fd.get('fertilizing_frequency_days')),
    last_fertilized: strOrNull(fd.get('last_fertilized')),

    current_phase: (strOrNull(fd.get('current_phase')) as GrowthPhase | null) ?? 'vegetative',
    current_phase_started_at:
      strOrNull(fd.get('current_phase_started_at')) ?? new Date().toISOString().slice(0, 10),

    species_id: strOrNull(fd.get('species_id')),
  };
}

export function fillPlantForm(form: HTMLFormElement, plant: Plant): void {
  setVal(form, 'common_name', plant.common_name);
  setVal(form, 'species', plant.species);
  setVal(form, 'location', plant.location);
  setVal(form, 'health_status', plant.health_status);
  setVal(form, 'notes', plant.notes);
  setVal(form, 'substrate_mix', plant.substrate_mix);
  setVal(form, 'substrate_ph', plant.substrate_ph);
  setVal(form, 'substrate_last_changed', plant.substrate_last_changed);
  setVal(form, 'light_type', plant.light_type);
  setVal(form, 'light_hours_per_day', plant.light_hours_per_day);
  setVal(form, 'light_placement', plant.light_placement);
  setVal(form, 'watering_frequency_days', plant.watering_frequency_days);
  setVal(form, 'last_watered', plant.last_watered);
  setVal(form, 'fertilizing_frequency_days', plant.fertilizing_frequency_days);
  setVal(form, 'last_fertilized', plant.last_fertilized);
  setVal(form, 'current_phase', plant.current_phase);
  setVal(form, 'current_phase_started_at', plant.current_phase_started_at);
  setVal(form, 'species_id', plant.species_id);
}

// Pre-llena los campos de cuidado del formulario con datos del catálogo.
// Sobreescribe siempre — el usuario edita después si quiere.
export function fillFormFromCatalog(form: HTMLFormElement, catalog: PlantCatalog): void {
  setVal(form, 'species_id', catalog.id);
  setVal(form, 'common_name', catalog.popular_name ?? catalog.common_name);
  setVal(form, 'species', catalog.scientific_name);
  setVal(form, 'light_type', catalog.light_type);
  setVal(form, 'light_hours_per_day', catalog.light_hours_per_day);
  setVal(form, 'watering_frequency_days', catalog.watering_frequency_days);
  setVal(form, 'substrate_mix', catalog.substrate_mix);
  setVal(form, 'substrate_ph', catalog.substrate_ph_min);
  setVal(form, 'fertilizing_frequency_days', catalog.fertilizing_frequency_days);
}
