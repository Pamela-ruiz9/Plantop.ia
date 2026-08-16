# Perfil de usuario y sesión — Dashboard y Ajustes

## Goal

Dar visibilidad y control sobre la propia cuenta: mostrar cómo inició sesión la usuaria (Google vs email/contraseña), desde cuándo es miembro y su último acceso, y permitirle editar su nombre para mostrar y su foto de perfil. Un resumen breve va en el Dashboard; el detalle completo y editable va en Ajustes.

Este es el "Proyecto 1" de dos proyectos relacionados que surgieron en la misma conversación. El sistema de amigos y perfiles públicos de otras usuarias es un subsistema aparte (RLS nuevas, tablas nuevas, decisiones de privacidad) y se brainstormea por separado, después de que este quede implementado.

## Contexto

- `pages/settings.astro` ya tiene una sección "Cuenta" con el email (solo lectura) y el botón "Cerrar sesión" (`logoutBtn` + `signOut()` de `lib/session.ts`). Esta spec reemplaza esa sección por una versión ampliada y editable.
- `pages/dashboard.astro` no tiene ninguna referencia al usuario hoy — solo stats de plantas.
- `lib/session.ts` expone `requireAuth()`, que ya resuelve el `User` de Supabase (`@supabase/supabase-js`) de forma síncrona antes de renderizar.
- El `User` de Supabase trae `app_metadata.provider` (`'google'` | `'email'`), `user_metadata.full_name`/`avatar_url` (pobladas automáticamente por Google en el login OAuth), `created_at` y `last_sign_in_at`.
- Patrón de subida de fotos ya establecido en `lib/plants.ts` (`uploadPlantPhoto`): sube a un bucket de Supabase Storage con `upsert: true`, devuelve `getPublicUrl(...)`. El bucket `plant-photos` se documentó como comentario en `supabase/migrations/0001_init.sql` pero se creó a mano vía dashboard/CLI — no hay SQL que lo cree.
- Gap de seguridad ya conocido y documentado en `docs/agents/STATUS.md`: las URLs de foto se validan con `startsWith('https://')` antes de renderizarse como `src`, de forma inconsistente entre páginas. Esta spec sigue ese mismo chequeo para el avatar, para no repetir el problema.

## Diseño

### 1. `lib/user-display.ts` — helpers puros de lectura

Funciones sin efectos secundarios, testeadas con Vitest:

```typescript
import type { User } from '@supabase/supabase-js';

export type LoginProvider = 'google' | 'email';

export function getProvider(user: User): LoginProvider {
  return user.app_metadata?.provider === 'google' ? 'google' : 'email';
}

export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name as string | undefined;
  if (fullName?.trim()) return fullName.trim();
  return (user.email ?? '').split('@')[0] || 'Usuaria';
}

export function getAvatarUrl(user: User): string | null {
  const url = user.user_metadata?.avatar_url as string | undefined;
  return url && url.startsWith('https://') ? url : null;
}

export function getInitial(user: User): string {
  return getDisplayName(user).charAt(0).toUpperCase();
}

export function getProviderLabel(provider: LoginProvider): string {
  return provider === 'google' ? 'Google' : 'Email y contraseña';
}

export function formatLastSignIn(user: User, now: Date = new Date()): string {
  return formatRelativeDate(user.last_sign_in_at, now);
}

export function formatMemberSince(user: User, now: Date = new Date()): string {
  return formatRelativeDate(user.created_at, now);
}
```

`formatRelativeDate` (interna, no exportada): parsea el string ISO; si es inválido o falta, devuelve `'—'`. Si la fecha es hoy → `"Hoy"`; ayer → `"Ayer"`; hasta 6 días atrás → `"hace N días"`; si no, fecha formateada `dd mmm yyyy` (mismo formato corto que ya usa el resto de la app para fechas, ej. `last_watered`).

### 2. `lib/profile.ts` — mutaciones

Mismo patrón que `uploadPlantPhoto`/`deletePlantPhoto` en `lib/plants.ts`: wrappers finos sobre Supabase, testeados mockeando el cliente.

```typescript
import { supabase } from './supabase';

export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) throw error;
}

export async function uploadAvatarPhoto(file: File, userId: string): Promise<string> {
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const path = ext ? `${userId}/avatar.${ext}` : `${userId}/avatar`;
  const { error } = await supabase.storage
    .from('avatar-photos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatar-photos').getPublicUrl(path);
  return data.publicUrl;
}
```

`uploadAvatarPhoto` solo sube y devuelve la URL — igual que `uploadPlantPhoto`, no persiste nada en el usuario. Quien llama (`settings.astro`) hace después `supabase.auth.updateUser({ data: { avatar_url: url } })`, igual que `new.astro` hace `uploadPlantPhoto` y después `updatePlant` por separado.

Como la edición escribe en los mismos campos de `user_metadata` que `getDisplayName`/`getAvatarUrl` leen, el resumen del Dashboard refleja los cambios sin lógica adicional — no hace falta invalidar caché ni sincronizar nada a mano, alcanza con volver a llamar `requireAuth()` (que siempre trae el usuario fresco de la sesión).

### 3. Bucket de Storage nuevo

`avatar-photos` — público de lectura, escritura autenticada. Mismo criterio que `plant-photos`: se documenta como comentario en una migración nueva (`supabase/migrations/000X_avatar_bucket.sql`), la creación real del bucket se hace a mano vía dashboard/CLI de Supabase (fuera del alcance de este repo, requiere acceso al proyecto de Supabase).

