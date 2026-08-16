# User Profile & Session Info Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar cómo inició sesión la usuaria (Google vs email/contraseña), desde cuándo es miembro y su último acceso, y permitirle editar su nombre para mostrar y su foto de perfil — un resumen breve en el Dashboard, el detalle completo y editable en Ajustes.

**Architecture:** Dos módulos nuevos en `lib/`: `user-display.ts` (funciones puras de lectura, testeadas) y `profile.ts` (mutaciones finas sobre Supabase Auth/Storage, mismo patrón que `uploadPlantPhoto`/`deletePlantPhoto` en `lib/plants.ts`). Ambas páginas (`dashboard.astro`, `settings.astro`) consumen `requireAuth()` como ya hacen hoy y solo agregan renderizado — no se toca el modelo de datos de plantas ni ninguna otra página.

**Tech Stack:** Astro 7 static + TypeScript 5.8 + Supabase Auth/Storage + Tailwind v4 + Vitest 4.

**IMPORTANTE — lección de este proyecto:** para verificar tipos en archivos `.astro`, siempre correr `npm run check` (Astro's own type checker), NUNCA solo `npx tsc --noEmit -p .` — este último no detecta errores reales de narrowing dentro de scripts embebidos en `.astro` y ya causó dos deploys rotos. Cada tarea de este plan que incluya un paso de verificación debe usar `npm run check`.

---

## File map

**Nuevos:**
- `plantopia/src/lib/user-display.ts` — funciones puras: `getProvider`, `getDisplayName`, `getAvatarUrl`, `getInitial`, `getProviderLabel`, `formatMemberSince`, `formatLastSignIn`
- `plantopia/src/lib/user-display.test.ts`
- `plantopia/src/lib/profile.ts` — `updateDisplayName`, `uploadAvatarPhoto`
- `plantopia/src/lib/profile.test.ts`
- `plantopia/supabase/migrations/0005_avatar_bucket.sql` — documenta el bucket `avatar-photos` (se crea a mano vía dashboard/CLI, igual que `plant-photos`)

**Modificados:**
- `plantopia/src/pages/dashboard.astro` — fila de resumen de usuario, clickeable hacia `/settings`
- `plantopia/src/pages/settings.astro` — sección "Cuenta" ampliada: avatar editable, nombre editable, método de acceso, miembro desde, último acceso

---

### Task 1: `lib/user-display.ts` — helpers puros de lectura

**Files:**
- Create: `plantopia/src/lib/user-display.ts`
- Create: `plantopia/src/lib/user-display.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `plantopia/src/lib/user-display.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getProvider,
  getDisplayName,
  getAvatarUrl,
  getInitial,
  getProviderLabel,
  formatMemberSince,
  formatLastSignIn,
  type SessionUser,
} from './user-display';

const NOW = new Date('2026-08-16T12:00:00');

describe('getProvider', () => {
  it('returns "google" when app_metadata.provider is "google"', () => {
    const user: SessionUser = { app_metadata: { provider: 'google' } };
    expect(getProvider(user)).toBe('google');
  });

  it('returns "email" when app_metadata.provider is "email"', () => {
    const user: SessionUser = { app_metadata: { provider: 'email' } };
    expect(getProvider(user)).toBe('email');
  });

  it('returns "email" when app_metadata is missing', () => {
    const user: SessionUser = {};
    expect(getProvider(user)).toBe('email');
  });
});

describe('getDisplayName', () => {
  it('returns full_name from user_metadata when present', () => {
    const user: SessionUser = { user_metadata: { full_name: 'Pame Ruiz' }, email: 'pame@example.com' };
    expect(getDisplayName(user)).toBe('Pame Ruiz');
  });

  it('falls back to the email local-part when full_name is whitespace-only', () => {
    const user: SessionUser = { user_metadata: { full_name: '   ' }, email: 'pame.ruiz98@gmail.com' };
    expect(getDisplayName(user)).toBe('pame.ruiz98');
  });

  it('falls back to the email local-part when full_name is missing', () => {
    const user: SessionUser = { email: 'pame.ruiz98@gmail.com' };
    expect(getDisplayName(user)).toBe('pame.ruiz98');
  });

  it('falls back to "Usuaria" when both full_name and email are missing', () => {
    const user: SessionUser = {};
    expect(getDisplayName(user)).toBe('Usuaria');
  });
});

