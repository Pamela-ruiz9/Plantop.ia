# Plantop.ia — Estado del proyecto

> Documento de referencia para agentes de IA (y para Pame) sobre qué existe hoy en Plantopia y qué queda pendiente. Se actualiza a medida que el proyecto avanza — no es un changelog histórico, es una foto del estado actual.

**Última actualización:** 2026-08-05
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
- Colección: tarjetas con foto, ícono de fase, badge "⚠️ Necesita atención". Filtro por fase y por "necesita atención".
- Badge en el ícono de la app (Badging API) mostrando cuántas plantas necesitan atención — se actualiza al abrir la colección.
- **Dashboard** (pestaña "🏠 Inicio", primera en la barra inferior):
  - 3 tarjetas de stat: total de plantas, necesitan atención (ámbar), vencen pronto (celeste).
  - Salud general: conteo por estado (sana / necesita atención / enferma).
  - Desglose por fase.
  - Lista "Necesitan atención" (riego/fertilización ya atrasados) y lista "Vencen pronto" (vencen en los próximos 2 días, mutuamente excluyente con la anterior — una planta nunca aparece en ambas), ambas con miniatura de foto.

### Feedback / soporte
- **FeedbackFAB**: botón flotante en todas las páginas que abre un GitHub Issue pre-llenado con descripción + diagnósticos automáticos (errores de consola, peticiones fallidas, entorno), con detección de duplicados contra issues abiertos. Sin dependencias nuevas, sin token de GitHub — abre la página de creación de issue de GitHub, no escribe directo vía API.

### Calidad de código
- 101 tests unitarios (Vitest) sobre `lib/*.ts` — ninguna página `.astro` tiene tests, es la convención establecida del repo.
- **Lección aprendida y documentada:** para verificar tipos hay que usar `npm run check` (Astro's own type checker), **nunca solo** `npx tsc --noEmit -p .` — este último no detecta errores reales de narrowing dentro de scripts embebidos en `.astro` y causó dos deploys rotos en agosto 2026. Todo plan/task nuevo debe usar `npm run check` como paso de verificación obligatorio.

---

## 🚧 Qué falta / gaps conocidos

Ordenado por prioridad aproximada, no por fecha.

### Prioridad media
- **Consistencia de seguridad en fotos**: `dashboard.astro` valida el esquema de la URL (`startsWith('https://')`) antes de mostrar una foto, pero `index.astro` no lo hace (solo tiene `escapeHtml`, sin chequeo de esquema). Además, `escapeHtml` en los tres lugares que resuelven fotos (`index.astro`, `detail.astro`, `dashboard.astro`, `edit.astro`) no escapa comillas, lo cual en teoría podría romper el atributo `src="..."` si una URL contuviera un `"` — riesgo bajo (self-XSS, ya que `photo_url` se genera server-side a partir del `userId`/`plantId` del dueño de la planta), pero valdría la pena unificar esta lógica en un solo helper compartido (`lib/photo-display.ts` o similar) y cerrar el gap en los cuatro lugares a la vez.
- **Confusión reportada con Gemini "gratis"**: la usuaria mencionó que al elegir Gemini en Ajustes, la app le sigue pidiendo un API key "normal" sin explicarle los pasos concretos para conseguir uno gratis. El help link ya apunta a Google AI Studio, pero puede no ser suficientemente guiado (ej. no aclara que no hace falta tarjeta de crédito, no muestra pasos dentro de la app). Quedó sin resolver — la usuaria pidió dejarlo así por ahora ("olvidalo, todo bien"), pero vale la pena revisarlo si vuelve a surgir.

### Prioridad baja / explícitamente pospuesto
- **Alertas de fase esperada por especie/temporada**: única pieza del roadmap original marcada desde el inicio como "opcional, fase posterior". Necesitaría una tabla de referencia de temporada esperada por especie que hoy no existe.
- **Dominio propio** (`plantopia.mx` estaba disponible, nunca comprado) y **offline-first con Dexie** (mencionados en el plan de migración original de julio 2026, nunca retomados — el service worker actual ya cubre bastante del caso de uso offline sin necesitar IndexedDB adicional para los datos).
- **Duplicación menor**: `renderAttentionList`/`renderDueSoonList` en `dashboard.astro` son casi idénticas (mismo shape, distinto color y función de motivo). Evaluado y aceptado como está — con solo 2 instancias no justifica una abstracción extra (regla de tres: extraer si aparece una tercera lista temática).

---

## Cómo trabajar en este proyecto (para agentes)

- **Siempre correr `npm run check` antes de dar por terminada una tarea que toque `.astro`** — no confiar solo en `tsc --noEmit`.
- El flujo habitual de esta sesión fue: brainstorming → spec en `docs/superpowers/specs/` → plan en `docs/superpowers/plans/` → ejecución con subagentes (spec review + code review por tarea) → merge a `main` → push (dispara deploy automático a GitHub Pages).
- Ramas de feature (`feature/<nombre>`) para cambios no triviales, con review independiente antes de mergear a `main`. Cambios chicos y mecánicos (fix de un comentario, ajuste de una clase CSS) se pueden commitear directo si ya se verificó `npm run check` + tests + build.
- El repo no tiene tests de `.astro`, solo de `lib/*.ts` — mantené esa convención salvo que se decida cambiarla explícitamente.
