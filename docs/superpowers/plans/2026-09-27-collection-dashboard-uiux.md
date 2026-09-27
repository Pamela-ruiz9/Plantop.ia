# Colección foto-protagonista + Dashboard interactivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colección con grid de 2 columnas siempre (también en celular) y tarjetas foto-protagonista; Dashboard con acciones rápidas de riego/fertilización, gráficos (dona de salud, barras de fase) y una agenda de cuidados agrupada (Atrasado / Hoy / Esta semana) que reemplaza las listas actuales de "Necesitan atención"/"Vencen pronto".

**Architecture:** Una función pura nueva de agrupación (`lib/dashboard-agenda.ts`, con tests) reutiliza `lib/plant-status.ts` sin duplicar lógica de fechas. `index.astro` y `dashboard.astro` se modifican in-place — sin páginas nuevas, sin cambios de esquema ni de `lib/plants.ts` (se reutiliza `addPlantEvent`, ya existente, para las acciones rápidas).

**Tech Stack:** Astro 7 static + TypeScript 5.8 + Tailwind v4 + Vitest 4.

**IMPORTANTE — lección de esta sesión (ver `docs/agents/STATUS.md`):** para verificar tipos en archivos `.astro`, siempre correr `npm run check` (Astro's own type checker), NUNCA solo `npx tsc --noEmit -p .` — este último no detecta errores reales de narrowing dentro de scripts embebidos en `.astro` y ya causó dos deploys rotos en este proyecto. Cada tarea de este plan que incluya un paso de verificación debe usar `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-27-collection-dashboard-uiux-design.md`

---

## File map

**Nuevos:**
- `plantopia/src/lib/dashboard-agenda.ts` — funciones puras: `groupPlantsByAgenda`, `agendaActions`
- `plantopia/src/lib/dashboard-agenda.test.ts` — tests de las funciones anteriores

**Modificados:**
- `plantopia/src/lib/labels.ts` — agrega `HEALTH_STROKE` (colores para el SVG de la dona, ya que `stroke` no acepta clases de Tailwind)
- `plantopia/src/pages/index.astro` — grid a 2 columnas siempre, tarjeta foto-protagonista con overlay y badge circular de atención
- `plantopia/src/pages/dashboard.astro` — dona de salud, barras de fase, sección de agenda con acciones rápidas (reemplaza "Necesitan atención"/"Vencen pronto")

---

### Task 1: `lib/dashboard-agenda.ts` — agrupación de la agenda

**Files:**
- Create: `plantopia/src/lib/dashboard-agenda.ts`
- Create: `plantopia/src/lib/dashboard-agenda.test.ts`

Este módulo agrupa plantas en tres baldes (Atrasado / Hoy / Esta semana) para la nueva sección de agenda del dashboard, reutilizando las funciones puras que ya existen en `lib/plant-status.ts` (`isCareOverdue`, `isWateringOverdue`, `isFertilizingOverdue`, `isWateringDueSoon`, `isFertilizingDueSoon`) — no se duplica lógica de fechas.

- [ ] **Step 1: Escribir el test que falla**

Crear `plantopia/src/lib/dashboard-agenda.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { groupPlantsByAgenda, agendaActions } from './dashboard-agenda';

const TODAY = new Date('2026-09-27T12:00:00');

const wateringOverdue = {
  watering_frequency_days: 7,
  last_watered: '2026-09-10', // 17 días atrás -> atrasado
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const wateringDueToday = {
  watering_frequency_days: 7,
  last_watered: '2026-09-20', // exactamente 7 días atrás -> vence hoy
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const wateringDueInThreeDays = {
  watering_frequency_days: 7,
  last_watered: '2026-09-23', // 4 días atrás, frecuencia 7 -> vence en 3 días
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const nothingDueSoon = {
  watering_frequency_days: 30,
  last_watered: '2026-09-07', // 20 días atrás, frecuencia 30 -> vence en 10 días (fuera de la ventana de 7)
  fertilizing_frequency_days: null,
  last_fertilized: null,
};

const bothOverdueAndFertDueInThreeDays = {
  watering_frequency_days: 7,
  last_watered: '2026-09-10', // atrasado
  fertilizing_frequency_days: 30,
  last_fertilized: '2026-08-31', // 27 días atrás, frecuencia 30 -> vence en 3 días
};

describe('groupPlantsByAgenda', () => {
  it('returns empty groups for an empty list', () => {
    expect(groupPlantsByAgenda([], TODAY)).toEqual({ overdue: [], today: [], this_week: [] });
  });

  it('puts an overdue plant in "overdue"', () => {
    const groups = groupPlantsByAgenda([wateringOverdue], TODAY);
    expect(groups.overdue).toEqual([wateringOverdue]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('puts a plant due exactly today in "today"', () => {
    const groups = groupPlantsByAgenda([wateringDueToday], TODAY);
    expect(groups.today).toEqual([wateringDueToday]);
    expect(groups.overdue).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('puts a plant due within the next 7 days (but not today) in "this_week"', () => {
    const groups = groupPlantsByAgenda([wateringDueInThreeDays], TODAY);
    expect(groups.this_week).toEqual([wateringDueInThreeDays]);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
  });

  it('excludes a plant that is not due within 7 days from every group', () => {
    const groups = groupPlantsByAgenda([nothingDueSoon], TODAY);
    expect(groups.overdue).toEqual([]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('prioritizes "overdue" when one axis is overdue and the other is due soon', () => {
    const groups = groupPlantsByAgenda([bothOverdueAndFertDueInThreeDays], TODAY);
    expect(groups.overdue).toEqual([bothOverdueAndFertDueInThreeDays]);
    expect(groups.today).toEqual([]);
    expect(groups.this_week).toEqual([]);
  });

  it('sorts multiple plants into their respective groups', () => {
    const groups = groupPlantsByAgenda(
      [wateringOverdue, wateringDueToday, wateringDueInThreeDays, nothingDueSoon],
      TODAY
    );
    expect(groups.overdue).toEqual([wateringOverdue]);
    expect(groups.today).toEqual([wateringDueToday]);
    expect(groups.this_week).toEqual([wateringDueInThreeDays]);
  });
});

describe('agendaActions', () => {
  it('returns no actions when nothing is due', () => {
    expect(agendaActions(nothingDueSoon, TODAY)).toEqual([]);
  });

  it('returns only the watered action when only watering is overdue', () => {
    expect(agendaActions(wateringOverdue, TODAY)).toEqual([{ eventType: 'watered', label: '💧' }]);
  });

  it('returns both actions when watering is overdue and fertilizing is due soon', () => {
    expect(agendaActions(bothOverdueAndFertDueInThreeDays, TODAY)).toEqual([
      { eventType: 'watered', label: '💧' },
      { eventType: 'fertilized', label: '🌿' },
    ]);
  });

  it('returns the fertilized action for a plant due today on that axis', () => {
    const fertDueToday = {
      watering_frequency_days: null,
      last_watered: null,
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-28', // exactamente 30 días atrás
    };
    expect(agendaActions(fertDueToday, TODAY)).toEqual([{ eventType: 'fertilized', label: '🌿' }]);
  });
});
```

- [ ] **Step 2: Correr el test — debe fallar**

```bash
cd plantopia && npm test -- src/lib/dashboard-agenda.test.ts
```

Expected: falla porque `./dashboard-agenda` no existe todavía (`Cannot find module`).

- [ ] **Step 3: Implementar `dashboard-agenda.ts`**

Crear `plantopia/src/lib/dashboard-agenda.ts`:

```typescript
// Agrupa plantas para la sección "Agenda de cuidados" del dashboard,
// reutilizando las funciones puras de plant-status.ts (no duplica lógica de fechas).
import {
  isCareOverdue,
  isWateringOverdue,
  isFertilizingOverdue,
  isWateringDueSoon,
  isFertilizingDueSoon,
} from './plant-status';

interface CareInfo {
  watering_frequency_days: number | null;
  last_watered: string | null;
  fertilizing_frequency_days: number | null;
  last_fertilized: string | null;
}

export type AgendaGroupKey = 'overdue' | 'today' | 'this_week';

// Ventana de la vista de agenda (distinta del umbral de 2 días que usa el resto
// de la app para "vencen pronto" — ver spec 2026-09-27, sección "Fuera de alcance").
export const AGENDA_WEEK_WINDOW_DAYS = 7;

export function groupPlantsByAgenda<T extends CareInfo>(
  plants: T[],
  today: Date = new Date()
): Record<AgendaGroupKey, T[]> {
  const overdue: T[] = [];
  const dueToday: T[] = [];
  const thisWeek: T[] = [];

  for (const plant of plants) {
    if (isCareOverdue(plant, today)) {
      overdue.push(plant);
    } else if (isWateringDueSoon(plant, 0, today) || isFertilizingDueSoon(plant, 0, today)) {
      dueToday.push(plant);
    } else if (
      isWateringDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today) ||
      isFertilizingDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)
    ) {
      thisWeek.push(plant);
    }
  }

  return { overdue, today: dueToday, this_week: thisWeek };
}

export interface AgendaAction {
  eventType: 'watered' | 'fertilized';
  label: string;
}

// Un eje (riego o fertilización) se considera "accionable" desde la agenda si está
// atrasado O vence dentro de la ventana de la semana — independiente de a qué balde
// (overdue/today/this_week) pertenezca la planta por su otro eje.
export function agendaActions(plant: CareInfo, today: Date = new Date()): AgendaAction[] {
  const actions: AgendaAction[] = [];
  if (isWateringOverdue(plant, today) || isWateringDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)) {
    actions.push({ eventType: 'watered', label: '💧' });
  }
  if (isFertilizingOverdue(plant, today) || isFertilizingDueSoon(plant, AGENDA_WEEK_WINDOW_DAYS, today)) {
    actions.push({ eventType: 'fertilized', label: '🌿' });
  }
  return actions;
}
```

- [ ] **Step 4: Correr el test — debe pasar**

```bash
npm test -- src/lib/dashboard-agenda.test.ts
```

Expected: todos en verde (14 tests)

- [ ] **Step 5: Type-check**

```bash
npm run check
```

Expected: `0 errors`

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/lib/dashboard-agenda.ts plantopia/src/lib/dashboard-agenda.test.ts
git commit -m "feat: pure agenda grouping for dashboard (overdue/today/this_week)"
```

---

### Task 2: `lib/labels.ts` — colores de trazo para la dona de salud

**Files:**
- Modify: `plantopia/src/lib/labels.ts`

El SVG de la dona usa el atributo `stroke`, que no acepta clases de Tailwind — necesita valores hex. Se define un mapeo paralelo a `HEALTH_COLORS` con los mismos tonos (verde/ámbar/rojo, familia `-400` para que se vean bien sobre fondo oscuro).

- [ ] **Step 1: Agregar `HEALTH_STROKE`**

En `plantopia/src/lib/labels.ts`, agregar justo después de `HEALTH_COLORS`:

```typescript
export const HEALTH_STROKE: Record<HealthStatus, string> = {
  healthy: '#4ade80', // green-400
  needs_attention: '#fbbf24', // amber-400
  sick: '#f87171', // red-400
};
```

- [ ] **Step 2: Type-check**

```bash
cd plantopia && npm run check
```

Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/lib/labels.ts
git commit -m "feat: add HEALTH_STROKE color mapping for health donut chart"
```

---

### Task 3: `index.astro` — grid a 2 columnas + tarjeta foto-protagonista

**Files:**
- Modify: `plantopia/src/pages/index.astro`

Este task no tiene tests (ninguna página `.astro` los tiene en este repo — convención documentada en `docs/agents/STATUS.md`). Léelo primero para confirmar que coincide con el contenido de abajo antes de editar.

- [ ] **Step 1: Grid siempre a 2 columnas**

Cambiar:

```html
    <div id="plant-grid" class="hidden grid gap-4 sm:grid-cols-2"></div>
```

por:

```html
    <div id="plant-grid" class="hidden grid grid-cols-2 gap-3"></div>
```

- [ ] **Step 2: Reemplazar la función `card()`**

Cambiar toda la función (usa `HEALTH_COLORS`/`HEALTH_LABELS`/`LOCATION_LABELS` hoy — deja de usarlas, ya no hace falta tocar esos imports porque siguen usándose en otras partes del archivo... **verificar primero:** si al terminar este step `HEALTH_COLORS`, `HEALTH_LABELS` o `LOCATION_LABELS` quedan sin uso en el archivo, quitarlos del import de `../lib/labels` para que `npm run check`/el linter no se quejen de imports no usados):

De:

```typescript
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
              <span>${PHASE_ICONS[plant.current_phase]} ${PHASE_LABELS[plant.current_phase]}</span>
              ${plant.last_watered ? `<span>💧 ${plant.last_watered}</span>` : ''}
              ${isCareOverdue(plant) ? `<span class="text-amber-400">⚠️ Necesita atención</span>` : ''}
            </div>
          </div>
        </a>
      `;
    }
