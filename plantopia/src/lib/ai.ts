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
