import { describe, it, expect } from 'vitest';
import {
  LOCATION_LABELS,
  HEALTH_LABELS,
  HEALTH_COLORS,
  LIGHT_LABELS,
  PHASE_LABELS,
  EVENT_LABELS,
  LOCATIONS,
  HEALTH_STATUSES,
  LIGHT_TYPES,
  GROWTH_PHASES,
  EVENT_TYPES,
} from './labels';

describe('labels', () => {
  it('LOCATIONS covers LOCATION_LABELS exactly', () => {
    for (const loc of LOCATIONS) expect(LOCATION_LABELS[loc]).toBeTruthy();
    expect(LOCATIONS).toHaveLength(Object.keys(LOCATION_LABELS).length);
  });

  it('HEALTH_STATUSES covers HEALTH_LABELS and HEALTH_COLORS exactly', () => {
    for (const s of HEALTH_STATUSES) {
      expect(HEALTH_LABELS[s]).toBeTruthy();
      expect(HEALTH_COLORS[s]).toBeTruthy();
    }
    expect(HEALTH_STATUSES).toHaveLength(Object.keys(HEALTH_LABELS).length);
    expect(HEALTH_STATUSES).toHaveLength(Object.keys(HEALTH_COLORS).length);
  });

  it('LIGHT_TYPES covers LIGHT_LABELS exactly', () => {
    for (const l of LIGHT_TYPES) expect(LIGHT_LABELS[l]).toBeTruthy();
    expect(LIGHT_TYPES).toHaveLength(Object.keys(LIGHT_LABELS).length);
  });

  it('GROWTH_PHASES covers PHASE_LABELS exactly', () => {
    for (const p of GROWTH_PHASES) expect(PHASE_LABELS[p]).toBeTruthy();
    expect(GROWTH_PHASES).toHaveLength(Object.keys(PHASE_LABELS).length);
  });

  it('EVENT_TYPES covers EVENT_LABELS exactly', () => {
    for (const e of EVENT_TYPES) expect(EVENT_LABELS[e]).toBeTruthy();
    expect(EVENT_TYPES).toHaveLength(Object.keys(EVENT_LABELS).length);
  });
});
