/**
 * Order operations for mobile roles.
 *
 * Supports seamless Demo Mode via local mock repository without Firebase dependency,
 * while preserving future Firebase Firestore subscriptions & rules.
 */

import {
  addDoc,
  collection,
  deleteDoc,
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
  cancelOrderWithReason,
  confirmItem as coreConfirmItem,
  createProduct,
  draftOrderFromExtraction,
  markItemUnavailable as coreMarkUnavailable,
  messagesCol,
  recordRiderCancellation,
  reportOrderDelay,
  addItem as coreAddItem,
  editItem as coreEditItem,
  removeItem as coreRemoveItem,
  setItemQuantity as coreSetQuantity,
  toggleItem as coreToggleItem,
  withStatus,
  type AiExtraction,
  type AiTrace,
  type CreateProductInput,
  type Message,
  type MessageBody,
  type Order,
  type OrderSource,
  type OrderStatus,
  type Product,
  type Rider,
  type Role,
  type UserProfile,
} from '@dfc/core';

import { db, isConfigured } from './firebase';
import { queueOfflineMutation } from './offline-storage';
import { DEMO_MODE } from '@/demo/config';
import { demoStorage } from '@/demo/storage';
import { mockOrderRepository } from '@/demo/repositories/order.repository';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const toOrder = (id: string, data: unknown): Order => ({ ...(data as Order), id });

const CUSTOMER_HISTORY = 30;
const STORE_LIVE = 60;
const RIDER_LIVE = 10;
const THREAD_MESSAGES = 100;

/** Customer: my orders, newest first. */
export function subscribeMyOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    onData(demoStorage.getOrders());
    return demoStorage.subscribe(() => {
      onData(demoStorage.getOrders());
    });
  }

  const q = query(
    collection(db(), COL.orders),
    where('customerUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(CUSTOMER_HISTORY),
  );
  return onSnapshot(
    q,
    (s) => onData(s.docs.map((d) => toOrder(d.id, d.data()))),
    (e) => onError?.(e),
  );
}

/** Vendor: everything live for my store. */
export function subscribeStoreOrders(
  storeId: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    onData(demoStorage.getOrders());
    return demoStorage.subscribe(() => {
      onData(demoStorage.getOrders());
    });
  }

  const q = query(
    collection(db(), COL.orders),
    where('storeId', '==', storeId),
    where('status', 'in', ['paid', 'vendor_accepted', 'packing', 'ready_for_pickup', 'dispatched']),
    orderBy('createdAt', 'desc'),
    limit(STORE_LIVE),
  );
  return onSnapshot(
    q,
    (s) => onData(s.docs.map((d) => toOrder(d.id, d.data()))),
    (e) => onError?.(e),
  );
}

/** Rider: my assigned work. */
export function subscribeRiderOrders(
  uid: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    onData(demoStorage.getOrders());
    return demoStorage.subscribe(() => {
      onData(demoStorage.getOrders());
    });
  }

  const q = query(
    collection(db(), COL.orders),
    where('riderUid', '==', uid),
    where('status', 'in', ['dispatched', 'picked_up', 'out_for_delivery']),
    orderBy('createdAt', 'desc'),
    limit(RIDER_LIVE),
  );
  return onSnapshot(
    q,
    (s) => onData(s.docs.map((d) => toOrder(d.id, d.data()))),
    (e) => onError?.(e),
  );
}