```

A:

```typescript
    function card(plant: PlantWithCatalog): string {
      const base = import.meta.env.BASE_URL;
      const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;
      const needsAttention = isCareOverdue(plant);

      return `
        <a href="${base}plants/detail?id=${plant.id}" class="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-slate-800 bg-slate-800 transition hover:border-slate-600">
          ${
            displayPhoto
              ? `<img src="${escapeHtml(displayPhoto)}" alt="${escapeHtml(plant.common_name)}" class="absolute inset-0 h-full w-full object-cover" loading="lazy" />`
              : `<div class="absolute inset-0 flex items-center justify-center text-5xl">🪴</div>`
          }
          ${
            needsAttention
              ? `<span class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs shadow">⚠️</span>`
              : ''
          }
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <p class="truncate text-sm font-medium text-white">${escapeHtml(plant.common_name)}</p>
            <span class="text-xs text-white/80">${PHASE_ICONS[plant.current_phase]} ${PHASE_LABELS[plant.current_phase]}</span>
          </div>
        </a>
      `;
    }
```

- [ ] **Step 3: Quitar imports no usados**

Revisar el import de `../lib/labels` al inicio del `<script>`:

```typescript
    import {
      HEALTH_LABELS,
      HEALTH_COLORS,
      PHASE_LABELS,
      PHASE_ICONS,
      LOCATION_LABELS,
      GROWTH_PHASES,
    } from '../lib/labels';
```

