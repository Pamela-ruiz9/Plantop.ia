import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * The source URL of the avatar image
   */
  src?: string | null;

  /**
   * Alternative text for the avatar image
   */
  alt?: string;

  /**
   * The size of the avatar
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * The shape of the avatar
   * @default 'circle'
   */
  shape?: 'circle' | 'square';

  /**
   * The fallback content to display when image fails to load or no src is provided
   */
  fallback?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className,
    src,
    alt = '',
    size = 'md',
    shape = 'circle',
    fallback,
    ...props
  }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    };

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    };

    const getFallbackInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center bg-gray-200 overflow-hidden',
          sizes[size],
          shapes[shape],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            {...props}
          />
        ) : (
          <span className="font-medium text-gray-600">
            {fallback ? getFallbackInitials(fallback) : '?'}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
