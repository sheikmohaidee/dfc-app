'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  COL,
  blankPromotion,
  createProduct,
  type CreateProductInput,
  type Product,
  type Promotion,
} from '@dfc/core';

import { db, isConfigured } from './firebase';
import { mockStore } from './mock-store';

// ---------------------------------------------------------------------------
// Catalogue and stock
// ---------------------------------------------------------------------------

export function subscribeProducts(
  onData: (p: Product[]) => void,
  _onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const notify = () => onData(mockStore.getProducts());
    notify();
    return mockStore.subscribe(notify);
  }

  try {
    return onSnapshot(
      query(collection(db(), COL.products), orderBy('name')),
      (s) => {
        if (s.empty) {
          onData(mockStore.getProducts());
        } else {
          onData(s.docs.map((d) => ({ ...(d.data() as Product), id: d.id })));
        }
      },
      (e) => {
        console.warn('Firebase subscribeProducts error, fallback to mock:', e);
        const notify = () => onData(mockStore.getProducts());
        notify();
        return mockStore.subscribe(notify);
      },
    );
  } catch {
    const notify = () => onData(mockStore.getProducts());
    notify();
    return mockStore.subscribe(notify);
  }
}

export async function addProduct(input: CreateProductInput): Promise<string> {
  if (!isConfigured) {
    return mockStore.addProduct(input);
  }
  try {
    const prod = createProduct(input);
    await setDoc(doc(db(), COL.products, prod.id), prod);
    return prod.id;
  } catch {
    return mockStore.addProduct(input);
  }
}

export async function saveProduct(product: Product): Promise<void> {
  if (!isConfigured) {
    mockStore.patchProduct(product.id, product);
    return;
  }
  try {
    await setDoc(doc(db(), COL.products, product.id), { ...product, updatedAt: Date.now() });
  } catch {
    mockStore.patchProduct(product.id, product);
  }
}

export async function patchProduct(id: string, patch: Partial<Product>): Promise<void> {
  if (!isConfigured) {
    mockStore.patchProduct(id, patch);
    return;
  }
  try {
    await updateDoc(doc(db(), COL.products, id), { ...patch, updatedAt: Date.now() });
  } catch {
    mockStore.patchProduct(id, patch);
  }
}

/** Stock counts change by delta far more often than they are set outright. */
export async function adjustStock(id: string, delta: number, current: number): Promise<void> {
  await patchProduct(id, { stockQty: Math.max(0, current + delta) });
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isConfigured) {
    mockStore.deleteProduct(id);
    return;
  }
  try {
    await deleteDoc(doc(db(), COL.products, id));
  } catch {
    mockStore.deleteProduct(id);
  }
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export function subscribePromotions(
  onData: (p: Promotion[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    onData([]);
    return () => {};
  }
  try {
    return onSnapshot(
      query(collection(db(), COL.promotions), orderBy('createdAt', 'desc')),
      (s) => onData(s.docs.map((d) => ({ ...(d.data() as Promotion), id: d.id }))),
      (e) => onError?.(e),
    );
  } catch {
    onData([]);
    return () => {};
  }
}

export async function createPromotion(adminUid: string): Promise<string> {
  if (!isConfigured) return 'mock-promo';
  const ref = doc(collection(db(), COL.promotions));
  await setDoc(ref, blankPromotion(ref.id, adminUid));
  return ref.id;
}

export async function savePromotion(promo: Promotion): Promise<void> {
  if (!isConfigured) return;
  await setDoc(doc(db(), COL.promotions, promo.id), { ...promo, updatedAt: Date.now() });
}

export async function patchPromotion(id: string, patch: Partial<Promotion>): Promise<void> {
  if (!isConfigured) return;
  await updateDoc(doc(db(), COL.promotions, id), { ...patch, updatedAt: Date.now() });
}

export async function deletePromotion(id: string): Promise<void> {
  if (!isConfigured) return;
  await deleteDoc(doc(db(), COL.promotions, id));
}
