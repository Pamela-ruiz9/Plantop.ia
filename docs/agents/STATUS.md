# Plantop.ia — Estado del proyecto

> Documento de referencia para agentes de IA (y para Pame) sobre qué existe hoy en Plantopia y qué queda pendiente. Se actualiza a medida que el proyecto avanza — no es un changelog histórico, es una foto del estado actual.

**Última actualización:** 2026-09-27
**Stack:** Astro 7 (`output: static`) + TypeScript 5.8 + Supabase (Postgres + Auth + Storage) + Tailwind v4 + Vitest 4. Deploy a GitHub Pages vía GitHub Actions.

---

## ✅ Qué está hecho

### Infraestructura y auth
- Auth con Supabase: email/password + Google OAuth. Login aterriza en `/dashboard`.
- PWA instalable: manifest, íconos, service worker (cache-first para assets propios, network-first con `no-cache` para navegación y para nunca cachear respuestas de Supabase).
- CI en Pull Requests (`.github/workflows/ci.yml`) — typecheck + test + build, separado de `deploy-pages.yml` (que solo corre en push a `main`).

### Plantas — CRUD y modelo de datos
- Alta, edición, borrado de plantas con modelo completo: sustrato (mezcla, pH, último cambio), luz (tipo, horas/día, ubicación física), riego y fertilización (frecuencia + última fecha), fase de vida (vegetativa/floración/fructificación/dormancia/latente) con historial (`plant_phase_log`).
- Bitácora de eventos libres (`plant_events`): riego, fertilización, trasplante, poda, plagas, foto agregada, nota.
- Fotos: subida a Supabase Storage, con fallback a la foto de referencia del catálogo si la planta no tiene una propia.
- **Catálogo de plantas**: 45 especies domésticas comunes con datos de cuidado + fotos de referencia (Wikimedia Commons). Buscador con autocompletar que pre-llena el formulario.

### Detalle de planta (`/plants/detail`)
- Timeline visual combinado: eventos + cambios de fase en una sola línea de tiempo cronológica (línea vertical + íconos en círculo), no dos listas separadas. Los eventos `phase_change` se excluyen del lado de "eventos" porque la entrada de fase (con rango de fechas) ya los representa.
- Sección de info del catálogo (colapsable) si la planta está vinculada a una especie del catálogo.
- Chat de IA sobre cuidados de esa planta específica (ver sección de IA abajo).

### IA (identificación + chat)
- El usuario elige su propio proveedor en `/settings`: Claude (Anthropic), GPT-4o (OpenAI), o Gemini 1.5 Flash (Google, nivel gratis). Guarda su propia API key en `localStorage` — todo corre client-side, sin backend propio ni SDKs, solo `fetch` directo a cada proveedor.
- `/identify`: sube una foto → la IA identifica la planta (nombre, especie, cuidados sugeridos) → botón "Agregar planta" pre-llena el formulario de alta, incluyendo la foto (viaja entre páginas vía IndexedDB, `lib/photo-handoff.ts`).
- Chat de cuidados por planta con historial persistido en `localStorage` (últimos 20 mensajes), con guard contra respuestas malformadas de las APIs y contra envíos concurrentes.
- **Nota de seguridad ya resuelta:** la key de Gemini se manda por header (`x-goog-api-key`), no por query string — evita que quede expuesta en herramientas de diagnóstico o logs. Ver `lib/ai.ts`.

