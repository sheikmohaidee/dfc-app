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
  type Product,
  type Promotion,
} from '@dfc/core';

import { db } from './firebase';

// ---------------------------------------------------------------------------
// Catalogue and stock
// ---------------------------------------------------------------------------

export function subscribeProducts(
  onData: (p: Product[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db(), COL.products), orderBy('name')),
    (s) => onData(s.docs.map((d) => ({ ...(d.data() as Product), id: d.id }))),
    (e) => onError?.(e),
  );
}

export async function saveProduct(product: Product): Promise<void> {
  await setDoc(doc(db(), COL.products, product.id), { ...product, updatedAt: Date.now() });
}

export async function patchProduct(id: string, patch: Partial<Product>): Promise<void> {
  await updateDoc(doc(db(), COL.products, id), { ...patch, updatedAt: Date.now() });
}

/** Stock counts change by delta far more often than they are set outright. */
export async function adjustStock(id: string, delta: number, current: number): Promise<void> {
  await patchProduct(id, { stockQty: Math.max(0, current + delta) });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db(), COL.products, id));
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export function subscribePromotions(
  onData: (p: Promotion[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db(), COL.promotions), orderBy('createdAt', 'desc')),
    (s) => onData(s.docs.map((d) => ({ ...(d.data() as Promotion), id: d.id }))),
    (e) => onError?.(e),
  );
}

export async function createPromotion(adminUid: string): Promise<string> {
  const ref = doc(collection(db(), COL.promotions));
  await setDoc(ref, blankPromotion(ref.id, adminUid));
  return ref.id;
}

export async function savePromotion(promo: Promotion): Promise<void> {
  await setDoc(doc(db(), COL.promotions, promo.id), { ...promo, updatedAt: Date.now() });
}

export async function patchPromotion(id: string, patch: Partial<Promotion>): Promise<void> {
  await updateDoc(doc(db(), COL.promotions, id), { ...patch, updatedAt: Date.now() });
}

export async function deletePromotion(id: string): Promise<void> {
  await deleteDoc(doc(db(), COL.promotions, id));
}
