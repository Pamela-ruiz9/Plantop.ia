# Catálogo de Plantas + Fotos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un catálogo curado de ~45 plantas de hogar en español con autocompletado en el formulario, y subida de fotos personales por usuario a Supabase Storage.

**Architecture:** Nueva tabla `plant_catalog` (lectura pública autenticada, datos fijos via migraciones). La tabla `plants` agrega FK opcional `species_id`. El formulario de nueva/editar planta tiene un buscador de catálogo con debounce que pre-llena campos de cuidado, y un campo de foto que sube a Supabase Storage (`plant-photos/{user_id}/{plant_id}.{ext}`). Las tarjetas y el detalle muestran la foto personal del usuario con fallback a la foto de referencia del catálogo.

**Tech Stack:** Astro 7 (static output), Supabase JS 2.x, TypeScript 5.8, Tailwind v4, Vitest 4 + happy-dom.

---

## File Map

**Crear:**
- `supabase/migrations/0002_plant_catalog.sql` — tabla, índice GIN, RLS, columna species_id
- `supabase/migrations/0003_plant_catalog_seed.sql` — ~45 plantas en español
- `plantopia/src/types/catalog.ts` — PlantCatalog interface + enum types + PlantWithCatalog
- `plantopia/src/lib/catalog.ts` — searchCatalog(), getCatalogPlant()
- `plantopia/src/lib/catalog.test.ts` — tests de catalog.ts

**Modificar:**
- `plantopia/src/types/database.ts` — species_id en Plant, plant_catalog en Database type
- `plantopia/src/lib/labels.ts` — labels para enums del catálogo
- `plantopia/src/lib/labels.test.ts` — tests para los nuevos labels
- `plantopia/src/lib/plant-form.ts` — leer species_id, sacar photo_url, agregar fillFormFromCatalog
- `plantopia/src/lib/plant-form.test.ts` — roundtrip con species_id
- `plantopia/src/lib/plants.ts` — join catalog en listPlants/getPlant, + uploadPlantPhoto/deletePlantPhoto
- `plantopia/src/components/PlantForm.astro` — buscador catálogo + campo foto
- `plantopia/src/pages/plants/new.astro` — orquestar upload antes de crear
- `plantopia/src/pages/plants/edit.astro` — orquestar cambio/borrado de foto
- `plantopia/src/pages/index.astro` — tarjetas con imagen
- `plantopia/src/pages/plants/detail.astro` — hero foto + sección info catálogo + botón cambiar foto

---

## Task 1: Migración de esquema

**Files:**
- Create: `supabase/migrations/0002_plant_catalog.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
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

ALTER TABLE plants ADD COLUMN species_id uuid REFERENCES plant_catalog(id);
```

- [ ] **Step 2: Aplicar la migración en Supabase**

Ve al dashboard de Supabase → SQL Editor → copia y pega el SQL completo → Run.

O con CLI: `supabase db push` (requiere `supabase link --project-ref nlameaniuxrqhqnkqkxv`).

---

## Task 2: Bucket de Supabase Storage

**Files:** (ninguno — configuración via SQL en el dashboard)

- [ ] **Step 1: Crear bucket y políticas**

En Supabase → SQL Editor, ejecutar:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Fotos públicas de plantas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "El dueño sube su foto"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "El dueño actualiza su foto"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "El dueño borra su foto"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plant-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

El path de cada foto será `{user_id}/{plant_id}.{ext}`. La política permite al usuario solo tocar su propia carpeta.

---

## Task 3: Migración de datos semilla

**Files:**
- Create: `supabase/migrations/0003_plant_catalog_seed.sql`

- [ ] **Step 1: Crear archivo de seed**