### Colección (`/`) y Dashboard (`/dashboard`)
- **Colección**: grid siempre a 2 columnas (también en celular, no solo desde `sm:`). Tarjeta foto-protagonista estilo Pinterest/Instagram — la foto ocupa casi toda la tarjeta (`aspect-[4/5]`), nombre + ícono de fase como overlay con degradado abajo, badge ⚠️ circular sobre la foto (no en el pie) si la planta necesita atención. La tarjeta ya no muestra especie, ubicación, badge de salud con texto ni fecha de último riego — se sacrificó ese detalle a cambio de densidad visual; sigue disponible en el detalle de la planta. Filtro por fase y por "necesita atención" sin cambios.
- Badge en el ícono de la app (Badging API) mostrando cuántas plantas necesitan atención — se actualiza al abrir la colección.
- **Dashboard** (pestaña "🏠 Inicio", primera en la barra inferior):
  - 3 tarjetas de stat: total de plantas, necesitan atención (ámbar), vencen pronto (celeste) — sin cambios, siguen con el umbral fijo de 2 días de `isCareDueSoon`.
  - **Salud general**: dona SVG (sin librería de gráficos, técnica `stroke-dasharray`/`stroke-dashoffset` con `HEALTH_STROKE` en `lib/labels.ts`) + leyenda con conteos.
  - **Por fase**: barras horizontales de porcentaje (antes eran chips de texto).
  - **🗓️ Agenda de cuidados**: reemplaza las listas separadas de "Necesitan atención"/"Vencen pronto" por una sola vista agrupada — Atrasado / Hoy / Esta semana (ventana de 7 días, independiente del umbral de 2 días de las tarjetas de stat; ver `lib/dashboard-agenda.ts`, función `groupPlantsByAgenda`). Cada fila tiene botones de **acción rápida** (💧 riego / 🌿 fertilización) que registran el cuidado sin salir del dashboard, reutilizando `addPlantEvent` de `lib/plants.ts` (event delegation sobre el contenedor, no listeners por botón — sobrevive a los re-renders de `innerHTML`). Fallo de red al usar una acción rápida: se re-habilita el botón y se muestra un banner de error (`#error`) con scroll automático hacia él, ya que el usuario suele estar scrolleado hacia abajo cuando toca el botón.

### Perfil de usuario y sesión
- **Dashboard**: fila de resumen clickeable arriba de las stats — avatar/inicial, nombre para mostrar, método de acceso (Google / email y contraseña) — navega a `/settings`.
- **Ajustes → Cuenta**: avatar editable (sube inmediatamente al elegir archivo), nombre para mostrar editable con botón "Guardar" separado, y detalle de sesión de solo lectura (método de acceso, miembro desde, último acceso).
- `lib/user-display.ts` (helpers puros de lectura) y `lib/profile.ts` (mutaciones: `updateDisplayName`, `uploadAvatarPhoto`) — mismo patrón de upload-devuelve-URL que `uploadPlantPhoto` en `lib/plants.ts`.
- Bucket `avatar-photos` documentado en `supabase/migrations/0005_avatar_bucket.sql` — **falta crearlo a mano** en el dashboard de Supabase (Storage → New bucket → `avatar-photos`, público de lectura) para que la subida real de avatar funcione; sin esto, sigue siendo correcto en tests pero falla en producción hasta crearlo.
- Fuera de alcance (explícito en el spec): amigos/perfiles públicos, cambio de email/contraseña, borrar cuenta, crop de foto.

### Feedback / soporte
- **FeedbackFAB**: botón flotante en todas las páginas que abre un GitHub Issue pre-llenado con descripción + diagnósticos automáticos (errores de consola, peticiones fallidas, entorno), con detección de duplicados contra issues abiertos. Sin dependencias nuevas, sin token de GitHub — abre la página de creación de issue de GitHub, no escribe directo vía API.

