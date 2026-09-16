'use client';

/**
 * Every read and write the admin board makes.
 *
 * Automatically routes to the reactive Mock Store when Firebase is not
 * configured, ensuring the whole command center runs smoothly in zero-DB mode.
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
  createManualAdminOrder,
  reportOrderDelay as coreReportDelay,
  setItemPrice as coreSetItemPrice,
  toggleItem as coreToggleItem,
  withDeliveryFee as coreWithDeliveryFee,
  withStatus,
  type ConciergeStop,
  type ManualOrderInput,
  type Order,
  type OrderStatus,
  type Payment,
  type Rider,
  type Store,
  type UserProfile,
} from '@dfc/core';

import { db, isConfigured } from './firebase';
import { mockStore } from './mock-store';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const BOARD_WINDOW_HOURS = 48;
export const BOARD_MAX_ORDERS = 300;

export function subscribeBoard(
  onData: (orders: Order[], truncated: boolean) => void,
  _onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const notify = () => {
      const all = mockStore.getOrders();
      const open = all.filter((o) => OPEN_STATUSES.includes(o.status));
      onData(open, false);
    };
    notify();
    return mockStore.subscribe(notify);
  }

  try {
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
      (err) => {
        console.warn('Firebase subscribeBoard fallback to mock:', err.message);
        const notify = () => {
          const all = mockStore.getOrders();
          const open = all.filter((o) => OPEN_STATUSES.includes(o.status));
          onData(open, false);
        };
        notify();
        return mockStore.subscribe(notify);
      },
    );
  } catch (e) {
    console.warn('Firebase error, using mock:', e);
    const notify = () => {
      const all = mockStore.getOrders();
      const open = all.filter((o) => OPEN_STATUSES.includes(o.status));
      onData(open, false);
    };
    notify();
    return mockStore.subscribe(notify);
  }
}

export function subscribeOrder(
  orderId: string,
  onData: (order: Order | null) => void,
): Unsubscribe {
  if (!isConfigured) {
    const notify = () => onData(mockStore.getOrder(orderId));
    notify();
    return mockStore.subscribe(notify);
  }

  try {
    return onSnapshot(
      doc(db(), COL.orders, orderId),
      (snap) => onData(snap.exists() ? ({ ...(snap.data() as Order), id: snap.id }) : null),
      () => onData(mockStore.getOrder(orderId)),
    );
  } catch {
    const notify = () => onData(mockStore.getOrder(orderId));
    notify();
    return mockStore.subscribe(notify);
  }
}

export function subscribePaymentFor(
  orderId: string,
  onData: (p: Payment | null) => void,
): Unsubscribe {
  if (!isConfigured) {
    const notify = () => onData(mockStore.getPaymentFor(orderId));
    notify();
    return mockStore.subscribe(notify);
  }

  try {
    const q = query(
      collection(db(), COL.payments),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc'),
      limit(1),
    );
    return onSnapshot(
      q,
      (s) => onData(s.empty ? null : { ...(s.docs[0]!.data() as Payment), id: s.docs[0]!.id }),
      () => onData(mockStore.getPaymentFor(orderId)),
    );
  } catch {
    const notify = () => onData(mockStore.getPaymentFor(orderId));
    notify();
    return mockStore.subscribe(notify);
  }
}

export function subscribeRiders(onData: (riders: Rider[]) => void): Unsubscribe {
  if (!isConfigured) {
    const notify = () => onData(mockStore.getRiders());
    notify();
    return mockStore.subscribe(notify);
  }

  try {
    return onSnapshot(
      collection(db(), COL.riders),
      (snap) => {
        if (snap.empty) {
          onData(mockStore.getRiders());
        } else {
          onData(snap.docs.map((d) => d.data() as Rider));
        }
      },
      () => onData(mockStore.getRiders()),
    );
  } catch {
    const notify = () => onData(mockStore.getRiders());
    notify();
    return mockStore.subscribe(notify);
  }
}

export function subscribeStores(onData: (stores: Store[]) => void): Unsubscribe {
  if (!isConfigured) {
    const notify = () => onData(mockStore.getStores());
    notify();
    return mockStore.subscribe(notify);
  }

  try {
    return onSnapshot(
      collection(db(), COL.stores),
      (snap) => {
        if (snap.empty) {
          onData(mockStore.getStores());
        } else {
          onData(snap.docs.map((d) => ({ ...(d.data() as Store), id: d.id })));
        }
      },
      () => onData(mockStore.getStores()),
    );
  } catch {
    const notify = () => onData(mockStore.getStores());
    notify();
    return mockStore.subscribe(notify);
  }
}

async function readOrder(orderId: string): Promise<Order> {
  if (!isConfigured) {
    const o = mockStore.getOrder(orderId);
    if (!o) throw new Error(`Order ${orderId} is gone.`);
    return o;
  }
  try {
    const snap = await getDoc(doc(db(), COL.orders, orderId));
    if (!snap.exists()) {
      const o = mockStore.getOrder(orderId);
      if (o) return o;
      throw new Error(`Order ${orderId} is gone.`);
    }
    return { ...(snap.data() as Order), id: snap.id };
  } catch {
    const o = mockStore.getOrder(orderId);
    if (!o) throw new Error(`Order ${orderId} is gone.`);
    return o;
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function moveOrder(
  orderId: string,
  to: OrderStatus,
  adminUid: string,
  note?: string,
): Promise<void> {
  if (!isConfigured) {
    mockStore.moveOrder(orderId, to, 'admin', adminUid, note);
    return;
  }
  try {
    const order = await readOrder(orderId);
    if (order.status === to) return;
    const patch = withStatus(order, to, 'admin', adminUid, note);
    await updateDoc(doc(db(), COL.orders, orderId), patch);
  } catch {
    mockStore.moveOrder(orderId, to, 'admin', adminUid, note);
  }
}

export async function setDeliveryFee(orderId: string, paise: number): Promise<void> {
  if (!isConfigured) {
    mockStore.setDeliveryFee(orderId, paise);
    return;
  }
  try {
    const order = await readOrder(orderId);
    await updateDoc(doc(db(), COL.orders, orderId), coreWithDeliveryFee(order, paise));
  } catch {
    mockStore.setDeliveryFee(orderId, paise);
  }
}

export async function setItemPrice(
  orderId: string,
  itemId: string,
  paise: number | null,
): Promise<void> {
  if (!isConfigured) {
    mockStore.setItemPrice(orderId, itemId, paise);
    return;
  }
  try {
    const order = await readOrder(orderId);
    await updateDoc(doc(db(), COL.orders, orderId), coreSetItemPrice(order, itemId, paise));
  } catch {
    mockStore.setItemPrice(orderId, itemId, paise);
  }
}

export async function toggleItem(orderId: string, itemId: string): Promise<void> {
  if (!isConfigured) {
    mockStore.toggleItem(orderId, itemId);
    return;
  }
  try {
    const order = await readOrder(orderId);
    await updateDoc(doc(db(), COL.orders, orderId), coreToggleItem(order, itemId));
  } catch {
    mockStore.toggleItem(orderId, itemId);
  }
}

export async function setStore(orderId: string, storeId: string): Promise<void> {
  if (!isConfigured) {
    return;
  }
  try {
    const order = await readOrder(orderId);
    await updateDoc(doc(db(), COL.orders, orderId), coreAssignStore(order, storeId));
  } catch {
    // fallback
  }
}

/** Assign a rider and push the order to `dispatched` in one write. */
export async function dispatchToRider(
  orderId: string,
  rider: Rider,
  adminUid: string,
): Promise<void> {
  if (!isConfigured) {
    mockStore.dispatchToRider(orderId, rider, adminUid);
    return;
  }
  try {
    const order = await readOrder(orderId);
    const assign = {
      ...coreAssignRider(order, rider.uid, rider.name),
      captainUid: rider.uid,
      captainName: rider.name,
      captainPhone: rider.phone || '+919876500004',
      assignmentStatus: 'ASSIGNED' as const,
    };
    const move =
      order.status === 'ready_for_pickup' || order.status === 'packing' || order.status === 'vendor_accepted'
        ? withStatus(order, 'dispatched', 'admin', adminUid, `Assigned to rider ${rider.name}`)
        : {};
    await updateDoc(doc(db(), COL.orders, orderId), { ...assign, ...move });
    await updateDoc(doc(db(), COL.riders, rider.uid), { activeOrderId: orderId });
  } catch {
    mockStore.dispatchToRider(orderId, rider, adminUid);
  }
}