```sql
-- supabase/migrations/0003_plant_catalog_seed.sql

INSERT INTO plant_catalog
  (common_name, popular_name, scientific_name, plant_type, origin, description,
   light_type, light_hours_per_day, humidity, watering_frequency_days,
   substrate_mix, substrate_ph_min, substrate_ph_max, fertilizing_frequency_days,
   min_temperature_celsius, care_difficulty, toxic_to_pets, toxic_to_children,
   flowering_season, adult_size, location)
VALUES
  ('Costilla de Adán','Monstera','Monstera deliciosa','tropical','México y América Central',
   'Icónica planta tropical de hojas grandes con fenestración característica.',
   'bright_indirect',6,'medium',10,'tierra negra + perlita 30%',5.5,7.0,30,12,'medium',true,true,'year_round','large','indoor'),

  ('Teléfono','Teléfono','Monstera adansonii','tropical','América del Sur',
   'Trepadora de hojas perforadas, perfecta para colgar o guiar en tutor.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita + fibra de coco',5.5,7.0,21,12,'medium',true,true,'year_round','medium','indoor'),

  ('Poto Dorado','Poto','Epipremnum aureum','trepadora','Islas Salomón',
   'Trepadora resistente, tolera poca luz y el descuido. Ideal para principiantes.',
   'low_indirect',4,'medium',7,'tierra universal',6.0,6.5,30,10,'easy',true,true,'none','large','indoor'),

  ('Cuna de Moisés','Lirio de Paz','Spathiphyllum wallisii','tropical','América Central y del Sur',
   'Purificadora de aire con flores blancas. Tolera poca luz.',
   'low_indirect',4,'high',7,'tierra negra + perlita 20%',5.5,6.5,30,15,'easy',true,false,'year_round','medium','indoor'),

  ('Lengua de Suegra','Sanseviera','Sansevieria trifasciata','tropical','África Occidental',
   'Extremadamente resistente. Tolera desde pleno sol hasta sombra profunda.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',5.5,7.0,60,10,'easy',true,false,'none','medium','indoor'),

  ('ZZ Plant','Zamioculca','Zamioculcas zamiifolia','tropical','África Oriental',
   'Casi indestructible. Almacena agua en sus rizomas, ideal para viajeros.',
   'low_indirect',4,'low',14,'tierra universal + perlita',6.0,7.0,60,10,'easy',true,false,'none','medium','indoor'),

  ('Ficus Lira',NULL,'Ficus lyrata','árbol','África Occidental',
   'Árbol de interior de moda. Sensible a cambios de ubicación y corrientes.',
   'bright_indirect',7,'medium',10,'tierra negra + corteza + perlita',6.0,7.0,30,15,'hard',false,false,'none','large','indoor'),

  ('Ficus Benjamina','Ficus','Ficus benjamina','árbol','Asia y Australia',
   'Árbol clásico de interior. Pierde hojas si se mueve o hay corrientes.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita',6.0,6.5,30,13,'medium',false,false,'none','large','indoor'),

  ('Dracena','Árbol Dragón','Dracaena marginata','árbol','Madagascar',
   'Resistente y elegante. Sus hojas rojas la hacen decorativa.',
   'bright_indirect',6,'low',10,'tierra negra + perlita',6.0,7.0,30,10,'easy',true,false,'none','large','indoor'),

  ('Calatea','Calatea','Calathea ornata','tropical','Colombia y Venezuela',
   'Hojas pintadas a mano. Exige alta humedad, se ofende fácil.',
   'low_indirect',4,'high',7,'tierra negra + turba',6.0,6.5,30,15,'hard',false,false,'none','medium','indoor'),

  ('Maranta','Planta Orante','Maranta leuconeura','tropical','Brasil',
   'Sus hojas se pliegan de noche como manos orando. No tóxica.',
   'low_indirect',4,'high',7,'tierra negra + perlita',6.0,6.5,30,15,'medium',false,false,'none','compact','indoor'),

  ('Anturio','Anturio','Anthurium andraeanum','tropical','Colombia y Ecuador',
   'Flores brillantes de larga duración. Necesita alta humedad.',
   'bright_indirect',6,'high',7,'orquídea + perlita + tierra negra',5.5,6.5,30,16,'medium',true,false,'year_round','medium','indoor'),

  ('Áloe Vera','Sábila','Aloe vera','suculenta','Arabia y norte de África',
   'Gel cicatrizante en sus hojas. Odia el exceso de riego.',
   'direct',7,'low',14,'sustrato de cactus + perlita 30%',7.0,8.5,90,5,'easy',true,false,'summer','medium','both'),

  ('Echeveria','Suculenta Rosa','Echeveria spp.','suculenta','México',
   'Roseta perfecta. Necesita mucha luz para mantener su forma compacta.',
   'direct',6,'low',14,'sustrato de cactus + grava',6.0,7.0,90,0,'easy',false,false,'spring','compact','both'),

  ('Árbol de Jade','Jade','Crassula ovata','suculenta','Sudáfrica',
   'Suculenta arbustiva que puede vivir décadas. Símbolo de buena suerte.',
   'direct',5,'low',14,'sustrato de cactus + perlita',6.0,7.0,60,5,'easy',true,false,'winter','medium','indoor'),

  ('Haworthia','Suculenta Rayadita','Haworthia spp.','suculenta','Sudáfrica',
   'Tolera la sombra mejor que otras suculentas. Perfecta para escritorios.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',6.0,7.0,90,5,'easy',false,false,'none','compact','indoor'),

  ('Calanchoe','Calanchoe','Kalanchoe blossfeldiana','suculenta','Madagascar',
   'Floración abundante y colorida. Fácil de cuidar y reflorar.',
   'direct',6,'low',10,'sustrato de cactus + tierra negra',6.0,7.0,30,10,'easy',true,false,'winter','compact','indoor'),

  ('Gasteria','Lengüita','Gasteria spp.','suculenta','Sudáfrica',
   'Prima de la haworthia. Más resistente a la sombra y el olvido.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',6.0,7.0,90,5,'easy',false,false,'spring','compact','indoor'),

  ('Sedum','Sedum','Sedum spp.','suculenta','México y América del Norte',
   'Género enorme de suculentas. La mayoría prospera con sol y poco riego.',
   'direct',6,'low',14,'sustrato de cactus + grava',6.0,7.0,90,-10,'easy',false,false,'summer','compact','both'),

  ('Helecho de Boston','Helecho','Nephrolepis exaltata','helecho','América tropical',
   'Purificador de aire clásico. Pide mucha humedad ambiental.',
   'bright_indirect',5,'high',3,'tierra negra + turba + perlita',5.5,6.5,30,10,'medium',false,false,'none','medium','indoor'),

  ('Helecho Nido de Pájaro','Nido de Pájaro','Asplenium nidus','helecho','Asia tropical',
   'Hojas enteras sin división, más tolerante que otros helechos.',
   'low_indirect',4,'high',5,'tierra negra + turba',5.0,6.0,30,15,'medium',false,false,'none','medium','indoor'),

  ('Tradescantia','Amor de Hombre','Tradescantia zebrina','tropical','México y América Central',
   'Crecimiento rápido con hojas moradas metálicas. Fácil de propagar.',
   'bright_indirect',6,'medium',7,'tierra universal',6.0,6.5,30,5,'easy',true,false,'year_round','compact','indoor'),

  ('Aglaonema','Aglaonema','Aglaonema spp.','tropical','Asia tropical',
   'Follaje colorido. Una de las más tolerantes a poca luz de su familia.',
   'low_indirect',4,'medium',10,'tierra negra + perlita',6.0,7.0,30,13,'easy',true,false,'none','medium','indoor'),

  ('Diefenbaquia','Caña Muda','Dieffenbachia spp.','tropical','América tropical',
   'Hojas grandes decorativas. MUY tóxica — puede causar imposibilidad de hablar.',
   'bright_indirect',5,'medium',7,'tierra negra + perlita',6.0,7.0,30,15,'easy',true,true,'none','medium','indoor'),

  ('Filodendro Corazón','Filodendro','Philodendron hederaceum','trepadora','América tropical',
   'Hojas en forma de corazón. Trepadora o colgante muy resistente.',
   'bright_indirect',5,'medium',7,'tierra negra + perlita',5.5,7.0,30,12,'easy',true,false,'none','large','indoor'),

  ('Singonio','Planta Flecha','Syngonium podophyllum','trepadora','América tropical',
   'Hojas en flecha que cambian de forma al madurar. Trepadora compacta.',
   'bright_indirect',4,'medium',7,'tierra negra + perlita',5.5,6.5,30,15,'easy',true,false,'none','medium','indoor'),

  ('Hiedra','Hiedra','Hedera helix','trepadora','Europa y Asia',
   'Clásica trepadora de exterior que aguanta muy bien en interior.',
   'bright_indirect',5,'medium',7,'tierra universal',6.0,7.5,30,0,'easy',true,false,'none','large','both'),

  ('Schefflera','Árbol Paraguas','Schefflera arboricola','árbol','Asia tropical',
   'Hojas agrupadas como paraguas. Resistente y de rápido crecimiento.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita',6.0,7.0,30,13,'easy',true,false,'none','large','indoor'),

  ('Pachira','Árbol del Dinero','Pachira aquatica','árbol','América Central',
   'Tronco trenzado característico. Símbolo de prosperidad en feng shui.',
   'bright_indirect',6,'medium',7,'tierra negra + arena',6.0,7.0,30,15,'easy',false,false,'none','large','indoor'),

  ('Pata de Elefante','Pata de Elefante','Beaucarnea recurvata','árbol','México',
   'Almacena agua en su tronco abultado. Extremadamente resistente al olvido.',
   'direct',7,'low',21,'sustrato de cactus + arena',6.0,7.0,60,10,'easy',false,false,'none','xlarge','indoor'),

  ('Yuca','Yuca','Yucca elephantipes','árbol','México y América Central',
   'Resistente, de porte erguido. Tolera el sol directo y sequía.',
   'direct',7,'low',14,'sustrato de cactus + tierra negra',6.0,7.0,60,5,'easy',true,false,'summer','xlarge','both'),

  ('Mamillaria','Cactus Botón','Mammillaria spp.','cactus','México',
   'Género de cactus más popular. Corona de flores pequeñas en primavera.',
   'direct',7,'low',14,'sustrato de cactus + grava',6.0,7.0,90,-5,'easy',false,false,'spring','compact','both'),

  ('Cereus','Cactus Columnar','Cereus peruvianus','cactus','América del Sur',
   'Columna azul-verde que puede crecer varios metros. Muy resistente.',
   'direct',7,'low',14,'sustrato de cactus + grava',6.0,7.0,90,5,'easy',false,false,'summer','xlarge','both'),

  ('Nopal',NULL,'Opuntia spp.','cactus','México',
   'Cactus paleta nativo de México. Fruta y nopales comestibles.',
   'direct',7,'low',14,'sustrato de cactus + arena',6.0,7.5,90,-10,'easy',false,false,'spring','large','outdoor'),

  ('Palmera de Salón','Palmita','Chamaedorea elegans','tropical','México y Guatemala',
   'Palma compacta ideal para interiores. No tóxica para mascotas.',
   'bright_indirect',4,'medium',7,'tierra negra + perlita',6.0,7.0,30,10,'easy',false,false,'none','medium','indoor'),

  ('Ripsalis','Cactus Colgante','Rhipsalis spp.','cactus','Bosques tropicales de América',
   'Cactus epífito de selva. No necesita sol directo, ideal colgante.',
   'bright_indirect',5,'medium',7,'mezcla de orquídea + tierra negra',5.5,6.5,30,10,'easy',false,false,'winter','medium','indoor'),

  ('Peperomia','Radiadora','Peperomia obtusifolia','tropical','América tropical',
   'Planta compacta de bajo mantenimiento. Miles de variedades disponibles.',
   'bright_indirect',4,'low',10,'tierra universal + perlita',6.0,7.0,30,10,'easy',false,false,'none','compact','indoor'),

  ('Ave del Paraíso',NULL,'Strelitzia reginae','tropical','Sudáfrica',
   'Flores espectaculares en naranja y azul. Necesita sol directo para florecer.',
   'direct',7,'medium',7,'tierra negra + arena',6.0,7.0,30,5,'medium',true,false,'spring','large','both'),

  ('Crotón','Crotón','Codiaeum variegatum','tropical','Malasia y Oceanía',
   'Hojas multicolores explosivas. Odia los cambios y los ambientes secos.',
   'direct',7,'high',7,'tierra negra + perlita',5.5,6.5,30,15,'hard',true,false,'none','medium','indoor'),

  ('Alocasia','Oreja de Elefante','Alocasia spp.','tropical','Asia tropical',
   'Hojas enormes en forma de corazón o flecha. Impacto visual garantizado.',
   'bright_indirect',6,'high',7,'tierra negra + perlita + corteza',5.5,7.0,30,15,'medium',true,false,'none','large','indoor'),

  ('Bromelia','Bromelia','Bromeliaceae spp.','tropical','América tropical',
   'Forma roseta con copa central que retiene agua. Floración única en su vida.',
   'bright_indirect',6,'medium',7,'mezcla de orquídea + corteza',5.5,6.5,30,15,'medium',false,false,'year_round','medium','indoor'),

  ('Albahaca',NULL,'Ocimum basilicum','otra','India y Asia tropical',
   'Hierba aromática imprescindible en la cocina. Pide sol y agua frecuente.',
   'direct',7,'medium',3,'tierra negra + compost',6.0,7.0,30,10,'medium',false,false,'summer','compact','both'),

  ('Menta',NULL,'Mentha spp.','otra','Europa y Asia',
   'Aromática invasiva. Mejor en maceta propia para controlar su expansión.',
   'bright_indirect',5,'medium',3,'tierra negra + compost',6.0,7.0,30,0,'easy',false,false,'summer','compact','both'),

  ('Romero',NULL,'Salvia rosmarinus','otra','Mediterráneo',
   'Arbusto aromático resistente. Odia los suelos con humedad estancada.',
   'direct',7,'low',7,'tierra universal + arena',6.0,8.0,60,-5,'easy',false,false,'spring','medium','outdoor'),

  ('Lavanda',NULL,'Lavandula angustifolia','otra','Mediterráneo',
   'Flores perfumadas que repelen mosquitos. Necesita sol y buen drenaje.',
   'direct',7,'low',7,'tierra universal + arena',6.5,8.0,60,-10,'medium',false,false,'summer','medium','outdoor'),

  ('Tomillo',NULL,'Thymus vulgaris','otra','Mediterráneo',
   'Hierba culinaria compacta muy resistente. Sol y poco riego.',
   'direct',6,'low',7,'tierra universal + arena',6.0,8.0,60,-10,'easy',false,false,'spring','compact','outdoor');
```

