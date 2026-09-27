# Colección foto-protagonista + Dashboard interactivo

## Goal

Dos mejoras de UI/UX que Pame pidió juntas por estar relacionadas (ambas son las pantallas del bottom-nav, cambios de frontend puro, sin tocar el modelo de datos):

1. **Colección** (`/`, `index.astro`): que se vea "más llamativa", con grid de 2 columnas también en celular.
2. **Dashboard** (`/dashboard`, `dashboard.astro`): que sea "más interactivo" — acciones rápidas, gráficos y vista de calendario.

Quedan explícitamente fuera de esta iteración (backlog separado, ver `docs/agents/STATUS.md`): catálogo de orquídeas, keep-alive de Supabase, sección de esquejes.

## Contexto

- La colección hoy usa `grid gap-4 sm:grid-cols-2` — en pantallas angostas (celular, <640px) el grid es en realidad **1 columna**, porque `sm:` recién aplica desde 640px. Como Pame usa la app principalmente desde el teléfono, en la práctica ve una lista, no una cuadrícula.
- La tarjeta de planta actual es foto arriba (h-40) + bloque de texto abajo (nombre, especie, badge de salud, ubicación, fase, última fecha de riego, badge de atención en texto).
- El dashboard ya tiene: fila de perfil, 3 stat cards, chips de salud/fase, y dos listas ("Necesitan atención" / "Vencen pronto") con miniatura de foto — ver `2026-08-05-dashboard-enhancements-design.md` para el diseño de esa versión.
- `lib/plants.ts::addPlantEvent(plant, event)` ya crea el evento **y** actualiza `last_watered`/`last_fertilized` en la misma llamada — es la función que usa `plants/detail.astro` para registrar riego/fertilización. El dashboard puede reutilizarla directamente, sin lógica nueva de persistencia.
- `lib/plant-status.ts` ya expone `isWateringOverdue`, `isFertilizingOverdue`, `isWateringDueSoon`, `isFertilizingDueSoon`, `isCareOverdue`, `isCareDueSoon` — puras, testeadas. La vista de calendario y las acciones rápidas se apoyan en estas mismas funciones, no se duplica lógica de fechas.
- Todas las páginas comparten el patrón `escapeHtml` local (duplicado, gap conocido en STATUS.md) — esta spec no lo unifica, solo sigue el patrón existente en el código nuevo que toca.

## Diseño

### 1. Colección — grid siempre a 2 columnas (`index.astro`)

`class="hidden grid gap-3 grid-cols-2"` (antes `gap-4 sm:grid-cols-2`) — 2 columnas desde el primer breakpoint, `gap` más chico para que las tarjetas compactas no se vean apretadas.

### 2. Colección — tarjeta foto-protagonista (`index.astro`, función `card()`)

Reemplaza el layout "foto arriba + texto abajo" por foto de fondo + overlay con degradado, estilo Pinterest:

```html
<a href="..." class="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-slate-800 bg-slate-800">
  <!-- foto o placeholder, absolute inset-0 -->
  <img class="h-full w-full object-cover" ... />
  <!-- badge de atención, esquina superior -->
  <span class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs shadow">⚠️</span>
  <!-- overlay inferior con degradado -->
  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
    <p class="truncate text-sm font-medium text-white">Nombre</p>
    <span class="text-xs text-white/80">🌸 Floración</span>
  </div>
</a>
```