export function subscribeRiderTasks(
  riderUid: string,
  onData: (active: Order | null, history: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    const all = demoStorage.getOrders();
    const active = all.find((o) => (o.status === 'dispatched' || o.status === 'picked_up') && (o.riderUid === riderUid || o.captainUid === riderUid)) ?? null;
    const history = all.filter((o) => (o.status === 'delivered' || o.status === 'cancelled') && (o.riderUid === riderUid || o.captainUid === riderUid));
    onData(active, history);
    return demoStorage.subscribe(() => {
      const updated = demoStorage.getOrders();
      const act = updated.find((o) => (o.status === 'dispatched' || o.status === 'picked_up') && (o.riderUid === riderUid || o.captainUid === riderUid)) ?? null;
      const hist = updated.filter((o) => (o.status === 'delivered' || o.status === 'cancelled') && (o.riderUid === riderUid || o.captainUid === riderUid));
      onData(act, hist);
    });
  }
  const q = query(
    collection(db(), COL.orders),
    where('riderUid', '==', riderUid),
    orderBy('createdAt', 'desc'),
    limit(15),
  );
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => toOrder(d.id, d.data()));
      const active = all.find((o) => o.status === 'dispatched' || o.status === 'picked_up') ?? null;
      const history = all.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
      onData(active, history);
    },
    (err) => onError?.(err),
  );
}

export function subscribeRiderProfile(
  riderUid: string,
  onData: (rider: Rider | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    const mockRider: Rider = {
      uid: riderUid,
      name: 'Captain Arun',
      phone: '+919876500002',
      isOnline: true,
      activeOrderId: null,
      cancellationsToday: 0,
      maxDailyCancellations: 2,
    };
    onData(mockRider);
    return () => {};
  }
  return onSnapshot(
    doc(db(), COL.riders, riderUid),
    (snap) => onData(snap.exists() ? (snap.data() as Rider) : null),
    (err) => onError?.(err),
  );
}

export function subscribeOrder(id: string, onData: (o: Order | null) => void): Unsubscribe {
  if (DEMO_MODE) {
    onData(demoStorage.getOrderById(id));
    return demoStorage.subscribe(() => {
      onData(demoStorage.getOrderById(id));
    });
  }

  return onSnapshot(doc(db(), COL.orders, id), (s) =>
    onData(s.exists() ? toOrder(s.id, s.data()) : null),
  );
}

export function subscribeMessages(
  orderId: string,
  onData: (m: Message[]) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db(), messagesCol(orderId)),
    orderBy('createdAt', 'desc'),
    limit(THREAD_MESSAGES),
  );
  return onSnapshot(q, (s) =>
    onData(s.docs.map((d) => ({ ...(d.data() as Message), id: d.id })).reverse()),
  );
}

async function read(id: string): Promise<Order> {
  if (DEMO_MODE) {
    const o = demoStorage.getOrderById(id);
    if (!o) throw new Error('Order not found');
    return o;
  }
  const snap = await getDoc(doc(db(), COL.orders, id));
  if (!snap.exists()) throw new Error('That order no longer exists.');
  return toOrder(snap.id, snap.data());
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

async function nextCode(): Promise<number> {
  const ref = doc(db(), ORDER_CODE_COUNTER);
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? ((snap.data().value as number) ?? 1000) : 1000;
    const next = current + 1;
    tx.set(ref, { value: next }, { merge: true });
    return next;
  });
}

export async function createOrderFromExtraction(args: {
  customer: UserProfile;
  extraction: AiExtraction;
  source: OrderSource;
  ai: AiTrace;
}): Promise<Order> {
  if (DEMO_MODE) {
    const storeName = args.extraction.storeHint || 'Amma Mess';
    const storeId = args.extraction.category === 'pharmacy' ? 'pharm-meenakshi' : 'rest-amma-mess';
    return mockOrderRepository.createDirectOrder({
      category: args.extraction.category,
      storeName,
      storeId,
      items: args.extraction.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        pricePaise: i.estimatedPriceRupees ? i.estimatedPriceRupees * 100 : 15000,
        flag: i.note,
      })),
      totalPaise:
        args.extraction.items.reduce(
          (s, i) => s + (i.estimatedPriceRupees ? i.estimatedPriceRupees * 100 : 15000) * i.quantity,
          0,
        ) + 3000,
      sourceKind: args.source.kind,
      transcript: args.source.transcript,
    });
  }

  const code = await nextCode();
  const ref = doc(collection(db(), COL.orders));
  const order = draftOrderFromExtraction({
    id: ref.id,
    code,
    customer: args.customer,
    extraction: args.extraction,
    source: args.source,
    ai: args.ai,
  });
  await setDoc(ref, order);
  return order;
}