- [ ] **Step 2: Aplicar seed en Supabase**

En Supabase → SQL Editor → pega el SQL completo → Run.

---

## Task 4: Tipos TypeScript — catalog.ts y database.ts

**Files:**
- Create: `plantopia/src/types/catalog.ts`
- Modify: `plantopia/src/types/database.ts`

- [ ] **Step 1: Crear src/types/catalog.ts**

```typescript
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
```

- [ ] **Step 2: Actualizar src/types/database.ts**

Agregar `species_id` al interface Plant y `plant_catalog` al Database type.

En el interface `Plant`, después de `photo_url: string | null;`, agregar:

```typescript
  species_id: string | null;
```

Al final del bloque `Tables` en el tipo `Database`, después de `plant_events: { ... };`, agregar:

```typescript
      plant_catalog: {
        Row: Spread<{
          id: string; common_name: string; popular_name: string | null;
          scientific_name: string; plant_type: string; origin: string | null;
          description: string | null; reference_photo_url: string | null;
          light_type: string | null; light_hours_per_day: number | null;
          humidity: string | null; watering_frequency_days: number | null;
          substrate_mix: string | null; substrate_ph_min: number | null;
          substrate_ph_max: number | null; fertilizing_frequency_days: number | null;
          min_temperature_celsius: number | null; care_difficulty: string | null;
          toxic_to_pets: boolean; toxic_to_children: boolean;
          flowering_season: string | null; adult_size: string | null;
          location: string | null; created_at: string; updated_at: string;
        }>;
        Insert: Spread<{
          id?: string; common_name: string; popular_name?: string | null;
          scientific_name: string; plant_type: string; origin?: string | null;
          description?: string | null; reference_photo_url?: string | null;
          light_type?: string | null; light_hours_per_day?: number | null;
          humidity?: string | null; watering_frequency_days?: number | null;
          substrate_mix?: string | null; substrate_ph_min?: number | null;
          substrate_ph_max?: number | null; fertilizing_frequency_days?: number | null;
          min_temperature_celsius?: number | null; care_difficulty?: string | null;
          toxic_to_pets?: boolean; toxic_to_children?: boolean;
          flowering_season?: string | null; adult_size?: string | null;
          location?: string | null;
        }>;
        Update: Spread<Partial<{
          common_name: string; popular_name: string | null;
          scientific_name: string; plant_type: string; origin: string | null;
          description: string | null; reference_photo_url: string | null;
        }>>;
        Relationships: [];
      };
```

- [ ] **Step 3: Verificar que no hay errores de tipos**

```bash
cd plantopia && npm run check
```

Esperado: sin errores relacionados con los tipos nuevos.

- [ ] **Step 4: Commit**

```bash
git add plantopia/src/types/catalog.ts plantopia/src/types/database.ts
git commit -m "feat: add PlantCatalog types and species_id to Plant"
```

---

## Task 5: Labels para enums del catálogo

**Files:**
- Modify: `plantopia/src/lib/labels.ts`
- Modify: `plantopia/src/lib/labels.test.ts`

- [ ] **Step 1: Agregar tests que fallen**

Al final de `labels.test.ts`, agregar:

```typescript
import {
  HUMIDITY_LABELS, CARE_DIFFICULTY_LABELS, FLOWERING_SEASON_LABELS,
  ADULT_SIZE_LABELS, PLANT_TYPE_LABELS, CATALOG_LOCATION_LABELS,
  HUMIDITY_LEVELS, CARE_DIFFICULTIES, FLOWERING_SEASONS, ADULT_SIZES,
  PLANT_TYPES, CATALOG_LOCATIONS,
} from './labels';

describe('catalog labels', () => {
  it('HUMIDITY_LEVELS covers HUMIDITY_LABELS exactly', () => {
    for (const h of HUMIDITY_LEVELS) expect(HUMIDITY_LABELS[h]).toBeTruthy();
    expect(HUMIDITY_LEVELS).toHaveLength(Object.keys(HUMIDITY_LABELS).length);
  });

  it('CARE_DIFFICULTIES covers CARE_DIFFICULTY_LABELS exactly', () => {
    for (const d of CARE_DIFFICULTIES) expect(CARE_DIFFICULTY_LABELS[d]).toBeTruthy();
    expect(CARE_DIFFICULTIES).toHaveLength(Object.keys(CARE_DIFFICULTY_LABELS).length);
  });

  it('FLOWERING_SEASONS covers FLOWERING_SEASON_LABELS exactly', () => {
    for (const s of FLOWERING_SEASONS) expect(FLOWERING_SEASON_LABELS[s]).toBeTruthy();
    expect(FLOWERING_SEASONS).toHaveLength(Object.keys(FLOWERING_SEASON_LABELS).length);
  });

  it('ADULT_SIZES covers ADULT_SIZE_LABELS exactly', () => {
    for (const s of ADULT_SIZES) expect(ADULT_SIZE_LABELS[s]).toBeTruthy();
    expect(ADULT_SIZES).toHaveLength(Object.keys(ADULT_SIZE_LABELS).length);
  });

  it('PLANT_TYPES covers PLANT_TYPE_LABELS exactly', () => {
    for (const t of PLANT_TYPES) expect(PLANT_TYPE_LABELS[t]).toBeTruthy();
    expect(PLANT_TYPES).toHaveLength(Object.keys(PLANT_TYPE_LABELS).length);
  });

  it('CATALOG_LOCATIONS covers CATALOG_LOCATION_LABELS exactly', () => {
    for (const l of CATALOG_LOCATIONS) expect(CATALOG_LOCATION_LABELS[l]).toBeTruthy();
    expect(CATALOG_LOCATIONS).toHaveLength(Object.keys(CATALOG_LOCATION_LABELS).length);
  });
});
```

