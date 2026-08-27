'use client';

/**
 * Every Firestore write the admin board makes.
 *
 * All of them funnel through @dfc/core's pure helpers, so the state machine is
 * enforced once and the same rules apply on mobile.
 */

import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  COL,
  ORDER_CODE_COUNTER,
  OPEN_STATUSES,
  assignRider as coreAssignRider,
  assignStore as coreAssignStore,
  blankOrder,
  computePricing,
  setItemPrice as coreSetItemPrice,
  toggleItem as coreToggleItem,
  withDeliveryFee as coreWithDeliveryFee,
  withStatus,
  type ConciergeStop,
  type Order,
  type OrderStatus,
  type Payment,
  type Rider,
  type Store,
  type UserProfile,
} from '@dfc/core';

import { db } from './firebase';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * How far back the board looks. Anything older than this that is still open is
 * a stuck order, and belongs in a report rather than on a wall display.
 */
export const BOARD_WINDOW_HOURS = 48;

/**
 * Hard ceiling on the live set. Firestore streams every matching document and
 * keeps them in memory; without a cap, one bad week silently turns the board
 * into a several-thousand-document subscription that re-renders on every
 * write. If this ever truncates, ops has a bigger problem than the board.
 */
export const BOARD_MAX_ORDERS = 300;

/**
 * The board's single live query. One subscription for all four columns —
 * splitting per column would cost four listeners and four index reads for
 * the same working set.
 *
 * Bounded twice, by age and by count, so cost and render time stay flat as
 * volume grows instead of scaling with lifetime order count.
 */
export function subscribeBoard(
  onData: (orders: Order[], truncated: boolean) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const since = Date.now() - BOARD_WINDOW_HOURS * 60 * 60 * 1000;
  const q = query(
    collection(db(), COL.orders),
    where('status', 'in', OPEN_STATUSES),
    where('createdAt', '>=', since),
    orderBy('createdAt', 'desc'),
    limit(BOARD_MAX_ORDERS),
  );
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id })),
        snap.size >= BOARD_MAX_ORDERS,
      ),
    (err) => onError?.(err),
  );
}

export function subscribeOrder(
  orderId: string,
  onData: (order: Order | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db(), COL.orders, orderId), (snap) =>
    onData(snap.exists() ? ({ ...(snap.data() as Order), id: snap.id }) : null),
  );
}

/** The newest payment attempt on an order, for the reconciliation panel. */
export function subscribePaymentFor(
  orderId: string,
  onData: (p: Payment | null) => void,
): Unsubscribe {
  const q = query(
    collection(db(), COL.payments),
    where('orderId', '==', orderId),
    orderBy('createdAt', 'desc'),
    limit(1),
  );
  return onSnapshot(
    q,
    (s) => onData(s.empty ? null : { ...(s.docs[0]!.data() as Payment), id: s.docs[0]!.id }),
    () => onData(null),
  );
}

export function subscribeRiders(onData: (riders: Rider[]) => void): Unsubscribe {
  return onSnapshot(collection(db(), COL.riders), (snap) =>
    onData(snap.docs.map((d) => d.data() as Rider)),
  );
}

export function subscribeStores(onData: (stores: Store[]) => void): Unsubscribe {
  return onSnapshot(collection(db(), COL.stores), (snap) =>
    onData(snap.docs.map((d) => ({ ...(d.data() as Store), id: d.id }))),
  );
}

async function readOrder(orderId: string): Promise<Order> {
  const snap = await getDoc(doc(db(), COL.orders, orderId));
  if (!snap.exists()) throw new Error(`Order ${orderId} is gone.`);
  return { ...(snap.data() as Order), id: snap.id };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Moves an order. Re-reads first so two admins clicking at once cannot apply a
 * transition against stale state — the rules would reject it anyway, this just
 * gives a clean error instead of a permission denial.
 */
export async function moveOrder(
  orderId: string,
  to: OrderStatus,
  adminUid: string,
  note?: string,
): Promise<void> {
  const order = await readOrder(orderId);
  if (order.status === to) return;
  const patch = withStatus(order, to, 'admin', adminUid, note);
  await updateDoc(doc(db(), COL.orders, orderId), patch);
}

export async function setDeliveryFee(orderId: string, paise: number): Promise<void> {
  const order = await readOrder(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreWithDeliveryFee(order, paise));
}

export async function setItemPrice(
  orderId: string,
  itemId: string,
  paise: number | null,
): Promise<void> {
  const order = await readOrder(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreSetItemPrice(order, itemId, paise));
}

export async function toggleItem(orderId: string, itemId: string): Promise<void> {
  const order = await readOrder(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreToggleItem(order, itemId));
}

export async function setStore(orderId: string, storeId: string): Promise<void> {
  const order = await readOrder(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreAssignStore(order, storeId));
}

/** Assign a rider and push the order to `dispatched` in one write. */
export async function dispatchToRider(
  orderId: string,
  rider: Rider,
  adminUid: string,
): Promise<void> {
  const order = await readOrder(orderId);
  const assign = coreAssignRider(order, rider.uid, rider.name);
  const move =
    order.status === 'ready_for_pickup'
      ? withStatus(order, 'dispatched', 'admin', adminUid)
      : {};
  await updateDoc(doc(db(), COL.orders, orderId), { ...assign, ...move });
  await updateDoc(doc(db(), COL.riders, rider.uid), { activeOrderId: orderId });
}

/** Concierge: confirm a stop's availability and its cost, then reprice. */
export async function updateStop(
  orderId: string,
  stopId: string,
  patch: Partial<Pick<ConciergeStop, 'available' | 'costPaise'>>,
): Promise<void> {
  const order = await readOrder(orderId);
  const stops = (order.stops ?? []).map((s) => (s.id === stopId ? { ...s, ...patch } : s));
  const pricing = computePricing({
    items: order.items,
    stops,
    deliveryPaise: order.pricing.deliveryPaise,
    servicePaise: order.pricing.servicePaise,
  });
  await updateDoc(doc(db(), COL.orders, orderId), { stops, pricing, updatedAt: Date.now() });
}

/**
 * Price is agreed — send it to the customer. Prepaid orders wait for money;
 * COD skips straight to `paid` because there is nothing to collect up front.
 */
export async function sendPriceToCustomer(orderId: string, adminUid: string): Promise<void> {
  const order = await readOrder(orderId);
  const patch = withStatus(order, 'awaiting_payment', 'admin', adminUid, 'Price sent');
  await updateDoc(doc(db(), COL.orders, orderId), {
    ...patch,
    paymentStatus: order.paymentMode === 'prepaid' ? 'link_sent' : 'unpaid',
    'pricing.pricedBy': adminUid,
    'pricing.pricedAt': Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/**
 * Short order codes come from a single counter doc, bumped in a transaction.
 * Firestore auto-ids are fine for the document, but "#1042" is what people say
 * on the phone.
 */
export async function nextOrderCode(): Promise<number> {
  const ref = doc(db(), ORDER_CODE_COUNTER);
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? ((snap.data().value as number) ?? 1000) : 1000;
    const next = current + 1;
    tx.set(ref, { value: next }, { merge: true });
    return next;
  });
}

export async function createManualOrder(customer: UserProfile): Promise<string> {
  const code = await nextOrderCode();
  const ref = doc(collection(db(), COL.orders));
  const order = blankOrder(ref.id, code, customer);
  await setDoc(ref, order);
  return ref.id;
}
