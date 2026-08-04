import { describe, it, expect, beforeEach } from 'vitest';
import { getAISettings, saveAISettings, clearAISettings, parseIdentification } from './ai';

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
