/**
 * Payment gateway — the server half.
 *
 * This is the piece that removes the human from UPI reconciliation. The split
 * between the pieces is the whole security model:
 *
 *   createGatewayOrder   callable. Asks Razorpay for an order id. Reads the
 *                        amount from Firestore, never from the client — a
 *                        client-supplied amount is how you sell a ₹2,000
 *                        basket for ₹1.
 *
 *   createPaymentLink    callable. Hosted Razorpay link. Reuses a live link
 *                        rather than minting a second one, because two open
 *                        links for one order is how a customer pays twice.
 *
 *   razorpayWebhook      HTTP. The only thing in the entire system allowed to
 *                        write `paid`. Verifies an HMAC signature over the raw
 *                        body before it believes a word of it.
 *
 * Each one is a thin `onCall`/`onRequest` shell around a plain async function
 * that takes its Firestore handle, its credentials and its `fetch` as
 * arguments. That indirection exists so the tests in `tests/` can drive the
 * real logic against the emulator with a stubbed Razorpay — the alternative is
 * a payment path whose only test is production.
 *
 * Secrets come from Secret Manager (`firebase functions:secrets:set`), not
 * from environment config, and never reach a client bundle.
 */

import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';

import { COL, orderPaymentStatus, type Order, type Payment } from '@dfc/core';

import {
  decideSettlement,
  parseEvent,
  verifyWebhookSignature,
  type RazorpayEvent,
} from './razorpay';

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

const REGION = 'asia-south1'; // Mumbai — closest to Madurai.

/** What the logic below needs from the outside world. */
export interface GatewayDeps {
  db: Firestore;
  keyId: string;
  keySecret: string;
  /** Injectable so tests never touch api.razorpay.com. */
  fetchImpl?: typeof fetch;
}

/** A payment doc, plus the link fields that only gateway payments carry. */
type GatewayPayment = Payment & { paymentLinkUrl?: string; paymentLinkId?: string };

function basicAuth(deps: GatewayDeps): string {
  return Buffer.from(`${deps.keyId}:${deps.keySecret}`).toString('base64');
}

/**
 * Loads an order and proves it belongs to the caller.
 *
 * Shared by both callables because "which order, and is it yours" is the only
 * authorisation either of them performs, and it must not drift between them.
 */
async function loadOwnedOrder(
  db: Firestore,
  uid: string,
  orderId: string,
): Promise<{ order: Order; amountPaise: number }> {
  const snap = await db.doc(`${COL.orders}/${orderId}`).get();
  if (!snap.exists) throw new HttpsError('not-found', 'That order does not exist.');

  const order = snap.data() as Order;
  if (order.customerUid !== uid) {
    throw new HttpsError('permission-denied', 'That is not your order.');
  }

  const amountPaise = order.pricing.totalPaise;
  if (amountPaise <= 0) {
    throw new HttpsError('failed-precondition', 'That order has not been priced yet.');
  }

  return { order, amountPaise };
}

function requireOrderId(data: unknown): string {
  const { orderId } = (data ?? {}) as { orderId?: unknown };
  if (!orderId || typeof orderId !== 'string') {
    throw new HttpsError('invalid-argument', 'orderId is required.');
  }
  return orderId;
}

// ---------------------------------------------------------------------------
// Create a gateway order
// ---------------------------------------------------------------------------

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountPaise: number;
  /** True when an existing Razorpay order was reused rather than created. */
  reused: boolean;
}

