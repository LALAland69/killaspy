import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Cria um componente lazy-loaded com Suspense wrapper
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  FallbackComponent?: React.ReactNode
): React.FC<P> {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={FallbackComponent || <LoadingSpinner />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Componente de skeleton para loading states
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/2 mb-4" />
      <div className="h-20 bg-muted rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-muted rounded animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="bg-muted rounded animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <span className="text-muted-foreground text-sm">Carregando gráfico...</span>
    </div>
  );
}

/**
 * Componente para lazy load de imagens com blur placeholder
 */
export function LazyImage({ 
  src, 
  alt, 
  className = '',
  placeholder = 'blur'
}: { 
  src: string; 
  alt: string; 
  className?: string;
  placeholder?: 'blur' | 'skeleton';
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  
  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-xs">Erro ao carregar</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className={`absolute inset-0 ${
          placeholder === 'blur' 
            ? 'bg-muted/50 backdrop-blur-sm' 
            : 'bg-muted animate-pulse'
        }`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/**
 * Wrapper para componentes que devem ser renderizados apenas quando visíveis
 */
export function RenderWhenVisible({ 
  children, 
  fallback,
  threshold = 0.1,
  rootMargin = '100px'
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
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
  }, [threshold, rootMargin]);
  
  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <SkeletonCard />)}
    </div>
  );
}