`HEALTH_LABELS`, `HEALTH_COLORS` y `LOCATION_LABELS` ya no se usan en `card()`. Confirmar que tampoco se usan en el resto del archivo (el filtro de fase usa `GROWTH_PHASES`/`PHASE_ICONS`/`PHASE_LABELS`, sin tocar) y dejar el import en:

```typescript
    import {
      PHASE_LABELS,
      PHASE_ICONS,
      GROWTH_PHASES,
    } from '../lib/labels';
```

- [ ] **Step 4: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso, `npm run check` con 0 errores

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/pages/index.astro
git commit -m "feat: photo-forward 2-column grid for the collection"
```

---

### Task 4: `dashboard.astro` — dona de salud + barras de fase

**Files:**
- Modify: `plantopia/src/pages/dashboard.astro`

Reemplaza los chips de texto de "Salud general" y "Por fase" por gráficos SVG simples, sin librerías nuevas. Este task no toca todavía la sección de listas (eso es el Task 5).

- [ ] **Step 1: Cambiar la clase del contenedor de "Por fase"**

Cambiar:

```html
      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">Por fase</h2>
        <div id="phase-breakdown" class="flex flex-wrap gap-2 text-sm text-slate-300"></div>
      </section>
```

por:

```html
      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">Por fase</h2>
        <div id="phase-breakdown" class="flex flex-col gap-2"></div>
      </section>
