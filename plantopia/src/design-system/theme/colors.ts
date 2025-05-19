export const colors = {
  // Brand Colors
  primary: {
    light: '#4CAF50',
    main: '#2E7D32',
    dark: '#1B5E20',
    contrastText: '#FFFFFF',
  },
  
  // UI Colors
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
    accent: '#E8F5E9',
  },
  
  // Text Colors
  text: {
    primary: '#1C2024',
    secondary: '#616161',
    disabled: '#9E9E9E',
    hint: '#757575',
  },
  
  // Status Colors
  status: {
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#2196F3',
  },
  
  // Border Colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },
} as const;

export type Colors = typeof colors;
