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
