// Serialización entre el <form id="plant-form"> (ver PlantForm.astro) y el tipo Plant.
import type { Plant, PlantLocation, HealthStatus, LightType, GrowthPhase } from '../types/database';
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

export function readPlantForm(form: HTMLFormElement): PlantInsert {
  const fd = new FormData(form);
  return {
    common_name: String(fd.get('common_name') ?? '').trim(),
    species: strOrNull(fd.get('species')),
    photo_url: null,
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
  };
}

export function fillPlantForm(form: HTMLFormElement, plant: Plant): void {
  const setVal = (name: string, value: string | number | null) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (el) el.value = value === null || value === undefined ? '' : String(value);
  };

  setVal('common_name', plant.common_name);
  setVal('species', plant.species);
  setVal('location', plant.location);
  setVal('health_status', plant.health_status);
  setVal('notes', plant.notes);
  setVal('substrate_mix', plant.substrate_mix);
  setVal('substrate_ph', plant.substrate_ph);
  setVal('substrate_last_changed', plant.substrate_last_changed);
  setVal('light_type', plant.light_type);
  setVal('light_hours_per_day', plant.light_hours_per_day);
  setVal('light_placement', plant.light_placement);
  setVal('watering_frequency_days', plant.watering_frequency_days);
  setVal('last_watered', plant.last_watered);
  setVal('fertilizing_frequency_days', plant.fertilizing_frequency_days);
  setVal('last_fertilized', plant.last_fertilized);
  setVal('current_phase', plant.current_phase);
  setVal('current_phase_started_at', plant.current_phase_started_at);
}
