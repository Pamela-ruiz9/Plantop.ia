export const spacing = {
  // Base spacing unit (0.25rem = 4px)
  unit: 0.25,
  
  // Spacing scale
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  
  // Component specific spacing
  layout: {
    pageMargin: '1rem',
    containerPadding: '1rem',
    sectionGap: '2rem',
  },
  
  // Common component spacing
  component: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
  },
} as const;

export type Spacing = typeof spacing;
