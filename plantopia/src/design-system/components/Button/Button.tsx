import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  
  /**
   * The size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether the button spans the full width of its container
   * @default false
   */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-primary-main hover:bg-primary-dark text-white shadow-sm',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
      outline: 'border-2 border-primary-main text-primary-main hover:bg-primary-main hover:text-white',
      ghost: 'hover:bg-primary-light hover:text-primary-main',
      link: 'text-primary-main hover:underline',
    };
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-11 px-6 text-lg',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg 
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
