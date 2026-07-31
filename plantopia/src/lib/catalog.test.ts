import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase BEFORE importing catalog
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

import { searchCatalog, getCatalogPlant } from './catalog';

describe('searchCatalog', () => {
  it('returns [] for empty string (no DB call)', async () => {
    const result = await searchCatalog('');
    expect(result).toEqual([]);
  });

  it('returns [] for single character (no DB call)', async () => {
    const result = await searchCatalog('m');
    expect(result).toEqual([]);
  });

  it('returns array for 2+ character term', async () => {
    const result = await searchCatalog('mo');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('getCatalogPlant', () => {
  it('returns null when not found', async () => {
    const result = await getCatalogPlant('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});
