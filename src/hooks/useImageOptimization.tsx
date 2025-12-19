import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for preloading critical images
 */
export function useImagePreload(srcs: string[]) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const images: HTMLImageElement[] = [];

    srcs.forEach((src) => {
      if (!src) return;

      const img = new Image();
      
      img.onload = () => {
        setLoaded((prev) => ({ ...prev, [src]: true }));
      };
      
      img.onerror = () => {
        setErrors((prev) => ({ ...prev, [src]: true }));
      };
      
      img.src = src;
      images.push(img);
    });

    return () => {
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [srcs.join(',')]);

  const allLoaded = srcs.every((src) => loaded[src]);
  const hasErrors = srcs.some((src) => errors[src]);

  return { loaded, errors, allLoaded, hasErrors };
}

/**
 * Hook for progressive image loading with blur-up effect
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
) {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isHighQuality, setIsHighQuality] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSrc(highQualitySrc);
      setIsHighQuality(true);
    };
    img.src = highQualitySrc;

    return () => {
      img.onload = null;
    };
  }, [highQualitySrc]);

  return { src, isHighQuality };
}

/**
 * Hook for intersection-based image loading
 */
export function useLazyImage(threshold = 0.01, rootMargin = '200px') {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  const onLoad = useCallback(() => {
    setHasLoaded(true);
  }, []);

  return { ref, isVisible, hasLoaded, onLoad };
}

/**
 * Hook for image dimension detection
 */
export function useImageDimensions(src: string) {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    aspectRatio: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const img = new Image();

    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
      setLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { dimensions, loading, error };
}

/**
 * Generate responsive sizes attribute based on layout
 */
export function generateSizes(layout: 'full' | 'half' | 'third' | 'quarter' | 'grid'): string {
  switch (layout) {
    case 'full':
      return '100vw';
    case 'half':
      return '(max-width: 768px) 100vw, 50vw';
    case 'third':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'quarter':
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
    case 'grid':
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw';
    default:
      return '100vw';
  }
}

/**
 * Hook for native lazy loading support detection
 */
export function useNativeLazyLoading() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('loading' in HTMLImageElement.prototype);
  }, []);

  return supported;
}

/**
 * Hook for WebP support detection
 */
export function useWebPSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWebP = async () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        const result = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        setSupported(result);
      } else {
        setSupported(false);
      }
    };

    checkWebP();
  }, []);

  return supported;
}

/**
 * Hook for AVIF support detection
 */
export function useAVIFSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAVIF = async () => {
      const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpMAAAKBAAAA8AMABIAC';
      
      const img = new Image();
      img.onload = () => setSupported(true);
      img.onerror = () => setSupported(false);
      img.src = avifData;
    };

    checkAVIF();
  }, []);

  return supported;
}

/**
 * Create a low-quality image placeholder (LQIP) data URL
 */
export function createPlaceholder(width: number, height: number, color = '#e5e7eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect fill="${color}" width="${width}" height="${height}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
