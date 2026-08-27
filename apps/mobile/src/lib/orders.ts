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
  confirmItem as coreConfirmItem,
  draftOrderFromExtraction,
  markItemUnavailable as coreMarkUnavailable,
  messagesCol,
  addItem as coreAddItem,
  editItem as coreEditItem,
  removeItem as coreRemoveItem,
  setItemQuantity as coreSetQuantity,
  toggleItem as coreToggleItem,
  withStatus,
  type AiExtraction,
  type AiTrace,
  type Message,
  type MessageBody,
  type Order,
  type OrderSource,
  type OrderStatus,
  type Role,
  type UserProfile,
} from '@dfc/core';

import { db } from './firebase';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const toOrder = (id: string, data: unknown): Order => ({ ...(data as Order), id });

/**
 * Every subscription below is capped. A customer with three years of history,
 * a busy store, or a rider mid-shift should each stream a bounded set — an
 * unbounded listener on a phone costs battery, memory and Firestore reads that
 * grow forever, and nobody scrolls past the first screen anyway.
 */
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

export function subscribeOrder(id: string, onData: (o: Order | null) => void): Unsubscribe {
  return onSnapshot(doc(db(), COL.orders, id), (s) =>
    onData(s.exists() ? toOrder(s.id, s.data()) : null),
  );
}

export function subscribeMessages(
  orderId: string,
  onData: (m: Message[]) => void,
): Unsubscribe {
  const q = query(
    collection(db(), messagesCol(orderId)),
    orderBy('createdAt', 'desc'),
    limit(THREAD_MESSAGES),
  );
  // Queried newest-first so the limit keeps the *recent* end of the thread,
  // then flipped back into reading order.
  return onSnapshot(q, (s) =>
    onData(s.docs.map((d) => ({ ...(d.data() as Message), id: d.id })).reverse()),
  );
}

async function read(id: string): Promise<Order> {
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

/**
 * The moment the app becomes useful: unstructured input, already parsed by
 * Gemini, becomes a real order that the admin board sees within the second.
 */
export async function createOrderFromExtraction(args: {
  customer: UserProfile;
  extraction: AiExtraction;
  source: OrderSource;
  ai: AiTrace;
}): Promise<Order> {
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
  await addDoc(collection(db(), messagesCol(orderId)), {
    threadId: orderId,
    author,
    body,
    createdAt: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Customer actions
//
// Payment lives in ./payments.ts, not here. It has its own state machine, its
// own collection and its own rules, and folding it into the order helpers is
// what produced two competing "mark it paid" paths.
// ---------------------------------------------------------------------------

export async function toggleItem(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreToggleItem(o, itemId));
}

export async function setQuantity(
  orderId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreSetQuantity(o, itemId, quantity));
}

/**
 * Corrects a line the model misread.
 *
 * The governing rule only lets a customer touch `items` while the order is
 * still `incoming`, which is the right window: once an admin has priced it,
 * changing the wording under them would reprice somebody else's work. The UI
 * hides the affordance past that point, and the rule is what enforces it.
 */
export async function editItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; unit?: string; quantity?: number; note?: string },
): Promise<void> {
  const o = await read(orderId);
  const change = coreEditItem(o, itemId, patch);
  if (Object.keys(change).length === 0) return;
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

/** Adds a line the model missed. */
export async function addItem(
  orderId: string,
  input: { name: string; unit?: string; quantity?: number },
): Promise<void> {
  const o = await read(orderId);
  const change = coreAddItem(o, input);
  if (Object.keys(change).length === 0) return;
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

/** Removes a misread line entirely. Refuses to empty the order. */
export async function removeItem(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  const change = coreRemoveItem(o, itemId);
  if (Object.keys(change).length === 0) return;
  await updateDoc(doc(db(), COL.orders, orderId), change);
}

export async function cancelOrder(orderId: string, uid: string, role: Role): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'cancelled', role, uid));
}

// ---------------------------------------------------------------------------
// Vendor actions
// ---------------------------------------------------------------------------

export async function vendorAccept(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'vendor_accepted', 'vendor', uid));
}

export async function vendorReject(orderId: string, uid: string, reason: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'rejected', 'vendor', uid, reason));
}

export async function vendorStartPacking(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'packing', 'vendor', uid));
}

export async function vendorMarkReady(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'ready_for_pickup', 'vendor', uid));
}

/** The pharmacist resolving a flagged item — the handoff the whole flow hangs on. */
export async function vendorConfirmItem(
  orderId: string,
  itemId: string,
  patch: { name?: string; pricePaise?: number } = {},
): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreConfirmItem(o, itemId, patch));
}

export async function vendorMarkUnavailable(orderId: string, itemId: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), coreMarkUnavailable(o, itemId));
}

// ---------------------------------------------------------------------------
// Rider actions
// ---------------------------------------------------------------------------

export async function riderAdvance(
  orderId: string,
  to: OrderStatus,
  uid: string,
): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, to, 'rider', uid));
}

export async function riderComplete(orderId: string, uid: string): Promise<void> {
  const o = await read(orderId);
  await updateDoc(doc(db(), COL.orders, orderId), withStatus(o, 'delivered', 'rider', uid));
  await updateDoc(doc(db(), COL.riders, uid), { activeOrderId: null });
}

export async function setRiderOnline(uid: string, isOnline: boolean): Promise<void> {
  await updateDoc(doc(db(), COL.riders, uid), { isOnline });
}
