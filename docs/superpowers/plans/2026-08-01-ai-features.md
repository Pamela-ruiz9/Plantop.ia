# AI Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar identificación de plantas por foto y chat de cuidados con IA configurable por el usuario (Claude, GPT-4o, Gemini), con navegación inferior de 3 tabs.

**Architecture:** Todo client-side. La key de IA se guarda en `localStorage`. Los datos de identificación pasan de `/identify` a `/plants/new` via `sessionStorage`. No hay cambios en Supabase ni backend nuevo. Las llamadas a la IA van directo desde el browser con `fetch` nativo.

**Tech Stack:** Astro 7 static, TypeScript 5.8, Tailwind v4, Vitest 4 + happy-dom. APIs: Anthropic Messages API, OpenAI Chat Completions, Google Gemini generateContent.

---

## File map

**Nuevos:**
- `plantopia/src/lib/ai.ts` — tipos, settings helpers, identifyPlantFromImage, chatAboutPlant, chat history
- `plantopia/src/lib/ai.test.ts` — unit tests de ai.ts
- `plantopia/src/components/BottomNav.astro` — barra de navegación inferior
- `plantopia/src/pages/settings.astro` — configuración de proveedor y key
- `plantopia/src/pages/identify.astro` — identificación de planta por foto

**Modificados:**
- `plantopia/src/layouts/Layout.astro` — `pb-16` en body para que no tape la barra inferior
- `plantopia/src/lib/plant-form.ts` — agregar `fillFormFromAI(form, identification)`
- `plantopia/src/pages/index.astro` — agregar `<BottomNav>`, quitar email/logout del header
- `plantopia/src/pages/plants/new.astro` — leer sessionStorage al cargar y pre-llenar si hay identificación de IA
- `plantopia/src/pages/plants/detail.astro` — agregar sección de chat al final

---

### Task 1: ai.ts — tipos y settings helpers

**Files:**
- Create: `plantopia/src/lib/ai.ts`
- Create: `plantopia/src/lib/ai.test.ts`

El stack de tests usa Vitest + happy-dom (localStorage disponible). Los imports de vi/describe/it/expect vienen de `'vitest'`.

- [ ] **Step 1: Escribir los tests que fallan**

```typescript
// plantopia/src/lib/ai.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getAISettings, saveAISettings, clearAISettings } from './ai';

describe('AI settings', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when not configured', () => {
    expect(getAISettings()).toBeNull();
  });

  it('saveAISettings + getAISettings round-trip for anthropic', () => {
    saveAISettings({ provider: 'anthropic', key: 'sk-ant-test' });
    expect(getAISettings()).toEqual({ provider: 'anthropic', key: 'sk-ant-test' });
  });

  it('saveAISettings + getAISettings round-trip for gemini', () => {
    saveAISettings({ provider: 'gemini', key: 'AItest' });
    expect(getAISettings()).toEqual({ provider: 'gemini', key: 'AItest' });
  });

  it('clearAISettings removes settings', () => {
    saveAISettings({ provider: 'openai', key: 'sk-test' });
    clearAISettings();
    expect(getAISettings()).toBeNull();
  });

  it('getAISettings returns null if provider missing', () => {
    localStorage.setItem('plantopia_ai_key', 'somekey');
    expect(getAISettings()).toBeNull();
  });

  it('getAISettings returns null if key missing', () => {
    localStorage.setItem('plantopia_ai_provider', 'openai');
    expect(getAISettings()).toBeNull();
  });
});
```

- [ ] **Step 2: Correr los tests — deben fallar**

```bash
cd plantopia && npm test -- src/lib/ai.test.ts
```

Expected: `Cannot find module './ai'`

- [ ] **Step 3: Crear ai.ts con tipos y settings helpers**

```typescript
// plantopia/src/lib/ai.ts

export type AIProvider = 'anthropic' | 'openai' | 'gemini';

export interface AISettings {
  provider: AIProvider;
  key: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PlantIdentification {
  common_name: string;
  popular_name?: string;
  scientific_name?: string;
  light_type?: 'direct' | 'bright_indirect' | 'low_indirect';
  light_hours_per_day?: number;
  watering_frequency_days?: number;
  substrate_mix?: string;
  substrate_ph?: number;
  fertilizing_frequency_days?: number;
  description?: string;
}

const PROVIDER_KEY = 'plantopia_ai_provider';
const API_KEY_KEY = 'plantopia_ai_key';

export function getAISettings(): AISettings | null {
  const provider = localStorage.getItem(PROVIDER_KEY) as AIProvider | null;
  const key = localStorage.getItem(API_KEY_KEY);
  if (!provider || !key) return null;
  return { provider, key };
}

export function saveAISettings(settings: AISettings): void {
  localStorage.setItem(PROVIDER_KEY, settings.provider);
  localStorage.setItem(API_KEY_KEY, settings.key);
}

export function clearAISettings(): void {
  localStorage.removeItem(PROVIDER_KEY);
  localStorage.removeItem(API_KEY_KEY);
}
```

- [ ] **Step 4: Correr los tests — deben pasar**

```bash
npm test -- src/lib/ai.test.ts
```

