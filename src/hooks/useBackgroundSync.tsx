import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  getSyncQueue, 
  removeFromSyncQueue, 
  updateSyncQueueItem,
  addToSyncQueue,
  getOfflineStats
} from '@/lib/offlineDb';
import { toast } from 'sonner';

interface SyncStatus {
  isSyncing: boolean;
  pendingItems: number;
  lastSyncAt: Date | null;
  error: string | null;
}

export function useBackgroundSync() {
  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    lastSyncAt: null,
    error: null
  });

  // Process a single sync queue item
  const processSyncItem = useCallback(async (item: {
    id: string;
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    data: Record<string, unknown>;
    retries: number;
  }): Promise<boolean> => {
    try {
      const { table, operation, data } = item;
      
      // Type-safe table operations using dynamic approach
      // We use 'any' here since we're doing dynamic table operations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableRef = supabase.from(table as any);
      
      switch (operation) {
        case 'INSERT': {
          const { error } = await tableRef.insert(data as any);
          if (error) throw error;
          break;
        }
        case 'UPDATE': {
          const { id: recordId, ...updateData } = data;
          const { error } = await tableRef
            .update(updateData as any)
            .eq('id', String(recordId));
          if (error) throw error;
          break;
        }
        case 'DELETE': {
          const { error } = await tableRef
            .delete()
            .eq('id', String(data.id));
          if (error) throw error;
          break;
        }
      }
      
      await removeFromSyncQueue(item.id);
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Failed to process item:', error);
      
      // Increment retry count
      await updateSyncQueueItem(item.id, { retries: item.retries + 1 });
      
      // Remove if max retries exceeded
      if (item.retries >= 5) {
        await removeFromSyncQueue(item.id);
        console.warn('[BackgroundSync] Max retries exceeded, removing item:', item.id);
      }
      
      return false;
    }
  }, []);

  // Process all pending sync items
  const syncNow = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!isOnline) {
      console.log('[BackgroundSync] Offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    
    let success = 0;
    let failed = 0;

    try {
      const queue = await getSyncQueue();
      
      for (const item of queue) {
        const result = await processSyncItem(item);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }

      const stats = await getOfflineStats();
      
      setSyncStatus({
        isSyncing: false,
        pendingItems: stats.syncQueueSize,
        lastSyncAt: new Date(),
        error: null
      });

      if (success > 0) {
        toast.success(`Sincronizado: ${success} item(s)`);
      }
    } catch (error) {
      console.error('[BackgroundSync] Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }

    return { success, failed };
  }, [isOnline, processSyncItem]);

  // Queue an operation for background sync
  const queueOperation = useCallback(async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown>
  ): Promise<string | null> => {
    try {
      const id = await addToSyncQueue(table, operation, data);
      
      const stats = await getOfflineStats();
      setSyncStatus(prev => ({ ...prev, pendingItems: stats.syncQueueSize }));
      
      // If online, try to sync immediately
      if (isOnline) {
        // Small delay to batch operations
        setTimeout(() => syncNow(), 1000);
      } else {
        toast.info('Operação salva offline. Será sincronizada quando online.');
      }
      
      return id;
    } catch (error) {
      console.error('[BackgroundSync] Failed to queue operation:', error);
      return null;
    }
  }, [isOnline, syncNow]);

  // Update pending count on mount
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getOfflineStats();
        setSyncStatus(prev => ({ ...prev, pendingItems: stats.syncQueueSize }));
      } catch (error) {
        console.error('[BackgroundSync] Failed to get stats:', error);
      }
    };
    
    updateStats();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && syncStatus.pendingItems > 0 && !syncStatus.isSyncing) {
      console.log('[BackgroundSync] Back online, starting sync...');
      syncNow();
    }
  }, [isOnline, syncStatus.pendingItems, syncStatus.isSyncing, syncNow]);

  // Register for background sync if available
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register periodic sync if available
        if ('periodicSync' in registration) {
          (registration as any).periodicSync.register('sync-data', {
            minInterval: 15 * 60 * 1000 // 15 minutes
          }).catch(() => {
            console.log('[BackgroundSync] Periodic sync not available');
          });
        }
      });
    }
  }, []);

  return {
    ...syncStatus,
    syncNow,
    queueOperation
  };
}
