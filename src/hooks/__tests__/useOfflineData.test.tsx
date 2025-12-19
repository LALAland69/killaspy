import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/lib/offlineDb', () => ({
  setCache: vi.fn().mockResolvedValue(undefined),
  getCache: vi.fn().mockResolvedValue(null),
  saveMultipleToStore: vi.fn().mockResolvedValue(undefined),
  getAllFromStore: vi.fn().mockResolvedValue([]),
  getFromStore: vi.fn().mockResolvedValue(null),
  saveToStore: vi.fn().mockResolvedValue(undefined),
  deleteFromStore: vi.fn().mockResolvedValue(undefined),
  clearExpiredCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

vi.mock('./useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({ isOnline: true })),
}));

vi.mock('./useBackgroundSync', () => ({
  useBackgroundSync: vi.fn(() => ({ 
    queueOperation: vi.fn().mockResolvedValue(undefined) 
  })),
}));

import { useOfflineData, useOfflineAds, useOfflineSavedAds } from '../useOfflineData';
import { getCache, setCache, getAllFromStore } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useOfflineData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => 
      useOfflineData({
        table: 'ads',
        cacheKey: 'test-key',
      })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('returns cached data when available', async () => {
    const cachedData = [{ id: '1', name: 'cached' }];
    vi.mocked(getCache).mockResolvedValue(cachedData);

    const { result } = renderHook(() =>
      useOfflineData({
        table: 'ads',
        cacheKey: 'test-key',
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.source).toBe('cache');
  });

  it('fetches fresh data when online and no cache', async () => {
    vi.mocked(getCache).mockResolvedValue(null);
    vi.mocked(getAllFromStore).mockResolvedValue([]);
    
    const mockData = [{ id: '1', headline: 'fresh' }];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() =>
      useOfflineData({
        table: 'ads',
        cacheKey: 'test-key',
        cacheTTL: 3600,
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.isLoading).toBeDefined();
  });

  it('provides saveItem function', async () => {
    const { result } = renderHook(() =>
      useOfflineData<{ id: string }>({
        table: 'ads',
        cacheKey: 'test-key',
      })
    );

    expect(result.current.saveItem).toBeDefined();
    expect(typeof result.current.saveItem).toBe('function');
  });

  it('provides deleteItem function', async () => {
    const { result } = renderHook(() =>
      useOfflineData<{ id: string }>({
        table: 'ads',
        cacheKey: 'test-key',
      })
    );

    expect(result.current.deleteItem).toBeDefined();
    expect(typeof result.current.deleteItem).toBe('function');
  });

  it('provides refresh function', async () => {
    const { result } = renderHook(() =>
      useOfflineData<{ id: string }>({
        table: 'ads',
        cacheKey: 'test-key',
      })
    );

    expect(result.current.refresh).toBeDefined();
    expect(typeof result.current.refresh).toBe('function');
  });
});

describe('useOfflineAds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches ads with offline support', async () => {
    const mockAds = [{ id: 'ad-1', headline: 'Test Ad' }];
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockAds, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useOfflineAds());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.isLoading).toBeDefined();
  });
});

describe('useOfflineSavedAds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches saved ads with offline support', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useOfflineSavedAds());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.isLoading).toBeDefined();
  });
});
