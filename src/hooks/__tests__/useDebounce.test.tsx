import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', async () => {
    const { useDebounce } = await import('../useDebounce');
    
    const { result } = renderHook(() => useDebounce('initial', 300));
    
    expect(result.current).toBe('initial');
  });

  it('debounces value updates', async () => {
    const { useDebounce } = await import('../useDebounce');
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Update value
    rerender({ value: 'updated', delay: 300 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');
    
    // Advance time
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid changes', async () => {
    const { useDebounce } = await import('../useDebounce');
    
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(100); });
    
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(100); });
    
    rerender({ value: 'd' });
    act(() => { vi.advanceTimersByTime(100); });

    // Should still be 'a' as timer keeps resetting
    expect(result.current).toBe('a');
    
    // Wait full delay
    act(() => { vi.advanceTimersByTime(300); });
    
    // Now should be final value
    expect(result.current).toBe('d');
  });
});