export async function createGatewayOrderLogic(
  deps: GatewayDeps,
  uid: string,
  orderId: string,
): Promise<GatewayOrderResult> {
  const { db } = deps;
  const { order, amountPaise } = await loadOwnedOrder(db, uid, orderId);

  const paymentId = `${orderId}_gateway`;
  const paymentRef = db.doc(`${COL.payments}/${paymentId}`);

  // Idempotent: a double tap must not create two Razorpay orders.
  const existing = await paymentRef.get();
  if (existing.exists) {
    const p = existing.data() as GatewayPayment;
    if (p.gatewayOrderId && p.state !== 'failed') {
      return { gatewayOrderId: p.gatewayOrderId, amountPaise, reused: true };
    }
  }

  const doFetch = deps.fetchImpl ?? fetch;
  const res = await doFetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(deps)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise, // Razorpay speaks paise, same as we do.
      currency: 'INR',
      receipt: `dfc-${order.code}`,
      notes: { orderId, orderCode: String(order.code), customerUid: uid },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error('razorpay order creation failed', { status: res.status, body });
    throw new HttpsError('internal', 'Could not reach the payment provider.');
  }

  const created = (await res.json()) as { id: string };
  const now = Date.now();

  await paymentRef.set(
    {
      id: paymentId,
      orderId,
      orderCode: order.code,
      customerUid: uid,
      method: 'gateway',
      state: 'awaiting_customer',
      amountPaise,
      receivedPaise: 0,
      reference: created.id,
      gatewayOrderId: created.id,
      createdAt: existing.exists ? (existing.data() as Payment).createdAt : now,
      updatedAt: now,
    } satisfies Payment,
    { merge: true },
  );

  return { gatewayOrderId: created.id, amountPaise, reused: false };
}

export const createGatewayOrder = onCall(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: false },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

    const result = await createGatewayOrderLogic(
      {
        db: getFirestore(),
        keyId: RAZORPAY_KEY_ID.value(),
        keySecret: RAZORPAY_KEY_SECRET.value(),
      },
      uid,
      requireOrderId(request.data),
    );

    return {
      gatewayOrderId: result.gatewayOrderId,
      amountPaise: result.amountPaise,
      keyId: RAZORPAY_KEY_ID.value(),
    };
  },
);

// ---------------------------------------------------------------------------
// Payment links
// ---------------------------------------------------------------------------

export interface PaymentLinkResult {
  url: string;
  amountPaise: number;
  /** True when a live link was reused. The tests assert on this. */
  reused: boolean;
}

/**
 * Creates a Razorpay Payment Link and returns its short URL.
 *
 * This, rather than the native Razorpay checkout SDK, is what the app opens.
 * The SDK means a native module, a config plugin, and a build that no longer
 * runs in Expo Go — a lot of fragility for a checkout the customer sees for
 * twenty seconds. A hosted link opens in the system browser, supports UPI,
 * cards, net banking and wallets, and fires the same webhook.
 *
 * The amount is read from Firestore. The client never names a price.
 *
 * Idempotency is the interesting part. The app calls this every time the
 * customer taps "Pay now", including the taps that happen because the browser
 * was slow to open. Minting a link per tap leaves several payable links for
 * one order, and Razorpay will happily collect on all of them.
 */
export async function createPaymentLinkLogic(
  deps: GatewayDeps,
  uid: string,
  orderId: string,
): Promise<PaymentLinkResult> {
  const { db } = deps;
  const { order, amountPaise } = await loadOwnedOrder(db, uid, orderId);

  const paymentId = `${orderId}_gateway`;
  const paymentRef = db.doc(`${COL.payments}/${paymentId}`);

  const existing = await paymentRef.get();
  if (existing.exists) {
    const p = existing.data() as GatewayPayment | undefined;
    // Reuse a live link. A failed link is dead and a paid one must never be
    // handed out again, but everything in between is still payable.
    //
    // The amount is part of the test: if the order was repriced after the
    // link was minted, the old link collects the old total. That is a
    // different bug — underbilling rather than double-billing — so a stale
    // amount forces a fresh link.
    if (
      p?.paymentLinkUrl &&
      p.state !== 'failed' &&
      p.state !== 'paid' &&
      p.amountPaise === amountPaise
    ) {
      return { url: p.paymentLinkUrl, amountPaise, reused: true };
    }
  }

  const doFetch = deps.fetchImpl ?? fetch;
  const res = await doFetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth(deps)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      accept_partial: false,
      description: `DFC order ${order.code}`,
      customer: {
        name: order.customerName,
        contact: order.customerPhone,
      },
      notify: { sms: false, email: false }, // the app already tells them
      reminder_enable: false,
      // Echoed back on the webhook — this is how the event finds its order.
      notes: { orderId, orderCode: String(order.code), customerUid: uid },
      // 30 minutes. A stale link paid an hour later is a reconciliation
      // problem, not a sale.
      expire_by: Math.floor(Date.now() / 1000) + 30 * 60,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    logger.error('razorpay payment link failed', { status: res.status, body });
    throw new HttpsError('internal', 'Could not reach the payment provider.');
  }

  const link = (await res.json()) as { id: string; short_url: string };
  const now = Date.now();

  await paymentRef.set(
    {
      id: paymentId,
      orderId,
      orderCode: order.code,
      customerUid: uid,
      method: 'gateway',
      state: 'awaiting_customer',
      amountPaise,
      receivedPaise: 0,
      reference: link.id,
      gatewayOrderId: link.id,
      paymentLinkId: link.id,
      paymentLinkUrl: link.short_url,
      createdAt: existing.exists ? (existing.data() as Payment).createdAt : now,
      updatedAt: now,
    },
    { merge: true },
  );

  return { url: link.short_url, amountPaise, reused: false };
}