```

(`#health-breakdown` no cambia de clase en el HTML — sigue siendo `flex flex-wrap gap-2 text-sm`, el contenido interno cambia en el Step 3.)

- [ ] **Step 2: Actualizar el import de `labels.ts`**

Cambiar:

```typescript
    import {
      PHASE_LABELS,
      PHASE_ICONS,
      GROWTH_PHASES,
      HEALTH_LABELS,
      HEALTH_COLORS,
      HEALTH_STATUSES,
    } from '../lib/labels';
```

por:

```typescript
    import {
      PHASE_LABELS,
      PHASE_ICONS,
      GROWTH_PHASES,
      HEALTH_LABELS,
      HEALTH_COLORS,
      HEALTH_STATUSES,
      HEALTH_STROKE,
    } from '../lib/labels';
```

- [ ] **Step 3: Reemplazar `renderHealthBreakdown` por la versión con dona**

Cambiar:

```typescript
    function renderHealthBreakdown(plants: PlantWithCatalog[]) {
      healthBreakdown.innerHTML = HEALTH_STATUSES.map((status) => {
        const count = plants.filter((p) => (p.health_status ?? 'healthy') === status).length;
        return `<span class="rounded-full border px-3 py-1 text-xs ${HEALTH_COLORS[status]}">${HEALTH_LABELS[status]}: ${count}</span>`;
      }).join('');
    }
```

por:

```typescript
    function renderHealthBreakdown(plants: PlantWithCatalog[]) {
      const total = plants.length;
      const counts = HEALTH_STATUSES.map((status) => ({
        status,
        count: plants.filter((p) => (p.health_status ?? 'healthy') === status).length,
      }));

      const legend = counts
        .map(
          ({ status, count }) =>
            `<span class="rounded-full border px-3 py-1 text-xs ${HEALTH_COLORS[status]}">${HEALTH_LABELS[status]}: ${count}</span>`
        )
        .join('');

      if (total === 0) {
        healthBreakdown.innerHTML = `<div class="flex flex-wrap gap-2">${legend}</div>`;
        return;
      }

      let cumulative = 0;
      const segments = counts
        .filter(({ count }) => count > 0)
        .map(({ status, count }) => {
          const pct = (count / total) * 100;
          const dashoffset = -cumulative;
          cumulative += pct;
          return `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="${HEALTH_STROKE[status]}" stroke-width="4" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${dashoffset}" />`;
        })
        .join('');

      healthBreakdown.innerHTML = `
        <div class="flex items-center gap-4">
          <svg viewBox="0 0 36 36" class="h-20 w-20 shrink-0 -rotate-90" role="img" aria-label="Distribución de salud de la colección">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e293b" stroke-width="4" />
            ${segments}
          </svg>
          <div class="flex flex-1 flex-wrap gap-2">${legend}</div>
        </div>
      `;
    }
