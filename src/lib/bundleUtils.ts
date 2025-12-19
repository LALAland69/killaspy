/**
 * FASE 6: Bundle Analyzer Utilities
 * Helpers para análise e otimização de bundle
 */

// Dynamic import with retry for reliability
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Dynamic import failed after retries');
}

// Preload a module using link preload
export function preloadModule(path: string): void {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = path;
  document.head.appendChild(link);
}

// Preload an image
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Check if a module is already cached
export function isModuleCached(path: string): boolean {
  const scripts = document.querySelectorAll('script[src]');
  return Array.from(scripts).some(script => 
    (script as HTMLScriptElement).src.includes(path)
  );
}

// Get estimated bundle sizes (for development)
export function estimateBundleSizes(): Record<string, string> {
  const performance = window.performance;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const bundles: Record<string, string> = {};
  
  resources
    .filter(r => r.name.endsWith('.js') || r.name.endsWith('.css'))
    .forEach(r => {
      const name = r.name.split('/').pop() || r.name;
      const size = r.transferSize || r.encodedBodySize;
      bundles[name] = formatBytes(size);
    });
  
  return bundles;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Report long tasks that might affect performance
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (!('PerformanceObserver' in window)) return () => {};
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Long task threshold
          callback(entry.duration);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

// Track JavaScript execution time
export function measureExecutionTime<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (duration > 16) { // More than one frame
    console.warn(`[PERF] ${label} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

// Defer non-critical work
export function deferWork(fn: () => void, timeout = 0): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, timeout);
  }
}

// Schedule work during idle time
export function scheduleIdleWork<T>(
  tasks: (() => T)[],
  onComplete: (results: T[]) => void
): void {
  const results: T[] = [];
  let index = 0;
  
  function runTask(deadline: IdleDeadline) {
    while (index < tasks.length && deadline.timeRemaining() > 0) {
      results.push(tasks[index]());
      index++;
    }
    
    if (index < tasks.length) {
      requestIdleCallback(runTask);
    } else {
      onComplete(results);
    }
  }
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(runTask);
  } else {
    // Fallback: run all at once
    tasks.forEach(task => results.push(task()));
    onComplete(results);
  }
}
