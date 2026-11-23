import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface FoodImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src?: string | null;
  alt: string;
  /** Sizes the wrapper (aspect ratio, width/height). */
  className?: string;
  fallbackClassName?: string;
  categoryName?: string;
  category?: string;
  /** Intrinsic size hint so the browser reserves space before load. */
  width?: number;
  height?: number;
  /** First visible image on the page: eager load with high fetch priority. */
  priority?: boolean;
}

export function resolveImageUrl(src?: string | null): string {
  if (!src || typeof src !== 'string' || src.trim().length === 0) {
    return '';
  }
  const clean = src.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (clean.startsWith('/uploads/')) {
    const filename = clean.replace(/^\/uploads\//, '');
    return `https://jcmfppoqbqkdkjwkvulm.supabase.co/storage/v1/object/public/product-images/${filename}`;
  }
  const rawApiUrl = (((import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE || '') as string).trim();
  const apiUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  if (apiUrl && clean.startsWith('/')) {
    return `${apiUrl}${clean}`;
  }
  return clean;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  className,
  fallbackClassName,
  categoryName,
  category,
  width = 800,
  height = 600,
  priority = false,
  ...props
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedUrl = resolveImageUrl(src);
  const label = category || categoryName;

  if (!resolvedUrl || loadFailed) {
    return (
      <div
        className={cn('flex h-full w-full flex-col justify-end bg-deep p-4', fallbackClassName || className)}
        role="img"
        aria-label={alt}
      >
        <span className="line-clamp-2 font-serif text-lg leading-tight text-muted">{alt}</span>
        {label && <span className="mt-1 text-xs text-subtle">{label}</span>}
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-deep', className)}>
      <img
        src={resolvedUrl}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // React 18 does not know fetchPriority; pass the lowercase DOM attribute.
        {...({ fetchpriority: priority ? 'high' : 'auto' } as Record<string, string>)}
        onLoad={() => setIsLoaded(true)}
        onError={() => setLoadFailed(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          isLoaded || priority ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  );
};
