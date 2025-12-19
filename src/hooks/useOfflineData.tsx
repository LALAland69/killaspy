import { useCallback, useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useBackgroundSync } from './useBackgroundSync';
import {
  setCache,
  getCache,
  saveMultipleToStore,
  getAllFromStore,
  getFromStore,
  saveToStore,
  deleteFromStore,
  clearExpiredCache
} from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';

interface UseOfflineDataOptions<T> {
  table: string;
  cacheKey: string;
  cacheTTL?: number; // seconds
  fetchFn?: () => Promise<T[]>;
}

interface OfflineDataState<T> {
  data: T[];
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  source: 'network' | 'cache' | 'indexeddb';
}

export function useOfflineData<T extends { id: string }>({
  table,
  cacheKey,
  cacheTTL = 3600,
  fetchFn
}: UseOfflineDataOptions<T>) {
  const { isOnline } = useNetworkStatus();
  const { queueOperation } = useBackgroundSync();
  const [state, setState] = useState<OfflineDataState<T>>({
    data: [],
    isLoading: true,
    isStale: false,
    error: null,
    source: 'cache'
  });

  // Fetch data with offline-first strategy
  const fetchData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, try to get from cache/IndexedDB
      const cached = await getCache<T[]>(cacheKey);
      if (cached && cached.length > 0) {
        setState(prev => ({
          ...prev,
          data: cached,
          isStale: true,
          source: 'cache'
        }));
      } else {
        // Try IndexedDB store
        const stored = await getAllFromStore<T>(table);
        if (stored && stored.length > 0) {
          setState(prev => ({
            ...prev,
            data: stored,
            isStale: true,
            source: 'indexeddb'
          }));
        }
      }

      // If online, fetch fresh data
      if (isOnline) {
        let freshData: T[];
        
        if (fetchFn) {
          freshData = await fetchFn();
        } else {
          // Use 'any' for dynamic table operations
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await supabase.from(table as any).select('*');
          if (error) throw error;
          freshData = (data as unknown) as T[];
        }

        // Update cache and IndexedDB
        await Promise.all([
          setCache(cacheKey, freshData, cacheTTL),
          saveMultipleToStore(table, freshData)
        ]);

        setState({
          data: freshData,
          isLoading: false,
          isStale: false,
          error: null,
          source: 'network'
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[OfflineData] Fetch error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch'
      }));
    }
  }, [cacheKey, cacheTTL, fetchFn, isOnline, table]);

  // Save item (works offline)
  const saveItem = useCallback(async (item: T): Promise<boolean> => {
    try {
      // Save to IndexedDB immediately
      await saveToStore(table, item);
      
      // Update local state
      setState(prev => {
        const existingIndex = prev.data.findIndex(d => d.id === item.id);
        if (existingIndex >= 0) {
          const newData = [...prev.data];
          newData[existingIndex] = item;
          return { ...prev, data: newData };
        }
        return { ...prev, data: [...prev.data, item] };
      });

      // Queue for sync
      const existingItem = await getFromStore<T>(table, item.id);
      await queueOperation(
        table,
        existingItem ? 'UPDATE' : 'INSERT',
        item as unknown as Record<string, unknown>
      );

      return true;
    } catch (error) {
      console.error('[OfflineData] Save error:', error);
      return false;
    }
  }, [table, queueOperation]);

  // Delete item (works offline)
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Delete from IndexedDB
      await deleteFromStore(table, id);
      
      // Update local state
      setState(prev => ({
        ...prev,
        data: prev.data.filter(d => d.id !== id)
      }));

      // Queue for sync
      await queueOperation(table, 'DELETE', { id });

      return true;
    } catch (error) {
      console.error('[OfflineData] Delete error:', error);
      return false;
    }
  }, [table, queueOperation]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clean expired cache periodically
  useEffect(() => {
    const cleanup = async () => {
      const cleared = await clearExpiredCache();
      if (cleared > 0) {
        console.log(`[OfflineData] Cleared ${cleared} expired cache items`);
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 60 * 1000); // Every minute
    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    saveItem,
    deleteItem,
    refresh,
    isOffline: !isOnline
  };
}

// Specialized hook for ads
export function useOfflineAds() {
  return useOfflineData({
    table: 'ads',
    cacheKey: 'ads-list',
    cacheTTL: 300 // 5 minutes
  });
}

// Specialized hook for saved ads
export function useOfflineSavedAds() {
  return useOfflineData({
    table: 'savedAds',
    cacheKey: 'saved-ads',
    cacheTTL: 600 // 10 minutes
  });
}