Expected: todos en verde

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/ai.ts plantopia/src/lib/ai.test.ts
git commit -m "feat: ai.ts types and settings helpers with tests"
```

---

### Task 2: ai.ts — identifyPlantFromImage

**Files:**
- Modify: `plantopia/src/lib/ai.ts`
- Modify: `plantopia/src/lib/ai.test.ts`

`parseIdentification` se exporta solo para ser testeable; `fileToBase64` y `callVisionAI` son internas.

- [ ] **Step 1: Agregar tests de parseIdentification**

```typescript
// Agregar al final de plantopia/src/lib/ai.test.ts:
import { parseIdentification } from './ai';

describe('parseIdentification', () => {
  it('parses valid JSON', () => {
    const text = '{"common_name":"Monstera","scientific_name":"Monstera deliciosa"}';
    const result = parseIdentification(text);
    expect(result.common_name).toBe('Monstera');
    expect(result.scientific_name).toBe('Monstera deliciosa');
  });

  it('strips markdown code blocks', () => {
    const text = '```json\n{"common_name":"Pothos"}\n```';
    expect(parseIdentification(text).common_name).toBe('Pothos');
  });

  it('strips plain code blocks', () => {
    const text = '```\n{"common_name":"Helechos"}\n```';
    expect(parseIdentification(text).common_name).toBe('Helechos');
  });

  it('throws if JSON is invalid', () => {
    expect(() => parseIdentification('no es json')).toThrow('No se pudo identificar la planta.');
  });

  it('throws if common_name is missing', () => {
    expect(() => parseIdentification('{"scientific_name":"test"}')).toThrow('No se pudo identificar la planta.');
  });

  it('throws on empty string', () => {
    expect(() => parseIdentification('')).toThrow('No se pudo identificar la planta.');
  });
});
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- src/lib/ai.test.ts
```

Expected: `parseIdentification is not a function`

- [ ] **Step 3: Implementar parseIdentification, fileToBase64, callVisionAI, identifyPlantFromImage en ai.ts**

Agregar al final de `plantopia/src/lib/ai.ts`:

```typescript
const IDENTIFY_PROMPT = `Identificá esta planta. Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con estos campos (omitir los que no sepas con certeza):
{
  "common_name": "nombre común en español",
  "popular_name": "apodo popular en español",
  "scientific_name": "nombre científico",
  "light_type": "direct" | "bright_indirect" | "low_indirect",
  "light_hours_per_day": número,
  "watering_frequency_days": número,
  "substrate_mix": "descripción del sustrato en español",
  "substrate_ph": número decimal,
  "fertilizing_frequency_days": número,
  "description": "una oración descriptiva en español"
}`;

export function parseIdentification(text: string): PlantIdentification {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('No se pudo identificar la planta.');
  }
  if (typeof parsed !== 'object' || parsed === null || !('common_name' in parsed)) {
    throw new Error('No se pudo identificar la planta.');
  }
  return parsed as PlantIdentification;
}

function mapHttpError(status: number): string {
  if (status === 401 || status === 403) return 'Key incorrecta. Verificá tu configuración en Ajustes.';
  if (status === 429) return 'Límite de la API alcanzado. Esperá un momento.';
  return `Error del servidor (${status}). Intentá de nuevo.`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Error al leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

async function callVisionAI(
  settings: AISettings,
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const { provider, key } = settings;

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(mapHttpError(res.status));
    const data = await res.json();
    return (data.content[0].text as string);
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(mapHttpError(res.status));
    const data = await res.json();
    return (data.choices[0].message.content as string);
  }

  // gemini
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
      }),
    },
  );
  if (!res.ok) throw new Error(mapHttpError(res.status));
  const data = await res.json();
  return (data.candidates[0].content.parts[0].text as string);
}

export async function identifyPlantFromImage(file: File): Promise<PlantIdentification> {
  const settings = getAISettings();
  if (!settings) throw new Error('No hay IA configurada. Configurá tu proveedor en Ajustes.');
  try {
    const base64 = await fileToBase64(file);
    const text = await callVisionAI(settings, base64, file.type, IDENTIFY_PROMPT);
    return parseIdentification(text);
  } catch (err) {
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Sin conexión. Verificá tu internet.');
    }
    throw err;
  }
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- src/lib/ai.test.ts
```

Expected: todos en verde

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/ai.ts plantopia/src/lib/ai.test.ts
git commit -m "feat: identifyPlantFromImage with 3-provider support"
```

---

### Task 3: ai.ts — chatAboutPlant y chat history helpers

**Files:**
- Modify: `plantopia/src/lib/ai.ts`
- Modify: `plantopia/src/lib/ai.test.ts`

- [ ] **Step 1: Agregar tests de chat history**

