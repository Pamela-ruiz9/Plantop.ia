// Tipos para la tabla plant_catalog y sus joins con plants.
import type { Plant } from './database';

export type PlantType = 'suculenta' | 'tropical' | 'cactus' | 'helecho' | 'trepadora' | 'árbol' | 'otra';
export type HumidityLevel = 'low' | 'medium' | 'high';
export type CareDifficulty = 'easy' | 'medium' | 'hard';
export type FloweringSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'year_round' | 'none';
export type AdultSize = 'compact' | 'medium' | 'large' | 'xlarge';
export type CatalogLocation = 'indoor' | 'outdoor' | 'both';

export interface PlantCatalog {
  id: string;
  common_name: string;
  popular_name: string | null;
  scientific_name: string;
  plant_type: PlantType;
  origin: string | null;
  description: string | null;
  reference_photo_url: string | null;
  light_type: 'direct' | 'bright_indirect' | 'low_indirect' | 'shade' | null;
  light_hours_per_day: number | null;
  humidity: HumidityLevel | null;
  watering_frequency_days: number | null;
  substrate_mix: string | null;
  substrate_ph_min: number | null;
  substrate_ph_max: number | null;
  fertilizing_frequency_days: number | null;
  min_temperature_celsius: number | null;
  care_difficulty: CareDifficulty | null;
  toxic_to_pets: boolean;
  toxic_to_children: boolean;
  flowering_season: FloweringSeason | null;
  adult_size: AdultSize | null;
  location: CatalogLocation | null;
  created_at: string;
  updated_at: string;
}

export type PlantWithCatalog = Plant & {
  plant_catalog: Pick<PlantCatalog, 'id' | 'common_name' | 'popular_name' | 'reference_photo_url'> | null;
};

export type PlantWithFullCatalog = Plant & {
  plant_catalog: PlantCatalog | null;
};
