/**
 * Mobile Catalogue and Menu data layer.
 *
 * Provides store products, stock management, and live order subscriptions
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
  type Order,
  type Product,
} from '@dfc/core';

import { db, isConfigured } from './firebase';

// In-memory products store for mobile offline mode
let localProducts: Product[] = [...SEED_PRODUCTS];
const productListeners = new Set<(products: Product[]) => void>();

function notifyProductListeners() {
  for (const fn of productListeners) {
    fn([...localProducts]);
  }
}

/**
 * Fetch all products for a specific store.
 */
export async function getStoreProducts(storeId: string): Promise<Product[]> {
  if (!isConfigured) {
    return localProducts.filter((p) => p.storeId === storeId);
  }
  try {
    const q = query(
      collection(db(), COL.products),
      where('storeId', '==', storeId),
      orderBy('name'),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return localProducts.filter((p) => p.storeId === storeId);
    }
    return snap.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));
  } catch (err) {
    console.warn('Failed to fetch live products, fallback to mock:', err);
    return localProducts.filter((p) => p.storeId === storeId);
  }
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

  if (!isConfigured) return;

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
  if (!isConfigured) {
    const filtered = () =>
      onData(localProducts.filter((p) => !storeId || p.storeId === storeId));
    filtered();
    const listener = () => filtered();
    productListeners.add(listener);
    return () => {
      productListeners.delete(listener);
    };
  }

  try {
    const q = query(
      collection(db(), COL.products),
      where('storeId', '==', storeId),
      orderBy('name'),
    );
    return onSnapshot(
      q,
      (s) => {
        if (s.empty) {
          onData(localProducts.filter((p) => p.storeId === storeId));
        } else {
          onData(s.docs.map((d) => ({ ...(d.data() as Product), id: d.id })));
        }
      },
      (e) => {
        onError?.(e);
        onData(localProducts.filter((p) => p.storeId === storeId));
      },
    );
  } catch {
    onData(localProducts.filter((p) => p.storeId === storeId));
    return () => {};
  }
}

/**
 * Subscribes to live incoming/active orders for a specific store (KDS view).
 */
export function subscribeStoreOrders(
  storeId: string,
  onData: (orders: Order[]) => void,
): Unsubscribe {
  if (!isConfigured) {
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