export const createPaymentLink = onCall(
  { region: REGION, secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: false },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

    const result = await createPaymentLinkLogic(
      {
        db: getFirestore(),
        keyId: RAZORPAY_KEY_ID.value(),
        keySecret: RAZORPAY_KEY_SECRET.value(),
      },
      uid,
      requireOrderId(request.data),
    );

    return { url: result.url, amountPaise: result.amountPaise };
  },
);

// ---------------------------------------------------------------------------
// The webhook
// ---------------------------------------------------------------------------

export interface WebhookResult {
  status: number;
  body: string;
  /** What the handler decided to do. Assertable; not sent to Razorpay. */
  outcome:
    | 'bad-method'
    | 'missing-signature'
    | 'bad-signature'
    | 'bad-payload'
    | 'ignored'
    | 'paid'
    | 'short'
    | 'already-paid'
    | 'no-order'
    | 'failed'
    | 'refunded'
    | 'error';
}

export interface WebhookRequest {
  method: string;
  rawBody: Buffer | undefined;
  signature: string | undefined;
  ip?: string;
}

/**
 * The webhook, as a plain function over a plain request shape.
 *
 * Everything security-relevant happens in the first twenty lines, before a
 * single byte of the payload is trusted or parsed.
 */
export async function handleWebhook(
  db: Firestore,
  req: WebhookRequest,
  secret: string,
): Promise<WebhookResult> {
  if (req.method !== 'POST') {
    return { status: 405, body: 'Method not allowed', outcome: 'bad-method' };
  }

  // The signature is computed over the exact bytes Razorpay sent. Using the
  // parsed-and-restringified body will not match — key order and whitespace
  // both change.
  const check = verifyWebhookSignature(req.rawBody, req.signature, secret);
  if (!check.ok) {
    if (check.reason === 'mismatch') {
      logger.warn('razorpay webhook: bad signature', { ip: req.ip });
      // 400, not 401 — Razorpay retries on 5xx, and a forged request should
      // not earn retries.
      return { status: 400, body: 'Bad signature', outcome: 'bad-signature' };
    }
    return { status: 400, body: 'Missing signature', outcome: 'missing-signature' };
  }

  const raw = req.rawBody as Buffer;

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw.toString('utf8')) as RazorpayEvent;
  } catch {
    return { status: 400, body: 'Bad payload', outcome: 'bad-payload' };
  }

  const parsed = parseEvent(event);
  logger.info('razorpay webhook', { event: parsed.event, orderId: parsed.orderId });

  // Always 200 after this point unless the write genuinely fails: Razorpay
  // retries non-2xx for 24 hours, and re-delivering an event we already
  // handled is harmless but noisy.
  try {
    switch (parsed.event) {
      case 'payment.captured':
      case 'payment_link.paid': {
        if (!parsed.orderId) return { status: 200, body: 'ok', outcome: 'ignored' };
        const outcome = await settlePaid(db, parsed.orderId, {
          amountPaise: parsed.amountPaise,
          gatewayPaymentId: parsed.gatewayPaymentId,
        });
        return { status: 200, body: 'ok', outcome };
      }
      case 'payment.failed': {
        if (!parsed.orderId) return { status: 200, body: 'ok', outcome: 'ignored' };
        await markFailed(db, parsed.orderId, parsed.failureReason ?? 'Payment failed');
        return { status: 200, body: 'ok', outcome: 'failed' };
      }
      case 'refund.processed': {
        if (!parsed.orderId) return { status: 200, body: 'ok', outcome: 'ignored' };
        await markRefunded(db, parsed.orderId);
        return { status: 200, body: 'ok', outcome: 'refunded' };
      }
      default:
        return { status: 200, body: 'ok', outcome: 'ignored' };
    }
  } catch (err) {
    logger.error('razorpay webhook handling failed', { err, orderId: parsed.orderId });
    // 500 so Razorpay retries — the event was genuine, we just failed it.
    return { status: 500, body: 'retry', outcome: 'error' };
  }
}