- [ ] **Step 2: Verificar que los tests fallan**

```bash
cd plantopia && npm test
```

Esperado: FAIL "Cannot find module" o "is not exported from './labels'".

- [ ] **Step 3: Agregar los labels a labels.ts**

Al principio de `labels.ts`, agregar los imports de catalog:

```typescript
import type {
  HumidityLevel, CareDifficulty, FloweringSeason,
  AdultSize, PlantType, CatalogLocation,
} from '../types/catalog';
```

Al final de `labels.ts`, antes del último export, agregar:

```typescript
export const HUMIDITY_LABELS: Record<HumidityLevel, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export const CARE_DIFFICULTY_LABELS: Record<CareDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

export const FLOWERING_SEASON_LABELS: Record<FloweringSeason, string> = {
  spring: 'Primavera',
  summer: 'Verano',
  fall: 'Otoño',
  winter: 'Invierno',
  year_round: 'Todo el año',
  none: 'No florece',
};

export const ADULT_SIZE_LABELS: Record<AdultSize, string> = {
  compact: 'Compacta',
  medium: 'Mediana',
  large: 'Grande',
  xlarge: 'Muy grande',
};

export const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  suculenta: 'Suculenta',
  tropical: 'Tropical',
  cactus: 'Cactus',
  helecho: 'Helecho',
  trepadora: 'Trepadora',
  árbol: 'Árbol',
  otra: 'Otra',
};

export const CATALOG_LOCATION_LABELS: Record<CatalogLocation, string> = {
  indoor: 'Interior',
  outdoor: 'Exterior',
  both: 'Interior y exterior',
};

export const HUMIDITY_LEVELS: HumidityLevel[] = ['low', 'medium', 'high'];
export const CARE_DIFFICULTIES: CareDifficulty[] = ['easy', 'medium', 'hard'];
export const FLOWERING_SEASONS: FloweringSeason[] = ['spring', 'summer', 'fall', 'winter', 'year_round', 'none'];
export const ADULT_SIZES: AdultSize[] = ['compact', 'medium', 'large', 'xlarge'];
export const PLANT_TYPES: PlantType[] = ['suculenta', 'tropical', 'cactus', 'helecho', 'trepadora', 'árbol', 'otra'];
export const CATALOG_LOCATIONS: CatalogLocation[] = ['indoor', 'outdoor', 'both'];
```

- [ ] **Step 4: Verificar que pasan**

```bash
cd plantopia && npm test
```

Esperado: todos los tests PASS.

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/labels.ts plantopia/src/lib/labels.test.ts
git commit -m "feat: add catalog enum labels and arrays"
```

---

## Task 6: catalog.ts — biblioteca de búsqueda

**Files:**
- Create: `plantopia/src/lib/catalog.ts`
- Create: `plantopia/src/lib/catalog.test.ts`

- [ ] **Step 1: Escribir los tests primero**

Crear `plantopia/src/lib/catalog.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase ANTES de importar catalog
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

import { searchCatalog, getCatalogPlant } from './catalog';

