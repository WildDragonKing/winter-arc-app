/**
 * Offline Mutation Queue
 *
 * Handles failed mutations when offline and retries when connection is restored
 * Uses IndexedDB for persistence across sessions
 */

interface QueuedMutation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'winter_arc_offline';
const STORE_NAME = 'mutation_queue';
const MAX_RETRIES = 3;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Add mutation to queue
 */
export async function queueMutation(type: string, data: any): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const mutation: QueuedMutation = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await store.add(mutation);
    console.info('[Offline Queue] Mutation queued:', type);
  } catch (error) {
    console.error('[Offline Queue] Failed to queue mutation:', error);
  }
}

/**
 * Get all queued mutations
 */
export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline Queue] Failed to get mutations:', error);
    return [];
  }
}

/**
 * Remove mutation from queue
 */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.delete(id);
  } catch (error) {
    console.error('[Offline Queue] Failed to remove mutation:', error);
  }
}

/**
 * Update mutation retry count
 */
async function updateRetryCount(id: string, retries: number): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);
    request.onsuccess = () => {
      const mutation = request.result;
      if (mutation) {
        mutation.retries = retries;
        store.put(mutation);
      }
    };
  } catch (error) {
    console.error('[Offline Queue] Failed to update retry count:', error);
  }
}

/**
 * Process queued mutations
 */
export async function processQueue(
  handler: (type: string, data: any) => Promise<void>
): Promise<void> {
  const mutations = await getQueuedMutations();

  for (const mutation of mutations) {
    try {
      await handler(mutation.type, mutation.data);
      await removeMutation(mutation.id);
      console.info('[Offline Queue] Mutation processed:', mutation.type);
    } catch (error) {
      const newRetryCount = mutation.retries + 1;

      if (newRetryCount >= MAX_RETRIES) {
        await removeMutation(mutation.id);
        console.error('[Offline Queue] Mutation failed permanently:', mutation.type, error);
      } else {
        await updateRetryCount(mutation.id, newRetryCount);
        console.warn(
          `[Offline Queue] Mutation failed, retry ${newRetryCount}/${MAX_RETRIES}:`,
          mutation.type
        );
      }
    }
  }
}

/**
 * React Hook for online/offline status
 */
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * React Hook to auto-process queue when online
 */
export function useOfflineQueue(handler: (type: string, data: any) => Promise<void>): void {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      processQueue(handler).catch((error) => {
        console.error('[Offline Queue] Processing failed:', error);
      });
    }
  }, [isOnline, handler]);
}
