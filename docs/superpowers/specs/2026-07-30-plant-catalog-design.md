# Diseño: Catálogo de plantas + fotos de usuario

**Fecha:** 30 julio 2026
**Stack:** Astro static + Supabase (tabla `plant_catalog`) + Supabase Storage

---

## Contexto

Plantop.ia tiene CRUD de plantas con modelo de datos ampliado (sustrato, luz, fases, eventos). El problema actual: el usuario tiene que llenar todos los campos manualmente, y `photo_url` siempre queda `null`.

Esta feature agrega:
1. Un catálogo curado de plantas comunes de hogar en español (~40–60 plantas)
2. Búsqueda/autocompletado al agregar planta para pre-llenar campos de cuidado
3. Foto personal del usuario (upload a Supabase Storage) con fallback a foto de referencia del catálogo

---

## Modelo de datos

### Tabla nueva: `plant_catalog`

Lectura pública para usuarios autenticados. Sin escritura desde el cliente (solo via migraciones SQL).

```sql
CREATE TABLE plant_catalog (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  common_name               text NOT NULL,        -- "Costilla de Adán"
  popular_name              text,                 -- "Monstera" (apodo más usado)
  scientific_name           text NOT NULL,        -- "Monstera deliciosa"
  plant_type                text NOT NULL,        -- suculenta|tropical|cactus|helecho|trepadora|árbol|otra
  origin                    text,                 -- "México y América Central"
  description               text,                 -- descripción breve en español
  reference_photo_url       text,                 -- URL pública (Wikimedia u otra fuente libre)

  -- Cuidados (pre-llenan la ficha del usuario)
  light_type                text,                 -- direct|bright_indirect|low_indirect|shade
  light_hours_per_day       numeric,
  humidity                  text,                 -- low|medium|high
  watering_frequency_days   integer,
  substrate_mix             text,
  substrate_ph_min          numeric,
  substrate_ph_max          numeric,
  fertilizing_frequency_days integer,
  min_temperature_celsius   numeric,

  -- Info adicional
  care_difficulty           text,                 -- easy|medium|hard
  toxic_to_pets             boolean DEFAULT false,
  toxic_to_children         boolean DEFAULT false,
  flowering_season          text,                 -- spring|summer|fall|winter|year_round|none
  adult_size                text,                 -- compact|medium|large|xlarge
  location                  text,                 -- indoor|outdoor|both

  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- Índice para búsqueda por nombre
CREATE INDEX idx_plant_catalog_names
  ON plant_catalog USING gin(
    to_tsvector('spanish', coalesce(common_name,'') || ' ' || coalesce(popular_name,'') || ' ' || coalesce(scientific_name,''))
  );

-- RLS
ALTER TABLE plant_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo público para autenticados"
  ON plant_catalog FOR SELECT
  USING (auth.role() = 'authenticated');
```

### Cambio en `plants`

```sql
ALTER TABLE plants ADD COLUMN species_id uuid REFERENCES plant_catalog(id);
```

Opcional: si la planta no está en el catálogo, queda `null`.

### Supabase Storage

- Bucket: `plant-photos`, acceso **público** (las fotos de plantas no son datos sensibles y simplifica la implementación — no hay URLs firmadas que expiren)
- Ruta de archivo: `{user_id}/{plant_id}.{ext}` (reemplaza el archivo si se cambia la foto)
- Política de Storage: solo el dueño del archivo puede subir/borrar (`user_id` en la ruta = auth.uid())
- `photo_url` almacena la URL pública completa de Supabase Storage

### Lógica de foto en la UI

```
mostrar foto =
  plants.photo_url          (foto personal del usuario)
  ?? plant_catalog.reference_photo_url  (foto del catálogo)
  ?? placeholder 🪴
```

---

## Flujo de uso

### Agregar planta

1. Arriba del formulario: buscador "Buscar en el catálogo..." con autocomplete (debounce 300ms, min 2 caracteres)
2. Al seleccionar una planta del catálogo: pre-llena todos los campos del formulario y muestra la foto de referencia como preview
3. El usuario puede editar cualquier campo pre-llenado
4. Campo de foto (optional): botón que abre cámara/galería en móvil o explorador en desktop; muestra preview al seleccionar
5. Guardar: si hay foto seleccionada → upload a Storage → crear planta con `photo_url` y `species_id`

