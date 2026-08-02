# AI Features — Identificación y Chat de Plantas

## Goal

Agregar IA a Plantop.ia: cada usuaria configura su propio proveedor de IA y key. La IA permite identificar una planta desde una foto (pre-llenando el formulario) y chatear sobre el estado de sus plantas.

## Architecture

Todo client-side. Sin cambios en Supabase. Sin backend nuevo.

**Storage:**
- `localStorage` para configuración de IA y historial de chat
- `sessionStorage` para pasar datos de identificación de `/identify` a `/plants/new`

**localStorage keys:**
```
plantopia_ai_provider   →  'anthropic' | 'openai' | 'gemini'
plantopia_ai_key        →  string
plantopia_chat_{plantId} →  JSON: Message[]  (últimos 20)
```

**sessionStorage key:**
```
plantopia_ai_identification  →  JSON: PlantIdentification
```

**Tech Stack:** Astro 7 static + TypeScript 5.8 + Tailwind v4. Llamadas a IA directo desde el browser usando `fetch` nativo (sin SDK).

---

## Navigation

Se agrega una barra de navegación inferior (`BottomNav.astro`) con tres tabs:

| Tab | Ruta | Ícono |
|-----|------|-------|
| Mi colección | `/Plantop.ia/` | 🌿 |
| Identificar | `/Plantop.ia/identify` | 🔍 |
| Ajustes | `/Plantop.ia/settings` | ⚙️ |

`BottomNav.astro` recibe una prop `active: 'collection' | 'identify' | 'settings'` para resaltar el tab activo.

Se agrega `<BottomNav />` en cada página principal (index, identify, settings). Las páginas de plantas (new, edit, detail) no tienen BottomNav — tienen su propio header con "← Volver".

El body en `Layout.astro` recibe `pb-16` para que el contenido no quede tapado por la barra.

---

## Files

**Nuevos:**
- `src/lib/ai.ts` — cliente de IA unificado
- `src/pages/settings.astro` — configuración de proveedor y key
- `src/pages/identify.astro` — identificación de planta por foto
- `src/components/BottomNav.astro` — barra de navegación inferior

**Modificados:**
- `src/layouts/Layout.astro` — agregar `pb-16` al body
- `src/pages/index.astro` — agregar `<BottomNav active="collection" />`; quitar email/logout del header (se mueve a settings)
- `src/pages/plants/new.astro` — leer `sessionStorage` al cargar para pre-llenar desde IA
- `src/pages/plants/detail.astro` — agregar sección de chat al final

---

## `src/lib/ai.ts`

### Types

```typescript
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
```

### Settings helpers

```typescript
const PROVIDER_KEY = 'plantopia_ai_provider';
const API_KEY_KEY  = 'plantopia_ai_key';

export function getAISettings(): AISettings | null
export function saveAISettings(settings: AISettings): void
export function clearAISettings(): void
```

### `identifyPlantFromImage(file: File): Promise<PlantIdentification>`

1. Convierte `file` a base64 con `FileReader`
2. Llama al proveedor con la imagen y este prompt:

```
Identificá esta planta. Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con estos campos (omitir los que no sepas):
{
  "common_name": "nombre en español",
  "popular_name": "apodo popular en español",
  "scientific_name": "nombre científico",
  "light_type": "direct" | "bright_indirect" | "low_indirect",
  "light_hours_per_day": número,
  "watering_frequency_days": número,
  "substrate_mix": "descripción del sustrato en español",
  "substrate_ph": número,
  "fertilizing_frequency_days": número,
  "description": "una oración descriptiva en español"
}
```

3. Parsea el JSON de la respuesta. Si falla el parse → lanza `Error('No se pudo identificar la planta.')`.
4. Valida que `common_name` existe. Si no → lanza error.

**Llamadas por proveedor:**

