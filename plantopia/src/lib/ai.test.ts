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
