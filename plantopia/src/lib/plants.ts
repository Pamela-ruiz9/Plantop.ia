// Helpers CRUD para plantas, eventos y log de fases.
// Todas las queries se ejecutan client-side (Astro output: static).
import { supabase } from './supabase';
import type {
  Plant,
  PlantEvent,
  PlantPhaseLog,
  GrowthPhase,
} from '../types/database';

export type PlantInsert = Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type PlantUpdate = Partial<PlantInsert>;

export async function listPlants(): Promise<Plant[]> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPlant(id: string): Promise<Plant | null> {
  const { data, error } = await supabase.from('plants').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPlant(userId: string, plant: PlantInsert): Promise<Plant> {
  const { data, error } = await supabase
    .from('plants')
    .insert({ ...plant, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlant(id: string, patch: PlantUpdate): Promise<Plant> {
  const { data, error } = await supabase
    .from('plants')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlant(id: string): Promise<void> {
  const { error } = await supabase.from('plants').delete().eq('id', id);
  if (error) throw error;
}

/** Cambia la fase actual de una planta y cierra/abre el registro correspondiente en plant_phase_log. */
export async function changePlantPhase(
  plant: Plant,
  newPhase: GrowthPhase,
  note?: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // Cierra el log de la fase abierta anterior (si existe).
  const { data: openLogs, error: openErr } = await supabase
    .from('plant_phase_log')
    .select('*')
    .eq('plant_id', plant.id)
    .is('ended_at', null);
  if (openErr) throw openErr;

  if (openLogs && openLogs.length > 0) {
    const { error: closeErr } = await supabase
      .from('plant_phase_log')
      .update({ ended_at: today })
      .in(
        'id',
        openLogs.map((l) => l.id)
      );
    if (closeErr) throw closeErr;
  }

  const { error: insertErr } = await supabase.from('plant_phase_log').insert({
    plant_id: plant.id,
    user_id: plant.user_id,
    phase: newPhase,
    started_at: today,
    ended_at: null,
    note: note ?? null,
  });
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('plants')
    .update({ current_phase: newPhase, current_phase_started_at: today })
    .eq('id', plant.id);
  if (updateErr) throw updateErr;

  await supabase.from('plant_events').insert({
    plant_id: plant.id,
    user_id: plant.user_id,
    event_type: 'phase_change',
    event_date: today,
    note: note ?? `Cambio de fase a ${newPhase}`,
    photo_url: null,
  });
}

export async function listPlantEvents(plantId: string): Promise<PlantEvent[]> {
  const { data, error } = await supabase
    .from('plant_events')
    .select('*')
    .eq('plant_id', plantId)
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addPlantEvent(
  plant: Plant,
  event: Pick<PlantEvent, 'event_type' | 'event_date' | 'note'> & { photo_url?: string | null }
): Promise<PlantEvent> {
  const { data, error } = await supabase
    .from('plant_events')
    .insert({
      plant_id: plant.id,
      user_id: plant.user_id,
      event_type: event.event_type,
      event_date: event.event_date,
      note: event.note ?? null,
      photo_url: event.photo_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  // Si es un evento de riego/fertilización, actualiza el "last_*" de la planta.
  if (event.event_type === 'watered') {
    await supabase.from('plants').update({ last_watered: event.event_date }).eq('id', plant.id);
  } else if (event.event_type === 'fertilized') {
    await supabase
      .from('plants')
      .update({ last_fertilized: event.event_date })
      .eq('id', plant.id);
  }

  return data;
}

export async function deletePlantEvent(id: string): Promise<void> {
  const { error } = await supabase.from('plant_events').delete().eq('id', id);
  if (error) throw error;
}

export async function listPhaseLog(plantId: string): Promise<PlantPhaseLog[]> {
  const { data, error } = await supabase
    .from('plant_phase_log')
    .select('*')
    .eq('plant_id', plantId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
