import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies before importing
vi.mock('@/lib/offlineDb', () => ({
  getSyncQueue: vi.fn().mockResolvedValue([]),
  removeFromSyncQueue: vi.fn().mockResolvedValue(undefined),
  updateSyncQueueItem: vi.fn().mockResolvedValue(undefined),
  addToSyncQueue: vi.fn().mockResolvedValue(undefined),
  getOfflineStats: vi.fn().mockResolvedValue({ pendingItems: 0 }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  },
}));

vi.mock('./useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({ isOnline: true })),
}));

import { useBackgroundSync } from '../useBackgroundSync';
import { getSyncQueue, addToSyncQueue } from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useBackgroundSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBackgroundSync());

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingItems).toBe(0);
    expect(result.current.lastSyncAt).toBeNull();
  });

  it('queues operation correctly', async () => {
    const { result } = renderHook(() => useBackgroundSync());

    await act(async () => {
      await result.current.queueOperation('saved_ads', 'INSERT', { ad_id: 'test-123' });
    });

    expect(addToSyncQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'saved_ads',
        operation: 'INSERT',
        data: { ad_id: 'test-123' },
      })
    );
  });

  it('processes sync queue when online', async () => {
    const mockItems = [
      {
        id: '1',
        table: 'saved_ads',
        operation: 'INSERT' as const,
        data: { ad_id: 'test-123' },
        timestamp: Date.now(),
        retries: 0,
      },
    ];

    vi.mocked(getSyncQueue).mockResolvedValue(mockItems);
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    const { result } = renderHook(() => useBackgroundSync());

    await act(async () => {
      await result.current.syncNow();
    });

    expect(getSyncQueue).toHaveBeenCalled();
  });

  it('handles sync errors gracefully', async () => {
    const mockItems = [
      {
        id: '1',
        table: 'saved_ads',
        operation: 'INSERT' as const,
        data: { ad_id: 'test-123' },
        timestamp: Date.now(),
        retries: 0,
      },
    ];

    vi.mocked(getSyncQueue).mockResolvedValue(mockItems);
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('Network error') }),
    } as any);

    const { result } = renderHook(() => useBackgroundSync());

    await act(async () => {
      await result.current.syncNow();
    });

    // Should not throw error
    expect(result.current.isSyncing).toBe(false);
  });
});
