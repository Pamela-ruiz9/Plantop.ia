'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  interactive?: boolean;
  fullWidth?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, fullWidth = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-background-paper shadow-sm',
          {
            'border border-border-main': variant === 'bordered',
            'shadow-lg': variant === 'elevated',
            'hover:shadow-md transition-shadow duration-200': interactive,
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between p-4 pb-2', className)}
        {...props}
      >
        <div>
          {title && <div className="text-lg font-semibold">{title}</div>}
          {subtitle && <div className="text-sm text-text-secondary">{subtitle}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn({ 'p-4': !noPadding }, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-4 pt-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardRoot.displayName = 'Card';
CardHeader.displayName = 'Card.Header';
CardContent.displayName = 'Card.Content';
CardFooter.displayName = 'Card.Footer';

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});
