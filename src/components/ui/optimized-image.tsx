import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Generates srcset for responsive images
 * Supports common breakpoints: 320, 640, 768, 1024, 1280, 1536, 1920
 */
function generateSrcSet(src: string): string | undefined {
  // Only generate srcset for URLs that might support resizing
  // Skip for data URLs, blob URLs, or external URLs without query params
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return undefined;
  }
  
  // For Supabase storage URLs, we can add width transformations
  if (src.includes('supabase') && src.includes('storage')) {
    const widths = [320, 640, 768, 1024, 1280];
    return widths
      .map(w => {
        const separator = src.includes('?') ? '&' : '?';
        return `${src}${separator}width=${w} ${w}w`;
      })
      .join(', ');
  }
  
  return undefined;
}

/**
 * Checks if WebP is supported
 */
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

/**
 * OptimizedImage Component
 * - Native lazy loading with loading="lazy"
 * - IntersectionObserver for visibility-based loading
 * - Blur/skeleton placeholder during loading
 * - Error handling with fallback
 * - Responsive srcset generation
 * - Decoding optimization with decoding="async"
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  fallbackSrc = '/placeholder.svg',
  onLoad,
  onError,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    if (priority || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load images 200px before they enter viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isVisible]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  const srcSet = generateSrcSet(src);
  const currentSrc = error ? fallbackSrc : src;

  // Determine object-fit class
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!loaded && placeholder !== 'none' && (
        <div
          className={cn(
            'absolute inset-0 z-10 transition-opacity duration-300',
            placeholder === 'blur'
              ? 'bg-muted/60 backdrop-blur-sm'
              : 'bg-muted animate-pulse'
          )}
          aria-hidden="true"
        />
      )}

      {/* Image - only render when visible or priority */}
      {isVisible && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClass,
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs">Erro ao carregar imagem</span>
        </div>
      )}
    </div>
  );
});

/**
 * Responsive image component with art direction support
 * Uses <picture> element for format fallbacks
 */
interface ResponsiveImageProps extends OptimizedImageProps {
  webpSrc?: string;
  avifSrc?: string;
}

export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  webpSrc,
  avifSrc,
  alt,
  className = '',
  containerClassName = '',
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  fallbackSrc = '/placeholder.svg',
  onLoad,
  onError,
  objectFit = 'cover',
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isVisible]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ width, height }}
    >
      {!loaded && placeholder !== 'none' && (
        <div
          className={cn(
            'absolute inset-0 z-10 transition-opacity duration-300',
            placeholder === 'blur'
              ? 'bg-muted/60 backdrop-blur-sm'
              : 'bg-muted animate-pulse'
          )}
          aria-hidden="true"
        />
      )}

      {isVisible && (
        <picture>
          {avifSrc && <source srcSet={avifSrc} type="image/avif" sizes={sizes} />}
          {webpSrc && <source srcSet={webpSrc} type="image/webp" sizes={sizes} />}
          <img
            src={error ? fallbackSrc : src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full transition-opacity duration-300',
              objectFitClass,
              loaded ? 'opacity-100' : 'opacity-0',
              className
            )}
          />
        </picture>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-xs">Erro ao carregar imagem</span>
        </div>
      )}
    </div>
  );
});

/**
 * Background image component with lazy loading
 */
interface BackgroundImageProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
  overlay?: boolean;
  overlayClassName?: string;
}

export const BackgroundImage = memo(function BackgroundImage({
  src,
  className = '',
  children,
  priority = false,
  overlay = false,
  overlayClassName = 'bg-black/50',
}: BackgroundImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isVisible]);

  // Preload image when visible
  useEffect(() => {
    if (!isVisible) return;

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [isVisible, src]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{
        backgroundImage: loaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
      )}
      {overlay && <div className={cn('absolute inset-0', overlayClassName)} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

export { supportsWebP };
