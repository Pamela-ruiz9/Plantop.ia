import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The maximum width of the container
   * @default 'lg'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /**
   * Whether to center the content horizontally
   * @default true
   */
  center?: boolean;

  /**
   * Whether to add default padding
   * @default true
   */
  padding?: boolean;

  /**
   * Whether to add default margin top and bottom
   * @default false
   */
  spacing?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    className,
    maxWidth = 'lg',
    center = true,
    padding = true,
    spacing = false,
    children,
    ...props
  }, ref) => {
    const maxWidths = {
      sm: 'max-w-screen-sm',  // 640px
      md: 'max-w-screen-md',  // 768px
      lg: 'max-w-screen-lg',  // 1024px
      xl: 'max-w-screen-xl',  // 1280px
      '2xl': 'max-w-screen-2xl', // 1536px
      'full': 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          maxWidths[maxWidth],
          center && 'mx-auto',
          padding && 'px-4 sm:px-6 lg:px-8',
          spacing && 'my-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
