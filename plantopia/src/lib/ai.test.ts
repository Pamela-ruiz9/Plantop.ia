import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAISettings, saveAISettings, clearAISettings, parseIdentification, identifyPlantFromImage } from './ai';

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

describe('identifyPlantFromImage - malformed vision API responses', () => {
  const file = new File(['fake-image-bytes'], 'plant.png', { type: 'image/png' });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws a friendly error when Anthropic returns 200 with empty content (e.g. safety filter)', async () => {
    saveAISettings({ provider: 'anthropic', key: 'sk-ant-test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [] }),
    }));

    await expect(identifyPlantFromImage(file)).rejects.toThrow('No se pudo identificar la planta.');
  });

  it('throws a friendly error when OpenAI returns 200 with missing message content', async () => {
    saveAISettings({ provider: 'openai', key: 'sk-test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: {} }] }),
    }));

    await expect(identifyPlantFromImage(file)).rejects.toThrow('No se pudo identificar la planta.');
  });

  it('throws a friendly error when Gemini returns 200 with no candidates', async () => {
    saveAISettings({ provider: 'gemini', key: 'AItest' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
    }));

    await expect(identifyPlantFromImage(file)).rejects.toThrow('No se pudo identificar la planta.');
  });

  it('still succeeds when the response shape is well-formed', async () => {
    saveAISettings({ provider: 'anthropic', key: 'sk-ant-test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [{ text: '{"common_name":"Monstera"}' }] }),
    }));

    await expect(identifyPlantFromImage(file)).resolves.toEqual({ common_name: 'Monstera' });
  });
});