Detalles:
- `aspect-[4/5]` fija la proporción de la tarjeta (más alta que ancha) para que el grid se vea parejo aunque las fotos originales tengan proporciones distintas — mismo `object-cover` que ya se usa hoy.
- El placeholder sin foto (`🪴`) pasa de un `<div>` de 40px de alto a ocupar todo el `aspect-[4/5]` con el emoji centrado y grande (`text-5xl`), fondo `bg-slate-800` (sin cambios de color, solo de tamaño).
- Badge de atención: solo se renderiza si `isCareOverdue(plant)` — mismo criterio que hoy, cambia de badge de texto en el pie a badge circular sobre la foto (`bg-amber-500`, ícono ⚠️, sin texto — no entra texto en 24×24px).
- Overlay: nombre (`truncate`, una línea — con 2 columnas en celular no hay espacio para nombres largos completos) + ícono/label de fase corto. **Se quitan** de la tarjeta: especie, ubicación (📍), badge de salud con texto, y fecha de último riego — no entran en el espacio reducido y ya están disponibles al entrar al detalle de la planta. Es una pérdida de información intencional a cambio de la densidad visual pedida.
- El filtro por fase/atención no cambia — sigue operando sobre `allPlants` y regenerando `gridEl.innerHTML`, mismo mecanismo de hoy.

### 3. Dashboard — acciones rápidas (`dashboard.astro`)

Cada fila de `renderAttentionList`/`renderDueSoonList` agrega uno o dos botones (💧 / 🌿) según qué esté vencido/por vencer, junto a la flecha `→`:

```html
<button data-plant-id="${plant.id}" data-event-type="watered" class="quick-action rounded-full bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700">💧</button>
```

- Un solo listener delegado en el contenedor de cada lista (`attentionList.addEventListener('click', ...)`), revisa `event.target.closest('.quick-action')`, lee `data-plant-id` + `data-event-type` del botón.
- El click **no navega** (la fila entera es un `<a>` hoy — los botones van dentro pero con `event.stopPropagation()` y `event.preventDefault()` para no disparar la navegación al detalle).
- Al click: `await addPlantEvent(plant, { event_type, event_date: todayISOString() })` (la función ya existente en `lib/plants.ts`) — necesita el objeto `Plant` completo (`id`, `user_id`), que ya está disponible en `allPlants`/`plants` cargado en `init()`.
- Tras la llamada exitosa: refrescar el estado local (recalcular `attention`/`dueSoon` a partir de los `plants` en memoria con las fechas actualizadas) y volver a renderizar las listas afectadas — sin recargar toda la página ni volver a pedir `listPlants`. Un pequeño estado de "guardando…" (deshabilitar el botón mientras la promesa está en curso) evita doble click.
- Si falla la petición: mostrar un mensaje de error breve inline (reutilizar el patrón de `errorEl`, o un `title`/tooltip en el botón) — no hace falta un sistema de notificaciones nuevo para esto.

### 4. Dashboard — gráficos (`dashboard.astro`)

Se reemplazan los chips de texto de "Salud general" y "Por fase" por gráficos SVG simples, **sin librería nueva** (SVG inline generado en el mismo `render*` que ya arma el HTML):

- **Salud general → dona**: SVG de círculo con `stroke-dasharray`/`stroke-dashoffset` por segmento, un `<circle>` por estado de salud, usando los mismos colores que `HEALTH_COLORS` (se necesita el valor hex/tailwind equivalente en vez de la clase, ya que `stroke` no toma clases de Tailwind directamente — se define un mapeo `HEALTH_STROKE: Record<HealthStatus, string>` en `lib/labels.ts` con los mismos tonos: verde/ámbar/rojo). Leyenda con conteo al lado (no se quita el número, solo se agrega el gráfico).
- **Por fase → barras horizontales**: una fila por fase (igual que hoy), pero cada una con una barra (`<div>` con `width` proporcional al conteo sobre el total) detrás o al lado del label — no requiere SVG, son `div`s con `width` en `%` calculado en JS, mismo patrón que una barra de progreso simple.
- Si `plants.length === 0` en alguna categoría, no se dibuja el gráfico (ya no debería llegar acá porque el estado vacío general de plantas ya se maneja aparte, pero se guarda el chequeo por si una categoría puntual queda en 0).

### 5. Dashboard — vista de calendario/agenda (`dashboard.astro`)