### Calidad de código
- 138 tests unitarios (Vitest) sobre `lib/*.ts` — ninguna página `.astro` tiene tests, es la convención establecida del repo.
- **Lección aprendida y documentada:** para verificar tipos hay que usar `npm run check` (Astro's own type checker), **nunca solo** `npx tsc --noEmit -p .` — este último no detecta errores reales de narrowing dentro de scripts embebidos en `.astro` y causó dos deploys rotos en agosto 2026. Todo plan/task nuevo debe usar `npm run check` como paso de verificación obligatorio.

---

## 🚧 Qué falta / gaps conocidos

Ordenado por prioridad aproximada, no por fecha.

### Prioridad media
- **Consistencia de seguridad en fotos**: `dashboard.astro` valida el esquema de la URL (`startsWith('https://')`) antes de mostrar una foto, pero `index.astro` no lo hace (solo tiene `escapeHtml`, sin chequeo de esquema). Además, `escapeHtml` está duplicada byte-a-byte en **cinco** archivos ahora (`index.astro`, `detail.astro`, `dashboard.astro`, `edit.astro`, y desde 2026-08-16 también `settings.astro` para el avatar) y no escapa comillas, lo cual en teoría podría romper el atributo `src="..."` si una URL contuviera un `"` — riesgo bajo (self-XSS, ya que tanto `photo_url` como `avatar_url` se generan a partir de datos del propio usuario/dueño), pero con cinco copias vale la pena unificar esta lógica en un solo helper compartido (`lib/dom.ts` o similar) y cerrar el gap en todos los lugares a la vez.
- **Confusión reportada con Gemini "gratis"**: la usuaria mencionó que al elegir Gemini en Ajustes, la app le sigue pidiendo un API key "normal" sin explicarle los pasos concretos para conseguir uno gratis. El help link ya apunta a Google AI Studio, pero puede no ser suficientemente guiado (ej. no aclara que no hace falta tarjeta de crédito, no muestra pasos dentro de la app). Quedó sin resolver — la usuaria pidió dejarlo así por ahora ("olvidalo, todo bien"), pero vale la pena revisarlo si vuelve a surgir.

### Prioridad baja / explícitamente pospuesto
- **Alertas de fase esperada por especie/temporada**: única pieza del roadmap original marcada desde el inicio como "opcional, fase posterior". Necesitaría una tabla de referencia de temporada esperada por especie que hoy no existe.
- **Dominio propio** (`plantopia.mx` estaba disponible, nunca comprado) y **offline-first con Dexie** (mencionados en el plan de migración original de julio 2026, nunca retomados — el service worker actual ya cubre bastante del caso de uso offline sin necesitar IndexedDB adicional para los datos).
- **Duplicación menor**: `renderAttentionList`/`renderDueSoonList` en `dashboard.astro` son casi idénticas (mismo shape, distinto color y función de motivo). Evaluado y aceptado como está — con solo 2 instancias no justifica una abstracción extra (regla de tres: extraer si aparece una tercera lista temática).

---

## 🗂️ Backlog (pedido por Pame, 2026-09-27)

Sin priorizar todavía — a definir orden con Pame.

- ~~Mejorar UI/UX de la colección (grid 2 columnas)~~ y ~~inicio/dashboard más interactivo~~ → **hechos el 2026-09-27** (ver spec `docs/superpowers/specs/2026-09-27-collection-dashboard-uiux-design.md` y plan `docs/superpowers/plans/2026-09-27-collection-dashboard-uiux.md`; detalle en la sección de Colección/Dashboard arriba).

1. **Ampliar catálogo con orquídeas** (varias especies: ej. Phalaenopsis, Cattleya, Dendrobium, Vanda). El `CHECK` de `plant_type` en `0002_plant_catalog.sql` no incluye `'orquídea'` — hoy solo admite `suculenta, tropical, cactus, helecho, trepadora, árbol, otra`. Hace falta una migración que agregue el valor al enum antes de sembrar las especies (seguir el patrón de `0003_plant_catalog_seed.sql`), + fotos de referencia (Wikimedia Commons, como el resto del catálogo).
2. **Evitar que Supabase pause el proyecto por inactividad** (plan free lo pausa tras ~7 días sin actividad, y el uso es esporádico). No existe hoy ningún mecanismo de keep-alive — el repo solo tiene `ci.yml` (PRs) y `deploy-pages.yml` (push a main). Candidato: GitHub Action con `schedule` (cron) que haga una query liviana a la DB cada pocos días.
3. **Sección nueva de esquejes (propagación)**: trackear qué esquejes tiene Pame y su evolución (enraizamiento → trasplante). No existe ningún concepto de esqueje en el modelo de datos actual (ni tabla, ni tipo de evento en `plant_events`) — es una entidad nueva de cero, candidata a spec propio (¿tabla `cuttings` independiente, o extensión de `plants`/`plant_events`? a decidir en el spec).

---

## Cómo trabajar en este proyecto (para agentes)

- **Siempre correr `npm run check` antes de dar por terminada una tarea que toque `.astro`** — no confiar solo en `tsc --noEmit`.
- El flujo habitual de esta sesión fue: brainstorming → spec en `docs/superpowers/specs/` → plan en `docs/superpowers/plans/` → ejecución con subagentes (spec review + code review por tarea) → merge a `main` → push (dispara deploy automático a GitHub Pages).
- Ramas de feature (`feature/<nombre>`) para cambios no triviales, con review independiente antes de mergear a `main`. Cambios chicos y mecánicos (fix de un comentario, ajuste de una clase CSS) se pueden commitear directo si ya se verificó `npm run check` + tests + build.
- El repo no tiene tests de `.astro`, solo de `lib/*.ts` — mantené esa convención salvo que se decida cambiarla explícitamente.