Si la planta no está en el catálogo: se ignora el buscador y se llena el formulario manual (flujo actual).

### Editar planta

- Si tiene foto personal: se muestra con botones "Cambiar foto" y "Quitar foto"
- Si no tiene foto personal pero sí hay referencia del catálogo: se muestra la del catálogo con botón "Agregar mi foto"
- Cambiar foto: sube nueva imagen → reemplaza archivo en Storage → actualiza `photo_url`
- Quitar foto: elimina archivo de Storage → `photo_url = null`

---

## Cambios de UI

### Tarjetas en el listado (`index.astro`)

Tarjeta con imagen arriba (estilo catálogo):

```
┌─────────────────────────┐
│  [foto o placeholder 🪴] │  ← 160px alto, object-cover
├─────────────────────────┤
│ Monstera          Sana  │
│ Monstera deliciosa      │
│ 📍 Interior  🌱 Vegetativa │
│ 💧 hace 3 días          │
└─────────────────────────┘
```

### Vista de detalle (`detail.astro`)

- Banner/hero con foto arriba (~200px alto) si existe alguna foto
- Botón "Cambiar foto" / "Agregar foto" debajo de la imagen
- Info del catálogo: sección colapsable "📚 Info del catálogo" con toxicidad, origen, dificultad, tamaño adulto (si `species_id` existe)
- El resto de la vista queda igual

---

## Archivos nuevos

| Archivo | Propósito |
|---|---|
| `supabase/migrations/0002_plant_catalog.sql` | Tabla `plant_catalog`, índice, RLS, columna `species_id` en `plants` |
| `supabase/migrations/0003_plant_catalog_seed.sql` | ~50 plantas comunes de hogar en español |
| `src/lib/catalog.ts` | `searchCatalog(term)`, `getCatalogPlant(id)` |
| `src/types/catalog.ts` | Tipo `PlantCatalog` e interfaces relacionadas |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/types/database.ts` | Agregar `PlantCatalog` interface y `plant_catalog` en `Database` |
| `src/components/PlantForm.astro` | Buscador de catálogo arriba + campo de foto |
| `src/lib/plant-form.ts` | Leer `species_id` y manejar archivo de foto separado |
| `src/lib/plants.ts` | `uploadPlantPhoto(file, userId, plantId)`, `deletePlantPhoto(url)` |
| `src/pages/plants/new.astro` | Orquestar upload de foto antes de crear planta |
| `src/pages/plants/edit.astro` | Orquestar cambio/eliminación de foto |
| `src/pages/index.astro` | Tarjetas con imagen |
| `src/pages/plants/detail.astro` | Hero foto + sección info catálogo + botón cambiar foto |

---

## Catálogo inicial (~50 plantas)

Plantas comunes de hogar en México, ordenadas por popularidad:

**Tropicales:** Monstera deliciosa, Pothos (Poto), Philodendron, Spathiphyllum (Cuna de Moisés), Sansevieria (Lengua de Suegra), Ficus lyrata, Ficus benjamina, Dracaena, Calathea, Maranta, Anthurium, Bromelia, Aglaonema, Dieffenbachia, Tradescantia (Amor de Hombre)

**Suculentas y cactus:** Aloe vera, Echeveria, Crassula (Árbol de Jade), Haworthia, Sedum, Sempervivum, Gasteria, Kalanchoe, Opuntia, Mammillaria, Cereus

**Helechos:** Helecho de Boston, Helecho Nido de Pájaro, Helecho Espada

**Trepadoras:** Hiedra (Hedera helix), Syngonium, Epipremnum (Poto), Passiflora

**Árboles/arbustos de interior:** Ficus, Pachira (Árbol del Dinero), Schefflera, Beaucarnea (Pata de Elefante), Yuca

**Hierbas aromáticas:** Albahaca, Menta, Romero, Lavanda, Tomillo

---

## Datos que NO se migran al schema de `plants`

Los campos del catálogo que son solo de referencia (toxicidad, origen, tamaño adulto, dificultad, temporada de floración) viven únicamente en `plant_catalog`. No se copian a `plants` — se consultan via `species_id`. Esto evita duplicar datos y permite actualizar el catálogo sin afectar registros de usuario.

---

## Tests a agregar

- `catalog.test.ts`: `searchCatalog` devuelve resultados correctos con términos en español y con acentos
- Actualizar `plant-form.test.ts`: roundtrip incluye `species_id`