export async function addMessage(orderId: string, body: MessageBody, author: 'user' | 'bot') {
  if (DEMO_MODE) return;
  await addDoc(collection(db(), messagesCol(orderId)), {
    threadId: orderId,
    author,
    body,
    createdAt: Date.now(),
  });
}

export async function sendMessage(
  orderId: string,
  sender: { uid: string; role: Role; name: string } | 'user' | 'bot',
  body: MessageBody,
): Promise<string> {
  if (DEMO_MODE) return 'mock-msg-id';
  const author = typeof sender === 'string' ? sender : (sender.role === 'customer' ? 'user' : 'bot');
  const payload: Record<string, unknown> = {
    orderId,
    threadId: orderId,
    author,
    body,
    createdAt: Date.now(),
  };
  if (typeof sender !== 'string') {
    payload.senderUid = sender.uid;
    payload.senderRole = sender.role;
    payload.senderName = sender.name;
  }
  const ref = await addDoc(collection(db(), messagesCol(orderId)), payload);
  return ref.id;
}

// ---------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------

export async function toggleItem(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  const change = coreToggleItem(o, itemId);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function setQuantity(
  orderId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const o = await read(orderId);
  const change = coreSetQuantity(o, itemId, quantity);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function editItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; unit?: string; quantity?: number; note?: string },
): Promise<void> {
  const o = await read(orderId);
  const change = coreEditItem(o, itemId, patch);
  if (Object.keys(change).length === 0) return;
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function addItem(
  orderId: string,
  input: { name: string; unit?: string; quantity?: number },
): Promise<void> {
  const o = await read(orderId);
  const change = coreAddItem(o, input);
  if (Object.keys(change).length === 0) return;
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function removeItem(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  const change = coreRemoveItem(o, itemId);
  if (Object.keys(change).length === 0) return;
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function cancelOrder(
  orderId: string,
  uid: string,
  role: Role,
  reason?: string,
): Promise<void> {
  const o = await read(orderId);
  const change = cancelOrderWithReason(o, role, uid, reason ?? 'Cancelled');
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

// ---------------------------------------------------------------------------
// Vendor actions
// ---------------------------------------------------------------------------

export async function vendorAccept(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  const change = withStatus(o, 'vendor_accepted', 'vendor', uid);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function vendorReject(orderId: string, uid: string, reason: string): Promise<void> {
  const o = await read(orderId);
  const change = withStatus(o, 'rejected', 'vendor', uid, reason);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function vendorStartPacking(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  const change = withStatus(o, 'packing', 'vendor', uid);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function vendorMarkReady(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  const change = withStatus(o, 'ready_for_pickup', 'vendor', uid);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function vendorReportDelay(
  orderId: string,
  delayMinutes: number,
  reason: string,
  uid: string,
): Promise<void> {
  const o = await read(orderId);
  const patch = reportOrderDelay(o, delayMinutes, reason, uid);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...patch } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), patch);
}

export async function vendorConfirmItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; pricePaise?: number } = {},
): Promise<void> {
  const o = await read(orderId);
  const change = coreConfirmItem(o, itemId, patch);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function vendorMarkUnavailable(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  const change = coreMarkUnavailable(o, itemId);
  if (DEMO_MODE) {
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

// ---------------------------------------------------------------------------
// Vendor Catalogue / Menu Management
// ---------------------------------------------------------------------------

export function vendorSubscribeProducts(
  storeId: string,
  onData: (products: Product[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db(), COL.products),
    where('storeId', '==', storeId),
    orderBy('name'),
  );
  return onSnapshot(
    q,
    (s) => onData(s.docs.map((d) => ({ ...(d.data() as Product), id: d.id }))),
    (e) => onError?.(e),
  );
}

export async function vendorAddProduct(input: CreateProductInput): Promise<string> {
  if (DEMO_MODE || !isConfigured) return 'mock-prod';
  const prod = createProduct(input);
  await setDoc(doc(db(), COL.products, prod.id), prod);
  return prod.id;
}

export async function vendorToggleProduct(productId: string, isActive: boolean): Promise<void> {
  if (DEMO_MODE || !isConfigured) return;
  await updateDoc(doc(db(), COL.products, productId), { isActive, updatedAt: Date.now() });
}

export async function vendorDeleteProduct(productId: string): Promise<void> {
  if (DEMO_MODE || !isConfigured) return;
  await deleteDoc(doc(db(), COL.products, productId));
}

// ---------------------------------------------------------------------------
// Rider actions
// ---------------------------------------------------------------------------

export async function riderAdvance(
  orderId: string,
  to: OrderStatus,
  uid: string,
): Promise<void> {
  if (DEMO_MODE || !isConfigured) {
    void queueOfflineMutation('rider_advance', { orderId, to, uid });
    const o = await read(orderId);
    const change = withStatus(o, to, 'rider', uid);
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  const o = await read(orderId);
  const change = withStatus(o, to, 'rider', uid);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function riderComplete(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  const change = withStatus(o, 'delivered', 'rider', uid);
  if (DEMO_MODE || !isConfigured) {
    void queueOfflineMutation('rider_complete', { orderId, uid });
    await demoStorage.saveOrder({ ...o, ...change } as Order);
    return;
  }
  await updateDoc(doc(db(), COL.orders, orderId), change);
  await updateDoc(doc(db(), COL.riders, uid), { activeOrderId: null });
}

export async function riderCancelTask(
  orderId: string,
  rider: Rider,
  reason: string,
  explanation?: string,
): Promise<{ autoOffline: boolean; count: number }> {
  const o = await read(orderId);
  const result = recordRiderCancellation(rider, o, reason, explanation);

  if (DEMO_MODE || !isConfigured) {
    void queueOfflineMutation('cancel_order', { orderId, riderUid: rider.uid, reason, explanation });
    await demoStorage.saveOrder({ ...o, ...result.orderPatch } as Order);
    return { autoOffline: result.autoOffline, count: result.rider.cancellationsToday ?? 0 };
  }

  // Unassign rider from order and reset order status
  const orderPatch = {
    riderUid: null,
    riderName: null,
    cancellationReason: reason,
    cancelledByRole: 'rider' as const,
    cancelledByUid: rider.uid,
    status: (o.status === 'dispatched' ? 'ready_for_pickup' : 'admin_review') as OrderStatus,
    updatedAt: Date.now(),
  };
  await updateDoc(doc(db(), COL.orders, orderId), orderPatch);

  // Update rider profile with cancellation record and auto-offline lockout if exceeded
  await updateDoc(doc(db(), COL.riders, rider.uid), {
    ...result.rider,
    activeOrderId: null,
  });

  return { autoOffline: result.autoOffline, count: result.rider.cancellationsToday ?? 0 };
}

export async function setRiderOnline(uid: string, isOnline: boolean): Promise<void> {
  if (DEMO_MODE || !isConfigured) return;
  await updateDoc(doc(db(), COL.riders, uid), { isOnline });
}

// ---------------------------------------------------------------------------
// Compatibility Aliases
// ---------------------------------------------------------------------------

export const addOrderItem = addItem;
export const editOrderItem = editItem;
export const removeOrderItem = removeItem;
export const setItemQuantity = setQuantity;
export const toggleItemIncluded = toggleItem;
export const subscribeCustomerOrders = subscribeMyOrders;
export const subscribeVendorOrders = subscribeStoreOrders;