```typescript
// Agregar al final de plantopia/src/lib/ai.test.ts:
import { getChatHistory, saveChatHistory, clearChatHistory } from './ai';

describe('chat history', () => {
  beforeEach(() => localStorage.clear());

  it('getChatHistory returns [] when no history', () => {
    expect(getChatHistory('plant-abc')).toEqual([]);
  });

  it('saveChatHistory + getChatHistory round-trip', () => {
    const messages: Message[] = [{ role: 'user', content: 'Hola' }];
    saveChatHistory('plant-abc', messages);
    expect(getChatHistory('plant-abc')).toEqual(messages);
  });

  it('saveChatHistory truncates to last 20 messages', () => {
    const messages: Message[] = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
    }));
    saveChatHistory('plant-abc', messages);
    const saved = getChatHistory('plant-abc');
    expect(saved).toHaveLength(20);
    expect(saved[0].content).toBe('msg 5');
    expect(saved[19].content).toBe('msg 24');
  });

  it('clearChatHistory removes history', () => {
    saveChatHistory('plant-abc', [{ role: 'user', content: 'test' }]);
    clearChatHistory('plant-abc');
    expect(getChatHistory('plant-abc')).toEqual([]);
  });

  it('getChatHistory ignores history of other plants', () => {
    saveChatHistory('plant-abc', [{ role: 'user', content: 'test' }]);
    expect(getChatHistory('plant-xyz')).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npm test -- src/lib/ai.test.ts
```

Expected: `getChatHistory is not a function`

- [ ] **Step 3: Implementar chat history helpers y chatAboutPlant en ai.ts**

Agregar al final de `plantopia/src/lib/ai.ts`:

```typescript
const CHAT_PREFIX = 'plantopia_chat_';
const CHAT_MAX = 20;

export function getChatHistory(plantId: string): Message[] {
  const raw = localStorage.getItem(`${CHAT_PREFIX}${plantId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export function saveChatHistory(plantId: string, messages: Message[]): void {
  const trimmed = messages.slice(-CHAT_MAX);
  localStorage.setItem(`${CHAT_PREFIX}${plantId}`, JSON.stringify(trimmed));
}

export function clearChatHistory(plantId: string): void {
  localStorage.removeItem(`${CHAT_PREFIX}${plantId}`);
}

async function callChatAI(
  settings: AISettings,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const { provider, key } = settings;

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(mapHttpError(res.status));
    const data = await res.json();
    return (data.content[0].text as string);
  }

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) throw new Error(mapHttpError(res.status));
    const data = await res.json();
    return (data.choices[0].message.content as string);
  }

  // gemini — usa 'model' en lugar de 'assistant'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      }),
    },
  );
  if (!res.ok) throw new Error(mapHttpError(res.status));
  const data = await res.json();
  return (data.candidates[0].content.parts[0].text as string);
}

export async function chatAboutPlant(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
): Promise<string> {
  const settings = getAISettings();
  if (!settings) throw new Error('No hay IA configurada.');
  const messages: Message[] = [...history, { role: 'user', content: userMessage }];
  try {
    return await callChatAI(settings, systemPrompt, messages);
  } catch (err) {
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Sin conexión. Verificá tu internet.');
    }
    throw err;
  }
}
```

- [ ] **Step 4: Correr todos los tests**

```bash
npm test -- src/lib/ai.test.ts
```

Expected: todos en verde

- [ ] **Step 5: Commit**

```bash
git add plantopia/src/lib/ai.ts plantopia/src/lib/ai.test.ts
git commit -m "feat: chatAboutPlant, chat history helpers with tests"
```

---

### Task 4: BottomNav component + Layout.astro padding

**Files:**
- Create: `plantopia/src/components/BottomNav.astro`
- Modify: `plantopia/src/layouts/Layout.astro`

- [ ] **Step 1: Crear BottomNav.astro**

```astro
---
// plantopia/src/components/BottomNav.astro
interface Props {
  active: 'collection' | 'identify' | 'settings';
}
const { active } = Astro.props;
const base = import.meta.env.BASE_URL;

const tabs = [
  { id: 'collection', href: base,                  icon: '🌿', label: 'Mi colección' },
  { id: 'identify',   href: `${base}identify`,     icon: '🔍', label: 'Identificar'  },
  { id: 'settings',  href: `${base}settings`,     icon: '⚙️', label: 'Ajustes'      },
] as const;
---

