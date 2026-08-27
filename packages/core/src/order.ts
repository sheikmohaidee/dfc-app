/**
 * Order construction and mutation helpers.
 *
 * Pure functions over the domain model — no Firebase. The apps call these and
 * then persist the result, which keeps the interesting logic testable.
 */

import { computePricing, suggestDeliveryPaise } from './money';
import { routeKm, suggestStore, storeById } from './madurai';
import { minConfidence, toConciergeStops, toOrderItems, type AiExtraction } from './schema';
import type {
  AiTrace,
  Order,
  OrderItem,
  OrderSource,
  OrderStatus,
  Pricing,
  Role,
  TimelineEvent,
  UserProfile,
} from './types';
import { transition } from './status';

export function newOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const EMPTY_PRICING: Pricing = {
  itemsPaise: 0,
  deliveryPaise: 0,
  servicePaise: 0,
  totalPaise: 0,
};

export interface DraftOrderInput {
  id: string;
  code: number;
  customer: UserProfile;
  extraction: AiExtraction;
  source: OrderSource;
  ai: AiTrace;
}

/**
 * The moment an unstructured input becomes a structured order. Called on the
 * customer's device right after the model answers, then written to Firestore
 * where the admin board picks it up.
 */
export function draftOrderFromExtraction(input: DraftOrderInput): Order {
  const { extraction, customer } = input;
  const items = toOrderItems(extraction);
  const stops = extraction.category === 'concierge' ? toConciergeStops(extraction) : [];

  const localityId = customer.localityId ?? 'kk-nagar';
  const store = suggestStore(extraction.category, localityId, extraction.storeHint);

  // A first-pass delivery estimate so the customer sees a real number
  // immediately. The admin can override it in the side sheet.
  const km = store ? routeKm(store.localityId, localityId) : 3;
  const stopCount = Math.max(1, stops.length);
  const deliveryPaise = suggestDeliveryPaise(km, stopCount);

  const pricing = computePricing({
    items,
    stops,
    deliveryPaise,
    servicePaise: extraction.category === 'concierge' ? 2500 : 0,
  });

  const now = Date.now();
  const firstEvent: TimelineEvent = { status: 'incoming', at: now, by: 'system' };

  return {
    id: input.id,
    code: input.code,

    customerUid: customer.uid,
    customerName: customer.name,
    customerPhone: customer.phone,
    localityId,
    addressLine: customer.addressLine ?? '',

    category: extraction.category,
    status: 'incoming',

    items,
    ...(stops.length ? { stops } : {}),

    storeId: store?.id ?? null,
    storeName: store?.name ?? null,

    riderUid: null,
    riderName: null,

    pricing,
    // Pharmacy defaults to prepaid (regulated goods, fewer doorstep disputes);
    // everything else defaults to cash, which is what Madurai actually uses.
    paymentMode: extraction.category === 'pharmacy' ? 'prepaid' : 'cod',
    paymentStatus: 'unpaid',

    source: input.source,
    ai: input.ai,

    deliveryOtp: newOtp(),

    timeline: [firstEvent],
    createdAt: now,
    updatedAt: now,
  };
}

