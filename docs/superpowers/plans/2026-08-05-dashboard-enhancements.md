# Dashboard Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar `/dashboard` con una categoría preventiva "vencen pronto" (2 días antes de atrasarse), fotos en las listas de plantas pendientes, y un resumen de salud general de la colección.

**Architecture:** Cuatro funciones puras nuevas en `lib/plant-status.ts` (mismo patrón que las de "atrasado" ya existentes, con tests), y cambios acotados en `pages/dashboard.astro` para consumirlas — sin tocar ninguna otra página ni el modelo de datos.

**Tech Stack:** Astro 7 static + TypeScript 5.8 + Tailwind v4 + Vitest 4.

**IMPORTANTE — lección de esta sesión:** para verificar tipos en archivos `.astro`, siempre correr `npm run check` (Astro's own type checker), NUNCA solo `npx tsc --noEmit -p .` — este último no detecta errores reales de narrowing dentro de scripts embebidos en `.astro` y ya causó dos deploys rotos en este proyecto. Cada tarea de este plan que incluya un paso de verificación debe usar `npm run check`.

---

## File map

**Modificados (nada nuevo se crea):**
- `plantopia/src/lib/plant-status.ts` — 4 funciones puras nuevas: `isWateringDueSoon`, `isFertilizingDueSoon`, `isCareDueSoon`, `countCareDueSoon`
- `plantopia/src/lib/plant-status.test.ts` — tests para las 4 funciones nuevas
- `plantopia/src/pages/dashboard.astro` — 3ra tarjeta de stat ("Vencen pronto"), sección "Salud general", fotos en las listas, nueva sección "Vencen pronto"

---

### Task 1: plant-status.ts — isWateringDueSoon / isFertilizingDueSoon

**Files:**
- Modify: `plantopia/src/lib/plant-status.ts`
- Modify: `plantopia/src/lib/plant-status.test.ts`

Estado actual de `plant-status.ts` (léelo primero para confirmar que coincide antes de editar):

```typescript
// Determina si el riego o la fertilización de una planta están vencidos,
// según su frecuencia configurada y la fecha del último cuidado.

interface WateringInfo {
  watering_frequency_days: number | null;
  last_watered: string | null;
}

interface FertilizingInfo {
  fertilizing_frequency_days: number | null;
  last_fertilized: string | null;
}

function daysSince(dateStr: string, today: Date): number {
  const then = new Date(`${dateStr}T00:00:00`);
  const diffMs = today.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isWateringOverdue(plant: WateringInfo, today: Date = new Date()): boolean {
  if (plant.watering_frequency_days == null || !plant.last_watered) return false;
  return daysSince(plant.last_watered, today) > plant.watering_frequency_days;
}

export function isFertilizingOverdue(plant: FertilizingInfo, today: Date = new Date()): boolean {
  if (plant.fertilizing_frequency_days == null || !plant.last_fertilized) return false;
  return daysSince(plant.last_fertilized, today) > plant.fertilizing_frequency_days;
}

export function isCareOverdue(plant: WateringInfo & FertilizingInfo, today: Date = new Date()): boolean {
  return isWateringOverdue(plant, today) || isFertilizingOverdue(plant, today);
}

export function countCareOverdue(
  plants: Array<WateringInfo & FertilizingInfo>,
  today: Date = new Date()
): number {
  return plants.filter((plant) => isCareOverdue(plant, today)).length;
}
```

Estado actual de `plant-status.test.ts` — usa `TODAY = new Date('2026-08-15T12:00:00')` en todos los tests. Los tests nuevos de este task reutilizan la misma constante.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `plant-status.test.ts`, después del `describe('isWateringOverdue', ...)` y antes del `describe('isFertilizingOverdue', ...)`:

```typescript
describe('isWateringDueSoon', () => {
  it('returns false when watering_frequency_days is null', () => {
    expect(isWateringDueSoon({ watering_frequency_days: null, last_watered: '2026-08-14' }, 2, TODAY)).toBe(false);
  });

  it('returns false when last_watered is null', () => {
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: null }, 2, TODAY)).toBe(false);
  });

  it('returns true when due today (until === 0)', () => {
    // last_watered 7 días atrás, frecuencia 7 -> until = 0
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-08' }, 2, TODAY)).toBe(true);
  });

  it('returns true right at the edge of the window (until === daysAhead)', () => {
    // last_watered 5 días atrás, frecuencia 7 -> until = 2
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-10' }, 2, TODAY)).toBe(true);
  });

  it('returns false just outside the window (until === daysAhead + 1)', () => {
    // last_watered 4 días atrás, frecuencia 7 -> until = 3
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-11' }, 2, TODAY)).toBe(false);
  });

  it('returns false when already overdue (until < 0) — not "due soon", already late', () => {
    // last_watered 8 días atrás, frecuencia 7 -> until = -1
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-07' }, 2, TODAY)).toBe(false);
  });

  it('uses a default window of 2 days when daysAhead is omitted', () => {
    expect(isWateringDueSoon({ watering_frequency_days: 7, last_watered: '2026-08-10' }, undefined, TODAY)).toBe(true);
  });
});
```

Agregar después del `describe('isFertilizingOverdue', ...)` y antes del `describe('isCareOverdue', ...)`:

```typescript
describe('isFertilizingDueSoon', () => {
  it('returns false when fertilizing_frequency_days is null', () => {
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: null, last_fertilized: '2026-07-20' }, 2, TODAY)).toBe(false);
  });

  it('returns false when last_fertilized is null', () => {
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: null }, 2, TODAY)).toBe(false);
  });

  it('returns true within the window', () => {
    // last_fertilized 29 días atrás, frecuencia 30 -> until = 1
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: '2026-07-17' }, 2, TODAY)).toBe(true);
  });

  it('returns false when already overdue', () => {
    // last_fertilized 31 días atrás, frecuencia 30 -> until = -1
    expect(isFertilizingDueSoon({ fertilizing_frequency_days: 30, last_fertilized: '2026-07-15' }, 2, TODAY)).toBe(false);
  });
});
```

Y actualizar el import al inicio del archivo de:

```typescript
import { isCareOverdue, isWateringOverdue, isFertilizingOverdue, countCareOverdue } from './plant-status';
```

a:

```typescript
import {
  isCareOverdue,
  isWateringOverdue,
  isFertilizingOverdue,
  countCareOverdue,
  isWateringDueSoon,
  isFertilizingDueSoon,
} from './plant-status';
```

- [ ] **Step 2: Correr los tests — deben fallar**

```bash
cd plantopia && npm test -- src/lib/plant-status.test.ts
```

Expected: `isWateringDueSoon is not a function` (o similar — el módulo no exporta esos nombres todavía)

- [ ] **Step 3: Implementar isWateringDueSoon / isFertilizingDueSoon**

En `plant-status.ts`, agregar `daysUntilDue` justo después de `daysSince`, y las dos funciones nuevas justo después de `isFertilizingOverdue` (antes de `isCareOverdue`):

```typescript
function daysUntilDue(frequencyDays: number, lastDateStr: string, today: Date): number {
  return frequencyDays - daysSince(lastDateStr, today);
}
```

```typescript
export function isWateringDueSoon(plant: WateringInfo, daysAhead = 2, today: Date = new Date()): boolean {
  if (plant.watering_frequency_days == null || !plant.last_watered) return false;
  const until = daysUntilDue(plant.watering_frequency_days, plant.last_watered, today);
  return until >= 0 && until <= daysAhead;
}

export function isFertilizingDueSoon(plant: FertilizingInfo, daysAhead = 2, today: Date = new Date()): boolean {
  if (plant.fertilizing_frequency_days == null || !plant.last_fertilized) return false;
  const until = daysUntilDue(plant.fertilizing_frequency_days, plant.last_fertilized, today);
  return until >= 0 && until <= daysAhead;
}
```

El archivo completo debe quedar en este orden: `WateringInfo`/`FertilizingInfo` interfaces → `daysSince` → `daysUntilDue` → `isWateringOverdue` → `isFertilizingOverdue` → `isWateringDueSoon` → `isFertilizingDueSoon` → `isCareOverdue` → `countCareOverdue`. `isCareOverdue` y `countCareOverdue` no cambian en este task — el Task 2 solo agrega `isCareDueSoon`/`countCareDueSoon` al final del archivo, después de ellas.

- [ ] **Step 4: Correr los tests — deben pasar**

```bash
npm test -- src/lib/plant-status.test.ts
```

Expected: todos en verde

- [ ] **Step 5: Type-check con el comando correcto**

```bash
npm run check
```

Expected: `0 errors` (puede haber el hint pre-existente de `catalog.test.ts`, no relacionado)

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/lib/plant-status.ts plantopia/src/lib/plant-status.test.ts
git commit -m "feat: isWateringDueSoon/isFertilizingDueSoon with tests"
```

---

### Task 2: plant-status.ts — isCareDueSoon / countCareDueSoon

**Files:**
- Modify: `plantopia/src/lib/plant-status.ts`
- Modify: `plantopia/src/lib/plant-status.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `plant-status.test.ts` (después del último `describe('countCareOverdue', ...)`):

```typescript
describe('isCareDueSoon', () => {
  it('returns true when only watering is due soon', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-10', // until = 2, due soon
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01', // until = 16, not due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(true);
  });

  it('returns true when only fertilizing is due soon', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15', // recién regada, until = 7
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-07-17', // until = 1, due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(true);
  });

  it('returns false when nothing is due soon or overdue', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-15',
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01',
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(false);
  });

  it('returns false when watering is already overdue (overdue, not "due soon")', () => {
    const plant = {
      watering_frequency_days: 7,
      last_watered: '2026-08-01', // until = -6, overdue
      fertilizing_frequency_days: 30,
      last_fertilized: '2026-08-01', // until = 16, not due soon
    };
    expect(isCareDueSoon(plant, 2, TODAY)).toBe(false);
  });
});

describe('countCareDueSoon', () => {
  const dueSoon = {
    watering_frequency_days: 7,
    last_watered: '2026-08-10', // until = 2
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };
  const notDueSoon = {
    watering_frequency_days: 7,
    last_watered: '2026-08-15',
    fertilizing_frequency_days: 30,
    last_fertilized: '2026-08-01',
  };

  it('returns 0 for an empty list', () => {
    expect(countCareDueSoon([], 2, TODAY)).toBe(0);
  });

  it('counts only the due-soon plants', () => {
    expect(countCareDueSoon([dueSoon, notDueSoon, dueSoon], 2, TODAY)).toBe(2);
  });
});
```

Y actualizar el import agregando `isCareDueSoon, countCareDueSoon`:

```typescript
import {
  isCareOverdue,
  isWateringOverdue,
  isFertilizingOverdue,
  countCareOverdue,
  isWateringDueSoon,
  isFertilizingDueSoon,
  isCareDueSoon,
  countCareDueSoon,
} from './plant-status';
```

- [ ] **Step 2: Correr los tests — deben fallar**

```bash
cd plantopia && npm test -- src/lib/plant-status.test.ts
```

Expected: `isCareDueSoon is not a function`

- [ ] **Step 3: Implementar isCareDueSoon / countCareDueSoon**

Agregar al final de `plant-status.ts` (después de `countCareOverdue`):

```typescript
export function isCareDueSoon(
  plant: WateringInfo & FertilizingInfo,
  daysAhead = 2,
  today: Date = new Date()
): boolean {
  return isWateringDueSoon(plant, daysAhead, today) || isFertilizingDueSoon(plant, daysAhead, today);
}

export function countCareDueSoon(
  plants: Array<WateringInfo & FertilizingInfo>,
  daysAhead = 2,
  today: Date = new Date()
): number {
  return plants.filter((plant) => isCareDueSoon(plant, daysAhead, today)).length;
}
```

- [ ] **Step 4: Correr los tests — deben pasar**

```bash
npm test -- src/lib/plant-status.test.ts
```

Expected: todos en verde (25 tests en el archivo en total)

- [ ] **Step 5: Correr la suite completa + type-check**

```bash
npm test
npm run check
```

Expected: toda la suite pasa, `npm run check` con 0 errores

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/lib/plant-status.ts plantopia/src/lib/plant-status.test.ts
git commit -m "feat: isCareDueSoon/countCareDueSoon with tests"
```

---

### Task 3: dashboard.astro — sección "Salud general"

**Files:**
- Modify: `plantopia/src/pages/dashboard.astro`

Este task es independiente del Task 4 — solo agrega el desglose de salud, sin tocar la lógica de "vencen pronto" ni las tarjetas de stats. Confirma que el archivo actual coincide con esto antes de editar (léelo primero):

```astro
---
import Layout from '../layouts/Layout.astro';
import BottomNav from '../components/BottomNav.astro';
import '../styles/global.css';
---

<Layout title="Plantopia — Inicio">
  <main class="mx-auto min-h-screen max-w-3xl px-4 py-8">
    <header class="mb-6 flex items-center gap-2">
      <span class="text-2xl">🏠</span>
      <h1 class="text-xl font-semibold">Inicio</h1>
    </header>

    <div id="loading" class="py-12 text-center text-sm text-slate-500">Cargando resumen…</div>
    <div id="error" class="hidden rounded-md border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300"></div>

    <div id="content" class="hidden flex-col gap-6">
      <section class="grid grid-cols-2 gap-3" id="stats-grid"></section>

      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">Por fase</h2>
        <div id="phase-breakdown" class="flex flex-wrap gap-2 text-sm text-slate-300"></div>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">⚠️ Necesitan atención</h2>
        <ul id="attention-list" class="flex flex-col gap-2"></ul>
        <p id="attention-empty" class="hidden text-sm text-slate-500">Nada pendiente — todo al día 🎉</p>
      </section>
    </div>
  </main>

  <BottomNav active="dashboard" />

  <script>
    import { requireAuth } from '../lib/session';
    import { listPlants } from '../lib/plants';
    import { isCareOverdue, isWateringOverdue, isFertilizingOverdue } from '../lib/plant-status';
    import { PHASE_LABELS, PHASE_ICONS, GROWTH_PHASES } from '../lib/labels';
    import type { PlantWithCatalog } from '../types/catalog';

    const loadingEl = document.getElementById('loading')!;
    const errorEl = document.getElementById('error')!;
    const contentEl = document.getElementById('content')!;
    const statsGrid = document.getElementById('stats-grid')!;
    const phaseBreakdown = document.getElementById('phase-breakdown')!;
    const attentionList = document.getElementById('attention-list')!;
    const attentionEmpty = document.getElementById('attention-empty')!;

    function escapeHtml(str: string): string {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function overdueReasons(plant: PlantWithCatalog): string {
      const reasons: string[] = [];
      if (isWateringOverdue(plant)) reasons.push('💧 riego');
      if (isFertilizingOverdue(plant)) reasons.push('🌿 fertilización');
      return reasons.join(' · ');
    }

    function renderStats(total: number, attentionCount: number) {
      const attentionCard = attentionCount > 0
        ? { border: 'border-amber-900', bg: 'bg-amber-950', text: 'text-amber-300', label: 'text-amber-400' }
        : { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-100', label: 'text-slate-500' };

      statsGrid.innerHTML = `
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p class="text-2xl font-semibold text-slate-100">${total}</p>
          <p class="text-xs text-slate-500">Plantas</p>
        </div>
        <div class="rounded-xl border ${attentionCard.border} ${attentionCard.bg} p-4 text-center">
          <p class="text-2xl font-semibold ${attentionCard.text}">${attentionCount}</p>
          <p class="text-xs ${attentionCard.label}">Necesitan atención</p>
        </div>
      `;
    }

    function renderPhaseBreakdown(plants: PlantWithCatalog[]) {
      phaseBreakdown.innerHTML = GROWTH_PHASES.map((phase) => {
        const count = plants.filter((p) => p.current_phase === phase).length;
        return `<span class="rounded-full border border-slate-800 bg-slate-900 px-3 py-1">${PHASE_ICONS[phase]} ${PHASE_LABELS[phase]}: ${count}</span>`;
      }).join('');
    }

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
        <a href="${base}plants/detail?id=${plant.id}" class="flex items-center justify-between gap-2 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-sm transition hover:border-amber-700">
          <div>
            <span class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</span>
            <span class="ml-2 text-xs text-amber-400">${overdueReasons(plant)}</span>
          </div>
          <span class="text-amber-400">→</span>
        </a>`
        )
        .join('');
    }

    async function init() {
      const user = await requireAuth();
      if (!user) return;

      try {
        const plants = await listPlants(user.id);
        const attention = plants.filter((p) => isCareOverdue(p));

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.classList.add('flex');

        renderStats(plants.length, attention.length);
        renderPhaseBreakdown(plants);
        renderAttentionList(attention);
      } catch (err) {
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
        errorEl.textContent =
          err instanceof Error ? `Error al cargar: ${err.message}` : 'Error al cargar el resumen.';
      }
    }

    init();
  </script>
</Layout>
```

- [ ] **Step 1: Agregar la sección HTML "Salud general"**

Insertar entre la sección `stats-grid` y la sección "Por fase":

```html
      <section class="grid grid-cols-2 gap-3" id="stats-grid"></section>

      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">Salud general</h2>
        <div id="health-breakdown" class="flex flex-wrap gap-2 text-sm"></div>
      </section>

      <section>
        <h2 class="mb-2 text-sm font-medium text-slate-300">Por fase</h2>
```

- [ ] **Step 2: Actualizar el import de labels.ts**

Cambiar:

```typescript
import { PHASE_LABELS, PHASE_ICONS, GROWTH_PHASES } from '../lib/labels';
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
} from '../lib/labels';
```

- [ ] **Step 3: Agregar el ref del elemento**

Cambiar:

```typescript
    const statsGrid = document.getElementById('stats-grid')!;
    const phaseBreakdown = document.getElementById('phase-breakdown')!;
```

por:

```typescript
    const statsGrid = document.getElementById('stats-grid')!;
    const healthBreakdown = document.getElementById('health-breakdown')!;
    const phaseBreakdown = document.getElementById('phase-breakdown')!;
```

- [ ] **Step 4: Agregar renderHealthBreakdown**

Agregar justo antes de `renderPhaseBreakdown`:

```typescript
    function renderHealthBreakdown(plants: PlantWithCatalog[]) {
      healthBreakdown.innerHTML = HEALTH_STATUSES.map((status) => {
        const count = plants.filter((p) => (p.health_status ?? 'healthy') === status).length;
        return `<span class="rounded-full border px-3 py-1 text-xs ${HEALTH_COLORS[status]}">${HEALTH_LABELS[status]}: ${count}</span>`;
      }).join('');
    }

    function renderPhaseBreakdown(plants: PlantWithCatalog[]) {
```

(`HEALTH_COLORS[status]` ya trae clases completas tipo `bg-green-950 text-green-300 border-green-900` — es el mismo patrón que usa el badge de salud en `index.astro`.)

- [ ] **Step 5: Llamar renderHealthBreakdown en init()**

Cambiar:

```typescript
        renderStats(plants.length, attention.length);
        renderPhaseBreakdown(plants);
        renderAttentionList(attention);
```

por:

```typescript
        renderStats(plants.length, attention.length);
        renderHealthBreakdown(plants);
        renderPhaseBreakdown(plants);
        renderAttentionList(attention);
```

- [ ] **Step 6: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso (8 páginas), `npm run check` con 0 errores

- [ ] **Step 7: Commit**

```bash
git add plantopia/src/pages/dashboard.astro
git commit -m "feat: health breakdown section in dashboard"
```

---

### Task 4: dashboard.astro — "Vencen pronto" + fotos en las listas

**Files:**
- Modify: `plantopia/src/pages/dashboard.astro`

Este task construye sobre el resultado del Task 3. Léelo primero para confirmar el estado actual antes de editar.

- [ ] **Step 1: Cambiar el grid de stats a 3 columnas**

Cambiar:

```html
      <section class="grid grid-cols-2 gap-3" id="stats-grid"></section>
```

por:

```html
      <section class="grid grid-cols-3 gap-3" id="stats-grid"></section>
```

- [ ] **Step 2: Agregar la sección HTML "Vencen pronto"**

Insertar justo después de la sección "⚠️ Necesitan atención" (después de su `</section>` de cierre, antes del `</div>` que cierra `#content`):

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
    </div>
```

- [ ] **Step 3: Actualizar el import de plant-status.ts**

Cambiar:

```typescript
    import { isCareOverdue, isWateringOverdue, isFertilizingOverdue } from '../lib/plant-status';
```

por:

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

- [ ] **Step 4: Agregar los refs de "Vencen pronto"**

Cambiar:

```typescript
    const attentionList = document.getElementById('attention-list')!;
    const attentionEmpty = document.getElementById('attention-empty')!;
```

por:

```typescript
    const attentionList = document.getElementById('attention-list')!;
    const attentionEmpty = document.getElementById('attention-empty')!;
    const dueSoonList = document.getElementById('due-soon-list')!;
    const dueSoonEmpty = document.getElementById('due-soon-empty')!;
```

- [ ] **Step 5: Agregar dueSoonReasons y thumbnail**

Agregar justo después de `overdueReasons`:

```typescript
    function dueSoonReasons(plant: PlantWithCatalog): string {
      const reasons: string[] = [];
      if (isWateringDueSoon(plant)) reasons.push('💧 riego');
      if (isFertilizingDueSoon(plant)) reasons.push('🌿 fertilización');
      return reasons.join(' · ');
    }

    function thumbnail(plant: PlantWithCatalog): string {
      const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;
      if (displayPhoto && displayPhoto.startsWith('https://')) {
        return `<img src="${escapeHtml(displayPhoto)}" alt="" class="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />`;
      }
      return `<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">🪴</div>`;
    }
```

(La resolución de foto — `photo_url ?? plant_catalog?.reference_photo_url ?? null` con el chequeo `startsWith('https://')` — es exactamente la misma lógica que ya usa la tarjeta de colección en `index.astro`.)

- [ ] **Step 6: Actualizar renderStats para 3 tarjetas**

Cambiar toda la función:

```typescript
    function renderStats(total: number, attentionCount: number) {
      const attentionCard = attentionCount > 0
        ? { border: 'border-amber-900', bg: 'bg-amber-950', text: 'text-amber-300', label: 'text-amber-400' }
        : { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-100', label: 'text-slate-500' };

      statsGrid.innerHTML = `
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p class="text-2xl font-semibold text-slate-100">${total}</p>
          <p class="text-xs text-slate-500">Plantas</p>
        </div>
        <div class="rounded-xl border ${attentionCard.border} ${attentionCard.bg} p-4 text-center">
          <p class="text-2xl font-semibold ${attentionCard.text}">${attentionCount}</p>
          <p class="text-xs ${attentionCard.label}">Necesitan atención</p>
        </div>
      `;
    }
```

por:

```typescript
    function renderStats(total: number, attentionCount: number, dueSoonCount: number) {
      const attentionCard = attentionCount > 0
        ? { border: 'border-amber-900', bg: 'bg-amber-950', text: 'text-amber-300', label: 'text-amber-400' }
        : { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-100', label: 'text-slate-500' };
      const dueSoonCard = dueSoonCount > 0
        ? { border: 'border-sky-900', bg: 'bg-sky-950', text: 'text-sky-300', label: 'text-sky-400' }
        : { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-100', label: 'text-slate-500' };

      statsGrid.innerHTML = `
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p class="text-2xl font-semibold text-slate-100">${total}</p>
          <p class="text-xs text-slate-500">Plantas</p>
        </div>
        <div class="rounded-xl border ${attentionCard.border} ${attentionCard.bg} p-4 text-center">
          <p class="text-2xl font-semibold ${attentionCard.text}">${attentionCount}</p>
          <p class="text-xs ${attentionCard.label}">Necesitan atención</p>
        </div>
        <div class="rounded-xl border ${dueSoonCard.border} ${dueSoonCard.bg} p-4 text-center">
          <p class="text-2xl font-semibold ${dueSoonCard.text}">${dueSoonCount}</p>
          <p class="text-xs ${dueSoonCard.label}">Vencen pronto</p>
        </div>
      `;
    }
```

- [ ] **Step 7: Agregar la miniatura a renderAttentionList**

Cambiar:

```typescript
      attentionList.innerHTML = attention
        .map(
          (plant) => `
        <a href="${base}plants/detail?id=${plant.id}" class="flex items-center justify-between gap-2 rounded-lg border border-amber-900 bg-amber-950/30 px-3 py-2 text-sm transition hover:border-amber-700">
          <div>
            <span class="font-medium text-slate-100">${escapeHtml(plant.common_name)}</span>
            <span class="ml-2 text-xs text-amber-400">${overdueReasons(plant)}</span>
          </div>
          <span class="text-amber-400">→</span>
        </a>`
        )
        .join('');
```

por:

```typescript
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
```

- [ ] **Step 8: Agregar renderDueSoonList**

Agregar justo después de la función `renderAttentionList` completa:

```typescript
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

- [ ] **Step 9: Actualizar init() — calcular dueSoon y llamar a los nuevos renders**

Cambiar:

```typescript
      try {
        const plants = await listPlants(user.id);
        const attention = plants.filter((p) => isCareOverdue(p));

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.classList.add('flex');

        renderStats(plants.length, attention.length);
        renderHealthBreakdown(plants);
        renderPhaseBreakdown(plants);
        renderAttentionList(attention);
      } catch (err) {
```

por:

```typescript
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
```

**Nota importante:** la tarjeta de stat "Vencen pronto" y la lista "Vencen pronto" deben usar el MISMO array `dueSoon` (calculado una sola vez en `init()`), no `countCareDueSoon(plants)` por separado — si se calculan por separado, el número de la tarjeta y la cantidad de filas de la lista pueden no coincidir (una planta atrasada en un eje pero por vencer en otro contaría en el número pero no aparecería en la lista, que sí aplica el filtro de exclusión). `countCareDueSoon` queda para otros usos futuros (ej. el badge del ícono de la app), no se usa en este archivo.

- [ ] **Step 10: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso (8 páginas), `npm run check` con 0 errores

- [ ] **Step 11: Correr la suite completa**

```bash
npm test
```

Expected: todos los tests pasan (nada de `dashboard.astro` tiene tests — consistente con que ninguna página `.astro` los tiene en este repo — pero confirma que no rompiste nada en `lib/`)

- [ ] **Step 12: Commit**

```bash
git add plantopia/src/pages/dashboard.astro
git commit -m "feat: due-soon section, photos, and 3-stat grid in dashboard"
```

---

## Checklist de spec coverage

| Requisito del spec | Task |
|---|---|
| `isWateringDueSoon` / `isFertilizingDueSoon` (umbral 2 días, límite `until>=0 && until<=daysAhead`) | Task 1 |
| `isCareDueSoon` / `countCareDueSoon` | Task 2 |
| Mutua exclusión entre "atención" y "vencen pronto" | Task 4, Step 9 |
| Fotos en "Necesitan atención" | Task 4, Step 7 |
| Fotos en "Vencen pronto" | Task 4, Step 8 |
| Sección "Salud general" con `HEALTH_LABELS`/`HEALTH_COLORS` | Task 3 |
| Sección "Por fase" sin cambios | Task 3 (no tocada) |
| Stats grid de 3 tarjetas (Total / Atención ámbar / Vencen pronto celeste) | Task 4, Steps 1 y 6 |
| Empty state "Vencen pronto" | Task 4, Step 2 |
| Sin cambios en otras páginas ni en el modelo de datos | Todo el plan (solo toca `plant-status.ts` y `dashboard.astro`) |