```

(Técnica de dona con `viewBox="0 0 36 36"` y `r="15.915"`: la circunferencia de ese radio es ≈100, así que `stroke-dasharray`/`stroke-dashoffset` se pueden expresar directo en porcentaje sin convertir a longitud de arco. `-rotate-90` hace que el primer segmento arranque arriba, en las 12.)

- [ ] **Step 4: Reemplazar `renderPhaseBreakdown` por la versión con barras**

Cambiar:

```typescript
    function renderPhaseBreakdown(plants: PlantWithCatalog[]) {
      phaseBreakdown.innerHTML = GROWTH_PHASES.map((phase) => {
        const count = plants.filter((p) => p.current_phase === phase).length;
        return `<span class="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">${PHASE_ICONS[phase]} ${PHASE_LABELS[phase]}: ${count}</span>`;
      }).join('');
    }
```

por:

```typescript
    function renderPhaseBreakdown(plants: PlantWithCatalog[]) {
      const total = plants.length || 1; // evita división por cero (no debería llegar acá con 0 plantas, pero por las dudas)
      phaseBreakdown.innerHTML = GROWTH_PHASES.map((phase) => {
        const count = plants.filter((p) => p.current_phase === phase).length;
        const pct = Math.round((count / total) * 100);
        return `
          <div class="flex items-center gap-2 text-sm text-slate-300">
            <span class="w-28 shrink-0 truncate">${PHASE_ICONS[phase]} ${PHASE_LABELS[phase]}</span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-green-600" style="width: ${pct}%"></div>
            </div>
            <span class="w-6 shrink-0 text-right text-xs text-slate-500">${count}</span>
          </div>
        `;
      }).join('');
    }
```

- [ ] **Step 5: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso, `npm run check` con 0 errores

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/pages/dashboard.astro
git commit -m "feat: donut chart for health, bar chart for phase breakdown"
```

---

### Task 5: `dashboard.astro` — agenda de cuidados + acciones rápidas

**Files:**
- Modify: `plantopia/src/pages/dashboard.astro`

Reemplaza las secciones "⚠️ Necesitan atención" y "⏳ Vencen pronto" por una sola sección de agenda agrupada (Atrasado / Hoy / Esta semana), con botones de acción rápida (💧/🌿) que registran el cuidado sin salir del dashboard. Las 3 tarjetas de stats (Total / Necesitan atención / Vencen pronto) **no cambian** — siguen usando el umbral de 2 días de siempre; la agenda usa su propia ventana de 7 días (`AGENDA_WEEK_WINDOW_DAYS`), son cálculos independientes.

- [ ] **Step 1: Reemplazar las dos secciones de listas por una sola**

Cambiar:

```html
      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">⚠️ Necesitan atención</h2>
        <ul id="attention-list" class="flex flex-col gap-2"></ul>
        <p id="attention-empty" class="hidden text-sm text-slate-500">Nada pendiente — todo al día 🎉</p>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">⏳ Vencen pronto</h2>
        <ul id="due-soon-list" class="flex flex-col gap-2"></ul>
        <p id="due-soon-empty" class="hidden text-sm text-slate-500">Nada por vencer en los próximos días.</p>
      </section>
```

por:

```html
      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">🗓️ Agenda de cuidados</h2>
        <div id="agenda-list" class="flex flex-col gap-4"></div>
        <p id="agenda-empty" class="hidden text-sm text-slate-500">Todo al día 🎉</p>
      </section>
```

- [ ] **Step 2: Actualizar imports**

Cambiar:

```typescript
    import {
      isCareOverdue,
      isCareDueSoon,
      isWateringOverdue,
      isFertilizingOverdue,
      isWateringDueSoon,
      isFertilizingDueSoon,
    } from '../lib/plant-status';
```

por:

```typescript
    import { isCareOverdue, isCareDueSoon } from '../lib/plant-status';
    import { groupPlantsByAgenda, agendaActions, type AgendaGroupKey } from '../lib/dashboard-agenda';
```