Nueva sección que reemplaza las dos listas separadas ("Necesitan atención" / "Vencen pronto") por una sola vista agrupada por cuándo vence el cuidado, usando **agrupación relativa** (no un calendario mensual con grilla de días — sería sobre-ingeniería para el volumen de datos de una colección personal):

Grupos, en este orden, solo se muestran los que tienen al menos una planta:
- **Atrasado** (`isCareOverdue`) — planta puede tener riego y/o fertilización atrasados a la vez, se muestra una sola vez con ambos motivos.
- **Hoy** (`isWateringDueSoon`/`isFertilizingDueSoon` con `daysAhead=0` de forma efectiva — o sea, vence exactamente hoy).
- **Esta semana** (vence en 1 a 7 días — se amplía la ventana de "vencen pronto" de 2 a 7 días para que la vista de agenda tenga sentido como agenda; con solo 2 días casi siempre estaría vacía).

Esto implica ampliar `daysAhead` por defecto donde se usa desde el dashboard (no se toca el default de `plant-status.ts`, se pasa `daysAhead: 7` explícito al llamar `isCareDueSoon`/`isWateringDueSoon`/`isFertilizingDueSoon` desde esta vista — el badge del ícono de la app y otras vistas siguen usando el default de 2 días sin cambios).

Cada fila reutiliza la miniatura + acciones rápidas del punto 3. La agrupación por fecha reemplaza las dos secciones "⚠️ Necesitan atención" / "⏳ Vencen pronto" actuales (se retiran esos headers, la información pasa a vivir en la nueva sección única).

### 6. Layout final de `/dashboard` (de arriba a abajo)

1. Header "🏠 Inicio" (sin cambios)
2. Fila de perfil (sin cambios)
3. Stats (3 tarjetas, sin cambios)
4. Salud general → dona (nuevo formato, mismo dato)
5. Por fase → barras (nuevo formato, mismo dato)
6. **Agenda de cuidados** (nuevo, reemplaza "Necesitan atención" + "Vencen pronto"): grupos Atrasado / Hoy / Esta semana, cada fila con acciones rápidas 💧/🌿.
7. Estado vacío: si no hay nada atrasado ni por vencer en 7 días, un solo mensaje "Todo al día 🎉" (reemplaza los dos mensajes vacíos independientes de hoy).

## Testing

- `lib/plant-status.ts`: no cambia su comportamiento por defecto (el `daysAhead=7` se pasa como argumento desde `dashboard.astro`, no cambia el default de la función) — no hace falta test nuevo ahí, ya está cubierto.
- Si se agrega alguna función pura nueva (ej. agrupar plantas en Atrasado/Hoy/Esta semana), va en `lib/plant-status.ts` o un módulo nuevo `lib/dashboard-agenda.ts`, con tests unitarios siguiendo el patrón TDD ya establecido en el repo.
- `index.astro`/`dashboard.astro`: sin tests, consistente con la convención del repo (ninguna página `.astro` tiene tests).
- Verificación manual obligatoria en navegador (mobile viewport) antes de dar por terminado: grid 2 columnas en celular, badge de atención visible, acciones rápidas funcionando sin navegar, gráficos con datos reales.

## Fuera de alcance

- Catálogo de orquídeas, keep-alive de Supabase, sección de esquejes — backlog separado, no relacionado a este cambio de UI.
- Calendario mensual con grilla de días — la agenda usa agrupación relativa (Atrasado/Hoy/Esta semana), no un componente de calendario completo.
- Deshacer una acción rápida (ej. "deshacer riego") — si Pame marca riego por error, corrige desde el detalle de la planta como hoy (editar `last_watered` o borrar el evento).
- Unificar `escapeHtml` en un helper compartido — gap conocido y documentado en `STATUS.md`, no se resuelve en esta spec para no mezclar alcance.
- Cambiar el umbral de "vencen pronto" (2 días) usado en otras partes de la app (badge del ícono, etc.) — solo la vista de agenda del dashboard usa la ventana de 7 días.
