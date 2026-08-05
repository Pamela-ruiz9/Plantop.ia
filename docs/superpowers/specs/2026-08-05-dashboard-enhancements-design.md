# Dashboard Enhancements — Fotos, "Vencen pronto" y Salud general

## Goal

Ampliar `/dashboard` (la pestaña "Inicio") con tres mejoras que la usuaria pidió después de usar la app: fotos en las listas de plantas pendientes, una categoría preventiva de "vencen pronto" antes de que algo se atrase, y un resumen de salud general de la colección.

## Contexto

`/dashboard` ya existe (agregado en una sesión anterior) y muestra: 2 tarjetas de conteo (total / necesitan atención), un desglose por fase, y una lista de plantas atrasadas (solo texto, sin foto). Esta spec extiende esas piezas — no rediseña la página desde cero.

`lib/plant-status.ts` ya tiene `isWateringOverdue`, `isFertilizingOverdue`, `isCareOverdue` y `countCareOverdue`, todas puras y unit-testeadas, comparando `last_watered`/`last_fertilized` + frecuencia en días contra la fecha de hoy.

## Diseño

### 1. "Vencen pronto" — `lib/plant-status.ts`

Nuevas funciones puras, mismo patrón que las de "atrasado":

```typescript
function daysUntilDue(frequencyDays: number, lastDateStr: string, today: Date): number {
  return frequencyDays - daysSince(lastDateStr, today);
}

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

export function isCareDueSoon(plant: WateringInfo & FertilizingInfo, daysAhead = 2, today: Date = new Date()): boolean {
  return isWateringDueSoon(plant, daysAhead, today) || isFertilizingDueSoon(plant, daysAhead, today);
}

export function countCareDueSoon(
  plants: Array<WateringInfo & FertilizingInfo>,
  daysAhead = 2,
  today: Date = new Date()
): number {
  return plants.filter((p) => isCareDueSoon(p, daysAhead, today)).length;
}
```

**Umbral fijo de 2 días** — no configurable por el usuario, no hay UI de settings para esto. Es un valor razonable para una app personal; si en el futuro hace falta ajustarlo, es un cambio de una línea.

**Semántica del límite:** `until` es `frecuencia - díasDesdeElÚltimoCuidado`. `until < 0` significa atrasado (ya lo cubre `isWateringOverdue`/`isFertilizingOverdue`). `until === 0` significa "vence hoy" — se considera "vence pronto", no atrasado todavía. `until` entre 0 y `daysAhead` inclusive → vence pronto. No hay solapamiento ni hueco en el límite entre "atrasado" y "vence pronto".

**Mutua exclusión entre listas:** una planta puede estar atrasada en riego pero por vencer en fertilización al mismo tiempo — en ese caso `isCareDueSoon` igual devolvería `true` (porque mira ambos ejes de forma independiente). Para que las dos listas del dashboard no se pisen, la exclusión se resuelve en la página, no en la función:

```typescript
const overdue = plants.filter((p) => isCareOverdue(p));
const dueSoon = plants.filter((p) => !isCareOverdue(p) && isCareDueSoon(p));
```

Así, cualquier planta que ya aparece en "Necesitan atención" nunca aparece también en "Vencen pronto", sin importar qué diga `isCareDueSoon` por sí sola.

### 2. Fotos en las listas — `pages/dashboard.astro`

Se agrega una miniatura (40×40px, `rounded-lg`, `object-cover`) a cada fila de "Necesitan atención" y "Vencen pronto", reutilizando exactamente la misma lógica de resolución de foto que ya usa la tarjeta de colección en `index.astro`:

```typescript
const displayPhoto = plant.photo_url ?? plant.plant_catalog?.reference_photo_url ?? null;
```

Si no hay foto (`displayPhoto` es `null`), se muestra un placeholder con el emoji 🪴 en un cuadrado del mismo tamaño — mismo patrón que la tarjeta de colección.

### 3. Salud general — `pages/dashboard.astro`

Nueva fila de chips, estructuralmente igual a "Por fase" pero contando por `health_status` en vez de `current_phase`, reutilizando `HEALTH_LABELS`/`HEALTH_COLORS` que ya existen en `lib/labels.ts` (los mismos colores que ya usa el badge de salud en cada tarjeta de planta — no se agregan íconos nuevos):

```typescript
function renderHealthBreakdown(plants: PlantWithCatalog[]) {
  healthBreakdown.innerHTML = HEALTH_STATUSES.map((status) => {
    const count = plants.filter((p) => (p.health_status ?? 'healthy') === status).length;
    return `<span class="rounded-full border px-3 py-1 text-xs ${HEALTH_COLORS[status]}">${HEALTH_LABELS[status]}: ${count}</span>`;
  }).join('');
}
```

(`HEALTH_COLORS[status]` ya devuelve una clase completa tipo `bg-green-950 text-green-300 border-green-900`, igual que se usa en el badge de la tarjeta de `index.astro`.)

### 4. Layout final de `/dashboard` (de arriba a abajo)

1. Header "🏠 Inicio" (sin cambios)
2. **Stats**: `grid grid-cols-3 gap-3` (antes `grid-cols-2`) — Total (`border-slate-800 bg-slate-900`, sin cambios) / Necesitan atención (`border-amber-900 bg-amber-950 text-amber-300`, sin cambios) / Vencen pronto (nuevo: `border-sky-900 bg-sky-950 text-sky-300`)
3. **Salud general**: chips (nuevo)
4. **Por fase**: chips (sin cambios)
5. **⚠️ Necesitan atención**: lista con foto, mismos colores ámbar que ya tiene (`border-amber-900 bg-amber-950/30 text-amber-400`)
6. **⏳ Vencen pronto**: lista con foto, mismos colores celeste que la tarjeta de stat (`border-sky-900 bg-sky-950/30 text-sky-400`) — misma estructura que "Necesitan atención" pero en paleta celeste para diferenciarla visualmente (nuevo)

Ambas listas nuevas/modificadas mantienen el patrón de estado vacío ya existente (`#attention-empty`), agregando uno equivalente para "vencen pronto" (`#due-soon-empty`, texto: "Nada por vencer en los próximos días.").

## Testing

`plant-status.ts`: TDD, mismo patrón que las funciones de "atrasado" ya testeadas. Casos límite a cubrir:
- `until === daysAhead` → `true` (justo en el borde superior de la ventana)
- `until === daysAhead + 1` → `false` (un día fuera de la ventana)
- `until === 0` → `true` ("vence hoy")
- `until < 0` (ya atrasado) → `false` para `isXDueSoon` (no debe superponerse con "atrasado")
- `frequency`/`last_date` en `null` → `false` (sin datos, no se puede calcular)
- `countCareDueSoon` con lista mixta (algunas atrasadas, algunas por vencer, algunas al día) → cuenta solo las por vencer

`dashboard.astro`: sin tests, consistente con la convención del repo (ninguna página `.astro` tiene tests — solo los módulos de `lib/*.ts`).

## Fuera de alcance

- Accesos rápidos (botones de acción) y feed de actividad reciente global — el usuario los consideró pero no los priorizó para esta iteración.
- Umbral de "vencen pronto" configurable — fijo en 2 días.
- Notificaciones/alertas activas sobre "vencen pronto" — esto es solo un resumen visual en el dashboard, no dispara nada (a diferencia del badge de ícono de la app, que sigue basado únicamente en `isCareOverdue`, sin cambios).
