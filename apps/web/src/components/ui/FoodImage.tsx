import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FoodImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  categoryName?: string;
  category?: string;
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
  className = '',
  fallbackClassName = '',
  categoryName,
  category,
  ...props
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const displayCategory = category || categoryName || 'Euroshub Kitchen';
  const resolvedUrl = resolveImageUrl(src);
  const showFallback = !resolvedUrl || loadFailed;

  if (showFallback) {
    return (
      <div
        className={cn(
          'w-full h-full min-h-[140px] flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-100 to-bistro-border dark:from-charcoal-850 dark:to-charcoal-900 border border-bistro-border dark:border-charcoal-700/80 p-4 text-center select-none transition-bistro',
          fallbackClassName || className
        )}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full bg-white/70 dark:bg-charcoal-800/80 border border-bistro-border/60 dark:border-charcoal-700 shadow-sm flex items-center justify-center text-terracotta mb-2">
          <UtensilsCrossed className="w-6 h-6 opacity-80" />
        </div>
        <span className="font-serif font-semibold text-xs sm:text-sm text-charcoal-700 dark:text-charcoal-200 line-clamp-1 max-w-[85%]">
          {alt}
        </span>
        <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest mt-0.5">
          {displayCategory}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-charcoal-100 dark:bg-charcoal-850', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-charcoal-200/50 dark:bg-charcoal-800/50 animate-pulse" />
      )}
      <img
        src={resolvedUrl}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setLoadFailed(true)}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        {...props}
      />
    </div>
  );
};
