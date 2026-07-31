import { supabase } from './supabase';
import type { PlantCatalog } from '../types/catalog';

export async function searchCatalog(term: string): Promise<PlantCatalog[]> {
  if (term.trim().length < 2) return [];
  const { data, error } = await supabase
    .from('plant_catalog')
    .select('*')
    .or(
      `common_name.ilike.%${term}%,popular_name.ilike.%${term}%,scientific_name.ilike.%${term}%`
    )
    .limit(8);
  if (error) throw error;
  return (data ?? []) as PlantCatalog[];
}

export async function getCatalogPlant(id: string): Promise<PlantCatalog | null> {
  const { data, error } = await supabase
    .from('plant_catalog')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PlantCatalog | null;
}