describe('getAvatarUrl', () => {
  it('returns the avatar_url when present and https', () => {
    const user: SessionUser = { user_metadata: { avatar_url: 'https://example.com/a.jpg' } };
    expect(getAvatarUrl(user)).toBe('https://example.com/a.jpg');
  });

  it('returns null when avatar_url does not start with https://', () => {
    const user: SessionUser = { user_metadata: { avatar_url: 'http://example.com/a.jpg' } };
    expect(getAvatarUrl(user)).toBeNull();
  });

  it('returns null when avatar_url is missing', () => {
    const user: SessionUser = {};
    expect(getAvatarUrl(user)).toBeNull();
  });
});

describe('getInitial', () => {
  it('returns the uppercase first letter of the display name', () => {
    const user: SessionUser = { user_metadata: { full_name: 'pame ruiz' } };
    expect(getInitial(user)).toBe('P');
  });

  it('falls back through getDisplayName when there is no name or email', () => {
    const user: SessionUser = {};
    expect(getInitial(user)).toBe('U'); // "Usuaria"
  });
});

describe('getProviderLabel', () => {
  it('labels "google" as "Google"', () => {
    expect(getProviderLabel('google')).toBe('Google');
  });

  it('labels "email" as "Email y contraseña"', () => {
    expect(getProviderLabel('email')).toBe('Email y contraseña');
  });
});

describe('formatLastSignIn', () => {
  it('returns "Hoy" for the same day', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-16T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('Hoy');
  });

  it('returns "Ayer" for one day ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-15T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('Ayer');
  });

  it('returns "hace N días" up to 6 days ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-10T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('hace 6 días');
  });

  it('falls back to a formatted date beyond 6 days ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-09T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('09 ago 2026');
  });

  it('returns "—" when last_sign_in_at is missing', () => {
    const user: SessionUser = {};
    expect(formatLastSignIn(user, NOW)).toBe('—');
  });

  it('returns "—" when last_sign_in_at is not a parseable date', () => {
    const user: SessionUser = { last_sign_in_at: 'not-a-date' };
    expect(formatLastSignIn(user, NOW)).toBe('—');
  });
});

describe('formatMemberSince', () => {
  it('formats created_at the same way as last_sign_in_at', () => {
    const user: SessionUser = { created_at: '2026-08-09T09:00:00' };
    expect(formatMemberSince(user, NOW)).toBe('09 ago 2026');
  });

  it('returns "—" when created_at is missing', () => {
    const user: SessionUser = {};
    expect(formatMemberSince(user, NOW)).toBe('—');
  });
});
```

- [ ] **Step 2: Correr los tests — deben fallar**

```bash
cd plantopia && npm test -- src/lib/user-display.test.ts
```

Expected: falla al importar `./user-display` (el módulo no existe todavía).

- [ ] **Step 3: Implementar `user-display.ts`**

Crear `plantopia/src/lib/user-display.ts`:

```typescript
// Helpers puros para mostrar información de sesión de usuario (Dashboard y Ajustes).
// SessionUser es una vista estructural mínima del User de @supabase/supabase-js —
// cualquier User real cumple esta forma, así que las páginas pasan el user de
// requireAuth() directamente, sin castear.

export type LoginProvider = 'google' | 'email';