Y cambiar:

```typescript
    import { requireAuth } from '../lib/session';
    import { listPlants } from '../lib/plants';
```

por:

```typescript
    import { requireAuth } from '../lib/session';
    import { listPlants, addPlantEvent } from '../lib/plants';
```

(`isWateringOverdue`/`isFertilizingOverdue`/`isWateringDueSoon`/`isFertilizingDueSoon` ya no se usan directo en este archivo — la lógica por eje ahora vive en `agendaActions`, dentro de `dashboard-agenda.ts`. `overdueReasons`/`dueSoonReasons`, que los usaban, se eliminan en el Step 5.)

- [ ] **Step 3: Reemplazar los refs de elementos**

Cambiar:

```typescript
    const attentionList = document.getElementById('attention-list')!;
    const attentionEmpty = document.getElementById('attention-empty')!;
    const dueSoonList = document.getElementById('due-soon-list')!;
    const dueSoonEmpty = document.getElementById('due-soon-empty')!;
```

por:

```typescript
    const agendaList = document.getElementById('agenda-list')!;
    const agendaEmpty = document.getElementById('agenda-empty')!;
```

- [ ] **Step 4: Agregar el estado mutable de plantas**

Justo después de las declaraciones de refs (antes de `function escapeHtml`), agregar:

```typescript
    let currentPlants: PlantWithCatalog[] = [];
```

- [ ] **Step 5: Quitar `overdueReasons`/`dueSoonReasons`, mantener `thumbnail`**

Eliminar por completo estas dos funciones (ya no se usan — sus motivos ahora salen de `agendaActions`):

```typescript
    function overdueReasons(plant: PlantWithCatalog): string {
      const reasons: string[] = [];
      if (isWateringOverdue(plant)) reasons.push('💧 riego');
      if (isFertilizingOverdue(plant)) reasons.push('🌿 fertilización');
      return reasons.join(' · ');
    }

    function dueSoonReasons(plant: PlantWithCatalog): string {
      const reasons: string[] = [];
      if (isWateringDueSoon(plant)) reasons.push('💧 riego');
      if (isFertilizingDueSoon(plant)) reasons.push('🌿 fertilización');
      return reasons.join(' · ');
    }
```

`thumbnail(plant)` se deja tal cual está (no cambia).

- [ ] **Step 6: Agregar `agendaRow` y `renderAgenda`**

Agregar justo después de `thumbnail(plant)` y antes de `renderStats`:

```typescript
    interface AgendaColors {
      border: string;
      bg: string;
      text: string;
    }

    const AGENDA_SECTIONS: { key: AgendaGroupKey; title: string; colors: AgendaColors }[] = [
      { key: 'overdue', title: '⚠️ Atrasado', colors: { border: 'border-amber-900', bg: 'bg-amber-950/30', text: 'text-amber-400' } },
      { key: 'today', title: '📅 Hoy', colors: { border: 'border-sky-900', bg: 'bg-sky-950/30', text: 'text-sky-400' } },
      { key: 'this_week', title: '🗓️ Esta semana', colors: { border: 'border-violet-900', bg: 'bg-violet-950/30', text: 'text-violet-400' } },
    ];

    function agendaRow(plant: PlantWithCatalog, colors: AgendaColors): string {
      const base = import.meta.env.BASE_URL;
      const actions = agendaActions(plant);
      const reasonLabels = actions
        .map((action) => (action.eventType === 'watered' ? '💧 riego' : '🌿 fertilización'))
        .join(' · ');
      const buttons = actions
        .map(
          (action) =>
            `<button type="button" class="quick-action shrink-0 rounded-full bg-slate-800 px-2 py-1 text-xs transition hover:bg-slate-700 disabled:opacity-50" data-plant-id="${plant.id}" data-event-type="${action.eventType}">${action.label}</button>`
        )
        .join('');

      return `
        <a href="${base}plants/detail?id=${plant.id}" class="flex items-center gap-3 rounded-lg border ${colors.border} ${colors.bg} px-3 py-2 text-sm transition hover:border-slate-600">
          ${thumbnail(plant)}
          <div class="flex-1">
            <span class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</span>
            <span class="ml-2 text-xs ${colors.text}">${reasonLabels}</span>
          </div>
          <div class="flex shrink-0 items-center gap-1">${buttons}</div>
        </a>`;
    }

    function renderAgenda(groups: Record<AgendaGroupKey, PlantWithCatalog[]>) {
      const nonEmpty = AGENDA_SECTIONS.filter((section) => groups[section.key].length > 0);

      if (nonEmpty.length === 0) {
        agendaList.innerHTML = '';
        agendaEmpty.classList.remove('hidden');
        return;
      }

      agendaEmpty.classList.add('hidden');
      agendaList.innerHTML = nonEmpty
        .map(
          (section) => `
        <div>
          <h3 class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">${section.title}</h3>
          <div class="flex flex-col gap-2">
            ${groups[section.key].map((plant) => agendaRow(plant, section.colors)).join('')}
          </div>
        </div>`
        )
        .join('');
    }
```

