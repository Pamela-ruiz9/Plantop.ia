export * from './colors';
export * from './typography';
export * from './spacing';
export * from './breakpoints';

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { breakpoints, mediaQueries } from './breakpoints';

export const theme = {
  colors,
  typography,
  spacing,
  breakpoints,
  mediaQueries,
} as const;

export type Theme = typeof theme;
