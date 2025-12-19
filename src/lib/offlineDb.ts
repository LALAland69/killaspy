/**
 * Offline Database Layer using IndexedDB
 * Provides offline-first data persistence with sync queue
 */

const DB_NAME = 'killaspy-offline';
const DB_VERSION = 1;

interface SyncQueueItem {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

interface CachedData {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

let dbInstance: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Sync queue store - for pending operations
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('table', 'table', { unique: false });
      }

      // Cache store - for offline data
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      // Ads offline store
      if (!db.objectStoreNames.contains('ads')) {
        const adsStore = db.createObjectStore('ads', { keyPath: 'id' });
        adsStore.createIndex('updated_at', 'updated_at', { unique: false });
        adsStore.createIndex('advertiser_id', 'advertiser_id', { unique: false });
      }

      // Saved ads offline store
      if (!db.objectStoreNames.contains('savedAds')) {
        const savedStore = db.createObjectStore('savedAds', { keyPath: 'id' });
        savedStore.createIndex('ad_id', 'ad_id', { unique: false });
      }
    };
  });
}

// ============ SYNC QUEUE OPERATIONS ============

export async function addToSyncQueue(
  table: string,
  operation: SyncQueueItem['operation'],
  data: Record<string, unknown>
): Promise<string> {
  const db = await openDatabase();
  const id = crypto.randomUUID();
  
  const item: SyncQueueItem = {
    id,
    table,
    operation,
    data,
    timestamp: Date.now(),
    retries: 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const request = store.add(item);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('timestamp');
    const request = index.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        const updated = { ...item, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ============ CACHE OPERATIONS ============

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const db = await openDatabase();
  
  const item: CachedData = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (ttlSeconds * 1000)
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const request = store.put(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const request = store.get(key);
    
    request.onsuccess = () => {
      const item = request.result as CachedData | undefined;
      if (item && item.expiresAt > Date.now()) {
        resolve(item.data as T);
      } else {
        // Expired or not found
        if (item) {
          // Clean up expired item
          const deleteTx = db.transaction('cache', 'readwrite');
          deleteTx.objectStore('cache').delete(key);
        }
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearExpiredCache(): Promise<number> {
  const db = await openDatabase();
  const now = Date.now();
  let count = 0;
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('expiresAt');
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        count++;
        cursor.continue();
      }
    };
    
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
  });
}

// ============ GENERIC STORE OPERATIONS ============

export async function saveToStore<T extends { id: string }>(
  storeName: string,
  data: T
): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveMultipleToStore<T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============ STATS ============

export async function getOfflineStats(): Promise<{
  syncQueueSize: number;
  cachedItems: number;
  offlineAds: number;
}> {
  const db = await openDatabase();
  
  const getCount = (storeName: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };
  
  const [syncQueueSize, cachedItems, offlineAds] = await Promise.all([
    getCount('syncQueue'),
    getCount('cache'),
    getCount('ads')
  ]);
  
  return { syncQueueSize, cachedItems, offlineAds };
}
