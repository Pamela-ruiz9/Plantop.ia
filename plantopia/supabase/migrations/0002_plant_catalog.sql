-- supabase/migrations/0002_plant_catalog.sql

CREATE TABLE plant_catalog (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name                text NOT NULL,
  popular_name               text,
  scientific_name            text NOT NULL,
  plant_type                 text NOT NULL CHECK (plant_type IN ('suculenta','tropical','cactus','helecho','trepadora','árbol','otra')),
  origin                     text,
  description                text,
  reference_photo_url        text,
  light_type                 text CHECK (light_type IN ('direct','bright_indirect','low_indirect','shade')),
  light_hours_per_day        numeric,
  humidity                   text CHECK (humidity IN ('low','medium','high')),
  watering_frequency_days    integer,
  substrate_mix              text,
  substrate_ph_min           numeric,
  substrate_ph_max           numeric,
  fertilizing_frequency_days integer,
  min_temperature_celsius    numeric,
  care_difficulty            text CHECK (care_difficulty IN ('easy','medium','hard')),
  toxic_to_pets              boolean NOT NULL DEFAULT false,
  toxic_to_children          boolean NOT NULL DEFAULT false,
  flowering_season           text CHECK (flowering_season IN ('spring','summer','fall','winter','year_round','none')),
  adult_size                 text CHECK (adult_size IN ('compact','medium','large','xlarge')),
  location                   text CHECK (location IN ('indoor','outdoor','both')),
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plant_catalog_search
  ON plant_catalog
  USING gin(
    to_tsvector('spanish',
      coalesce(common_name,'') || ' ' ||
      coalesce(popular_name,'') || ' ' ||
      coalesce(scientific_name,'')
    )
  );

ALTER TABLE plant_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catálogo público para autenticados"
  ON plant_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_plant_catalog_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_plant_catalog_updated_at
  BEFORE UPDATE ON plant_catalog
  FOR EACH ROW EXECUTE FUNCTION update_plant_catalog_updated_at();

ALTER TABLE plants ADD COLUMN species_id uuid REFERENCES plant_catalog(id);

CREATE INDEX idx_plants_species_id ON plants(species_id);