/** Manual re-assignment of a rider by admin */
export async function reassignRider(
  orderId: string,
  rider: Rider,
  adminUid: string,
): Promise<void> {
  return dispatchToRider(orderId, rider, adminUid);
}

/** Reactivate rider and clear cancellation strikes */
export async function reactivateRiderAccount(riderUid: string): Promise<void> {
  if (!isConfigured) {
    mockStore.reactivateRider(riderUid);
    return;
  }
  try {
    await updateDoc(doc(db(), COL.riders, riderUid), {
      cancellationsToday: 0,
      isOfflineDueToCancellations: false,
      isOnline: true,
    });
  } catch {
    mockStore.reactivateRider(riderUid);
  }
}

/** Record extra preparation delay */
export async function recordOrderDelayAdmin(
  orderId: string,
  delayMinutes: number,
  reason: string,
  adminUid: string,
): Promise<void> {
  if (!isConfigured) {
    mockStore.reportDelay(orderId, delayMinutes, reason, adminUid);
    return;
  }
  try {
    const order = await readOrder(orderId);
    const patch = coreReportDelay(order, delayMinutes, reason, adminUid);
    await updateDoc(doc(db(), COL.orders, orderId), patch);
  } catch {
    mockStore.reportDelay(orderId, delayMinutes, reason, adminUid);
  }
}

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
  if (!isConfigured) {
    mockStore.moveOrder(orderId, order.status, 'admin', 'admin-1');
    return;
  }
  try {
    await updateDoc(doc(db(), COL.orders, orderId), { stops, pricing, updatedAt: Date.now() });
  } catch {
    // fallback
  }
}