export const razorpayWebhook = onRequest(
  { region: REGION, secrets: [RAZORPAY_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    const result = await handleWebhook(
      getFirestore(),
      {
        method: req.method,
        rawBody: req.rawBody,
        signature: req.get('x-razorpay-signature'),
        ip: req.ip,
      },
      RAZORPAY_WEBHOOK_SECRET.value(),
    );

    res.status(result.status).send(result.body);
  },
);

// ---------------------------------------------------------------------------

async function settlePaid(
  db: Firestore,
  orderId: string,
  entity: { amountPaise: number | null; gatewayPaymentId: string | null },
): Promise<'paid' | 'short' | 'already-paid' | 'no-order'> {
  const paymentRef = db.doc(`${COL.payments}/${orderId}_gateway`);
  const orderRef = db.doc(`${COL.orders}/${orderId}`);

  return db.runTransaction(async (tx) => {
    const [paySnap, orderSnap] = await Promise.all([tx.get(paymentRef), tx.get(orderRef)]);

    const payment = paySnap.exists ? (paySnap.data() as Payment) : null;
    const order = orderSnap.exists ? (orderSnap.data() as Order) : null;

    const decision = decideSettlement({
      currentState: payment?.state ?? null,
      expectedPaise: order?.pricing.totalPaise ?? 0,
      receivedPaise: entity.amountPaise,
      orderExists: order !== null,
    });

    if (decision.action === 'ignore') return decision.why;

    // Underpayment is not a payment. Flag it rather than releasing goods.
    if (decision.action === 'short') {
      logger.warn('razorpay: short payment', {
        orderId,
        expected: decision.expectedPaise,
        received: decision.receivedPaise,
      });
      tx.set(
        paymentRef,
        {
          state: 'awaiting_confirmation',
          receivedPaise: decision.receivedPaise,
          gatewayPaymentId: entity.gatewayPaymentId,
          failureReason: 'Amount received is less than the order total',
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      return 'short';
    }

    tx.set(
      paymentRef,
      {
        state: 'paid',
        receivedPaise: decision.receivedPaise,
        gatewayPaymentId: entity.gatewayPaymentId,
        confirmedBy: 'webhook',
        confirmedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    const patch: Record<string, unknown> = {
      paymentStatus: orderPaymentStatus('paid'),
      updatedAt: Date.now(),
    };

    // Advance the order too, so the store starts packing without an admin
    // touching anything. Only from awaiting_payment — a webhook must never
    // rewind an order that has already moved on.
    if (order!.status === 'awaiting_payment') {
      patch.status = 'paid';
      patch.timeline = FieldValue.arrayUnion({
        status: 'paid',
        at: Date.now(),
        by: 'system',
        note: 'Confirmed by payment gateway',
      });
    }

    tx.set(orderRef, patch, { merge: true });
    return 'paid';
  });
}

async function markFailed(db: Firestore, orderId: string, reason: string): Promise<void> {
  await db.doc(`${COL.payments}/${orderId}_gateway`).set(
    { state: 'failed', failureReason: reason, updatedAt: Date.now() },
    { merge: true },
  );
  await db.doc(`${COL.orders}/${orderId}`).set(
    { paymentStatus: orderPaymentStatus('failed'), updatedAt: Date.now() },
    { merge: true },
  );
}

async function markRefunded(db: Firestore, orderId: string): Promise<void> {
  await db.doc(`${COL.payments}/${orderId}_gateway`).set(
    { state: 'refunded', updatedAt: Date.now() },
    { merge: true },
  );
  await db.doc(`${COL.orders}/${orderId}`).set(
    { paymentStatus: orderPaymentStatus('refunded'), updatedAt: Date.now() },
    { merge: true },
  );
}
