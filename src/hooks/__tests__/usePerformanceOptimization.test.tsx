import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useDeepMemo, 
  useDebouncedValue, 
  useThrottledCallback, 
  useLazyLoad,
  useLocalCache,
} from '../usePerformanceOptimization';

describe('useDeepMemo', () => {
  it('returns same reference for equal objects', () => {
    const { result, rerender } = renderHook(
      ({ obj }) => useDeepMemo(() => obj, [obj]),
      { initialProps: { obj: { a: 1, b: 2 } } }
    );

    const firstResult = result.current;
    
    // Rerender with equal object (different reference)
    rerender({ obj: { a: 1, b: 2 } });
    
    expect(result.current).toBe(firstResult);
  });

  it('returns new reference for different objects', () => {
    const { result, rerender } = renderHook(
      ({ obj }) => useDeepMemo(() => obj, [obj]),
      { initialProps: { obj: { a: 1 } } }
    );

    const firstResult = result.current;
    
    // Rerender with different object
    rerender({ obj: { a: 2 } });
    
    expect(result.current).not.toBe(firstResult);
  });
});

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });
    
    // Before delay
    expect(result.current).toBe('initial');
    
    // After delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('updated');
  });

  it('cancels previous debounce on new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    rerender({ value: 'second' });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe('second');
  });
});

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls function immediately on first invocation', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(fn, 300));

    act(() => {
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throttles subsequent calls', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(fn, 300));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(fn).toHaveBeenCalledTimes(1);
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    act(() => {
      result.current();
    });
    
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('useLazyLoad', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    const mockObserve = vi.fn();
    const mockUnobserve = vi.fn();
    const mockDisconnect = vi.fn();

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    }));
  });

  it('initializes with isVisible false', () => {
    const { result } = renderHook(() => useLazyLoad());
    
    expect(result.current.isVisible).toBe(false);
  });

  it('provides a ref function', () => {
    const { result } = renderHook(() => useLazyLoad());
    
    expect(result.current.ref).toBeDefined();
  });
});

describe('useLocalCache', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  });

  it('returns cached value from localStorage', () => {
    const cachedData = { value: { test: 'data' }, expiry: Date.now() + 60000 };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

    const { result } = renderHook(() => useLocalCache('test-key'));

    expect(result.current.getFromCache()).toEqual({ test: 'data' });
  });

  it('returns null for expired cache', () => {
    const expiredData = { value: { test: 'data' }, expiry: Date.now() - 1000 };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));

    const { result } = renderHook(() => useLocalCache('test-key'));

    expect(result.current.getFromCache()).toBeNull();
  });

  it('sets value with TTL', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalCache('test-key', 60000));

    act(() => {
      result.current.setToCache({ new: 'value' });
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'cache_test-key',
      expect.stringContaining('"new":"value"')
    );
  });

  it('clears cached value', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useLocalCache('test-key'));

    act(() => {
      result.current.clearCache();
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cache_test-key');
  });
});