Anthropic:
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key, anthropic-version: 2023-06-01, anthropic-dangerous-allow-browser: true, content-type: application/json
Body: { model: 'claude-opus-4-5', max_tokens: 512,
  messages: [{ role: 'user', content: [
    { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
    { type: 'text', text: prompt }
  ]}]
}
Respuesta: data.content[0].text
```

OpenAI:
```
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer {key}, content-type: application/json
Body: { model: 'gpt-4o', max_tokens: 512,
  messages: [{ role: 'user', content: [
    { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
    { type: 'text', text: prompt }
  ]}]
}
Respuesta: data.choices[0].message.content
```

Gemini:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}
Headers: content-type: application/json
Body: { contents: [{ parts: [
    { inline_data: { mime_type: file.type, data: base64 } },
    { text: prompt }
  ]}]
}
Respuesta: data.candidates[0].content.parts[0].text
```

### `chatAboutPlant(plant: PlantWithFullCatalog, history: Message[], userMessage: string): Promise<string>`

System prompt (construido con datos de la planta):
```
Sos un experto en cuidado de plantas. Respondé en español, de forma concisa y práctica.
Planta: {common_name} ({species ?? 'especie desconocida'})
Salud: {HEALTH_LABELS[health_status]}, Fase: {PHASE_LABELS[current_phase]}
Ubicación: {LOCATION_LABELS[location] ?? '—'}, Luz: {LIGHT_LABELS[light_type] ?? '—'}
Riego cada {watering_frequency_days ?? '?'} días, último riego: {last_watered ?? 'desconocido'}
Última fertilización: {last_fertilized ?? 'desconocida'}
Notas: {notes ?? 'ninguna'}
```

Historial: los últimos 20 mensajes de `history` + el nuevo `userMessage`.

**Llamadas por proveedor:** igual que identificación pero con mensajes de texto (sin imagen).
- Anthropic: system prompt en campo `system` del body. Mensajes con `role: 'user'` / `'assistant'`.
- OpenAI: system prompt como primer mensaje `{ role: 'system', content: systemPrompt }`. Mensajes con `role: 'user'` / `'assistant'`.
- Gemini: system prompt en `system_instruction: { parts: [{ text: systemPrompt }] }` al nivel del body. Mensajes con `role: 'user'` / `'model'` (Gemini usa `'model'` en lugar de `'assistant'`).

### Chat history helpers

```typescript
const CHAT_PREFIX = 'plantopia_chat_';

export function getChatHistory(plantId: string): Message[]
export function saveChatHistory(plantId: string, messages: Message[]): void
export function clearChatHistory(plantId: string): void
```

`getChatHistory` devuelve array vacío si no existe. `saveChatHistory` guarda solo los últimos 20 mensajes.

---

## `src/components/BottomNav.astro`

Props: `active: 'collection' | 'identify' | 'settings'`

Barra fija en el fondo (`fixed bottom-0`), fondo `slate-900`, borde superior `slate-800`. Tres botones con ícono + label. El tab activo resalta en verde (`text-green-400`), los inactivos en `slate-500`.

Usa `import.meta.env.BASE_URL` para los hrefs.

---

## `src/pages/settings.astro`

Script client-side que:
1. Al cargar: lee `getAISettings()` y muestra el proveedor y estado actual (`✓ Configurado` / `Sin configurar`)
2. Formulario:
   - `<select>` con opciones: `anthropic` (Claude), `openai` (GPT-4o), `gemini` (Gemini — gratis)
   - Al cambiar proveedor: actualiza un link de ayuda debajo del campo de key:
     - anthropic → `https://console.anthropic.com/`
     - openai → `https://platform.openai.com/api-keys`
     - gemini → `https://aistudio.google.com/apikey` + "(es gratis)"
   - `<input type="password">` para la key + botón toggle para mostrar/ocultar
   - Botón "Guardar" → `saveAISettings()` → muestra "✓ Guardado"
   - Botón "Borrar configuración" → `clearAISettings()` → recarga estado
3. Muestra email del usuario logueado y botón "Cerrar sesión" (movido desde index)

---

## `src/pages/identify.astro`

Script client-side:

**Estado sin IA configurada:**
- Mensaje: "Configurá tu proveedor de IA en Ajustes para usar esta función."
- Botón/link "Ir a Ajustes"

**Estado con IA configurada:**
1. Zona de upload de foto (igual estilo que PlantForm — área punteada con ícono 📷)
2. Preview de la foto cuando se selecciona
3. Botón "Identificar planta" (deshabilitado hasta que haya foto)
4. Al hacer clic:
   - Botón muestra "Identificando…" + spinner, deshabilitado
   - Llama `identifyPlantFromImage(file)`
   - **Éxito:** muestra card con nombre, nombre popular, especie, descripción. Botón "Agregar planta →"
   - **Error:** muestra mensaje de error, permite reintentar
5. Al hacer clic "Agregar planta →":
   - Guarda `PlantIdentification` en `sessionStorage('plantopia_ai_identification')`
   - Navega a `{BASE_URL}plants/new`

---

## `src/pages/plants/new.astro` — cambios

Al final del `init()`, después de `requireAuth()`:

```typescript
const aiData = sessionStorage.getItem('plantopia_ai_identification');
if (aiData) {
  sessionStorage.removeItem('plantopia_ai_identification');
  const identification: PlantIdentification = JSON.parse(aiData);
  // Reutiliza fillFormFromCatalog adaptado — mismos campos
  fillFormFromCatalog(form, identification as any);
  // Muestra label verde igual que la búsqueda de catálogo
  const label = document.getElementById('catalog-selected') as HTMLParagraphElement;
  label.textContent = `✓ Identificado por IA: "${identification.common_name}". Podés editar cualquier campo.`;
  label.classList.remove('hidden');
  // El campo catalog-search muestra el nombre detectado (visual)
  (document.getElementById('catalog-search') as HTMLInputElement).value =
    identification.popular_name ?? identification.common_name;
}
```

`fillFormFromCatalog` ya acepta campos opcionales — `PlantIdentification` tiene el mismo shape que `PlantCatalog` para los campos que usa esa función, así que el cast `as any` es válido.

---

## `src/pages/plants/detail.astro` — cambios

Nueva sección al final del `#content`, solo renderizada si `getAISettings()` no es null:

```html
<section id="ai-chat" class="hidden">
  <h2>Consultar a la IA</h2>
  <ul id="chat-messages"></ul>
  <div class="flex gap-2">
    <input id="chat-input" type="text" placeholder="Preguntá sobre esta planta…" />
    <button id="chat-send">Enviar</button>
  </div>
  <button id="chat-clear">Limpiar chat</button>
</section>
```

Script:
1. Al cargar la planta: si `getAISettings()` existe → mostrar `#ai-chat`, cargar historial con `getChatHistory(plantId)`, renderizar mensajes
2. Al enviar:
   - Agrega mensaje del usuario al DOM y al historial
   - Muestra burbuja "…" de la IA
   - Llama `chatAboutPlant(plant, history, message)`
   - Reemplaza "…" con la respuesta
   - Guarda historial actualizado con `saveChatHistory`
3. Botón "Limpiar chat": `clearChatHistory(plantId)`, vacía DOM

---

## Error handling

| Situación | Comportamiento |
|-----------|----------------|
| Key inválida / error 401 | "Key incorrecta. Verificá tu configuración en Ajustes." |
| Imagen no reconocida | "No se pudo identificar la planta. Intentá con una foto más clara." |
| JSON inválido del modelo | "La IA devolvió una respuesta inesperada. Intentá de nuevo." |
| Sin conexión | "Sin conexión. Verificá tu internet." (fetch falla) |
| Rate limit (429) | "Límite de la API alcanzado. Esperá un momento." |

Todos los errores se muestran inline en la UI, nunca alert().

---

## Testing

- `src/lib/ai.ts` → unit tests en Vitest: parseo del JSON de identificación, helpers de localStorage, truncado de historial a 20 mensajes, extracción de texto de respuesta por proveedor
- No hay tests de integración con la API real (requieren keys)