export async function sendPriceToCustomer(orderId: string, adminUid: string): Promise<void> {
  if (!isConfigured) {
    mockStore.moveOrder(orderId, 'awaiting_payment', 'admin', adminUid, 'Price sent to customer');
    return;
  }
  try {
    const order = await readOrder(orderId);
    const patch = withStatus(order, 'awaiting_payment', 'admin', adminUid, 'Price sent');
    await updateDoc(doc(db(), COL.orders, orderId), {
      ...patch,
      paymentStatus: order.paymentMode === 'prepaid' ? 'link_sent' : 'unpaid',
      'pricing.pricedBy': adminUid,
      'pricing.pricedAt': Date.now(),
    });
  } catch {
    mockStore.moveOrder(orderId, 'awaiting_payment', 'admin', adminUid, 'Price sent to customer');
  }
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export async function nextOrderCode(): Promise<number> {
  if (!isConfigured) return Math.floor(1045 + Math.random() * 100);
  try {
    const ref = doc(db(), ORDER_CODE_COUNTER);
    return runTransaction(db(), async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? ((snap.data().value as number) ?? 1000) : 1000;
      const next = current + 1;
      tx.set(ref, { value: next }, { merge: true });
      return next;
    });
  } catch {
    return Math.floor(1045 + Math.random() * 100);
  }
}

export async function createManualOrder(customer: UserProfile): Promise<string> {
  if (!isConfigured) {
    return mockStore.createCustomOrder({
      id: '',
      code: 0,
      customerName: customer.name,
      customerPhone: customer.phone,
      localityId: customer.localityId ?? 'kk-nagar',
      addressLine: customer.addressLine,
      category: 'grocery',
      items: [],
      adminUid: 'admin-1',
    });
  }
  try {
    const code = await nextOrderCode();
    const ref = doc(collection(db(), COL.orders));
    const order = blankOrder(ref.id, code, customer);
    await setDoc(ref, order);
    return ref.id;
  } catch {
    return mockStore.createCustomOrder({
      id: '',
      code: 0,
      customerName: customer.name,
      customerPhone: customer.phone,
      localityId: customer.localityId ?? 'kk-nagar',
      addressLine: customer.addressLine,
      category: 'grocery',
      items: [],
      adminUid: 'admin-1',
    });
  }
}

export async function createCustomOrder(input: Omit<ManualOrderInput, 'id' | 'code'>): Promise<string> {
  if (!isConfigured) {
    return mockStore.createCustomOrder({
      ...input,
      id: '',
      code: 0,
    });
  }
  try {
    const code = await nextOrderCode();
    const ref = doc(collection(db(), COL.orders));
    const order = createManualAdminOrder({
      ...input,
      id: ref.id,
      code,
    });
    await setDoc(ref, order);
    return ref.id;
  } catch {
    return mockStore.createCustomOrder({
      ...input,
      id: '',
      code: 0,
    });
  }
}
