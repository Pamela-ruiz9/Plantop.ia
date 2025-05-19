import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The variant of the skeleton
   * @default 'rectangular'
   */
  variant?: 'rectangular' | 'circular' | 'text';

  /**
   * The width of the skeleton
   * Can be any valid CSS width value
   */
  width?: string | number;

  /**
   * The height of the skeleton
   * Can be any valid CSS height value
   */
  height?: string | number;

  /**
   * Whether the skeleton should animate
   * @default true
   */
  animate?: boolean;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className,
    variant = 'rectangular',
    width,
    height,
    animate = true,
    style,
    ...props
  }, ref) => {
    const baseStyles = 'bg-gray-200';
    
    const variants = {
      rectangular: 'rounded',
      circular: 'rounded-full',
      text: 'rounded w-full',
    };

    const animation = animate ? 'animate-pulse' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          animation,
          className
        )}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
