// Tipos generados a mano a partir del esquema (supabase/migrations/0001_init.sql).
// Cuando el proyecto Supabase exista, reemplazar con:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type PlantLocation = 'indoor' | 'outdoor';
export type HealthStatus = 'healthy' | 'needs_attention' | 'sick';
export type LightType = 'direct' | 'bright_indirect' | 'low_indirect' | 'shade';
export type GrowthPhase = 'vegetative' | 'flowering' | 'fruiting' | 'dormancy' | 'latent';
export type EventType =
  | 'watered'
  | 'fertilized'
  | 'repotted'
  | 'pruned'
  | 'pest_detected'
  | 'pest_treated'
  | 'phase_change'
  | 'photo_added'
  | 'note';

export interface Plant {
  id: string;
  user_id: string;
  common_name: string;
  species: string | null;
  photo_url: string | null;
  location: PlantLocation | null;
  health_status: HealthStatus | null;
  notes: string | null;

  substrate_mix: string | null;
  substrate_ph: number | null;
  substrate_last_changed: string | null;

  light_type: LightType | null;
  light_hours_per_day: number | null;
  light_placement: string | null;

  watering_frequency_days: number | null;
  last_watered: string | null;

  fertilizing_frequency_days: number | null;
  last_fertilized: string | null;

  current_phase: GrowthPhase;
  current_phase_started_at: string;

  created_at: string;
  updated_at: string;
}

export interface PlantPhaseLog {
  id: string;
  plant_id: string;
  user_id: string;
  phase: GrowthPhase;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  created_at: string;
}

export interface PlantEvent {
  id: string;
  plant_id: string;
  user_id: string;
  event_type: EventType;
  event_date: string;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      plants: {
        Row: Plant;
        Insert: Omit<Plant, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
      plant_phase_log: {
        Row: PlantPhaseLog;
        Insert: Omit<PlantPhaseLog, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PlantPhaseLog, 'id' | 'plant_id' | 'user_id' | 'created_at'>>;
      };
      plant_events: {
        Row: PlantEvent;
        Insert: Omit<PlantEvent, 'id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<PlantEvent, 'id' | 'plant_id' | 'user_id' | 'created_at'>>;
      };
    };
  };
}