export interface SessionUser {
  email?: string;
  app_metadata?: { provider?: string };
  user_metadata?: { full_name?: string; avatar_url?: string };
  created_at?: string;
  last_sign_in_at?: string;
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function getProvider(user: SessionUser): LoginProvider {
  return user.app_metadata?.provider === 'google' ? 'google' : 'email';
}

export function getDisplayName(user: SessionUser): string {
  const fullName = user.user_metadata?.full_name?.trim();
  if (fullName) return fullName;
  const localPart = (user.email ?? '').split('@')[0];
  return localPart || 'Usuaria';
}

export function getAvatarUrl(user: SessionUser): string | null {
  const url = user.user_metadata?.avatar_url;
  return url && url.startsWith('https://') ? url : null;
}

export function getInitial(user: SessionUser): string {
  return getDisplayName(user).charAt(0).toUpperCase();
}

export function getProviderLabel(provider: LoginProvider): string {
  return provider === 'google' ? 'Google' : 'Email y contraseña';
}

export function formatMemberSince(user: SessionUser, now: Date = new Date()): string {
  return formatRelativeDate(user.created_at, now);
}

export function formatLastSignIn(user: SessionUser, now: Date = new Date()): string {
  return formatRelativeDate(user.last_sign_in_at, now);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatRelativeDate(isoString: string | undefined, now: Date): string {
  if (!isoString) return '—';
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return '—';

  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(then).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays >= 2 && diffDays <= 6) return `hace ${diffDays} días`;

  const day = String(then.getDate()).padStart(2, '0');
  const month = MONTHS_ES[then.getMonth()];
  const year = then.getFullYear();
  return `${day} ${month} ${year}`;
}
```

- [ ] **Step 4: Correr los tests — deben pasar**

```bash
npm test -- src/lib/user-display.test.ts
```

Expected: todos en verde (24 tests).

- [ ] **Step 5: Type-check**

```bash
npm run check
```

Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/lib/user-display.ts plantopia/src/lib/user-display.test.ts
git commit -m "feat: user-display helpers for session info (name, avatar, provider, dates)"
```

---

### Task 2: `lib/profile.ts` — mutaciones (nombre y avatar)

**Files:**
- Create: `plantopia/src/lib/profile.ts`
- Create: `plantopia/src/lib/profile.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `plantopia/src/lib/profile.test.ts` (mismo patrón de mock que `plants.test.ts` para `uploadPlantPhoto`/`deletePlantPhoto`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStorage = {
  upload: vi.fn().mockResolvedValue({ data: { path: 'user1/avatar.jpg' }, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/avatar-photos/user1/avatar.jpg' },
  }),
};

const mockUpdateUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

// Mock supabase BEFORE importing profile
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
    },
    storage: {
      from: vi.fn(() => mockStorage),
    },
  },
}));

import { updateDisplayName, uploadAvatarPhoto } from './profile';

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateUser.mockResolvedValue({ data: { user: null }, error: null });
  mockStorage.upload.mockResolvedValue({ data: { path: 'user1/avatar.jpg' }, error: null });
  mockStorage.getPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/avatar-photos/user1/avatar.jpg' },
  });
});

describe('updateDisplayName', () => {
  it('calls supabase.auth.updateUser with the given name as full_name', async () => {
    await updateDisplayName('Pame Ruiz');
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: 'Pame Ruiz' } });
  });

  it('throws when Supabase returns an error', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: null, error: new Error('Update failed') });
    await expect(updateDisplayName('Pame Ruiz')).rejects.toThrow('Update failed');
  });
});

describe('uploadAvatarPhoto', () => {
  it('returns a public URL string after upload', async () => {
    const file = new File(['photo'], 'avatar.jpg', { type: 'image/jpeg' });

    const url = await uploadAvatarPhoto(file, 'user1');

    expect(typeof url).toBe('string');
    expect(url).toContain('avatar-photos');
    expect(url).toContain('user1/avatar.jpg');
  });

  it('throws when upload fails', async () => {
    mockStorage.upload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed') });
    const file = new File(['photo'], 'avatar.jpg', { type: 'image/jpeg' });

    await expect(uploadAvatarPhoto(file, 'user1')).rejects.toThrow('Upload failed');
  });
});
```

- [ ] **Step 2: Correr los tests — deben fallar**

```bash
npm test -- src/lib/profile.test.ts
```

Expected: falla al importar `./profile` (el módulo no existe todavía).

- [ ] **Step 3: Implementar `profile.ts`**

Crear `plantopia/src/lib/profile.ts`:

```typescript
// Mutaciones de perfil: nombre para mostrar y foto de avatar.
// updateDisplayName escribe en user_metadata.full_name (auth.updateUser).
// uploadAvatarPhoto solo sube y devuelve la URL — igual que uploadPlantPhoto en
// lib/plants.ts, quien llama persiste la URL por separado (ver settings.astro).
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

- [ ] **Step 4: Correr los tests — deben pasar**

```bash
npm test -- src/lib/profile.test.ts
```

Expected: todos en verde (4 tests).

- [ ] **Step 5: Type-check**

```bash
npm run check
```

Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add plantopia/src/lib/profile.ts plantopia/src/lib/profile.test.ts
git commit -m "feat: profile mutations (display name, avatar upload)"
```

---

### Task 3: Bucket de Storage `avatar-photos`

**Files:**
- Create: `plantopia/supabase/migrations/0005_avatar_bucket.sql`

- [ ] **Step 1: Crear el archivo de migración**

Crear `plantopia/supabase/migrations/0005_avatar_bucket.sql`:

```sql
-- supabase/migrations/0005_avatar_bucket.sql
-- Storage bucket para fotos de perfil (crear vía dashboard o CLI aparte,
-- mismo criterio que "plant-photos" en 0001_init.sql — no hay SQL que lo cree)
-- Bucket sugerido: "avatar-photos", público de lectura, escritura autenticada
```

- [ ] **Step 2: Commit**

```bash
cd plantopia && git add supabase/migrations/0005_avatar_bucket.sql
git commit -m "docs: document avatar-photos storage bucket"
```

**Nota para quien ejecute este plan en un entorno real:** este archivo solo documenta el bucket — para que la subida de avatar funcione de verdad hace falta crearlo a mano en el dashboard de Supabase (Storage → New bucket → `avatar-photos`, público de lectura) antes de probar Task 5 en el navegador. Sin esto, `uploadAvatarPhoto` en Task 2 sigue siendo correcto y sus tests (mockeados) pasan igual, pero la subida real fallará hasta que el bucket exista.

---

### Task 4: `dashboard.astro` — fila de resumen de usuario

**Files:**
- Modify: `plantopia/src/pages/dashboard.astro`

Este task construye sobre el estado actual de `dashboard.astro` (222 líneas, ya tiene stats/salud/fase/atención/vencen-pronto — sin cambios en esa lógica). Léelo primero para confirmar que coincide antes de editar.

- [ ] **Step 1: Agregar `base` al frontmatter**

Cambiar:

```astro
---
import Layout from '../layouts/Layout.astro';
import BottomNav from '../components/BottomNav.astro';
import '../styles/global.css';
---
```

por:

```astro
---
import Layout from '../layouts/Layout.astro';
import BottomNav from '../components/BottomNav.astro';
import '../styles/global.css';

const base = import.meta.env.BASE_URL;
---
```

- [ ] **Step 2: Agregar la fila de resumen de usuario en el markup**

Cambiar:

```astro
    <header class="mb-6 flex items-center gap-2">
      <span class="text-2xl">🏠</span>
      <h1 class="text-xl font-semibold">Inicio</h1>
    </header>

    <div id="loading" class="py-12 text-center text-sm text-slate-500">Cargando resumen…</div>
```

por:

```astro
    <header class="mb-6 flex items-center gap-2">
      <span class="text-2xl">🏠</span>
      <h1 class="text-xl font-semibold">Inicio</h1>
    </header>

    <a
      href={`${base}settings`}
      class="mb-6 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 transition hover:border-slate-600"
    >
      <div id="user-avatar" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300"></div>
      <div class="flex-1">
        <p id="user-name" class="text-sm font-medium text-slate-100"></p>
        <p id="user-provider" class="text-xs text-slate-500"></p>
      </div>
      <span class="text-slate-500">→</span>
    </a>

    <div id="loading" class="py-12 text-center text-sm text-slate-500">Cargando resumen…</div>
```

- [ ] **Step 3: Importar `user-display.ts` en el script**

Cambiar:

```typescript
    import { requireAuth } from '../lib/session';
    import { listPlants } from '../lib/plants';
```

por:

```typescript
    import { requireAuth } from '../lib/session';
    import { listPlants } from '../lib/plants';
    import {
      getDisplayName,
      getAvatarUrl,
      getInitial,
      getProvider,
      getProviderLabel,
      type SessionUser,
    } from '../lib/user-display';
```

- [ ] **Step 4: Agregar los refs de los elementos nuevos**

Cambiar:

```typescript
    const dueSoonList = document.getElementById('due-soon-list')!;
    const dueSoonEmpty = document.getElementById('due-soon-empty')!;
```

por:

```typescript
    const dueSoonList = document.getElementById('due-soon-list')!;
    const dueSoonEmpty = document.getElementById('due-soon-empty')!;
    const userAvatarEl = document.getElementById('user-avatar')!;
    const userNameEl = document.getElementById('user-name')!;
    const userProviderEl = document.getElementById('user-provider')!;
```

- [ ] **Step 5: Agregar `renderUserSummary`**

Agregar justo después de la función `escapeHtml` existente (antes de `overdueReasons`):

```typescript
    function escapeHtml(str: string): string {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function renderUserSummary(user: SessionUser) {
      const avatarUrl = getAvatarUrl(user);
      userAvatarEl.innerHTML = avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-8 w-8 rounded-full object-cover" />`
        : escapeHtml(getInitial(user));
      userNameEl.textContent = getDisplayName(user);
      userProviderEl.textContent = getProviderLabel(getProvider(user));
    }