<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900">
  <div class="mx-auto flex max-w-3xl">
    {tabs.map((tab) => (
      <a
        href={tab.href}
        class={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition ${
          active === tab.id
            ? 'text-green-400'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span class="text-xl leading-none">{tab.icon}</span>
        <span>{tab.label}</span>
      </a>
    ))}
  </div>
</nav>
```

- [ ] **Step 2: Agregar pb-16 al body en Layout.astro**

En `plantopia/src/layouts/Layout.astro`, cambiar:

```astro
  <body class="bg-slate-950 text-slate-100 min-h-screen">
```

por:

```astro
  <body class="bg-slate-950 text-slate-100 min-h-screen pb-16">
```

- [ ] **Step 3: Correr build para verificar que compila**

```bash
cd plantopia && npm run build 2>&1 | tail -5
```

Expected: `5 page(s) built` sin errores

- [ ] **Step 4: Commit**

```bash
git add plantopia/src/components/BottomNav.astro plantopia/src/layouts/Layout.astro
git commit -m "feat: BottomNav component and body bottom padding"
```

---

### Task 5: settings.astro + limpiar index.astro

**Files:**
- Create: `plantopia/src/pages/settings.astro`
- Modify: `plantopia/src/pages/index.astro`

En settings.astro se mueven el email del usuario y el botón de logout que actualmente viven en index.astro.

- [ ] **Step 1: Crear settings.astro**

```astro
---
// plantopia/src/pages/settings.astro
import Layout from '../layouts/Layout.astro';
import BottomNav from '../components/BottomNav.astro';
import '../styles/global.css';
---

<Layout title="Plantopia — Ajustes">
  <main class="mx-auto min-h-screen max-w-lg px-4 py-8">
    <h1 class="mb-6 text-xl font-semibold">Ajustes</h1>

    <!-- Sección IA -->
    <section class="mb-8">
      <h2 class="mb-3 text-sm font-medium text-slate-300">Proveedor de IA</h2>
      <p id="ai-status" class="mb-4 text-sm text-slate-400">Sin configurar</p>

      <div class="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <label for="ai-provider" class="mb-1 block text-xs text-slate-400">Proveedor</label>
          <select
            id="ai-provider"
            class="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="gemini">Gemini 1.5 Flash (Google — gratis)</option>
          </select>
        </div>

        <div>
          <label for="ai-key" class="mb-1 block text-xs text-slate-400">API Key</label>
          <div class="flex gap-2">
            <input
              id="ai-key"
              type="password"
              placeholder="Pegá tu key acá"
              class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
            />
            <button
              id="toggle-key"
              type="button"
              class="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              👁
            </button>
          </div>
          <a id="key-help-link" href="#" target="_blank" rel="noopener"
            class="mt-1 inline-block text-xs text-green-500 hover:text-green-400">
            ¿Dónde consigo mi key?
          </a>
        </div>

        <div class="flex gap-3">
          <button
            id="save-btn"
            type="button"
            class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
          >
            Guardar
          </button>
          <button
            id="clear-btn"
            type="button"
            class="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white"
          >
            Borrar configuración
          </button>
        </div>

        <p id="save-message" class="hidden text-sm"></p>
      </div>
    </section>

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
  </main>

  <BottomNav active="settings" />

  <script>
    import { requireAuth, signOut } from '../lib/session';
    import { getAISettings, saveAISettings, clearAISettings, type AIProvider } from '../lib/ai';

    const KEY_HELP: Record<AIProvider, { url: string; label: string }> = {
      anthropic: { url: 'https://console.anthropic.com/', label: 'Obtener key en Anthropic Console' },
      openai:    { url: 'https://platform.openai.com/api-keys', label: 'Obtener key en OpenAI Platform' },
      gemini:    { url: 'https://aistudio.google.com/apikey', label: 'Obtener key gratis en Google AI Studio' },
    };

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

    function updateHelpLink() {
      const provider = providerEl.value as AIProvider;
      const info = KEY_HELP[provider];
      helpLinkEl.href = info.url;
      helpLinkEl.textContent = info.label;
    }

    function refreshStatus() {
      const s = getAISettings();
      if (s) {
        const names: Record<AIProvider, string> = {
          anthropic: 'Claude (Anthropic)',
          openai: 'GPT-4o (OpenAI)',
          gemini: 'Gemini 1.5 Flash',
        };
        statusEl.textContent = `✓ Configurado: ${names[s.provider]}`;
        statusEl.className = 'mb-4 text-sm text-green-400';
        providerEl.value = s.provider;
      } else {
        statusEl.textContent = 'Sin configurar';
        statusEl.className = 'mb-4 text-sm text-slate-400';
      }
      updateHelpLink();
    }

    providerEl.addEventListener('change', updateHelpLink);

    toggleEl.addEventListener('click', () => {
      keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
    });

    saveBtn.addEventListener('click', () => {
      const key = keyEl.value.trim();
      if (!key) {
        saveMsg.textContent = 'Ingresá una key válida.';
        saveMsg.className = 'text-sm text-red-400';
        saveMsg.classList.remove('hidden');
        return;
      }
      saveAISettings({ provider: providerEl.value as AIProvider, key });
      keyEl.value = '';
      saveMsg.textContent = '✓ Guardado.';
      saveMsg.className = 'text-sm text-green-400';
      saveMsg.classList.remove('hidden');
      refreshStatus();
    });

    clearBtn.addEventListener('click', () => {
      clearAISettings();
      keyEl.value = '';
      saveMsg.textContent = 'Configuración borrada.';
      saveMsg.className = 'text-sm text-slate-400';
      saveMsg.classList.remove('hidden');
      refreshStatus();
    });

    async function init() {
      const user = await requireAuth();
      if (!user) return;
      userEmailEl.textContent = user.email ?? '—';
      logoutBtn.addEventListener('click', () => signOut());
      refreshStatus();
    }

    init();
  </script>
</Layout>
```

- [ ] **Step 2: Limpiar index.astro — quitar email/logout del header, agregar BottomNav**

En `plantopia/src/pages/index.astro`:

1. Agregar import de BottomNav después de los otros imports en el frontmatter:
   ```astro
   import BottomNav from '../components/BottomNav.astro';
   ```

2. Reemplazar el header completo:
   ```html
   <!-- ANTES -->
   <header class="mb-8 flex items-center justify-between">
     <div class="flex items-center gap-2">
       <span class="text-2xl">🌿</span>
       <h1 class="text-xl font-semibold">Plantopia</h1>
     </div>
     <div class="flex items-center gap-3">
       <span id="user-email" class="hidden text-sm text-slate-400 sm:inline"></span>
       <button
         id="logout-btn"
         type="button"
         class="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
       >
         Salir
       </button>
     </div>
   </header>
   ```
   ```html
   <!-- DESPUÉS -->
   <header class="mb-8 flex items-center gap-2">
     <span class="text-2xl">🌿</span>
     <h1 class="text-xl font-semibold">Plantopia</h1>
   </header>
   ```

3. Agregar `<BottomNav active="collection" />` justo antes de `</Layout>` (después del cierre de `</main>`).

4. En el `<script>` de index.astro, borrar:
   - La importación de `signOut` (si queda sin usar)
   - La línea `const userEmailEl = document.getElementById('user-email')!;`
   - La línea `const logoutBtn = document.getElementById('logout-btn')!;`
   - La línea `logoutBtn.addEventListener('click', () => signOut());`
   - Las líneas `userEmailEl.textContent = user.email ?? '';` y `userEmailEl.classList.remove('hidden');`

- [ ] **Step 3: Build para verificar que compila sin errores**

```bash
npm run build 2>&1 | tail -8
```

Expected: `6 page(s) built` (nueva página settings) sin errores TypeScript

- [ ] **Step 4: Commit**

```bash
git add plantopia/src/pages/settings.astro plantopia/src/pages/index.astro
git commit -m "feat: settings page with AI config; move logout from index"
```

---

### Task 6: identify.astro

**Files:**
- Create: `plantopia/src/pages/identify.astro`

- [ ] **Step 1: Crear identify.astro**

```astro
---
// plantopia/src/pages/identify.astro
import Layout from '../../layouts/Layout.astro';
import BottomNav from '../../components/BottomNav.astro';
import '../../styles/global.css';
---
```

Espera — `identify.astro` es una página raíz, no dentro de `plants/`. Ruta correcta: `plantopia/src/pages/identify.astro`.

```astro
---
// plantopia/src/pages/identify.astro
import Layout from '../layouts/Layout.astro';
import BottomNav from '../components/BottomNav.astro';
import '../styles/global.css';
---

<Layout title="Plantopia — Identificar planta">
  <main class="mx-auto min-h-screen max-w-lg px-4 py-8">
    <h1 class="mb-2 text-xl font-semibold">Identificar planta</h1>
    <p class="mb-6 text-sm text-slate-400">Subí una foto y la IA identificará la planta y pre-llenará el formulario.</p>

    <!-- Estado: sin IA -->
    <div id="no-ai" class="hidden rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
      <p class="mb-4 text-sm text-slate-400">Configurá tu proveedor de IA para usar esta función.</p>
      <a
        href={`${import.meta.env.BASE_URL}settings`}
        class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
      >
        Ir a Ajustes
      </a>
    </div>

    <!-- Estado: con IA -->
    <div id="with-ai" class="hidden flex flex-col gap-5">

      <!-- Upload -->
      <div id="upload-section">
        <div id="photo-preview-container" class="hidden mb-3">
          <img
            id="photo-preview"
            src=""
            alt="Vista previa"
            class="h-52 w-full rounded-xl border border-slate-700 object-cover"
          />
          <button
            id="change-photo"
            type="button"
            class="mt-2 text-xs text-slate-400 hover:text-slate-200"
          >
            Cambiar foto
          </button>
        </div>

        <label
          id="upload-label"
          for="photo-input"
          class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-600 px-4 py-12 text-center transition hover:border-slate-400"
        >
          <span class="text-4xl">📷</span>
          <span class="text-sm text-slate-400">Tocá para subir una foto de tu planta</span>
        </label>
        <input id="photo-input" type="file" accept="image/*" class="sr-only" />
      </div>

      <button
        id="identify-btn"
        type="button"
        disabled
        class="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Identificar planta
      </button>

      <p id="identify-error" class="hidden rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300"></p>

      <!-- Resultado -->
      <div id="result-card" class="hidden rounded-xl border border-green-900 bg-green-950 p-4">
        <p class="mb-1 text-xs text-green-400">✓ Planta identificada</p>
        <h2 id="result-name" class="text-lg font-semibold text-slate-100"></h2>
        <p id="result-popular" class="text-sm text-slate-400"></p>
        <p id="result-scientific" class="mt-0.5 text-xs italic text-slate-500"></p>
        <p id="result-description" class="mt-3 text-sm text-slate-300"></p>
        <button
          id="add-plant-btn"
          type="button"
          class="mt-4 w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500"
        >
          Agregar planta →
        </button>
      </div>

    </div>
  </main>

  <BottomNav active="identify" />

  <script>
    import { requireAuth } from '../lib/session';
    import { getAISettings, identifyPlantFromImage, type PlantIdentification } from '../lib/ai';

    const noAiEl        = document.getElementById('no-ai')!;
    const withAiEl      = document.getElementById('with-ai')!;
    const photoInput    = document.getElementById('photo-input') as HTMLInputElement;
    const previewCont   = document.getElementById('photo-preview-container')!;
    const previewImg    = document.getElementById('photo-preview') as HTMLImageElement;
    const uploadLabel   = document.getElementById('upload-label')!;
    const changePhotoBtn= document.getElementById('change-photo')!;
    const identifyBtn   = document.getElementById('identify-btn') as HTMLButtonElement;
    const errorEl       = document.getElementById('identify-error')!;
    const resultCard    = document.getElementById('result-card')!;
    const resultName    = document.getElementById('result-name')!;
    const resultPopular = document.getElementById('result-popular')!;
    const resultScientific = document.getElementById('result-scientific')!;
    const resultDesc    = document.getElementById('result-description')!;
    const addPlantBtn   = document.getElementById('add-plant-btn') as HTMLButtonElement;

    let currentFile: File | null = null;
    let lastIdentification: PlantIdentification | null = null;

    function showPreview(file: File) {
      previewImg.src = URL.createObjectURL(file);
      previewCont.classList.remove('hidden');
      uploadLabel.classList.add('hidden');
      identifyBtn.disabled = false;
      resultCard.classList.add('hidden');
      errorEl.classList.add('hidden');
    }

    function resetUpload() {
      currentFile = null;
      photoInput.value = '';
      previewImg.src = '';
      previewCont.classList.add('hidden');
      uploadLabel.classList.remove('hidden');
      identifyBtn.disabled = true;
      resultCard.classList.add('hidden');
      errorEl.classList.add('hidden');
    }

    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      currentFile = file;
      showPreview(file);
    });

    changePhotoBtn.addEventListener('click', () => resetUpload());

    identifyBtn.addEventListener('click', async () => {
      if (!currentFile) return;
      identifyBtn.disabled = true;
      identifyBtn.textContent = 'Identificando…';
      errorEl.classList.add('hidden');
      resultCard.classList.add('hidden');

      try {
        const result = await identifyPlantFromImage(currentFile);
        lastIdentification = result;

        resultName.textContent = result.common_name;
        resultPopular.textContent = result.popular_name ? `"${result.popular_name}"` : '';
        resultScientific.textContent = result.scientific_name ?? '';
        resultDesc.textContent = result.description ?? '';
        resultCard.classList.remove('hidden');
      } catch (err) {
        errorEl.textContent = err instanceof Error ? err.message : 'Error al identificar la planta.';
        errorEl.classList.remove('hidden');
      } finally {
        identifyBtn.disabled = false;
        identifyBtn.textContent = 'Identificar planta';
      }
    });

    addPlantBtn.addEventListener('click', () => {
      if (!lastIdentification) return;
      sessionStorage.setItem('plantopia_ai_identification', JSON.stringify(lastIdentification));
      window.location.href = `${import.meta.env.BASE_URL}plants/new`;
    });

    async function init() {
      const user = await requireAuth();
      if (!user) return;

      const settings = getAISettings();
      if (!settings) {
        noAiEl.classList.remove('hidden');
      } else {
        withAiEl.classList.remove('hidden');
      }
    }

    init();
  </script>
