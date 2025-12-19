import { useMemo, useCallback, useRef } from 'react';

/**
 * Hook para memoização profunda de objetos
 * Evita re-renders desnecessários quando objetos são recriados mas são iguais
 */
export function useDeepMemo<T>(value: T, deps: React.DependencyList): T {
  const ref = useRef<T>(value);
  
  const isEqual = useMemo(() => {
    return JSON.stringify(ref.current) === JSON.stringify(value);
  }, deps);
  
  if (!isEqual) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Hook para debounce de valores
 * Útil para inputs de busca
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

import React from 'react';

/**
 * Hook para throttle de callbacks
 * Limita a frequência de execução de funções
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;
    
    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      // Agendar para executar após o delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook para lazy loading de componentes com intersection observer
 */
export function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, isVisible };
}

/**
 * Hook para pré-carregar dados de páginas próximas
 */
export function usePrefetch<T>(
  prefetchFn: () => Promise<T>,
  enabled: boolean = true
) {
  const hasPrefetched = useRef(false);
  
  React.useEffect(() => {
    if (enabled && !hasPrefetched.current) {
      // Prefetch após idle time
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
      
      idleCallback(() => {
        prefetchFn().catch(() => {
          // Silently fail prefetch
        });
        hasPrefetched.current = true;
      });
    }
  }, [enabled, prefetchFn]);
}

/**
 * Hook para virtual scrolling simples
 * Renderiza apenas itens visíveis
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [items, visibleRange, itemHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
}

/**
 * Hook para cache local com expiração
 */
export function useLocalCache<T>(key: string, expirationMs: number = 5 * 60 * 1000) {
  const getFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;
      
      const { value, expiration } = JSON.parse(cached);
      if (Date.now() > expiration) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return value as T;
    } catch {
      return null;
    }
  }, [key]);
  
  const setToCache = useCallback((value: T) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        value,
        expiration: Date.now() + expirationMs,
      }));
    } catch {
      // Storage full, ignore
    }
  }, [key, expirationMs]);
  
  const clearCache = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
  }, [key]);
  
  return { getFromCache, setToCache, clearCache };
}
