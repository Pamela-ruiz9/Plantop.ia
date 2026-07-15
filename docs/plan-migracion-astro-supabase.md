# Plan: Migración a Astro + Supabase + PWA/App instalable

**Fecha:** 4 julio 2026
**Última actualización:** 15 julio 2026 — infraestructura + CRUD completos, ver estado abajo
**Contexto:** Plantop.ia está congelado desde mayo 2025 (Next.js + Firebase, solo CRUD básico de plantas). Se decide reconstruir sobre el mismo patrón de Rastrum: Astro (static) + Supabase + PWA instalable, y aprovechar para meter el modelo de datos completo (sustrato, luz, ciclos de floración/recesión).

## 📍 Estado (15 julio 2026)

**Fase de infraestructura: ✅ completa y verificada.**

- Proyecto Astro (static) + Tailwind v4 + PWA instalable — hecho
- Proyecto Supabase real creado (`nlameaniuxrqhqnkqkxv`), esquema completo aplicado con RLS — hecho y verificado en vivo (queries reales contra la DB)
- Auth Firebase → Supabase Auth (email/password) — hecho
- Firestore → Postgres (Supabase) — hecho, incluye el modelo de datos ampliado (sustrato, luz, fertilización, fase, `plant_events`, `plant_phase_log`) desde el día 1, como se planeó
- CRUD de plantas (alta, edición, borrado, listado con RLS) — hecho y verificado contra Supabase real
- Vista de detalle con historial de eventos y fases — hecho (solo lectura por ahora)

**Pendiente de esta fase:**
- Testing + CI (Vitest/Playwright) — no iniciado
- Deploy — en progreso (GitHub Pages + Actions)
- Dominio propio — `plantopia.mx` disponible, no comprado aún
- Offline-first con Dexie — dependencia instalada, integración pendiente
- Google OAuth (se implementó email/password en su lugar por ahora)

**Features de UI ampliadas** (timeline visual, botón de cambio de fase, indicadores por fase) — pendientes, ver sección de Features abajo.

---

**Referencia de patrón:** `~/projects/rastrum` — Astro 5 (output: static) + Supabase + Dexie (offline) + manifest.webmanifest + Tauri (APK/AAB opcional).

---

## 🏗️ INFRAESTRUCTURA (mover la base, sin features nuevas todavía)

Objetivo: tener el mismo CRUD de hoy (login, agregar/editar/borrar planta, dashboard) corriendo en Astro + Supabase, instalable como PWA. Cero funcionalidad nueva en esta fase — es plomería.

1. **Setup del proyecto Astro**
   - `npm create astro@latest` en modo `static`, TypeScript strict
   - Integraciones: `@astrojs/tailwind`, `@astrojs/sitemap`
   - Estructura: `src/pages`, `src/components`, `src/lib`, `src/layouts` (calcar organización de Rastrum)
   - Migrar design system actual (Avatar, Badge, Button, Card, Container, Input, Select, Skeleton, Typography) de React/Next a componentes Astro + islands donde se necesite interactividad (React island solo en formularios/estado)

2. **Proyecto Supabase nuevo**
   - Crear proyecto en Supabase (región cercana a México si aplica)
   - Esquema inicial: tabla `plants` con RLS (row-level security) por `user_id`
   - Habilitar Auth de Supabase (Google OAuth, para no perder el login actual)
   - `.env.example` con `SUPABASE_URL` / `SUPABASE_ANON_KEY`

3. **Migrar Auth: Firebase → Supabase Auth**
   - Reemplazar `firebase.ts`/`firebase-admin.ts` por cliente Supabase
   - Reescribir `useAuth`/`AuthContext` para Supabase session
   - Google Sign-In vía Supabase OAuth provider
   - Migrar middleware de sesión (`src/middleware.ts` → Astro middleware + cookies)

4. **Migrar datos: Firestore → Postgres (Supabase)**
   - Diseñar tabla `plants` (ver sección de features para el esquema final, se crea completo desde el día 1 para no migrar dos veces)
   - Storage de fotos: Supabase Storage (bucket `plant-photos`) en vez de Firebase Cloud Storage
   - Script de migración de datos existentes si hay usuarios/plantas reales en Firestore (verificar si aplica — probablemente no, proyecto sin uso real todavía)

