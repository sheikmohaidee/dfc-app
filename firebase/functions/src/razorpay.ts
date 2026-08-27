/**
 * Razorpay, as pure functions.
 *
 * Everything here is deliberately free of Firebase wrappers so it can be
 * tested without an emulator, a network, or a secret. The `onCall` and
 * `onRequest` handlers in payments.ts are thin shells around these.
 *
 * That split is not tidiness for its own sake: signature verification is the
 * single line between DFC and someone marking their own order paid, and it
 * needs to be exhaustively testable — forged, truncated, wrong secret, right
 * secret over a mutated body — without standing anything up.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

/** The HMAC Razorpay should have sent for this exact payload. */
export function computeSignature(rawBody: Buffer | string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export type SignatureResult =
  | { ok: true }
  | { ok: false; reason: 'missing-signature' | 'missing-body' | 'mismatch' };

/**
 * Verifies a webhook signature.
 *
 * Two properties matter and both are easy to get wrong:
 *
 *   It compares in constant time. A plain `===` returns early on the first
 *   differing byte, and the timing difference is enough to recover a valid
 *   signature one character at a time.
 *
 *   It verifies the RAW bytes. Re-serialising the parsed JSON changes key
 *   order and whitespace, so the HMAC would never match and every genuine
 *   webhook would be rejected — which fails safe, but fails.
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string | undefined | null,
  header: string | undefined | null,
  secret: string,
): SignatureResult {
  if (rawBody === undefined || rawBody === null || rawBody.length === 0) {
    return { ok: false, reason: 'missing-body' };
  }
  if (!header) return { ok: false, reason: 'missing-signature' };

  const expected = computeSignature(rawBody, secret);

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(header, 'utf8');

  // timingSafeEqual throws on a length mismatch, so the length check has to
  // come first. Length is not secret — a signature is always 64 hex chars.
  if (a.length !== b.length) return { ok: false, reason: 'mismatch' };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: 'mismatch' };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  status?: string;
  error_description?: string;
  notes?: Record<string, string>;
}

export interface RazorpayEvent {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    payment_link?: {
      entity?: { id?: string; amount_paid?: number; notes?: Record<string, string> };
    };
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number } };
  };
}

export interface ParsedEvent {
  event: string;
  /** Which DFC order this concerns, from the notes we attached. */
  orderId: string | null;
  /** Paise actually received, where the event carries it. */
  amountPaise: number | null;
  gatewayPaymentId: string | null;
  failureReason: string | null;
}

/**
 * Pulls the fields we act on out of an event.
 *
 * A payment-link event carries our notes on the *link* rather than the
 * payment, which is the kind of difference that silently drops half your
 * webhooks if you only read one of them.
 */
export function parseEvent(event: RazorpayEvent): ParsedEvent {
  const payment = event.payload?.payment?.entity;
  const link = event.payload?.payment_link?.entity;

  return {
    event: event.event,
    orderId: payment?.notes?.orderId ?? link?.notes?.orderId ?? null,
    amountPaise: payment?.amount ?? link?.amount_paid ?? null,
    gatewayPaymentId: payment?.id ?? link?.id ?? null,
    failureReason: payment?.error_description ?? null,
  };
}

/** Events we act on. Anything else is acknowledged and ignored. */
export const HANDLED_EVENTS = [
  'payment.captured',
  'payment_link.paid',
  'payment.failed',
  'refund.processed',
] as const;

export type HandledEvent = (typeof HANDLED_EVENTS)[number];

export function isHandled(event: string): event is HandledEvent {
  return (HANDLED_EVENTS as readonly string[]).includes(event);
}

// ---------------------------------------------------------------------------
// Settlement decision
// ---------------------------------------------------------------------------

export type SettlementDecision =
  | { action: 'pay'; receivedPaise: number }
  | { action: 'short'; receivedPaise: number; expectedPaise: number }
  | { action: 'ignore'; why: 'already-paid' | 'no-order' };

/**
 * Decides what a captured payment means, given what the order actually costs.
 *
 * Kept separate from the Firestore write so the rule — a short payment is not
 * a payment — is testable on its own. Releasing goods against a partial is the
 * expensive version of this bug.
 */
export function decideSettlement(input: {
  currentState: string | null;
  expectedPaise: number;
  receivedPaise: number | null;
  orderExists: boolean;
}): SettlementDecision {
  if (!input.orderExists) return { action: 'ignore', why: 'no-order' };

  // Razorpay re-delivers events for 24 hours. Paying twice for one order is
  // how you end up issuing a refund you did not need to.
  if (input.currentState === 'paid') return { action: 'ignore', why: 'already-paid' };

  // An event without an amount is trusted for the full total — it only
  // reaches here after a signature check.
  const received = input.receivedPaise ?? input.expectedPaise;

  if (received < input.expectedPaise) {
    return { action: 'short', receivedPaise: received, expectedPaise: input.expectedPaise };
  }

  return { action: 'pay', receivedPaise: received };
}