- [ ] **Step 7: Agregar `renderAll` y el manejador de acciones rápidas**

Agregar justo después de `renderAgenda` y antes de `async function init()`:

```typescript
    function renderAll() {
      const attention = currentPlants.filter((p) => isCareOverdue(p));
      const dueSoon = currentPlants.filter((p) => !isCareOverdue(p) && isCareDueSoon(p));
      const groups = groupPlantsByAgenda(currentPlants);

      renderStats(currentPlants.length, attention.length, dueSoon.length);
      renderHealthBreakdown(currentPlants);
      renderPhaseBreakdown(currentPlants);
      renderAgenda(groups);
    }

    async function handleQuickAction(event: Event) {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>('.quick-action');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const plantId = button.dataset.plantId!;
      const eventType = button.dataset.eventType as 'watered' | 'fertilized';
      const plant = currentPlants.find((p) => p.id === plantId);
      if (!plant) return;

      button.disabled = true;
      const originalLabel = button.textContent;

      try {
        const todayIso = new Date().toISOString().slice(0, 10);
        await addPlantEvent(plant, { event_type: eventType, event_date: todayIso, note: null });
        if (eventType === 'watered') {
          plant.last_watered = todayIso;
        } else {
          plant.last_fertilized = todayIso;
        }
        renderAll();
      } catch (err) {
        button.disabled = false;
        button.textContent = originalLabel;
        button.title = err instanceof Error ? err.message : 'No se pudo guardar.';
      }
    }

    agendaList.addEventListener('click', handleQuickAction);
```

- [ ] **Step 8: Simplificar `init()`**

Cambiar:

```typescript
    async function init() {
      const user = await requireAuth();
      if (!user) return;
      renderUserSummary(user);

      try {
        const plants = await listPlants(user.id);
        const attention = plants.filter((p) => isCareOverdue(p));
        // Mutuamente excluyente con "attention": una planta ya atrasada en un eje
        // (riego, por ej.) no aparece también en "vencen pronto" aunque el otro eje
        // (fertilización) esté por vencer — se cuenta una sola vez, en "atención".
        const dueSoon = plants.filter((p) => !isCareOverdue(p) && isCareDueSoon(p));

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.classList.add('flex');

        renderStats(plants.length, attention.length, dueSoon.length);
        renderHealthBreakdown(plants);
        renderPhaseBreakdown(plants);
        renderAttentionList(attention);
        renderDueSoonList(dueSoon);
      } catch (err) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent =
          err instanceof Error ? `Error al cargar: ${err.message}` : 'Error al cargar el resumen.';
      }
    }
```

por:

```typescript
    async function init() {
      const user = await requireAuth();
      if (!user) return;
      renderUserSummary(user);

      try {
        currentPlants = await listPlants(user.id);
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.classList.add('flex');
        renderAll();
      } catch (err) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent =
          err instanceof Error ? `Error al cargar: ${err.message}` : 'Error al cargar el resumen.';
      }
    }
```

- [ ] **Step 9: Quitar `renderAttentionList`/`renderDueSoonList`**

Eliminar por completo estas dos funciones (reemplazadas por `renderAgenda`/`agendaRow`):

