-- Plantopia — esquema inicial (Supabase / Postgres)
-- Incluye el modelo ampliado desde el día 1: sustrato, luz, fertilización,
-- fase de ciclo de vida + historial de fases + bitácora de eventos.

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type plant_location as enum ('indoor', 'outdoor');
create type health_status as enum ('healthy', 'needs_attention', 'sick');
create type light_type as enum ('direct', 'bright_indirect', 'low_indirect', 'shade');
create type growth_phase as enum ('vegetative', 'flowering', 'fruiting', 'dormancy', 'latent');
create type event_type as enum (
  'watered', 'fertilized', 'repotted', 'pruned', 'pest_detected',
  'pest_treated', 'phase_change', 'photo_added', 'note'
);

-- ─────────────────────────────────────────────────────────────
-- plants — ficha principal de cada planta
-- ─────────────────────────────────────────────────────────────
create table plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  common_name text not null,
  species text,
  photo_url text,
  location plant_location,
  health_status health_status default 'healthy',
  notes text,

  -- Sustrato
  substrate_mix text,             -- ej. "turba + perlita + corteza de pino"
  substrate_ph numeric(3,1),      -- opcional
  substrate_last_changed date,

  -- Luz
  light_type light_type,
  light_hours_per_day numeric(4,1),
  light_placement text,           -- ej. "ventana norte"

  -- Riego
  watering_frequency_days int,
  last_watered date,

  -- Fertilización
  fertilizing_frequency_days int,
  last_fertilized date,

  -- Ciclo de vida — fase actual
  current_phase growth_phase default 'vegetative',
  current_phase_started_at date default current_date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plants_user_id_idx on plants(user_id);
create index plants_current_phase_idx on plants(current_phase);

-- ─────────────────────────────────────────────────────────────
-- plant_phase_log — historial de cambios de fase (ciclo anual)
-- ─────────────────────────────────────────────────────────────
create table plant_phase_log (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  phase growth_phase not null,
  started_at date not null,
  ended_at date,               -- null = fase actual/en curso
  note text,

  created_at timestamptz not null default now()
);

create index plant_phase_log_plant_id_idx on plant_phase_log(plant_id);

-- ─────────────────────────────────────────────────────────────
-- plant_events — bitácora libre de eventos por planta
-- ─────────────────────────────────────────────────────────────
create table plant_events (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  event_type event_type not null,
  event_date date not null default current_date,
  note text,
  photo_url text,

  created_at timestamptz not null default now()
);

create index plant_events_plant_id_idx on plant_events(plant_id);
create index plant_events_event_date_idx on plant_events(event_date);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger para plants
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger plants_set_updated_at
  before update on plants
  for each row
  execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — cada usuario solo ve/edita lo suyo
-- ─────────────────────────────────────────────────────────────
alter table plants enable row level security;
alter table plant_phase_log enable row level security;
alter table plant_events enable row level security;

create policy "Users can view own plants"
  on plants for select using (auth.uid() = user_id);
create policy "Users can insert own plants"
  on plants for insert with check (auth.uid() = user_id);
create policy "Users can update own plants"
  on plants for update using (auth.uid() = user_id);
create policy "Users can delete own plants"
  on plants for delete using (auth.uid() = user_id);

create policy "Users can view own phase log"
  on plant_phase_log for select using (auth.uid() = user_id);
create policy "Users can insert own phase log"
  on plant_phase_log for insert with check (auth.uid() = user_id);
create policy "Users can update own phase log"
  on plant_phase_log for update using (auth.uid() = user_id);
create policy "Users can delete own phase log"
  on plant_phase_log for delete using (auth.uid() = user_id);

create policy "Users can view own events"
  on plant_events for select using (auth.uid() = user_id);
create policy "Users can insert own events"
  on plant_events for insert with check (auth.uid() = user_id);
create policy "Users can update own events"
  on plant_events for update using (auth.uid() = user_id);
create policy "Users can delete own events"
  on plant_events for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket para fotos de plantas (crear vía dashboard o CLI aparte)
-- Bucket sugerido: "plant-photos", público de lectura, escritura autenticada
-- ─────────────────────────────────────────────────────────────
