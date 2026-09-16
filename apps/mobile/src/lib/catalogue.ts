/**
 * Mobile Catalogue and Menu data layer.
 *
 * Provides store products, stock management, store listings, and live order subscriptions
 * with graceful offline mock fallbacks for standalone execution.
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  COL,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_STORES,
  type Category,
  type Order,
  type Product,
  type Store,
} from '@dfc/core';

import { db, isConfigured } from './firebase';
import { DEMO_MODE } from '@/demo/config';

// In-memory products store for mobile offline mode
let localProducts: Product[] = [...SEED_PRODUCTS];
const productListeners = new Set<(products: Product[]) => void>();

function notifyProductListeners() {
  for (const fn of productListeners) {
    fn([...localProducts]);
  }
}

function toStore(s: any): Store {
  return {
    ...s,
    ownerUid: s.ownerUid ?? null,
    isOpen: s.isOpen ?? true,
    avgPrepMinutes: s.avgPrepMinutes ?? 15,
  };
}

const fallbackStores: Store[] = SEED_STORES.map(toStore);

/**
 * Fetch all stores (optionally filtered by category).
 */
export async function getLiveStores(category?: Category): Promise<Store[]> {
  if (DEMO_MODE || !isConfigured) {
    return category ? fallbackStores.filter((s) => s.category === category) : fallbackStores;
  }
  try {
    const constraints: any[] = [];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    const q = query(collection(db(), COL.stores), ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) {
      return category ? fallbackStores.filter((s) => s.category === category) : fallbackStores;
    }
    return snap.docs.map((d) => ({ ...(d.data() as Store), id: d.id }));
  } catch (err) {
    console.warn('Failed to fetch live stores, fallback to mock:', err);
    return category ? fallbackStores.filter((s) => s.category === category) : fallbackStores;
  }
}

/**
 * Subscribe to stores in real-time.
 */
export function subscribeStores(
  onData: (stores: Store[]) => void,
  category?: Category,
  onError?: (e: Error) => void,
): Unsubscribe {
  const fallback = () => {
    onData(category ? fallbackStores.filter((s) => s.category === category) : fallbackStores);
  };

  if (DEMO_MODE || !isConfigured) {
    fallback();
    return () => {};
  }

  try {
    const constraints: any[] = [];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    const q = query(collection(db(), COL.stores), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          fallback();
        } else {
          onData(snap.docs.map((d) => ({ ...(d.data() as Store), id: d.id })));
        }
      },
      (err) => {
        onError?.(err);
        fallback();
      },
    );
  } catch (err) {
    fallback();
    return () => {};
  }
}

/**
 * Fetch all products (optionally filtered by category or store).
 */
export async function getLiveProducts(category?: Category, storeId?: string): Promise<Product[]> {
  const filterMock = () =>
    localProducts.filter(
      (p) => (!category || p.category === category) && (!storeId || p.storeId === storeId),
    );

  if (DEMO_MODE || !isConfigured) {
    return filterMock();
  }

  try {
    const constraints: any[] = [];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    if (storeId) {
      constraints.push(where('storeId', '==', storeId));
    }
    const q = query(collection(db(), COL.products), ...constraints);
    const snap = await getDocs(q);
    if (snap.empty) {
      return filterMock();
    }
    return snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
  } catch (err) {
    console.warn('Failed to fetch live products, fallback to mock:', err);
    return filterMock();
  }
}

/**
 * Subscribe to products in real-time.
 */
export function subscribeProducts(
  onData: (products: Product[]) => void,
  category?: Category,
  storeId?: string,
  onError?: (e: Error) => void,
): Unsubscribe {
  const filterMock = () =>
    localProducts.filter(
      (p) => (!category || p.category === category) && (!storeId || p.storeId === storeId),
    );

  if (DEMO_MODE || !isConfigured) {
    onData(filterMock());
    const listener = () => onData(filterMock());
    productListeners.add(listener);
    return () => {
      productListeners.delete(listener);
    };
  }

  try {
    const constraints: any[] = [];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    if (storeId) {
      constraints.push(where('storeId', '==', storeId));
    }
    const q = query(collection(db(), COL.products), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onData(filterMock());
        } else {
          onData(snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id })));
        }
      },
      (err) => {
        onError?.(err);
        onData(filterMock());
      },
    );
  } catch (err) {
    onData(filterMock());
    return () => {};
  }
}

/**
 * Fetch all products for a specific store.
 */
export async function getStoreProducts(storeId: string): Promise<Product[]> {
  return getLiveProducts(undefined, storeId);
}

/**
 * Update a product's properties (e.g. stock toggle 86'd / in-stock).
 */
export async function patchProduct(
  productId: string,
  patch: Partial<Product>,
): Promise<void> {
  // Update local memory state immediately
  localProducts = localProducts.map((p) =>
    p.id === productId ? { ...p, ...patch, updatedAt: Date.now() } : p,
  );
  notifyProductListeners();

  if (DEMO_MODE || !isConfigured) return;

  try {
    await updateDoc(doc(db(), COL.products, productId), {
      ...patch,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Failed to patch live product:', err);
  }
}

/**
 * Subscribes to products for a vendor's menu screen.
 */
export function vendorSubscribeProducts(
  storeId: string,
  onData: (products: Product[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return subscribeProducts(onData, undefined, storeId, onError);
}

/**
 * Subscribes to live incoming/active orders for a specific store (KDS view).
 */
export function subscribeStoreOrders(
  storeId: string,
  onData: (orders: Order[]) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    const matching = SEED_ORDERS.filter((o) => !storeId || o.storeId === storeId);
    onData(matching.length > 0 ? matching : SEED_ORDERS);
    return () => {};
  }

  try {
    const q = query(
      collection(db(), COL.orders),
      where('storeId', '==', storeId),
      where('status', 'in', [
        'paid',
        'vendor_accepted',
        'packing',
        'ready_for_pickup',
        'dispatched',
      ]),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onData(SEED_ORDERS.filter((o) => !storeId || o.storeId === storeId));
        } else {
          onData(snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id })));
        }
      },
      () => {
        onData(SEED_ORDERS.filter((o) => !storeId || o.storeId === storeId));
      },
    );
  } catch {
    onData(SEED_ORDERS.filter((o) => !storeId || o.storeId === storeId));
    return () => {};
  }
}
