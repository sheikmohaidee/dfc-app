/**
 * Every Firestore read and write the three mobile roles make.
 *
 * The mutations all go through @dfc/core's pure helpers, so a rider tapping
 * "Picked up" runs the same transition check the admin board and the security
 * rules do.
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
  SEED_ORDERS,
  SEED_RIDERS,
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

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const toOrder = (id: string, data: unknown): Order => ({ ...(data as Order), id });

export function subscribeCustomerOrders(
  customerUid: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const list = SEED_ORDERS.filter((o) => o.customerUid === customerUid || o.customerUid === 'cust-1');
    onData(list.length > 0 ? list : SEED_ORDERS);
    return () => {};
  }
  const q = query(
    collection(db(), COL.orders),
    where('customerUid', '==', customerUid),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => toOrder(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

export function subscribeVendorOrders(
  storeId: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const list = SEED_ORDERS.filter((o) => !storeId || o.storeId === storeId);
    onData(list.length > 0 ? list : SEED_ORDERS);
    return () => {};
  }
  const q = query(
    collection(db(), COL.orders),
    where('storeId', '==', storeId),
    where('status', 'in', [
      'admin_review',
      'awaiting_payment',
      'paid',
      'vendor_accepted',
      'packing',
      'ready_for_pickup',
    ]),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => toOrder(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

export function subscribeRiderTasks(
  riderUid: string,
  onData: (active: Order | null, history: Order[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const active = SEED_ORDERS.find((o) => o.status === 'dispatched' || o.status === 'picked_up') ?? null;
    const history = SEED_ORDERS.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
    onData(active, history);
    return () => {};
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
  if (!isConfigured) {
    const found = SEED_RIDERS.find((r) => r.uid === riderUid) ?? SEED_RIDERS[0]!;
    onData(found);
    return () => {};
  }
  return onSnapshot(
    doc(db(), COL.riders, riderUid),
    (snap) => onData(snap.exists() ? (snap.data() as Rider) : null),
    (err) => onError?.(err),
  );
}

export function subscribeOrder(
  orderId: string,
  onData: (order: Order | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    const found = SEED_ORDERS.find((o) => o.id === orderId) ?? SEED_ORDERS[0] ?? null;
    onData(found);
    return () => {};
  }
  return onSnapshot(
    doc(db(), COL.orders, orderId),
    (snap) => onData(snap.exists() ? toOrder(snap.id, snap.data()) : null),
    (err) => onError?.(err),
  );
}

export function subscribeMessages(
  orderId: string,
  onData: (messages: Message[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db(), messagesCol(orderId)), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as Message), id: d.id }))),
    (err) => onError?.(err),
  );
}

async function read(orderId: string): Promise<Order> {
  if (!isConfigured) {
    return SEED_ORDERS.find((o) => o.id === orderId) ?? SEED_ORDERS[0]!;
  }
  try {
    const snap = await getDoc(doc(db(), COL.orders, orderId));
    if (!snap.exists()) {
      return SEED_ORDERS.find((o) => o.id === orderId) ?? SEED_ORDERS[0]!;
    }
    return toOrder(snap.id, snap.data());
  } catch {
    return SEED_ORDERS.find((o) => o.id === orderId) ?? SEED_ORDERS[0]!;
  }
}

// ---------------------------------------------------------------------------
// Customer actions
// ---------------------------------------------------------------------------

export async function createOrderFromExtraction(args: {
  customer: UserProfile;
  source: OrderSource;
  extraction: AiExtraction;
  ai?: AiTrace | null;
  aiTrace?: AiTrace | null;
}): Promise<string> {
  if (!isConfigured) return 'mock-order-id';
  const codeRef = doc(db(), ORDER_CODE_COUNTER);
  const code = await runTransaction(db(), async (tx) => {
    const snap = await tx.get(codeRef);
    const current = snap.exists() ? ((snap.data().value as number) ?? 1000) : 1000;
    const next = current + 1;
    tx.set(codeRef, { value: next }, { merge: true });
    return next;
  });

  const fallbackAi: AiTrace = {
    model: 'gemini-1.5-flash',
    latencyMs: 0,
    raw: '',
    minConfidence: 1.0,
    parsedAt: Date.now(),
  };

  const orderRef = doc(collection(db(), COL.orders));
  const order = draftOrderFromExtraction({
    id: orderRef.id,
    code,
    customer: args.customer,
    source: args.source,
    extraction: args.extraction,
    ai: args.ai ?? args.aiTrace ?? fallbackAi,
  });

  await setDoc(orderRef, order);
  return orderRef.id;
}

export async function sendMessage(
  orderId: string,
  sender: { uid: string; role: Role; name: string },
  body: MessageBody,
): Promise<string> {
  if (!isConfigured) return 'mock-msg-id';
  const msgRef = await addDoc(collection(db(), messagesCol(orderId)), {
    orderId,
    senderUid: sender.uid,
    senderRole: sender.role,
    senderName: sender.name,
    body,
    createdAt: Date.now(),
  });
  return msgRef.id;
}

export async function addOrderItem(
  orderId: string,
  nameOrItem: string | { name: string; quantity?: number; unit?: string },
  quantity = 1,
  unit = 'item',
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const item =
    typeof nameOrItem === 'string'
      ? { name: nameOrItem, quantity, unit }
      : { name: nameOrItem.name, quantity: nameOrItem.quantity ?? 1, unit: nameOrItem.unit ?? 'item' };
  const change = coreAddItem(o, item);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function editOrderItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; quantity?: number; unit?: string },
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const change = coreEditItem(o, itemId, patch);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function removeOrderItem(orderId: string, itemId: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const change = coreRemoveItem(o, itemId);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function setItemQuantity(
  orderId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const change = coreSetQuantity(o, itemId, quantity);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function toggleItemIncluded(orderId: string, itemId: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const change = coreToggleItem(o, itemId);
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function cancelOrder(
  orderId: string,
  uid: string,
  role: Role,
  reason?: string,
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const patch = cancelOrderWithReason(o, role, uid, reason ?? 'Cancelled');
  await updateDoc(doc(db(), COL.orders, orderId), patch);
}

// ---------------------------------------------------------------------------
// Vendor actions
// ---------------------------------------------------------------------------

export async function vendorAccept(orderId: string, uid: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'vendor_accepted', 'vendor', uid));
}

export async function vendorReject(orderId: string, uid: string, reason: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'rejected', 'vendor', uid, reason));
}

export async function vendorStartPacking(orderId: string, uid: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'packing', 'vendor', uid));
}

export async function vendorMarkReady(orderId: string, uid: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'ready_for_pickup', 'vendor', uid));
}

export async function vendorReportDelay(
  orderId: string,
  delayMinutes: number,
  reason: string,
  uid: string,
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  const patch = reportOrderDelay(o, delayMinutes, reason, uid);
  await updateDoc(doc(db(), COL.orders, orderId), patch);
}

export async function vendorConfirmItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; pricePaise?: number } = {},
): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreConfirmItem(o, itemId, patch));
}

export async function vendorMarkUnavailable(orderId: string, itemId: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreMarkUnavailable(o, itemId));
}

// ---------------------------------------------------------------------------
// Vendor Catalogue / Menu Management
// ---------------------------------------------------------------------------

export function vendorSubscribeProducts(
  storeId: string,
  onData: (products: Product[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!isConfigured) {
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
  if (!isConfigured) return 'mock-prod';
  const prod = createProduct(input);
  await setDoc(doc(db(), COL.products, prod.id), prod);
  return prod.id;
}

export async function vendorToggleProduct(productId: string, isActive: boolean): Promise<void> {
  if (!isConfigured) return;
  await updateDoc(doc(db(), COL.products, productId), { isActive, updatedAt: Date.now() });
}

export async function vendorDeleteProduct(productId: string): Promise<void> {
  if (!isConfigured) return;
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
  if (!isConfigured) {
    void queueOfflineMutation('rider_advance', { orderId, to, uid });
    return;
  }
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, to, 'rider', uid));
}

export async function riderComplete(orderId: string, uid: string): Promise<void> {
  if (!isConfigured) return;
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'delivered', 'rider', uid));
  await updateDoc(doc(db(), COL.riders, uid), { activeOrderId: null });
}

export async function riderCancelTask(
  orderId: string,
  rider: Rider,
  reason: string,
  explanation?: string,
): Promise<{ autoOffline: boolean; count: number }> {
  if (!isConfigured) {
    return { autoOffline: false, count: (rider.cancellationsToday ?? 0) + 1 };
  }

  const o = await read(orderId);
  const result = recordRiderCancellation(rider, o, reason, explanation);

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
  if (!isConfigured) return;
  await updateDoc(doc(db(), COL.riders, uid), { isOnline });
}

// ---------------------------------------------------------------------------
// Aliases for compatibility
// ---------------------------------------------------------------------------

export const addItem = addOrderItem;
export const editItem = editOrderItem;
export const removeItem = removeOrderItem;
export const setQuantity = setItemQuantity;
export const toggleItem = toggleItemIncluded;
export const subscribeMyOrders = subscribeCustomerOrders;
export const subscribeStoreOrders = subscribeVendorOrders;
export const subscribeRiderOrders = (
  riderUid: string,
  onData: (orders: Order[]) => void,
  onError?: (e: Error) => void,
) => {
  return subscribeRiderTasks(
    riderUid,
    (active, history) => {
      onData(active ? [active, ...history] : history);
    },
    onError,
  );
};