```typescript
    function renderAttentionList(attention: PlantWithCatalog[]) {
      if (attention.length === 0) {
        attentionList.innerHTML = '';
        attentionEmpty.classList.remove('hidden');
        return;
      }
      attentionEmpty.classList.add('hidden');
      const base = import.meta.env.BASE_URL;
      attentionList.innerHTML = attention
        .map(
          (plant) => `
        <a href="${base}plants/detail?id=${plant.id}" class="flex items-center gap-3 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-sm transition hover:border-amber-700">
          ${thumbnail(plant)}
          <div class="flex-1">
            <span class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</span>
            <span class="ml-2 text-xs text-amber-400">${overdueReasons(plant)}</span>
          </div>
          <span class="text-amber-400">→</span>
        </a>`
        )
        .join('');
    }

    function renderDueSoonList(dueSoon: PlantWithCatalog[]) {
      if (dueSoon.length === 0) {
        dueSoonList.innerHTML = '';
        dueSoonEmpty.classList.remove('hidden');
        return;
      }
      dueSoonEmpty.classList.add('hidden');
      const base = import.meta.env.BASE_URL;
      dueSoonList.innerHTML = dueSoon
        .map(
          (plant) => `
        <a href="${base}plants/detail?id=${plant.id}" class="flex items-center gap-3 rounded-lg border border-sky-900 bg-sky-950/30 px-3 py-2 text-sm transition hover:border-sky-700">
          ${thumbnail(plant)}
          <div class="flex-1">
            <span class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</span>
            <span class="ml-2 text-xs text-sky-400">${dueSoonReasons(plant)}</span>
          </div>
          <span class="text-sky-400">→</span>
        </a>`
        )
        .join('');
    }
```

- [ ] **Step 10: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso, `npm run check` con 0 errores. Si `npm run check` marca `overdueReasons`/`dueSoonReasons`/`attentionList`/etc. como no usados en algún lado que se haya pasado por alto, volver a los steps anteriores y confirmar que se eliminaron todas las referencias.

- [ ] **Step 11: Correr la suite completa**

```bash
npm test
```

Expected: todos los tests pasan (incluye los 14 nuevos de `dashboard-agenda.test.ts` del Task 1)

- [ ] **Step 12: Commit**

```bash
git add plantopia/src/pages/dashboard.astro
git commit -m "feat: agenda de cuidados with quick actions, replaces attention/due-soon lists"
```

---

### Task 6: Verificación manual en navegador

**Files:** ninguno (solo verificación, sin cambios de código)

- [ ] **Step 1: Levantar el server de dev**

```bash
cd plantopia && astro dev --background
```

- [ ] **Step 2: Verificar la Colección en viewport móvil**

Abrir la app (con las devtools en modo responsive, ~375px de ancho) en `/` logueado con una cuenta que tenga al menos 3-4 plantas, algunas con foto y alguna sin foto, y al menos una con cuidado atrasado. Confirmar:
- Se ven 2 columnas de tarjetas, no 1.
- Las fotos ocupan casi toda la tarjeta, con el nombre y la fase superpuestos abajo.
- La planta atrasada muestra el badge ⚠️ circular sobre la foto.
- El filtro por fase y por "solo atención" sigue funcionando.

- [ ] **Step 3: Verificar el Dashboard en viewport móvil**

Ir a `/dashboard` con la misma cuenta. Confirmar:
- La dona de salud se dibuja con colores correctos y la leyenda coincide con los conteos.
- Las barras de "Por fase" muestran anchos proporcionales razonables.
- La sección "Agenda de cuidados" agrupa correctamente en Atrasado/Hoy/Esta semana (comparar contra los datos reales de las plantas de prueba).
- Tocar un botón 💧 o 🌿 en una fila: el botón se deshabilita brevemente, la fila desaparece o se reubica sin recargar la página, y **no navega** al detalle de la planta.
- Entrar al detalle de esa planta y confirmar que el evento de riego/fertilización quedó registrado (mismo patrón que usar el botón desde el detalle).

- [ ] **Step 4: Detener el server**

```bash
astro dev stop
```

No requiere commit — es solo verificación.

---

## Checklist de spec coverage

| Requisito del spec | Task |
|---|---|
| Grid siempre a 2 columnas en la colección | Task 3, Step 1 |
| Tarjeta foto-protagonista con overlay | Task 3, Step 2 |
| Badge circular de atención sobre la foto | Task 3, Step 2 |
| Acciones rápidas (💧/🌿) sin navegar, vía `addPlantEvent` | Task 5, Steps 6-7 |
| Dona SVG de salud general | Task 2 (colores) + Task 4, Step 3 |
| Barras horizontales de fase | Task 4, Step 4 |
| Agenda agrupada Atrasado/Hoy/Esta semana (ventana de 7 días) | Task 1 (lógica pura) + Task 5, Step 6 |
| Reemplazo de "Necesitan atención"/"Vencen pronto" por agenda única | Task 5, Steps 1, 9 |
| Stats (3 tarjetas) sin cambios, ventana de 2 días intacta | Task 5, Step 7 (`renderAll` usa `isCareDueSoon(p)` sin argumento extra) |
| Estado vacío único "Todo al día 🎉" | Task 5, Steps 1, 6 |
| Sin librerías nuevas | Todo el plan (SVG inline, sin dependencias agregadas a `package.json`) |
| Verificación manual en mobile | Task 6 |
