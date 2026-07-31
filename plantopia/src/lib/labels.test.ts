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
  HUMIDITY_LABELS, CARE_DIFFICULTY_LABELS, FLOWERING_SEASON_LABELS,
  ADULT_SIZE_LABELS, PLANT_TYPE_LABELS, CATALOG_LOCATION_LABELS,
  HUMIDITY_LEVELS, CARE_DIFFICULTIES, FLOWERING_SEASONS, ADULT_SIZES,
  PLANT_TYPES, CATALOG_LOCATIONS,
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

describe('catalog labels', () => {
  it('HUMIDITY_LEVELS covers HUMIDITY_LABELS exactly', () => {
    for (const h of HUMIDITY_LEVELS) expect(HUMIDITY_LABELS[h]).toBeTruthy();
    expect(HUMIDITY_LEVELS).toHaveLength(Object.keys(HUMIDITY_LABELS).length);
  });

  it('CARE_DIFFICULTIES covers CARE_DIFFICULTY_LABELS exactly', () => {
    for (const d of CARE_DIFFICULTIES) expect(CARE_DIFFICULTY_LABELS[d]).toBeTruthy();
    expect(CARE_DIFFICULTIES).toHaveLength(Object.keys(CARE_DIFFICULTY_LABELS).length);
  });

  it('FLOWERING_SEASONS covers FLOWERING_SEASON_LABELS exactly', () => {
    for (const s of FLOWERING_SEASONS) expect(FLOWERING_SEASON_LABELS[s]).toBeTruthy();
    expect(FLOWERING_SEASONS).toHaveLength(Object.keys(FLOWERING_SEASON_LABELS).length);
  });

  it('ADULT_SIZES covers ADULT_SIZE_LABELS exactly', () => {
    for (const s of ADULT_SIZES) expect(ADULT_SIZE_LABELS[s]).toBeTruthy();
    expect(ADULT_SIZES).toHaveLength(Object.keys(ADULT_SIZE_LABELS).length);
  });

  it('PLANT_TYPES covers PLANT_TYPE_LABELS exactly', () => {
    for (const t of PLANT_TYPES) expect(PLANT_TYPE_LABELS[t]).toBeTruthy();
    expect(PLANT_TYPES).toHaveLength(Object.keys(PLANT_TYPE_LABELS).length);
  });

  it('CATALOG_LOCATIONS covers CATALOG_LOCATION_LABELS exactly', () => {
    for (const l of CATALOG_LOCATIONS) expect(CATALOG_LOCATION_LABELS[l]).toBeTruthy();
    expect(CATALOG_LOCATIONS).toHaveLength(Object.keys(CATALOG_LOCATION_LABELS).length);
  });
});
