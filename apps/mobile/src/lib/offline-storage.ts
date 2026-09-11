/**
 * Local Persistence & Offline Transaction Sync Queue.
 *
 * Persists pending mutations (order state changes, chat messages, stock toggles,
 * rider telemetry updates) into AsyncStorage so the app remains 100% resilient
 * offline or disconnected from Firebase, and automatically syncs when online.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type MutationType =
  | 'create_order'
  | 'update_order_status'
  | 'add_item'
  | 'toggle_item'
  | 'remove_item'
  | 'send_message'
  | 'toggle_product'
  | 'rider_advance'
  | 'rider_complete'
  | 'report_delay'
  | 'cancel_order';

export interface OfflineMutation {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

const MUTATION_QUEUE_KEY = 'dfc_offline_mutations_queue';
const CACHE_PREFIX = 'dfc_cache_';

/**
 * Enqueues a transaction for local persistence and future background sync.
 */
export async function queueOfflineMutation(
  type: MutationType,
  payload: Record<string, unknown>,
): Promise<OfflineMutation> {
  const mutation: OfflineMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  try {
    const existing = await getPendingMutations();
    const updated = [...existing, mutation];
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to queue offline mutation to AsyncStorage:', err);
  }

  return mutation;
}

/**
 * Retrieves all pending offline mutations awaiting sync.
 */
export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineMutation[];
  } catch {
    return [];
  }
}

/**
 * Marks a specific mutation's sync status in storage.
 */
export async function updateMutationStatus(
  mutationId: string,
  status: OfflineMutation['status'],
  error?: string,
): Promise<void> {
  try {
    const queue = await getPendingMutations();
    const updated = queue.map((m) => {
      if (m.id !== mutationId) return m;
      return {
        ...m,
        status,
        ...(error ? { error } : {}),
        retryCount: status === 'failed' ? m.retryCount + 1 : m.retryCount,
      };
    });
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update mutation status:', err);
  }
}

/**
 * Purges successfully synced mutations from the queue.
 */
export async function clearSyncedMutations(): Promise<void> {
  try {
    const queue = await getPendingMutations();
    const pendingOnly = queue.filter((m) => m.status !== 'synced');
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(pendingOnly));
  } catch (err) {
    console.warn('Failed to clear synced mutations:', err);
  }
}

/**
 * Flushes all pending mutations through a dispatcher function.
 * Called automatically upon network reconnect or Firebase link.
 */
export async function flushOfflineQueue(
  dispatcher: (mutation: OfflineMutation) => Promise<boolean>,
): Promise<{ synced: number; failed: number }> {
  const queue = await getPendingMutations();
  const pending = queue.filter((m) => m.status === 'pending' || m.status === 'failed');

  let synced = 0;
  let failed = 0;

  for (const m of pending) {
    await updateMutationStatus(m.id, 'syncing');
    try {
      const ok = await dispatcher(m);
      if (ok) {
        await updateMutationStatus(m.id, 'synced');
        synced++;
      } else {
        await updateMutationStatus(m.id, 'failed', 'Dispatcher returned false');
        failed++;
      }
    } catch (err) {
      await updateMutationStatus(m.id, 'failed', (err as Error).message);
      failed++;
    }
  }

  await clearSyncedMutations();
  return { synced, failed };
}

/**
 * Fast key-value local cache helper for offline reads.
 */
export async function cacheEntity<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch {
    // Non-critical cache error
  }
}

/**
 * Retrieves a locally cached entity if available.
 */
export async function getCachedEntity<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
