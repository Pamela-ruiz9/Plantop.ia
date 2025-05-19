'use client';

import { forwardRef, type ElementType } from 'react';
import { cn } from '@/lib/utils';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline';
type TypographyColor = 'primary' | 'secondary' | 'disabled' | 'success' | 'error' | 'warning' | 'info';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  truncate?: boolean;
  as?: ElementType;
  bold?: boolean;
  center?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const variants: Record<TypographyVariant, string> = {
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-bold leading-tight',
  h3: 'text-2xl font-bold leading-snug',
  h4: 'text-xl font-semibold leading-snug',
  h5: 'text-lg font-semibold leading-snug',
  h6: 'text-base font-semibold leading-snug',
  subtitle1: 'text-lg font-normal leading-relaxed',
  subtitle2: 'text-base font-medium leading-relaxed',
  body1: 'text-base font-normal leading-relaxed',
  body2: 'text-sm font-normal leading-relaxed',
  caption: 'text-xs font-normal leading-normal',
  overline: 'text-xs font-medium uppercase tracking-wider',
};

const colors: Record<TypographyColor, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  disabled: 'text-text-disabled',
  success: 'text-status-success',
  error: 'text-status-error',
  warning: 'text-status-warning',
  info: 'text-status-info',
};

const defaultElements: Record<TypographyVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className,
    variant = 'body1',
    color = 'primary',
    truncate = false,
    bold = false,
    center = false,
    as,
    children,
    ...props
  }, ref) => {
    // Aseguramos que variant es un valor válido de TypographyVariant
    const safeVariant = variant as TypographyVariant;
    // Aseguramos que color es un valor válido de TypographyColor
    const safeColor = color as TypographyColor;
    
    const Component = as || defaultElements[safeVariant];

    return (
      <Component
        ref={ref}
        className={cn(
          variants[safeVariant],
          colors[safeColor],
          truncate && 'truncate',
          bold && 'font-bold',
          center && 'text-center',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';