### 4. Dashboard (`pages/dashboard.astro`) — fila de resumen

Dentro del `<header>` existente, debajo del título "🏠 Inicio", una fila clickeable (`<a href="${base}settings">`) con el mismo estilo de tarjeta que el resto de la página (`border-slate-800 bg-slate-900 rounded-xl`):

```
[Avatar 32px o inicial]  pame.ruiz98              →
                          🔵 Google
```

- Avatar: `<img>` si `getAvatarUrl(user)` no es `null`; si no, círculo con `getInitial(user)` sobre fondo `bg-slate-800`.
- Nombre: `getDisplayName(user)`.
- Método: ícono + `getProviderLabel(getProvider(user))` en texto chico (`text-xs text-slate-500`).
- Toda la fila importa `user-display.ts` y usa el `user` que ya devuelve `requireAuth()` en el `init()` existente — no hace falta una segunda llamada a Supabase.

### 5. Ajustes (`pages/settings.astro`) — sección "Cuenta" ampliada

Reemplaza la sección actual (líneas 74–87 de `settings.astro`):

```
Cuenta
┌───────────────────────────────────────┐
│ [Avatar 64px]  [Cambiar foto]          │
│                                         │
│ Nombre para mostrar                    │
│ [pame.ruiz98____________] [Guardar]    │
│                                         │
│  Método de acceso     🔵 Google        │
│  Miembro desde        05 ago 2026      │
│  Último acceso        Hoy              │
│                                         │
│              [Cerrar sesión]           │
└───────────────────────────────────────┘
```

**Cambiar foto:**
- Botón que dispara un `<input type="file" accept="image/*" class="hidden">`.
- Al seleccionar archivo: sube inmediatamente (sin paso de confirmación aparte, igual que ocurre hoy al elegir foto en `plants/new.astro` — pero ahí el upload se dispara en el submit del form; acá, al no haber un form más grande alrededor, se sube directo al `change` del input) → `uploadAvatarPhoto(file, user.id)` → `supabase.auth.updateUser({ data: { avatar_url: url } })` → refresca el avatar en pantalla.
- Mientras sube: deshabilitar el botón y mostrar texto "Subiendo…" en vez de spinner (no hay componente de spinner en el repo hoy).
- Si falla: mensaje de error reutilizando el mismo estilo que `#save-message` ya usa en la sección de IA (`text-red-400`).

**Nombre para mostrar:**
- Input de texto prellenado con `getDisplayName(user)` + botón "Guardar" separado.
- Validación: `trim()` no vacío; si está vacío, mensaje de error, no se llama a Supabase. Sin límite de caracteres artificial.
- Al guardar: `updateDisplayName(name)` → mensaje "✓ Guardado." (mismo patrón que el botón "Guardar" de la sección de IA, líneas 144–158 de `settings.astro` hoy).

**Método / fechas (solo lectura):**
- Tres filas `label` + `valor`, mismo estilo tabular simple, usando `getProviderLabel`, `formatMemberSince`, `formatLastSignIn`.

**Cerrar sesión:** sin cambios de comportamiento, se mueve al final de la sección ampliada.

### 6. Manejo de errores / edge cases

- `avatar_url` sin esquema `https://` (URL corrupta o dato inesperado) → se ignora, cae al fallback de inicial. Mismo criterio que las fotos de plantas.
- `created_at`/`last_sign_in_at` ausentes o no parseables → `formatRelativeDate` devuelve `'—'` en vez de romper.
- `full_name` vacío o solo espacios → `getDisplayName` cae al local-part del email.
- Falla de red al subir avatar o guardar nombre → mensaje de error visible, sin romper el resto de la página (mismo patrón que ya usa la sección de IA en `settings.astro`).

## Testing

- `lib/user-display.test.ts` (TDD): cada función cubierta con casos Google (con/sin avatar, con/sin `full_name`), email/password, fechas límite de `formatRelativeDate` (hoy, ayer, 6 días, 7+ días, `null`/inválida), `avatar_url` con esquema no-https.
- `lib/profile.test.ts`: `updateDisplayName` y `uploadAvatarPhoto` mockeando `supabase.auth.updateUser`/`supabase.storage`, igual que `plants.test.ts` mockea `uploadPlantPhoto`/`deletePlantPhoto` (caso éxito + caso error que debe lanzar).
- Sin tests de `.astro` — convención del repo se mantiene.
- Verificación obligatoria antes de cerrar la tarea: `npm run check` (no alcanza con `tsc --noEmit`, ver lección documentada en `docs/agents/STATUS.md`).

## Fuera de alcance

- Sistema de amigos y perfiles públicos de otras usuarias — Proyecto 2, brainstorming aparte.
- Cambio de email o contraseña — no se pidió, y cambiar el email de login en Supabase implica un flujo de reconfirmación que no se cubrió en esta conversación.
- Eliminar cuenta / borrar todos los datos — no se pidió.
- Recorte/edición de la foto de perfil (crop) antes de subir — se sube el archivo tal cual selecciona la usuaria, igual que las fotos de plantas hoy.
- Sincronización en tiempo real del nombre/avatar entre pestañas abiertas simultáneamente — con recargar la página alcanza, no hay tal patrón hoy en el repo para ningún otro dato tampoco.
