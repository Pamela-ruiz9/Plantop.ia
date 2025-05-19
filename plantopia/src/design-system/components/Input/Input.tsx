import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Typography } from '../Typography';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * The label for the input
   */
  label?: string;

  /**
   * The variant of the input
   * @default 'outline'
   */
  variant?: 'outline' | 'filled' | 'unstyled';

  /**
   * The size of the input
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the input is in an error state
   */
  error?: boolean;

  /**
   * Helper text to display below the input
   */
  helperText?: string;

  /**
   * Left icon or element
   */
  startElement?: React.ReactNode;

  /**
   * Right icon or element
   */
  endElement?: React.ReactNode;

  /**
   * Whether the input spans the full width of its container
   * @default false
   */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    label,
    variant = 'outline',
    size = 'md',
    error = false,
    helperText,
    startElement,
    endElement,
    fullWidth = false,
    disabled,
    id,
    ...props
  }, ref) => {
    const baseStyles = 'rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variants = {
      outline: 'border border-border-main focus:border-primary-main focus:ring-primary-light',
      filled: 'bg-gray-100 border-2 border-transparent focus:bg-white focus:border-primary-main',
      unstyled: 'border-none shadow-none focus:ring-0 focus:ring-offset-0',
    };

    const sizes = {
      sm: 'h-8 text-sm px-2',
      md: 'h-10 text-base px-3',
      lg: 'h-12 text-lg px-4',
    };

    const states = {
      error: 'border-status-error focus:border-status-error focus:ring-status-error/30',
      disabled: 'bg-gray-50 text-gray-400',
    };

    const wrapperBaseStyles = 'relative inline-flex items-center';
    
    return (
      <div className="space-y-1">
        {label && (
          <Typography
            as="label"
            variant="body2"
            htmlFor={id}
            className="block font-medium text-text-primary"
          >
            {label}
          </Typography>
        )}
        <div className={cn(
          wrapperBaseStyles,
          fullWidth && 'w-full',
          className
        )}>
          {startElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {startElement}
            </div>
          )}
          
          <input
            ref={ref}
            id={id}
            className={cn(
              baseStyles,
              variants[variant],
              sizes[size],
              error && states.error,
              disabled && states.disabled,
              startElement && 'pl-10',
              endElement && 'pr-10',
              fullWidth && 'w-full',
            )}
            disabled={disabled}
            {...props}
          />

          {endElement && (
            <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
              {endElement}
            </div>
          )}
        </div>

        {helperText && (
          <Typography
            variant="body2"
            color={error ? "error" : "secondary"}
          >
            {helperText}
          </Typography>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
