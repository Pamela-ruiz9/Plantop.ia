import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * The variant of the badge
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';

  /**
   * The size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the badge is outlined
   * @default false
   */
  outlined?: boolean;

  /**
   * Whether the badge is rounded
   * @default true
   */
  rounded?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className,
    variant = 'default',
    size = 'md',
    outlined = false,
    rounded = true,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium';
    
    const variants = {
      default: outlined 
        ? 'border border-gray-500 text-gray-700' 
        : 'bg-gray-100 text-gray-700',
      success: outlined
        ? 'border border-status-success text-status-success'
        : 'bg-green-100 text-status-success',
      warning: outlined
        ? 'border border-status-warning text-status-warning'
        : 'bg-yellow-100 text-status-warning',
      error: outlined
        ? 'border border-status-error text-status-error'
        : 'bg-red-100 text-status-error',
      info: outlined
        ? 'border border-status-info text-status-info'
        : 'bg-blue-100 text-status-info',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          rounded && 'rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