5. **PWA instalable ("descargar como app")**
   - `manifest.webmanifest` (nombre, iconos 192/512, `display: standalone`, `theme_color`)
   - Service worker básico (cache de assets estáticos, offline shell) — copiar patrón de `public/sw.js` de Rastrum
   - Iconos: reusar/adaptar `logo-square.png` y `plantopia-icon.png` que ya existen en `public/`
   - Meta tags de instalación (Add to Home Screen) en `<head>`

6. **Offline-first (opcional en esta fase, recomendado)**
   - Dexie (IndexedDB) como caché local de la colección de plantas — igual que Rastrum
   - Sync en background al reconectar

7. **Testing + CI**
   - Vitest para lógica (igual que Rastrum, no Jest)
   - Playwright para e2e básico (login, CRUD)
   - GitHub Actions: build + test en PR (no existía en el proyecto viejo)

8. **Deploy**
   - Definir hosting: Vercel/Cloudflare Pages/Firebase Hosting para el sitio estático de Astro
   - Dominio (¿ya tienes uno pensado, o seguimos con `plantopia` en subdominio tipo `plantopia.mx` o similar?)

9. **App nativa real (opcional, fase posterior)**
   - Tauri (`src-tauri/`) igual que Rastrum → build de `.apk`/`.aab` para Play Store si en algún momento quieres ir más allá de la PWA

**Entregable de esta fase:** app funcionando en Astro+Supabase con lo mismo que hace hoy (login, ver/agregar/editar/borrar plantas con foto, riego), instalable desde el navegador del celular.

---

## 🌱 FEATURES (lo nuevo que pediste — colección con ciclos de vida)

Objetivo: modelo de datos rico para que cada planta lleve su bitácora real de cuidado, no solo "nombre + riego".

### Modelo de datos ampliado (tabla `plants` en Supabase)

Campos nuevos sobre lo que ya existía:

- **Sustrato** (`substrate`): tipo/mezcla (ej. "turba + perlita + corteza de pino"), opcional pH, opcional última vez que se cambió
- **Luz** (`light`): tipo requerido (directa / indirecta brillante / indirecta baja / sombra) + horas/día si aplica + ubicación física (ventana norte/sur, etc.)
- **Riego**: ya existe (frecuencia + última fecha) — se mantiene, se puede afinar por estación
- **Fertilización**: frecuencia + última fecha (nuevo, no existía)
- **Ciclo de vida / fase actual** (`growth_phase`): enum —`vegetativo` | `floración` | `fructificación` | `recesión/dormancia` | `latencia` — con fecha de inicio de la fase actual
- **Historial de fases** (tabla nueva `plant_phase_log`): cada cambio de fase queda registrado con fecha, para poder ver el ciclo anual de cada planta a lo largo del tiempo
- **Bitácora general** (tabla nueva `plant_events`): log libre de eventos (trasplante, poda, plaga detectada, fertilizada, etc.) — no solo fases, cualquier evento relevante con fecha + nota + foto opcional

### UI/UX nuevas

- Formulario de planta ampliado con los campos nuevos (sustrato, luz, fase)
- Vista de detalle de planta con **timeline visual** del ciclo (fases + eventos en orden cronológico)
- Botón rápido "Cambiar de fase" desde la tarjeta o el detalle
- Indicador visual en la tarjeta de planta: fase actual con color/ícono (ej. 🌸 floración, 😴 recesión, 🌿 vegetativo)
- Filtro/orden de la colección por fase actual o por "necesita atención pronto" (riego/fertilización vencidos)

### Inteligencia básica (opcional, fase posterior a la primera entrega)

- Alertas de fase esperada según especie + temporada (ej. muchas plantas entran en recesión en invierno) — esto requeriría una tabla de referencia por especie, se puede dejar para después
- Recordatorios (push/notificación local vía PWA) para riego/fertilización vencidos

**Entregable de esta fase:** cada planta de tu colección real con su ficha completa (sustrato, luz, riego, fertilización) y su bitácora de ciclo de vida visible en una línea de tiempo.

---

## Orden de ejecución propuesto

1. Infraestructura completa (con el modelo de datos de features ya incluido en el esquema, para no migrar la DB dos veces)
2. Features de UI para el modelo ampliado
3. Alertas/inteligencia (después, si se justifica)

## Pendiente de decidir con Pame
- [ ] Dominio para el deploy
- [ ] ¿Migrar datos existentes de Firestore o empezar limpio? (probablemente empezar limpio)
- [ ] Lista real de plantas de la casa para poblar la colección inicial y validar el modelo con casos reales
- [ ] ¿Metemos Tauri/APK desde ya o dejamos PWA instalable como suficiente por ahora?