describe('searchCatalog', () => {
  it('returns [] for empty string (no DB call)', async () => {
    const result = await searchCatalog('');
    expect(result).toEqual([]);
  });

  it('returns [] for single character (no DB call)', async () => {
    const result = await searchCatalog('m');
    expect(result).toEqual([]);
  });

  it('returns array for 2+ character term', async () => {
    const result = await searchCatalog('mo');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getCatalogPlant', () => {
  it('returns null when not found', async () => {
    const result = await getCatalogPlant('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Verificar que fallan**

```bash
cd plantopia && npm test -- catalog.test.ts
```

Esperado: FAIL "Cannot find module './catalog'".

- [ ] **Step 3: Implementar catalog.ts**

Crear `plantopia/src/lib/catalog.ts`:

```typescript
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
```

- [ ] **Step 4: Verificar que pasan**

```bash
cd plantopia && npm test
```

Esperado: todos los tests PASS.

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/catalog.ts plantopia/src/lib/catalog.test.ts
git commit -m "feat: add catalog search library with tests"
```

---

## Task 7: plant-form.ts — species_id + fillFormFromCatalog

**Files:**
- Modify: `plantopia/src/lib/plant-form.ts`
- Modify: `plantopia/src/lib/plant-form.test.ts`

- [ ] **Step 1: Actualizar el test de roundtrip para incluir species_id**

En `plant-form.test.ts`, en el array `FORM_FIELDS`, agregar `'species_id'` al final:

```typescript
const FORM_FIELDS = [
  'common_name', 'species', 'location', 'health_status', 'notes',
  'substrate_mix', 'substrate_ph', 'substrate_last_changed',
  'light_type', 'light_hours_per_day', 'light_placement',
  'watering_frequency_days', 'last_watered',
  'fertilizing_frequency_days', 'last_fertilized',
  'current_phase', 'current_phase_started_at',
  'species_id',
] as const;
```

En el test `'fills a form and reads back identical values'`, agregar `species_id` al objeto plant:

```typescript
const plant: Plant = {
  // ... campos existentes ...
  species_id: 'abc-catalog-id',
  // ...
};
```

Y al final del test, agregar la aserción:

```typescript
expect(result.species_id).toBe('abc-catalog-id');
```

- [ ] **Step 2: Verificar que el test falla**

```bash
cd plantopia && npm test -- plant-form.test.ts
```

Esperado: FAIL porque `Plant` no tiene `species_id` todavía (ya lo tiene de Task 4) y `readPlantForm` no lee ese campo.

- [ ] **Step 3: Actualizar plant-form.ts**

Reemplazar el contenido completo de `plant-form.ts`:

```typescript
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
  setVal('species_id', plant.species_id);
}

// Pre-llena los campos de cuidado del formulario con datos del catálogo.
// Sobreescribe siempre — el usuario edita después si quiere.
export function fillFormFromCatalog(form: HTMLFormElement, catalog: PlantCatalog): void {
  const setVal = (name: string, value: string | number | null | undefined) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (el) el.value = value === null || value === undefined ? '' : String(value);
  };

  setVal('species_id', catalog.id);
  setVal('common_name', catalog.popular_name ?? catalog.common_name);
  setVal('species', catalog.scientific_name);
  setVal('light_type', catalog.light_type);
  setVal('light_hours_per_day', catalog.light_hours_per_day);
  setVal('watering_frequency_days', catalog.watering_frequency_days);
  setVal('substrate_mix', catalog.substrate_mix);
  setVal('substrate_ph', catalog.substrate_ph_min);
  setVal('fertilizing_frequency_days', catalog.fertilizing_frequency_days);
}
```

- [ ] **Step 4: Verificar que pasan todos los tests**

```bash
cd plantopia && npm test
```

Esperado: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/plant-form.ts plantopia/src/lib/plant-form.test.ts
git commit -m "feat: add species_id and fillFormFromCatalog to plant-form"
```

---

## Task 8: plants.ts — join catálogo + upload/delete fotos

**Files:**
- Modify: `plantopia/src/lib/plants.ts`

- [ ] **Step 1: Actualizar plants.ts**

Reemplazar el contenido completo de `plantopia/src/lib/plants.ts`:

```typescript
// Helpers CRUD para plantas, eventos y log de fases.
// Todas las queries se ejecutan client-side (Astro output: static).
import { supabase } from './supabase';
import type {
  Plant,
  PlantEvent,
  PlantPhaseLog,
  GrowthPhase,
} from '../types/database';
import type { PlantWithCatalog, PlantWithFullCatalog } from '../types/catalog';

export type PlantInsert = Omit<Plant, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type PlantUpdate = Partial<PlantInsert>;

export async function listPlants(): Promise<PlantWithCatalog[]> {
  const { data, error } = await supabase
    .from('plants')
    .select('*, plant_catalog(id, common_name, popular_name, reference_photo_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlantWithCatalog[];
}

export async function getPlant(id: string): Promise<PlantWithFullCatalog | null> {
  const { data, error } = await supabase
    .from('plants')
    .select('*, plant_catalog(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as PlantWithFullCatalog | null;
}

export async function createPlant(userId: string, plant: Omit<PlantInsert, 'photo_url'> & { photo_url?: string | null }): Promise<Plant> {
  const { data, error } = await supabase
    .from('plants')
    .insert({ ...plant, photo_url: plant.photo_url ?? null, user_id: userId })
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

export async function uploadPlantPhoto(file: File, userId: string, plantId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${plantId}.${ext}`;
  const { error } = await supabase.storage
    .from('plant-photos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('plant-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePlantPhoto(photoUrl: string): Promise<void> {
  const match = photoUrl.match(/plant-photos\/(.+?)(?:\?|$)/);
  if (!match) return;
  const { error } = await supabase.storage.from('plant-photos').remove([decodeURIComponent(match[1])]);
  if (error) throw error;
}

/** Cambia la fase actual de una planta y cierra/abre el registro correspondiente en plant_phase_log. */
export async function changePlantPhase(
  plant: Plant,
  newPhase: GrowthPhase,
  note?: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

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
      .in('id', openLogs.map((l) => l.id));
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

  if (event.event_type === 'watered') {
    await supabase.from('plants').update({ last_watered: event.event_date }).eq('id', plant.id);
  } else if (event.event_type === 'fertilized') {
    await supabase.from('plants').update({ last_fertilized: event.event_date }).eq('id', plant.id);
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
```

- [ ] **Step 2: Verificar tipos y tests**

```bash
cd plantopia && npm run check && npm test
```

Esperado: sin errores de tipos, todos los tests PASS.

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/lib/plants.ts
git commit -m "feat: join plant_catalog in queries, add uploadPlantPhoto and deletePlantPhoto"
```

---

## Task 9: PlantForm.astro — buscador de catálogo + campo de foto

**Files:**
- Modify: `plantopia/src/components/PlantForm.astro`

- [ ] **Step 1: Reemplazar PlantForm.astro**

Reemplazar el contenido completo:

```astro
---
import {
  LOCATIONS,
  HEALTH_STATUSES,
  LIGHT_TYPES,
  GROWTH_PHASES,
  LOCATION_LABELS,
  HEALTH_LABELS,
  LIGHT_LABELS,
  PHASE_LABELS,
} from '../lib/labels';
---

<form id="plant-form" class="flex flex-col gap-5">

  <!-- Buscador de catálogo -->
  <div class="relative">
    <label for="catalog-search" class="mb-1 block text-xs text-slate-400">
      Buscar en el catálogo (opcional — pre-llena los campos de cuidado)
    </label>
    <input
      id="catalog-search"
      type="text"
      placeholder="ej. Monstera, Poto, Helecho de Boston…"
      autocomplete="off"
      class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
    />
    <ul
      id="catalog-dropdown"
      class="absolute z-10 mt-1 hidden max-h-60 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 shadow-lg"
    ></ul>
    <p id="catalog-selected" class="mt-1 hidden text-xs text-green-400"></p>
    <input type="hidden" name="species_id" id="species_id" />
  </div>

  <!-- Foto -->
  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Foto</legend>
    <div id="photo-preview-container" class="hidden">
      <img
        id="photo-preview"
        src=""
        alt="Vista previa"
        class="h-40 w-full rounded-md border border-slate-700 object-cover"
      />
      <div class="mt-2 flex gap-3">
        <label
          for="photo-input"
          class="cursor-pointer text-xs text-slate-400 hover:text-slate-200"
        >Cambiar foto</label>
        <button type="button" id="remove-photo-btn" class="text-xs text-red-400 hover:text-red-300">
          Quitar foto
        </button>
      </div>
    </div>
    <div id="photo-upload-area">
      <label
        for="photo-input"
        class="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-600 px-4 py-6 text-sm text-slate-400 transition hover:border-slate-400 hover:text-slate-200"
      >
        <span>📷</span>
        <span>Agregar foto (opcional)</span>
      </label>
    </div>
    <input id="photo-input" name="photo" type="file" accept="image/*" class="sr-only" />
    <input type="hidden" name="photo_action" id="photo_action" value="keep" />
  </fieldset>

  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Datos básicos</legend>

    <div>
      <label for="common_name" class="mb-1 block text-xs text-slate-400">Nombre común *</label>
      <input
        id="common_name"
        name="common_name"
        type="text"
        required
        class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        placeholder="ej. Monstera del pasillo"
      />
    </div>

    <div>
      <label for="species" class="mb-1 block text-xs text-slate-400">Especie</label>
      <input
        id="species"
        name="species"
        type="text"
        class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        placeholder="ej. Monstera deliciosa"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="location" class="mb-1 block text-xs text-slate-400">Ubicación</label>
        <select
          id="location"
          name="location"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        >
          <option value="">—</option>
          {LOCATIONS.map((loc) => <option value={loc}>{LOCATION_LABELS[loc]}</option>)}
        </select>
      </div>
      <div>
        <label for="health_status" class="mb-1 block text-xs text-slate-400">Salud</label>
        <select
          id="health_status"
          name="health_status"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        >
          {HEALTH_STATUSES.map((h) => <option value={h}>{HEALTH_LABELS[h]}</option>)}
        </select>
      </div>
    </div>

    <div>
      <label for="notes" class="mb-1 block text-xs text-slate-400">Notas</label>
      <textarea
        id="notes"
        name="notes"
        rows="2"
        class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
      ></textarea>
    </div>
  </fieldset>

  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Sustrato</legend>
    <div>
      <label for="substrate_mix" class="mb-1 block text-xs text-slate-400">Mezcla</label>
      <input
        id="substrate_mix"
        name="substrate_mix"
        type="text"
        class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        placeholder="ej. turba + perlita + corteza de pino"
      />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="substrate_ph" class="mb-1 block text-xs text-slate-400">pH</label>
        <input
          id="substrate_ph"
          name="substrate_ph"
          type="number"
          step="0.1"
          min="0"
          max="14"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label for="substrate_last_changed" class="mb-1 block text-xs text-slate-400">Último cambio</label>
        <input
          id="substrate_last_changed"
          name="substrate_last_changed"
          type="date"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Luz</legend>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="light_type" class="mb-1 block text-xs text-slate-400">Tipo</label>
        <select
          id="light_type"
          name="light_type"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        >
          <option value="">—</option>
          {LIGHT_TYPES.map((l) => <option value={l}>{LIGHT_LABELS[l]}</option>)}
        </select>
      </div>
      <div>
        <label for="light_hours_per_day" class="mb-1 block text-xs text-slate-400">Horas/día</label>
        <input
          id="light_hours_per_day"
          name="light_hours_per_day"
          type="number"
          step="0.5"
          min="0"
          max="24"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
    <div>
      <label for="light_placement" class="mb-1 block text-xs text-slate-400">Ubicación de luz</label>
      <input
        id="light_placement"
        name="light_placement"
        type="text"
        class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        placeholder="ej. ventana norte"
      />
    </div>
  </fieldset>

  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Riego y fertilización</legend>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="watering_frequency_days" class="mb-1 block text-xs text-slate-400">Riego cada (días)</label>
        <input
          id="watering_frequency_days"
          name="watering_frequency_days"
          type="number"
          min="0"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label for="last_watered" class="mb-1 block text-xs text-slate-400">Último riego</label>
        <input
          id="last_watered"
          name="last_watered"
          type="date"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="fertilizing_frequency_days" class="mb-1 block text-xs text-slate-400">Fertilizar cada (días)</label>
        <input
          id="fertilizing_frequency_days"
          name="fertilizing_frequency_days"
          type="number"
          min="0"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
      <div>
        <label for="last_fertilized" class="mb-1 block text-xs text-slate-400">Última fertilización</label>
        <input
          id="last_fertilized"
          name="last_fertilized"
          type="date"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
  </fieldset>

  <fieldset class="flex flex-col gap-3">
    <legend class="mb-1 text-sm font-medium text-slate-300">Fase de vida</legend>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="current_phase" class="mb-1 block text-xs text-slate-400">Fase actual</label>
        <select
          id="current_phase"
          name="current_phase"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        >
          {GROWTH_PHASES.map((p) => <option value={p}>{PHASE_LABELS[p]}</option>)}
        </select>
      </div>
      <div>
        <label for="current_phase_started_at" class="mb-1 block text-xs text-slate-400">Fase desde</label>
        <input
          id="current_phase_started_at"
          name="current_phase_started_at"
          type="date"
          class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
        />
      </div>
    </div>
  </fieldset>

  <p id="form-message" class="hidden rounded-md px-3 py-2 text-sm"></p>

  <div class="flex gap-3">
    <button
      id="submit-btn"
      type="submit"
      class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
    >
      Guardar
    </button>
    <a
      href={import.meta.env.BASE_URL}
      class="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
    >
      Cancelar
    </a>
  </div>
</form>

<script>
  import { searchCatalog } from '../lib/catalog';
  import { fillFormFromCatalog } from '../lib/plant-form';
  import type { PlantCatalog } from '../types/catalog';

  const searchInput = document.getElementById('catalog-search') as HTMLInputElement;
  const dropdown = document.getElementById('catalog-dropdown') as HTMLUListElement;
  const speciesIdInput = document.getElementById('species_id') as HTMLInputElement;
  const selectedLabel = document.getElementById('catalog-selected') as HTMLParagraphElement;
  const form = document.getElementById('plant-form') as HTMLFormElement;

  const photoInput = document.getElementById('photo-input') as HTMLInputElement;
  const photoPreview = document.getElementById('photo-preview') as HTMLImageElement;
  const photoPreviewContainer = document.getElementById('photo-preview-container') as HTMLDivElement;
  const photoUploadArea = document.getElementById('photo-upload-area') as HTMLDivElement;
  const photoActionInput = document.getElementById('photo_action') as HTMLInputElement;
  const removePhotoBtn = document.getElementById('remove-photo-btn') as HTMLButtonElement;

  // --- Catálogo ---
  let debounceTimer: ReturnType<typeof setTimeout>;

  function closeDropdown() {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
  }

  function selectCatalogPlant(plant: PlantCatalog) {
    speciesIdInput.value = plant.id;
    searchInput.value = plant.popular_name ?? plant.common_name;
    selectedLabel.textContent = `✓ Datos de "${plant.common_name}" cargados. Podés editar cualquier campo.`;
    selectedLabel.classList.remove('hidden');
    closeDropdown();
    fillFormFromCatalog(form, plant);

    // Si el catálogo tiene foto de referencia y no hay foto del usuario, previsualizar
    if (plant.reference_photo_url && !photoInput.files?.length && photoActionInput.value !== 'upload') {
      showPhotoPreview(plant.reference_photo_url, false);
    }
  }

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const term = (e.target as HTMLInputElement).value.trim();
    if (term.length < 2) { closeDropdown(); return; }

    debounceTimer = setTimeout(async () => {
      try {
        const results = await searchCatalog(term);
        if (results.length === 0) { closeDropdown(); return; }
        dropdown.innerHTML = results
          .map(
            (p, i) => `<li data-i="${i}" class="cursor-pointer px-3 py-2 text-sm hover:bg-slate-800">
              <span class="font-medium text-slate-200">${escHtml(p.popular_name ?? p.common_name)}</span>
              <span class="ml-2 text-slate-500">${escHtml(p.common_name)}</span>
              <span class="ml-1 text-xs italic text-slate-600">${escHtml(p.scientific_name)}</span>
            </li>`
          )
          .join('');
        dropdown.classList.remove('hidden');
        dropdown.querySelectorAll<HTMLLIElement>('li').forEach((li, i) => {
          li.addEventListener('click', () => selectCatalogPlant(results[i]));
        });
      } catch { closeDropdown(); }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  function escHtml(str: string): string {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // --- Foto ---
  function showPhotoPreview(url: string, isUserPhoto: boolean) {
    photoPreview.src = url;
    photoPreviewContainer.classList.remove('hidden');
    if (isUserPhoto) {
      photoUploadArea.classList.add('hidden');
    }
  }

  function hidePhotoPreview() {
    photoPreview.src = '';
    photoPreviewContainer.classList.add('hidden');
    photoUploadArea.classList.remove('hidden');
  }

  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    showPhotoPreview(URL.createObjectURL(file), true);
    photoActionInput.value = 'upload';
  });

  removePhotoBtn.addEventListener('click', () => {
    photoInput.value = '';
    hidePhotoPreview();
    photoActionInput.value = 'remove';
  });

  // Expuesto para que las páginas (edit.astro) puedan pre-cargar la foto existente
  (window as any).__plantFormSetPhoto = (url: string | null) => {
    if (url) {
      showPhotoPreview(url, true);
      photoActionInput.value = 'keep';
    } else {
      hidePhotoPreview();
    }
  };

  // Expuesto para que edit.astro muestre el catálogo vinculado
  (window as any).__plantFormSetCatalogLabel = (name: string) => {
    selectedLabel.textContent = `✓ Basado en "${name}". Podés cambiar la planta buscando arriba.`;
    selectedLabel.classList.remove('hidden');
  };
</script>
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd plantopia && npm run check
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/components/PlantForm.astro
git commit -m "feat: add catalog search and photo upload to PlantForm"
```

---

## Task 10: new.astro — orquestar creación con foto

**Files:**
- Modify: `plantopia/src/pages/plants/new.astro`

- [ ] **Step 1: Actualizar el script de new.astro**

Reemplazar solo el bloque `<script>`:

```astro
  <script>
    import { requireAuth } from '../../lib/session';
    import { createPlant, uploadPlantPhoto, updatePlant } from '../../lib/plants';
    import { readPlantForm } from '../../lib/plant-form';

    const form = document.getElementById('plant-form') as HTMLFormElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    const messageEl = document.getElementById('form-message') as HTMLParagraphElement;

    function showError(text: string) {
      messageEl.textContent = text;
      messageEl.className = 'rounded-md px-3 py-2 text-sm bg-red-950 text-red-300 border border-red-900';
    }

    async function init() {
      const user = await requireAuth();
      if (!user) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        messageEl.className = 'hidden';

        try {
          const plantData = readPlantForm(form);
          if (!plantData.common_name) {
            showError('El nombre común es obligatorio.');
            submitBtn.disabled = false;
            return;
          }

          // Crear la planta primero para obtener el ID (se necesita para el path de la foto)
          const created = await createPlant(user.id, { ...plantData, photo_url: null });

          // Subir foto si se seleccionó una
          const photoInput = form.elements.namedItem('photo') as HTMLInputElement;
          const photoFile = photoInput.files?.[0];
          if (photoFile) {
            const photoUrl = await uploadPlantPhoto(photoFile, user.id, created.id);
            await updatePlant(created.id, { photo_url: photoUrl });
          }

          window.location.href = `${import.meta.env.BASE_URL}plants/detail?id=${created.id}`;
        } catch (err) {
          showError(err instanceof Error ? `Error al guardar: ${err.message}` : 'Error al guardar.');
          submitBtn.disabled = false;
        }
      });
    }

    init();
  </script>
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd plantopia && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/pages/plants/new.astro
git commit -m "feat: upload photo on plant create"
```

---

## Task 11: edit.astro — cambio y borrado de foto

**Files:**
- Modify: `plantopia/src/pages/plants/edit.astro`

- [ ] **Step 1: Actualizar el script de edit.astro**

Reemplazar solo el bloque `<script>`:

```astro
  <script>
    import { requireAuth } from '../../lib/session';
    import { getPlant, updatePlant, uploadPlantPhoto, deletePlantPhoto } from '../../lib/plants';
    import { readPlantForm, fillPlantForm } from '../../lib/plant-form';

    const loadingEl = document.getElementById('loading')!;
    const errorEl = document.getElementById('error')!;
    const wrapperEl = document.getElementById('form-wrapper')!;
    const backLink = document.getElementById('back-link') as HTMLAnchorElement;
    const form = document.getElementById('plant-form') as HTMLFormElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    const messageEl = document.getElementById('form-message') as HTMLParagraphElement;

    function showError(text: string) {
      messageEl.textContent = text;
      messageEl.className = 'rounded-md px-3 py-2 text-sm bg-red-950 text-red-300 border border-red-900';
    }

    async function init() {
      const user = await requireAuth();
      if (!user) return;

      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent = 'Falta el id de la planta.';
        return;
      }
      backLink.href = `${import.meta.env.BASE_URL}plants/detail?id=${id}`;

      try {
        const plant = await getPlant(id);
        if (!plant) {
          loadingEl.classList.add('hidden');
          errorEl.classList.remove('hidden');
          errorEl.textContent = 'No se encontró la planta.';
          return;
        }

        fillPlantForm(form, plant);
        loadingEl.classList.add('hidden');
        wrapperEl.classList.remove('hidden');

        // Pre-cargar foto existente (personal o de catálogo como referencia)
        const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;
        if (displayPhoto) {
          (window as any).__plantFormSetPhoto?.(displayPhoto);
          // Si es foto de catálogo (no personal), marcar como 'keep' sin contar como upload
          if (!plant.photo_url) {
            (document.getElementById('photo_action') as HTMLInputElement).value = 'keep';
          }
        }

        // Mostrar label del catálogo vinculado
        if (plant.plant_catalog) {
          const catalogName = plant.plant_catalog.popular_name ?? plant.plant_catalog.common_name;
          (window as any).__plantFormSetCatalogLabel?.(catalogName);
          (document.getElementById('catalog-search') as HTMLInputElement).value = catalogName;
        }

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          submitBtn.disabled = true;
          messageEl.className = 'hidden';

          try {
            const patch = readPlantForm(form);
            if (!patch.common_name) {
              showError('El nombre común es obligatorio.');
              submitBtn.disabled = false;
              return;
            }

            // Manejar foto
            const photoAction = (form.elements.namedItem('photo_action') as HTMLInputElement).value;
            const photoInput = form.elements.namedItem('photo') as HTMLInputElement;

            if (photoAction === 'upload' && photoInput.files?.[0]) {
              const url = await uploadPlantPhoto(photoInput.files[0], user.id, id);
              await updatePlant(id, { ...patch, photo_url: url });
            } else if (photoAction === 'remove') {
              if (plant.photo_url) await deletePlantPhoto(plant.photo_url);
              await updatePlant(id, { ...patch, photo_url: null });
            } else {
              await updatePlant(id, patch);
            }

            window.location.href = `${import.meta.env.BASE_URL}plants/detail?id=${id}`;
          } catch (err) {
            showError(err instanceof Error ? `Error al guardar: ${err.message}` : 'Error al guardar.');
            submitBtn.disabled = false;
          }
        });
      } catch (err) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent =
          err instanceof Error ? `Error al cargar: ${err.message}` : 'Error al cargar la planta.';
      }
    }

    init();
  </script>
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd plantopia && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/pages/plants/edit.astro
git commit -m "feat: handle photo change and delete on edit"
```

---

## Task 12: index.astro — tarjetas con imagen

**Files:**
- Modify: `plantopia/src/pages/index.astro`

- [ ] **Step 1: Actualizar el script de index.astro**

En el bloque `<script>`, cambiar el import de tipos y la función `card`:

```typescript
    import { requireAuth, signOut } from '../lib/session';
    import { listPlants } from '../lib/plants';
    import { HEALTH_LABELS, HEALTH_COLORS, PHASE_LABELS, LOCATION_LABELS } from '../lib/labels';
    import type { PlantWithCatalog } from '../types/catalog';

    // ... (loadingEl, errorEl, emptyEl, gridEl, userEmailEl, logoutBtn sin cambios) ...

    function card(plant: PlantWithCatalog): string {
      const health = plant.health_status ?? 'healthy';
      const healthColor = HEALTH_COLORS[health];
      const healthLabel = HEALTH_LABELS[health];
      const location = plant.location ? LOCATION_LABELS[plant.location] : '—';
      const base = import.meta.env.BASE_URL;
      const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;

      return `
        <a href="${base}plants/detail?id=${plant.id}" class="block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-600">
          <div class="h-40 bg-slate-800">
            ${
              displayPhoto
                ? `<img src="${escapeHtml(displayPhoto)}" alt="${escapeHtml(plant.common_name)}" class="h-full w-full object-cover" loading="lazy" />`
                : `<div class="flex h-full items-center justify-center text-4xl">🪴</div>`
            }
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</h3>
                ${plant.species ? `<p class="text-xs text-slate-500">${escapeHtml(plant.species)}</p>` : ''}
              </div>
              <span class="shrink-0 rounded-full border px-2 py-0.5 text-xs ${healthColor}">${healthLabel}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>📍 ${location}</span>
              <span>🌱 ${PHASE_LABELS[plant.current_phase]}</span>
              ${plant.last_watered ? `<span>💧 ${plant.last_watered}</span>` : ''}
            </div>
          </div>
        </a>
      `;
    }
```

El resto del script (escapeHtml, init) queda igual excepto eliminar el import de `Plant` de database.ts.

- [ ] **Step 2: Verificar typecheck**

```bash
cd plantopia && npm run check
```

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/pages/index.astro
git commit -m "feat: plant cards with photo and catalog fallback"
```

---

## Task 13: detail.astro — hero foto + info catálogo + cambiar foto

**Files:**
- Modify: `plantopia/src/pages/plants/detail.astro`

- [ ] **Step 1: Agregar sección hero en el HTML**

En `detail.astro`, dentro de `<div id="content" class="hidden">`, antes del div con nombre/botones, agregar:

```html
      <!-- Hero foto -->
      <div id="hero-photo-container" class="hidden mb-6">
        <img
          id="hero-photo"
          src=""
          alt=""
          class="h-48 w-full rounded-xl object-cover border border-slate-800"
        />
      </div>
```

Después del div de nombre/botones, agregar la sección de info del catálogo:

```html
      <!-- Info del catálogo (se muestra solo si la planta tiene species_id) -->
      <section id="catalog-info" class="hidden mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <details>
          <summary class="cursor-pointer text-sm font-medium text-slate-300">📚 Info del catálogo</summary>
          <div id="catalog-info-grid" class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"></div>
        </details>
      </section>
```

- [ ] **Step 2: Actualizar el script de detail.astro**

Actualizar los imports y la función `renderPlant`:

```typescript
    import { requireAuth } from '../../lib/session';
    import {
      getPlant, deletePlant, listPlantEvents, addPlantEvent,
      deletePlantEvent, listPhaseLog, changePlantPhase,
    } from '../../lib/plants';
    import {
      HEALTH_LABELS, HEALTH_COLORS, LOCATION_LABELS, LIGHT_LABELS,
      PHASE_LABELS, EVENT_LABELS,
      CARE_DIFFICULTY_LABELS, ADULT_SIZE_LABELS, FLOWERING_SEASON_LABELS,
      CATALOG_LOCATION_LABELS,
    } from '../../lib/labels';
    import type { PlantWithFullCatalog } from '../../types/catalog';
    import type { EventType, GrowthPhase } from '../../types/database';
```

Cambiar el tipo de `plant` en `renderPlant` y agregar la lógica de foto y catálogo:

```typescript
    function renderPlant(plant: PlantWithFullCatalog) {
      document.getElementById('plant-name')!.textContent = plant.common_name;
      document.getElementById('plant-species')!.textContent = plant.species ?? '';
      document.getElementById('plant-notes')!.textContent = plant.notes || 'Sin notas.';

      // Foto hero
      const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;
      const heroContainer = document.getElementById('hero-photo-container')!;
      const heroImg = document.getElementById('hero-photo') as HTMLImageElement;
      if (displayPhoto) {
        heroImg.src = displayPhoto;
        heroImg.alt = plant.common_name;
        heroContainer.classList.remove('hidden');
      } else {
        heroContainer.classList.add('hidden');
      }

      // Info del catálogo
      const catalogSection = document.getElementById('catalog-info')!;
      const catalogGrid = document.getElementById('catalog-info-grid')!;
      const cat = plant.plant_catalog;
      if (cat) {
        catalogSection.classList.remove('hidden');
        const items: Array<{ label: string; value: string }> = [
          { label: 'Origen', value: cat.origin ?? '—' },
          { label: 'Dificultad', value: cat.care_difficulty ? CARE_DIFFICULTY_LABELS[cat.care_difficulty] : '—' },
          { label: 'Tóxica mascotas', value: cat.toxic_to_pets ? '⚠️ Sí' : '✅ No' },
          { label: 'Tóxica niños', value: cat.toxic_to_children ? '⚠️ Sí' : '✅ No' },
          { label: 'Temp. mínima', value: cat.min_temperature_celsius != null ? `${cat.min_temperature_celsius}°C` : '—' },
          { label: 'Tamaño adulto', value: cat.adult_size ? ADULT_SIZE_LABELS[cat.adult_size] : '—' },
          { label: 'Floración', value: cat.flowering_season ? FLOWERING_SEASON_LABELS[cat.flowering_season] : '—' },
          { label: 'Ideal para', value: cat.location ? CATALOG_LOCATION_LABELS[cat.location] : '—' },
        ];
        catalogGrid.innerHTML = items
          .map(
            (item) => `
          <div class="rounded-lg border border-slate-800 bg-slate-950 p-2">
            <p class="text-xs text-slate-500">${item.label}</p>
            <p class="mt-0.5 text-sm font-medium text-slate-200">${escapeHtml(item.value)}</p>
          </div>`
          )
          .join('');
      } else {
        catalogSection.classList.add('hidden');
      }

      // Stats de la planta (igual que antes)
      const health = plant.health_status ?? 'healthy';
      const stats = [
        { label: 'Salud', value: HEALTH_LABELS[health], extra: HEALTH_COLORS[health] },
        { label: 'Fase', value: PHASE_LABELS[plant.current_phase] },
        { label: 'Ubicación', value: plant.location ? LOCATION_LABELS[plant.location] : '—' },
        { label: 'Luz', value: plant.light_type ? LIGHT_LABELS[plant.light_type] : '—' },
        { label: 'Riego cada', value: plant.watering_frequency_days ? `${plant.watering_frequency_days} días` : '—' },
        { label: 'Último riego', value: plant.last_watered ?? '—' },
        { label: 'Fertilizar cada', value: plant.fertilizing_frequency_days ? `${plant.fertilizing_frequency_days} días` : '—' },
        { label: 'Última fert.', value: plant.last_fertilized ?? '—' },
        { label: 'Sustrato', value: plant.substrate_mix ?? '—' },
      ];

      document.getElementById('stats-grid')!.innerHTML = stats
        .map(
          (s) => `
        <div class="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p class="text-xs text-slate-500">${s.label}</p>
          <p class="mt-1 text-sm font-medium text-slate-200">${escapeHtml(String(s.value))}</p>
        </div>`
        )
        .join('');
    }
```

También en `init()`, cambiar el tipo de `plant`:

```typescript
        const plant = await getPlant(id);  // ahora retorna PlantWithFullCatalog | null
        if (!plant) { ... }
        renderPlant(plant);
        // El resto de init() queda igual — Plant sigue siendo válido para changePlantPhase/addPlantEvent
        // porque PlantWithFullCatalog extiende Plant
```

- [ ] **Step 3: Verificar typecheck**

```bash
cd plantopia && npm run check
```

Si hay error en `changePlantPhase(plant, ...)` porque el tipo es `PlantWithFullCatalog` en lugar de `Plant`: esto funciona porque `PlantWithFullCatalog` extiende `Plant`. Si TypeScript lo rechaza, castear: `changePlantPhase(plant as Plant, newPhase, note)`.

- [ ] **Step 4: Verificar todos los tests**

```bash
cd plantopia && npm test
```

Esperado: todos PASS.

- [ ] **Step 5: Commit final**

```bash
git add plantopia/src/pages/plants/detail.astro
git commit -m "feat: hero photo and catalog info section in detail view"
```

---

## Verificación manual post-implementación

- [ ] Aplicar migración 0002 en Supabase (si no se hizo en Task 1)
- [ ] Aplicar migración 0003 (seed de plantas) en Supabase
- [ ] Crear bucket `plant-photos` con las políticas (Task 2)
- [ ] `npm run dev` en `plantopia/`
- [ ] Abrir `/plants/new` → escribir "Poto" en el buscador → seleccionar → verificar que se llenan los campos
- [ ] Subir una foto → guardar → verificar que aparece en el card y en el detalle
- [ ] Abrir `/plants/edit?id=...` → verificar que se muestra la foto existente y el nombre del catálogo
- [ ] Cambiar foto → guardar → verificar que se actualiza
- [ ] Quitar foto → guardar → verificar que el card muestra la foto de catálogo o el emoji
- [ ] Verificar que el build de producción pasa: `npm run build`
