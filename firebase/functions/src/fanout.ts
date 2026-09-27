/**
 * Who gets told what, as a pure function.
 *
 * The push machinery — tokens, FCM, dead-token pruning — is in
 * notifications.ts. What lives here is only the *decision*: given an order
 * before and after a write, which audiences should hear about it, with what
 * words, and how loudly.
 *
 * Splitting it out is what makes it testable. The decision is where the bugs
 * are: a vendor who is not told has lost a sale in three minutes, a customer
 * told about every internal status change mutes the app inside a week, and a
 * rider who is not told is standing still. None of that is visible from
 * reading an FCM response.
 */

import { COL, STATUS_LABEL, formatInr, type Order, type OrderStatus } from '@dfc/core';

/** Android channels, created client-side with matching ids. */
export const CHANNEL = {
  vendorOrders: 'dfc-vendor-orders',
  riderTasks: 'dfc-rider-tasks',
  customerUpdates: 'dfc-customer-updates',
} as const;

/** Who a push is aimed at. Resolved to uids and tokens by the caller. */
export type Audience =
  | { kind: 'admins' }
  | { kind: 'vendor'; storeId: string | null }
  | { kind: 'rider'; uid: string }
  | { kind: 'customer'; uid: string };

export interface PlannedPush {
  audience: Audience;
  notification: { title: string; body: string };
  channel: string;
  sound?: string;
  urgent?: boolean;
  data: Record<string, string>;
}

/** Customer-facing milestones. Anything not listed here is silent. */
export const CUSTOMER_MILESTONES: Partial<Record<OrderStatus, string>> = {
  paid: 'Order confirmed',
  vendor_accepted: 'The store is preparing your order',
  ready_for_pickup: 'Ready — store preparing pickup',
  dispatched: 'Rider assigned to your order',
  picked_up: 'Order picked up from store',
  out_for_delivery: 'Your order is on the way to you',
  delivered: 'Delivered. Thank you.',
  rejected: 'We could not fulfil this order',
  cancelled: 'Your order was cancelled',
};

/**
 * Plans the fan-out for one write to an order document.
 *
 * Returns an empty list far more often than not — most writes to an order are
 * a price edit or a timeline append, and nobody's phone should light up for
 * those.
 */
export function planFanOut(
  before: Order | undefined,
  after: Order | undefined,
  orderId: string,
): PlannedPush[] {
  if (!after) return []; // deleted — orders never are, but be safe

  const created = !before;
  const statusChanged = before?.status !== after.status;
  const riderChanged = before?.riderUid !== after.riderUid;

  // --- a brand new request: tell whoever is on the board -------------------
  if (created && after.status === 'incoming') {
    return [
      {
        audience: { kind: 'admins' },
        notification: {
          title: `New ${after.category} request`,
          body: `#${after.code} · ${after.customerName} · ${after.items.length} items`,
        },
        channel: CHANNEL.customerUpdates,
        data: { orderId, kind: 'incoming' },
      },
    ];
  }

  // Nothing anybody needs to know about.
  if (!statusChanged && !riderChanged) return [];

  const out: PlannedPush[] = [];

  // --- vendor: an order just became theirs to accept -----------------------
  if (statusChanged && after.status === 'paid') {
    out.push({
      audience: { kind: 'vendor', storeId: after.storeId },
      notification: {
        title: 'New order — accept within 3 minutes',
        body: `#${after.code} · ${formatInr(after.pricing.totalPaise)} · ${
          after.items.filter((i) => i.included).length
        } items`,
      },
      channel: CHANNEL.vendorOrders,
      sound: 'dfc_order',
      urgent: true,
      data: { orderId, kind: 'vendor_accept' },
    });
  }

  // --- rider: a task was assigned ------------------------------------------
  if (riderChanged && after.riderUid) {
    const cash = after.paymentMode === 'cod';
    out.push({
      audience: { kind: 'rider', uid: after.riderUid },
      notification: {
        // The amount goes in the title for a cash job. A rider who does not
        // know it is a cash delivery until they arrive has to ask, which is
        // the single most awkward moment in the whole flow.
        title: cash
          ? `Cash delivery · collect ${formatInr(after.pricing.totalPaise)}`
          : 'New delivery',
        body: `#${after.code} · ${after.storeName ?? 'Store'} → ${
          after.addressLine || after.localityId
        }`,
      },
      channel: CHANNEL.riderTasks,
      urgent: true,
      data: { orderId, kind: 'rider_task' },
    });
  }

  // --- customer: milestones only -------------------------------------------
  if (statusChanged) {
    const line = CUSTOMER_MILESTONES[after.status];
    if (line) {
      out.push({
        audience: { kind: 'customer', uid: after.customerUid },
        notification: { title: line, body: `#${after.code} · ${STATUS_LABEL[after.status].en}` },
        channel: CHANNEL.customerUpdates,
        data: { orderId, kind: 'status' },
      });
    }
  }

  return out;
}

/**
 * The rider is at the door.
 *
 * Separate from the status fan-out because it fires on an OTP change during
 * `out_for_delivery` rather than on a status change, and it must fire exactly
 * once — a second "your rider has arrived" while somebody is walking to the
 * door is worse than none.
 */
export function planArrival(
  before: Order | undefined,
  after: Order | undefined,
  orderId: string,
): PlannedPush[] {
  if (!after || !before) return [];
  if (before.status !== 'out_for_delivery' || after.status !== 'out_for_delivery') return [];
  if (before.deliveryOtp === after.deliveryOtp) return []; // nothing meaningful moved

  return [
    {
      audience: { kind: 'customer', uid: after.customerUid },
      notification: {
        title: 'Your rider has arrived',
        body:
          after.paymentMode === 'cod'
            ? `Keep ${formatInr(after.pricing.totalPaise)} and your code ${after.deliveryOtp} ready`
            : `Your code is ${after.deliveryOtp}`,
      },
      channel: CHANNEL.customerUpdates,
      urgent: true,
      data: { orderId, kind: 'arrived' },
    },
  ];
}

// ---------------------------------------------------------------------------
// Dead tokens
// ---------------------------------------------------------------------------

/** One entry per token, in the order the tokens were sent. */
export interface SendOutcome {
  success: boolean;
  errorCode?: string;
}

/**
 * Decides which tokens to drop after a send.
 *
 * Only a token the *device* has invalidated is dropped. A transient failure —
 * FCM unavailable, a quota blip — must not delete somebody's registration, or
 * a bad five minutes at Google silently unsubscribes the whole rider fleet.
 */
export function deadTokens(tokens: string[], outcomes: SendOutcome[]): string[] {
  const dead: string[] = [];
  outcomes.forEach((r, i) => {
    if (r.success) return;
    const code = r.errorCode ?? '';
    if (
      code.includes('registration-token-not-registered') ||
      code.includes('invalid-argument')
    ) {
      const t = tokens[i];
      if (t) dead.push(t);
    }
  });
  return dead;
}

export const USERS = COL.users;
