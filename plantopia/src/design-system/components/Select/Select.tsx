import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Typography } from '../Typography';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * The label for the select
   */
  label?: string;

  /**
   * The options to display in the select
   */
  options: SelectOption[];

  /**
   * The size of the select
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the select is in an error state
   */
  error?: boolean;

  /**
   * Helper text to display below the select
   */
  helperText?: string;

  /**
   * Whether the select spans the full width of its container
   * @default false
   */
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className,
    label,
    options,
    size = 'md',
    error = false,
    helperText,
    fullWidth = false,
    disabled,
    id,
    ...props
  }, ref) => {
    const baseStyles = 'rounded-lg border border-border-main bg-background-default transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    const sizes = {
      sm: 'h-8 text-sm pl-3 pr-8',
      md: 'h-10 text-base pl-3 pr-8',
      lg: 'h-12 text-lg pl-4 pr-9',
    };

    const states = {
      error: 'border-status-error focus:border-status-error focus:ring-status-error/30',
      disabled: 'bg-gray-50 text-gray-400',
    };

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
        <div className={cn('relative', fullWidth && 'w-full')}>
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              baseStyles,
              sizes[size],
              error && states.error,
              disabled && states.disabled,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          >
            {options.map(({ value, label, disabled }) => (
              <option key={value} value={value} disabled={disabled}>
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';