/** A manual order typed by an admin — no model involved. */
export function blankOrder(id: string, code: number, customer: UserProfile): Order {
  const now = Date.now();
  return {
    id,
    code,
    customerUid: customer.uid,
    customerName: customer.name,
    customerPhone: customer.phone,
    localityId: customer.localityId ?? 'kk-nagar',
    addressLine: customer.addressLine ?? '',
    category: 'grocery',
    status: 'admin_review',
    items: [],
    storeId: null,
    storeName: null,
    riderUid: null,
    riderName: null,
    pricing: EMPTY_PRICING,
    paymentMode: 'cod',
    paymentStatus: 'unpaid',
    source: { kind: 'text', transcript: '' },
    ai: null,
    deliveryOtp: newOtp(),
    timeline: [{ status: 'admin_review', at: now, by: 'admin' }],
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Returns the patch to write — never mutates the order in place. */
export function withStatus(
  order: Order,
  to: OrderStatus,
  role: Role,
  by: string,
  note?: string,
): Partial<Order> {
  const event = transition(order.status, to, role, by, note);
  return {
    status: to,
    timeline: [...order.timeline, event],
    updatedAt: event.at,
  };
}

export function withItems(order: Order, items: OrderItem[]): Partial<Order> {
  const pricing = computePricing({
    items,
    stops: order.stops ?? [],
    deliveryPaise: order.pricing.deliveryPaise,
    servicePaise: order.pricing.servicePaise,
  });
  return { items, pricing, updatedAt: Date.now() };
}

export function withDeliveryFee(order: Order, deliveryPaise: number): Partial<Order> {
  const pricing = computePricing({
    items: order.items,
    stops: order.stops ?? [],
    deliveryPaise,
    servicePaise: order.pricing.servicePaise,
  });
  return { pricing, updatedAt: Date.now() };
}

export function toggleItem(order: Order, itemId: string): Partial<Order> {
  return withItems(
    order,
    order.items.map((i) => (i.id === itemId ? { ...i, included: !i.included } : i)),
  );
}

export function setItemQuantity(order: Order, itemId: string, quantity: number): Partial<Order> {
  const q = Math.max(1, Math.min(99, Math.round(quantity)));
  return withItems(
    order,
    order.items.map((i) => (i.id === itemId ? { ...i, quantity: q } : i)),
  );
}

/**
 * Corrects what the model read.
 *
 * OCR on a handwritten prescription is a transcription, not a reading — the
 * customer knows what their own medicine is called and the model does not.
 * Letting them fix a name at the source is worth several phone calls a day.
 *
 * A hand-corrected line is marked `editedByCustomer`, which matters twice
 * over: the admin board can stop flagging it for verification (a human has
 * already verified it — the human who takes the medicine), and the pharmacist
 * can see which lines came from the photograph and which were typed.
 *
 * The prescription photograph is never touched. It stays immutable in Storage
 * and remains what a pharmacist dispenses against; this only edits the list
 * DFC works from.
 */
export function editItem(
  order: Order,
  itemId: string,
  patch: { name?: string; unit?: string; quantity?: number; note?: string },
): Partial<Order> {
  return withItems(
    order,
    order.items.map((i) => {
      if (i.id !== itemId) return i;

      const name = patch.name?.trim();
      const unit = patch.unit?.trim();
      const touched =
        (name !== undefined && name !== i.name) || (unit !== undefined && unit !== i.unit);

      return {
        ...i,
        ...(name ? { name } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(patch.quantity !== undefined
          ? { quantity: Math.max(1, Math.min(99, Math.round(patch.quantity))) }
          : {}),
        ...(patch.note !== undefined ? { note: patch.note.trim() || undefined } : {}),
        // A corrected line is no longer a guess. Confidence drives the VERIFY
        // chip, and leaving it low would keep nagging an admin about a line
        // the customer has already fixed by hand.
        ...(touched ? { confidence: 1, editedByCustomer: true } : {}),
      };
    }),
  );
}

/**
 * Adds a line the model missed, or that was never in the photo at all.
 *
 * Priced at null and confidence 1: nobody has quoted it yet, but it is not a
 * guess either — a person typed it deliberately. `isFullyPriced` still gates
 * checkout until an admin puts a number on it.
 */
export function addItem(
  order: Order,
  input: { name: string; unit?: string; quantity?: number },
  id = `i_${Math.random().toString(36).slice(2, 10)}`,
): Partial<Order> {
  const name = input.name.trim();
  if (!name) return {};

  const item: OrderItem = {
    id,
    name,
    unit: input.unit?.trim() || 'each',
    quantity: Math.max(1, Math.min(99, Math.round(input.quantity ?? 1))),
    unitPricePaise: null,
    confidence: 1,
    included: true,
    addedByCustomer: true,
  };

  return withItems(order, [...order.items, item]);
}

/**
 * Removes a line entirely.
 *
 * Distinct from unticking it, and the distinction is the point. Unticking says
 * "I do not want this today" and keeps the line visible so a pharmacist can
 * see it was on the prescription and deliberately skipped. Removing says the
 * line was never real — a misread, or something the model invented — and it
 * should not reach the shop at all.
 *
 * The last line cannot be removed; an order with no items is a support call,
 * not an order. Cancelling is the way out of that.
 */
export function removeItem(order: Order, itemId: string): Partial<Order> {
  const remaining = order.items.filter((i) => i.id !== itemId);
  if (remaining.length === order.items.length) return {};
  if (remaining.length === 0) return {};
  return withItems(order, remaining);
}

export function setItemPrice(order: Order, itemId: string, pricePaise: number | null): Partial<Order> {
  return withItems(
    order,
    order.items.map((i) => (i.id === itemId ? { ...i, unitPricePaise: pricePaise } : i)),
  );
}

/**
 * The pharmacist resolving a low-confidence item: confirming it promotes the
 * confidence to 1 so the VERIFY chip clears everywhere at once.
 */
export function confirmItem(
  order: Order,
  itemId: string,
  patch: { name?: string; pricePaise?: number } = {},
): Partial<Order> {
  return withItems(
    order,
    order.items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            ...(patch.name ? { name: patch.name, substitutedFor: i.name } : {}),
            ...(patch.pricePaise !== undefined ? { unitPricePaise: patch.pricePaise } : {}),
            confidence: 1,
            included: true,
          }
        : i,
    ),
  );
}

export function markItemUnavailable(order: Order, itemId: string): Partial<Order> {
  return withItems(
    order,
    order.items.map((i) =>
      i.id === itemId ? { ...i, included: false, note: 'Out of stock at the store' } : i,
    ),
  );
}

export function assignStore(order: Order, storeId: string): Partial<Order> {
  const store = storeById(storeId);
  return {
    storeId,
    storeName: store?.name ?? null,
    updatedAt: Date.now(),
  };
}

export function assignRider(order: Order, riderUid: string, riderName: string): Partial<Order> {
  return { riderUid, riderName, updatedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

export const includedItems = (o: Order): OrderItem[] => o.items.filter((i) => i.included);

export const flaggedItems = (o: Order): OrderItem[] =>
  o.items.filter((i) => i.confidence < 0.6);

export const hasFlagged = (o: Order): boolean => flaggedItems(o).length > 0;

export const orderConfidence = (o: Order): number => minConfidence(o.items);

/** Minutes the customer is told to expect, from prep time plus travel. */
export function etaMinutes(o: Order): number {
  const store = storeById(o.storeId);
  const prep = store?.avgPrepMinutes ?? 10;
  const km = store ? routeKm(store.localityId, o.localityId) : 3;
  // ~18 km/h through Madurai traffic, plus a 4-minute handoff buffer.
  return Math.round(prep + (km / 18) * 60 + 4);
}

export const shortCode = (o: Order): string => `#${o.code}`;

export function eventAt(o: Order, status: OrderStatus): number | null {
  return o.timeline.find((e) => e.status === status)?.at ?? null;
}