```

(`SessionUser` es el tipo estructural mínimo definido en `lib/user-display.ts` — el `user` que devuelve `requireAuth()` es un `User` de Supabase, que cumple esa forma, así que se pasa directo sin castear.)

- [ ] **Step 6: Llamar a `renderUserSummary` en `init()`**

Cambiar:

```typescript
    async function init() {
      const user = await requireAuth();
      if (!user) return;

      try {
        const plants = await listPlants(user.id);
```

por:

```typescript
    async function init() {
      const user = await requireAuth();
      if (!user) return;
      renderUserSummary(user);

      try {
        const plants = await listPlants(user.id);
```

- [ ] **Step 7: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso (8 páginas), `npm run check` con 0 errores.

- [ ] **Step 8: Commit**

```bash
git add plantopia/src/pages/dashboard.astro
git commit -m "feat: user summary row in dashboard, linking to settings"
```

---

### Task 5: `settings.astro` — sección "Cuenta" ampliada y editable

**Files:**
- Modify: `plantopia/src/pages/settings.astro`

Este task construye sobre el estado actual de `settings.astro` (179 líneas — sección IA sin cambios, sección "Cuenta" se reemplaza). Léelo primero para confirmar que coincide antes de editar.

- [ ] **Step 1: Reemplazar el markup de la sección "Cuenta"**

Cambiar:

```astro
    <!-- Sección cuenta -->
    <section>
      <h2 class="mb-3 text-sm font-medium text-slate-300">Cuenta</h2>
      <div class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
        <span id="user-email" class="text-sm text-slate-400">—</span>
        <button
          id="logout-btn"
          type="button"
          class="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
```

por:

```astro
    <!-- Sección cuenta -->
    <section>
      <h2 class="mb-3 text-sm font-medium text-slate-300">Cuenta</h2>
      <div class="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div class="flex items-center gap-4">
          <div id="profile-avatar" class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl font-medium text-slate-300"></div>
          <div>
            <input id="avatar-file" type="file" accept="image/*" class="hidden" />
            <button
              id="avatar-btn"
              type="button"
              class="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Cambiar foto
            </button>
            <p id="avatar-message" class="mt-1 hidden text-xs"></p>
          </div>
        </div>

        <div>
          <label for="display-name" class="mb-1 block text-xs text-slate-400">Nombre para mostrar</label>
          <div class="flex gap-2">
            <input
              id="display-name"
              type="text"
              class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
            <button
              id="name-save-btn"
              type="button"
              class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
            >
              Guardar
            </button>
          </div>
          <p id="name-message" class="mt-1 hidden text-xs"></p>
        </div>

        <dl class="flex flex-col gap-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-slate-500">Método de acceso</dt>
            <dd id="account-provider" class="text-slate-300">—</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Miembro desde</dt>
            <dd id="account-created" class="text-slate-300">—</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-500">Último acceso</dt>
            <dd id="account-last-signin" class="text-slate-300">—</dd>
          </div>
        </dl>

        <button
          id="logout-btn"
          type="button"
          class="self-start rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
```

- [ ] **Step 2: Actualizar los imports del script**

Cambiar:

```typescript
    import { requireAuth, signOut } from '../lib/session';
    import { getAISettings, saveAISettings, clearAISettings, type AIProvider } from '../lib/ai';
```

por:

```typescript
    import { requireAuth, signOut } from '../lib/session';
    import { getAISettings, saveAISettings, clearAISettings, type AIProvider } from '../lib/ai';
    import {
      getDisplayName,
      getAvatarUrl,
      getInitial,
      getProvider,
      getProviderLabel,
      formatMemberSince,
      formatLastSignIn,
      type SessionUser,
    } from '../lib/user-display';
    import { updateDisplayName, uploadAvatarPhoto } from '../lib/profile';
    import { supabase } from '../lib/supabase';
    import type { User } from '@supabase/supabase-js';
```

- [ ] **Step 3: Reemplazar los refs de elementos y agregar `currentUser`**

Cambiar:

```typescript
    const providerEl  = document.getElementById('ai-provider') as HTMLSelectElement;
    const keyEl       = document.getElementById('ai-key') as HTMLInputElement;
    const toggleEl    = document.getElementById('toggle-key') as HTMLButtonElement;
    const helpLinkEl  = document.getElementById('key-help-link') as HTMLAnchorElement;
    const saveBtn     = document.getElementById('save-btn') as HTMLButtonElement;
    const clearBtn    = document.getElementById('clear-btn') as HTMLButtonElement;
    const saveMsg     = document.getElementById('save-message') as HTMLParagraphElement;
    const statusEl    = document.getElementById('ai-status') as HTMLParagraphElement;
    const userEmailEl = document.getElementById('user-email') as HTMLSpanElement;
    const logoutBtn   = document.getElementById('logout-btn') as HTMLButtonElement;
```

por:

```typescript
    const providerEl  = document.getElementById('ai-provider') as HTMLSelectElement;
    const keyEl       = document.getElementById('ai-key') as HTMLInputElement;
    const toggleEl    = document.getElementById('toggle-key') as HTMLButtonElement;
    const helpLinkEl  = document.getElementById('key-help-link') as HTMLAnchorElement;
    const saveBtn     = document.getElementById('save-btn') as HTMLButtonElement;
    const clearBtn    = document.getElementById('clear-btn') as HTMLButtonElement;
    const saveMsg     = document.getElementById('save-message') as HTMLParagraphElement;
    const statusEl    = document.getElementById('ai-status') as HTMLParagraphElement;
    const logoutBtn   = document.getElementById('logout-btn') as HTMLButtonElement;

    const profileAvatarEl   = document.getElementById('profile-avatar') as HTMLDivElement;
    const avatarFileEl      = document.getElementById('avatar-file') as HTMLInputElement;
    const avatarBtn         = document.getElementById('avatar-btn') as HTMLButtonElement;
    const avatarMsg         = document.getElementById('avatar-message') as HTMLParagraphElement;
    const displayNameEl     = document.getElementById('display-name') as HTMLInputElement;
    const nameSaveBtn       = document.getElementById('name-save-btn') as HTMLButtonElement;
    const nameMsg           = document.getElementById('name-message') as HTMLParagraphElement;
    const providerValueEl   = document.getElementById('account-provider') as HTMLElement;
    const createdValueEl    = document.getElementById('account-created') as HTMLElement;
    const lastSigninValueEl = document.getElementById('account-last-signin') as HTMLElement;

    let currentUser: User | null = null;

    function escapeHtml(str: string): string {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function renderAvatar(user: SessionUser) {
      const avatarUrl = getAvatarUrl(user);
      profileAvatarEl.innerHTML = avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="h-16 w-16 rounded-full object-cover" />`
        : escapeHtml(getInitial(user));
    }

    function renderAccount(user: SessionUser) {
      renderAvatar(user);
      displayNameEl.value = getDisplayName(user);
      providerValueEl.textContent = getProviderLabel(getProvider(user));
      createdValueEl.textContent = formatMemberSince(user);
      lastSigninValueEl.textContent = formatLastSignIn(user);
    }
```

- [ ] **Step 4: Agregar los listeners de avatar y nombre**

Agregar justo después del listener `clearBtn.addEventListener(...)` existente (antes de `async function init()`):

```typescript
    avatarBtn.addEventListener('click', () => avatarFileEl.click());

    avatarFileEl.addEventListener('change', async () => {
      const file = avatarFileEl.files?.[0];
      if (!file || !currentUser) return;

      avatarBtn.disabled = true;
      avatarBtn.textContent = 'Subiendo…';
      avatarMsg.classList.add('hidden');

      try {
        const url = await uploadAvatarPhoto(file, currentUser.id);
        const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
        if (error) throw error;
        if (data.user) {
          currentUser = data.user;
          renderAvatar(currentUser);
        }
      } catch (err) {
        avatarMsg.textContent = err instanceof Error ? err.message : 'No se pudo subir la foto.';
        avatarMsg.className = 'mt-1 text-xs text-red-400';
        avatarMsg.classList.remove('hidden');
      } finally {
        avatarBtn.disabled = false;
        avatarBtn.textContent = 'Cambiar foto';
        avatarFileEl.value = '';
      }
    });

    nameSaveBtn.addEventListener('click', async () => {
      const name = displayNameEl.value.trim();
      nameMsg.classList.add('hidden');
      if (!name) {
        nameMsg.textContent = 'Ingresá un nombre válido.';
        nameMsg.className = 'mt-1 text-xs text-red-400';
        nameMsg.classList.remove('hidden');
        return;
      }

      nameSaveBtn.disabled = true;
      try {
        await updateDisplayName(name);
        nameMsg.textContent = '✓ Guardado.';
        nameMsg.className = 'mt-1 text-xs text-green-400';
        nameMsg.classList.remove('hidden');
      } catch (err) {
        nameMsg.textContent = err instanceof Error ? err.message : 'No se pudo guardar el nombre.';
        nameMsg.className = 'mt-1 text-xs text-red-400';
        nameMsg.classList.remove('hidden');
      } finally {
        nameSaveBtn.disabled = false;
      }
    });
```

- [ ] **Step 5: Actualizar `init()`**

Cambiar:

```typescript
    async function init() {
      const user = await requireAuth();
      if (!user) return;
      userEmailEl.textContent = user.email ?? '—';
      logoutBtn.addEventListener('click', () => signOut());
      refreshStatus();
    }
```

por:

```typescript
    async function init() {
      currentUser = await requireAuth();
      if (!currentUser) return;
      renderAccount(currentUser);
      logoutBtn.addEventListener('click', () => signOut());
      refreshStatus();
    }
```

- [ ] **Step 6: Build y type-check**

```bash
cd plantopia && npm run build 2>&1 | tail -10
npm run check
```

Expected: build exitoso (8 páginas), `npm run check` con 0 errores.

- [ ] **Step 7: Correr la suite completa**

```bash
npm test
```

Expected: todos los tests pasan (`settings.astro` no tiene tests propios — consistente con que ninguna página `.astro` los tiene en este repo — pero confirma que no se rompió nada en `lib/`).

- [ ] **Step 8: Commit**

```bash
git add plantopia/src/pages/settings.astro
git commit -m "feat: editable profile (name, avatar) and account details in settings"
```

---

### Task 6: Verificación manual en el navegador

**Files:** ninguno — solo verificación, sin cambios de código.

- [ ] **Step 1: Levantar el dev server**

```bash
cd plantopia && astro dev --background
```

- [ ] **Step 2: Probar el flujo completo logueada**

Con una sesión ya iniciada (Google o email/contraseña):
1. Ir a `/dashboard` → confirmar que aparece la fila de usuario arriba de las stats, con avatar/inicial, nombre y método correctos.
2. Tocar la fila → confirmar que navega a `/settings`.
3. En `/settings`, confirmar que la sección "Cuenta" muestra avatar, nombre editable, método, "Miembro desde" y "Último acceso" con valores razonables.
4. Cambiar el nombre y guardar → confirmar mensaje "✓ Guardado." y que persiste tras recargar la página.
5. Si hay una foto a mano, usar "Cambiar foto" → confirmar que sube y el avatar se actualiza sin recargar (requiere que el bucket `avatar-photos` exista de verdad en el proyecto de Supabase — ver nota en Task 3).
6. Volver a `/dashboard` → confirmar que el nombre/avatar nuevos se reflejan ahí también.

- [ ] **Step 3: Parar el dev server**

```bash
astro dev stop
```

No hay commit en este task — es solo verificación exploratoria antes de dar la tarea por terminada.

---

## Checklist de spec coverage

| Requisito del spec | Task |
|---|---|
| `lib/user-display.ts` — `getProvider`, `getDisplayName`, `getAvatarUrl`, `getInitial`, `getProviderLabel`, `formatMemberSince`, `formatLastSignIn` | Task 1 |
| `lib/profile.ts` — `updateDisplayName`, `uploadAvatarPhoto` | Task 2 |
| Bucket `avatar-photos` documentado | Task 3 |
| Dashboard: fila de resumen clickeable hacia `/settings` | Task 4 |
| Ajustes: avatar editable ("Cambiar foto", sube inmediatamente al elegir archivo) | Task 5, Step 4 |
| Ajustes: nombre editable con botón "Guardar" separado, validación de vacío | Task 5, Step 4 |
| Ajustes: método de acceso / miembro desde / último acceso (solo lectura) | Task 5, Steps 1 y 3 |
| Ajustes: "Cerrar sesión" se mantiene sin cambio de comportamiento | Task 5, Step 5 (sin cambios funcionales, solo reubicado en el markup del Step 1) |
| Avatar/`avatar_url` con esquema no-https se ignora (fallback a inicial) | Task 1 (`getAvatarUrl`), cubierto por test |
| Fechas ausentes/inválidas devuelven "—" | Task 1 (`formatRelativeDate`), cubierto por test |
| Dashboard refleja cambios de perfil sin lógica extra (mismos campos de `user_metadata`) | Task 4 + Task 5 — ambos leen del mismo `user_metadata.full_name`/`avatar_url` que Task 5 escribe |
| `npm run check` obligatorio antes de cerrar tareas `.astro` | Tasks 4 y 5, Step de build/check |
| Sin tests de `.astro` (convención del repo) | Tasks 4 y 5 (sin archivos de test para las páginas) |
| Fuera de alcance: amigos/perfiles públicos, cambio de email/contraseña, borrar cuenta, crop de foto | No implementado en este plan (correcto — es el Proyecto 2, spec aparte) |