</Layout>
```

- [ ] **Step 2: Build para verificar**

```bash
npm run build 2>&1 | tail -6
```

Expected: `7 page(s) built` sin errores

- [ ] **Step 3: Commit**

```bash
git add plantopia/src/pages/identify.astro
git commit -m "feat: identify page with AI plant identification flow"
```

---

### Task 7: plant-form.ts (fillFormFromAI) + new.astro (pre-llenado desde sessionStorage)

**Files:**
- Modify: `plantopia/src/lib/plant-form.ts`
- Modify: `plantopia/src/lib/plant-form.test.ts`
- Modify: `plantopia/src/pages/plants/new.astro`

`fillFormFromCatalog` usa `catalog.substrate_ph_min` pero `PlantIdentification` tiene `substrate_ph`. Se agrega `fillFormFromAI` para mapear correctamente sin casts.

- [ ] **Step 1: Agregar test de fillFormFromAI**

```typescript
// Agregar al final de plantopia/src/lib/plant-form.test.ts
// (buscar el bloque describe existente y agregar después)
import { fillFormFromAI } from './plant-form';
import type { PlantIdentification } from './ai';

describe('fillFormFromAI', () => {
  function makeForm(): HTMLFormElement {
    document.body.innerHTML = `
      <form id="f">
        <input name="common_name" />
        <input name="species" />
        <input name="light_type" />
        <input name="light_hours_per_day" />
        <input name="watering_frequency_days" />
        <input name="substrate_mix" />
        <input name="substrate_ph" />
        <input name="fertilizing_frequency_days" />
        <input name="species_id" />
      </form>`;
    return document.getElementById('f') as HTMLFormElement;
  }

  it('fills form fields from PlantIdentification', () => {
    const form = makeForm();
    const id: PlantIdentification = {
      common_name: 'Monstera',
      popular_name: 'Costilla de Adán',
      scientific_name: 'Monstera deliciosa',
      light_type: 'bright_indirect',
      light_hours_per_day: 6,
      watering_frequency_days: 10,
      substrate_mix: 'tierra negra + perlita',
      substrate_ph: 6.0,
      fertilizing_frequency_days: 30,
    };
    fillFormFromAI(form, id);
    const val = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value;
    expect(val('common_name')).toBe('Costilla de Adán'); // popular_name tiene prioridad
    expect(val('species')).toBe('Monstera deliciosa');
    expect(val('light_type')).toBe('bright_indirect');
    expect(val('light_hours_per_day')).toBe('6');
    expect(val('watering_frequency_days')).toBe('10');
    expect(val('substrate_mix')).toBe('tierra negra + perlita');
    expect(val('substrate_ph')).toBe('6');
    expect(val('fertilizing_frequency_days')).toBe('30');
    expect(val('species_id')).toBe(''); // no linkea al catálogo
  });

  it('uses common_name when popular_name is absent', () => {
    const form = makeForm();
    fillFormFromAI(form, { common_name: 'Pothos' });
    expect((form.elements.namedItem('common_name') as HTMLInputElement).value).toBe('Pothos');
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
npm test -- src/lib/plant-form.test.ts
```

Expected: `fillFormFromAI is not a function`

- [ ] **Step 3: Agregar fillFormFromAI a plant-form.ts**

Agregar al final de `plantopia/src/lib/plant-form.ts`:

```typescript
import type { PlantIdentification } from './ai';

export function fillFormFromAI(form: HTMLFormElement, id: PlantIdentification): void {
  setVal(form, 'common_name', id.popular_name ?? id.common_name);
  setVal(form, 'species', id.scientific_name);
  setVal(form, 'light_type', id.light_type);
  setVal(form, 'light_hours_per_day', id.light_hours_per_day);
  setVal(form, 'watering_frequency_days', id.watering_frequency_days);
  setVal(form, 'substrate_mix', id.substrate_mix);
  setVal(form, 'substrate_ph', id.substrate_ph);
  setVal(form, 'fertilizing_frequency_days', id.fertilizing_frequency_days);
  setVal(form, 'species_id', ''); // no linkea al catálogo
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
npm test -- src/lib/plant-form.test.ts
```

Expected: todos en verde

- [ ] **Step 5: Agregar pre-llenado desde sessionStorage en new.astro**

En `plantopia/src/pages/plants/new.astro`, dentro del bloque `<script>`, agregar estos imports al inicio:

```typescript
import { fillFormFromAI } from '../../lib/plant-form';
import type { PlantIdentification } from '../../lib/ai';
```

Y al final de la función `init()`, después de `requireAuth()` y antes del `form.addEventListener('submit', ...)`:

```typescript
// Pre-llenar desde identificación de IA (viene de /identify via sessionStorage)
const aiRaw = sessionStorage.getItem('plantopia_ai_identification');
if (aiRaw) {
  sessionStorage.removeItem('plantopia_ai_identification');
  try {
    const identification = JSON.parse(aiRaw) as PlantIdentification;
    fillFormFromAI(form, identification);
    const label = document.getElementById('catalog-selected') as HTMLParagraphElement;
    label.textContent = `✓ Identificado por IA: "${identification.popular_name ?? identification.common_name}". Podés editar cualquier campo.`;
    label.classList.remove('hidden');
    (document.getElementById('catalog-search') as HTMLInputElement).value =
      identification.popular_name ?? identification.common_name;
  } catch {
    // sessionStorage corrupto — ignorar silenciosamente
  }
}
```

- [ ] **Step 6: Build completo**

```bash
npm run build 2>&1 | tail -6
```

Expected: sin errores TypeScript

- [ ] **Step 7: Commit**

```bash
git add plantopia/src/lib/plant-form.ts plantopia/src/lib/plant-form.test.ts plantopia/src/pages/plants/new.astro
git commit -m "feat: fillFormFromAI and sessionStorage pre-fill in new plant form"
```

---

### Task 8: detail.astro — sección de chat

**Files:**
- Modify: `plantopia/src/pages/plants/detail.astro`

La sección de chat se agrega como último elemento dentro de `#content`. El system prompt se construye en el script con los labels ya importados en detail.astro.

- [ ] **Step 1: Agregar HTML del chat en detail.astro**

Dentro del `<div id="content" class="hidden">`, antes del cierre `</div>`, agregar la sección de chat:

```html
<!-- Chat IA — solo visible si hay IA configurada -->
<section id="ai-chat" class="hidden mt-8">
  <h2 class="mb-3 text-lg font-medium">Consultar a la IA</h2>
  <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
    <ul id="chat-messages" class="mb-4 flex max-h-72 flex-col gap-2 overflow-y-auto"></ul>
    <p id="chat-empty" class="mb-4 text-sm text-slate-500">
      Hacé una pregunta sobre esta planta.
    </p>
    <div class="flex gap-2">
      <input
        id="chat-input"
        type="text"
        placeholder="Preguntá sobre esta planta…"
        class="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-green-500"
      />
      <button
        id="chat-send"
        type="button"
        class="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
      >
        Enviar
      </button>
    </div>
    <p id="chat-error" class="hidden mt-2 text-xs text-red-400"></p>
    <button id="chat-clear" type="button" class="mt-3 text-xs text-slate-500 hover:text-slate-300">
      Limpiar historial
    </button>
  </div>
</section>
```

- [ ] **Step 2: Agregar imports de AI en el script de detail.astro**

Al inicio del bloque `<script>` en detail.astro, agregar:

```typescript
import {
  getAISettings,
  chatAboutPlant,
  getChatHistory,
  saveChatHistory,
  clearChatHistory,
  type Message,
} from '../../lib/ai';
```

- [ ] **Step 3: Agregar lógica de chat en detail.astro**

Justo antes de `init()`, agregar las funciones helper del chat:

```typescript
function escapeHtmlChat(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderChatMessages(messages: Message[]) {
  const listEl   = document.getElementById('chat-messages') as HTMLUListElement;
  const emptyEl  = document.getElementById('chat-empty')!;
  if (messages.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = messages
    .map(
      (m) => `
      <li class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          m.role === 'user'
            ? 'bg-green-900 text-green-100'
            : 'bg-slate-800 text-slate-200'
        }">
          ${escapeHtmlChat(m.content)}
        </div>
      </li>`,
    )
    .join('');
  listEl.scrollTop = listEl.scrollHeight;
}
```

- [ ] **Step 4: Inicializar el chat dentro de loadEvents (llamada después de renderPlant)**

En la función `init()`, después de la llamada `await loadEvents(plant, id)`, agregar:

```typescript
// Chat IA
const aiSettings = getAISettings();
const chatSection = document.getElementById('ai-chat')!;
if (aiSettings) {
  chatSection.classList.remove('hidden');

  let chatHistory = getChatHistory(id);
  renderChatMessages(chatHistory);

  function buildSystemPrompt() {
    return `Sos un experto en cuidado de plantas. Respondé en español, de forma concisa y práctica.
Planta: ${plant.common_name}${plant.species ? ` (${plant.species})` : ''}
Salud: ${HEALTH_LABELS[plant.health_status ?? 'healthy']}, Fase: ${PHASE_LABELS[plant.current_phase]}
Ubicación: ${plant.location ? LOCATION_LABELS[plant.location] : '—'}, Luz: ${plant.light_type ? LIGHT_LABELS[plant.light_type] : '—'}
Riego cada ${plant.watering_frequency_days ?? '?'} días, último riego: ${plant.last_watered ?? 'desconocido'}
Última fertilización: ${plant.last_fertilized ?? 'desconocida'}
Notas: ${plant.notes ?? 'ninguna'}`;
  }

  const chatInput  = document.getElementById('chat-input') as HTMLInputElement;
  const chatSend   = document.getElementById('chat-send') as HTMLButtonElement;
  const chatError  = document.getElementById('chat-error')!;
  const chatClear  = document.getElementById('chat-clear') as HTMLButtonElement;
  const chatList   = document.getElementById('chat-messages') as HTMLUListElement;

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    chatSend.disabled = true;
    chatError.classList.add('hidden');

    const userMsg: Message = { role: 'user', content: text };
    chatHistory = [...chatHistory, userMsg];
    renderChatMessages(chatHistory);

    // burbuja de espera
    const loadingLi = document.createElement('li');
    loadingLi.className = 'flex justify-start';
    loadingLi.innerHTML = '<div class="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400">…</div>';
    chatList.appendChild(loadingLi);
    chatList.scrollTop = chatList.scrollHeight;

    try {
      const reply = await chatAboutPlant(buildSystemPrompt(), chatHistory.slice(0, -1), text);
      chatHistory = [...chatHistory, { role: 'assistant', content: reply }];
      saveChatHistory(id, chatHistory);
      renderChatMessages(chatHistory);
    } catch (err) {
      chatHistory = chatHistory.slice(0, -1); // quitar el mensaje del usuario si falló
      chatError.textContent = err instanceof Error ? err.message : 'Error al consultar la IA.';
      chatError.classList.remove('hidden');
      renderChatMessages(chatHistory);
    } finally {
      chatSend.disabled = false;
    }
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  chatClear.addEventListener('click', () => {
    clearChatHistory(id);
    chatHistory = [];
    renderChatMessages(chatHistory);
  });
}
```

- [ ] **Step 5: Build completo**

```bash
npm run build 2>&1 | tail -6
```

Expected: sin errores TypeScript, `7 page(s) built`

- [ ] **Step 6: Correr todos los tests**

```bash
npm test 2>&1 | tail -10
```

Expected: todos los tests pasan

- [ ] **Step 7: Commit y push**

```bash
git add plantopia/src/pages/plants/detail.astro
git commit -m "feat: AI chat section in plant detail"
git push origin main
```

---

## Checklist de spec coverage

| Requisito del spec | Task |
|--------------------|------|
| `getAISettings / saveAISettings / clearAISettings` | Task 1 |
| `identifyPlantFromImage` (3 proveedores) | Task 2 |
| `parseIdentification` (JSON parsing + strip markdown) | Task 2 |
| `chatAboutPlant` (3 proveedores) | Task 3 |
| `getChatHistory / saveChatHistory / clearChatHistory` (truncar a 20) | Task 3 |
| `BottomNav.astro` con prop active | Task 4 |
| `pb-16` en Layout.astro | Task 4 |
| `settings.astro` con provider selector, key input, help links, logout | Task 5 |
| `index.astro` limpio sin email/logout | Task 5 |
| `identify.astro` con upload, identificación, result card, "Agregar planta" | Task 6 |
| `fillFormFromAI` en plant-form.ts | Task 7 |
| `new.astro` lee sessionStorage y pre-llena | Task 7 |
| `detail.astro` chat con historial, enter para enviar, limpiar | Task 8 |
| Gemini `system_instruction` y `role:'model'` | Task 3 |
| Error handling (401, 429, sin conexión, JSON inválido) | Tasks 2, 3 |
