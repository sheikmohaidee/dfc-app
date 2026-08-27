/**
 * The webhook, end to end, against the Firestore emulator.
 *
 * signature.test.ts proves the HMAC check is correct in isolation. This proves
 * the check is actually *wired in front of the database* — that a forged
 * request does not merely get a 400 back, but leaves the order exactly as it
 * was. The two are different failures, and only the second one costs money.
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { handleWebhook } from '../src/payments';
import {
  TEST_WEBHOOK_SECRET,
  clearFirestore,
  db,
  getOrder,
  getPayment,
  seedOrder,
  shutdown,
} from './harness';

const sign = (body: string, secret = TEST_WEBHOOK_SECRET) =>
  createHmac('sha256', secret).update(Buffer.from(body, 'utf8')).digest('hex');

function capturedEvent(orderId: string, amountPaise: number, paymentId = 'pay_R1abc') {
  return JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: paymentId, amount: amountPaise, notes: { orderId } } },
    },
  });
}

/** Posts a body with a correct signature unless told otherwise. */
async function post(body: string, opts: { signature?: string; method?: string } = {}) {
  return handleWebhook(
    db(),
    {
      method: opts.method ?? 'POST',
      rawBody: Buffer.from(body, 'utf8'),
      signature: 'signature' in opts ? opts.signature : sign(body),
      ip: '203.0.113.7',
    },
    TEST_WEBHOOK_SECRET,
  );
}

before(() => {
  db(); // fail fast if the emulator env is not set
});
after(shutdown);
beforeEach(clearFirestore);

// ---------------------------------------------------------------------------

describe('a genuine payment.captured', () => {
  it('marks the payment paid and advances the order', async () => {
    const { orderId, order } = await seedOrder();

    const res = await post(capturedEvent(orderId, order.pricing.totalPaise));

    assert.equal(res.status, 200);
    assert.equal(res.outcome, 'paid');

    const payment = await getPayment(orderId);
    assert.equal(payment?.state, 'paid');
    assert.equal(payment?.receivedPaise, order.pricing.totalPaise);
    assert.equal(payment?.confirmedBy, 'webhook');
    assert.equal(payment?.gatewayPaymentId, 'pay_R1abc');

    const after = await getOrder(orderId);
    assert.equal(after.paymentStatus, 'paid');
    assert.equal(after.status, 'paid', 'the store should be able to start packing');
    assert.equal(after.timeline.at(-1)?.by, 'system');
  });

  it('handles a payment_link.paid the same way', async () => {
    const { orderId, order } = await seedOrder();

    const body = JSON.stringify({
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            id: 'plink_9',
            amount_paid: order.pricing.totalPaise,
            notes: { orderId },
          },
        },
      },
    });

    const res = await post(body);
    assert.equal(res.outcome, 'paid');
    assert.equal((await getPayment(orderId))?.state, 'paid');
  });

  it('does not rewind an order that has already moved on', async () => {
    // The rider is already carrying it. A late webhook must record the money
    // and nothing else.
    const { orderId, order } = await seedOrder({ status: 'out_for_delivery' });

    await post(capturedEvent(orderId, order.pricing.totalPaise));

    const after = await getOrder(orderId);
    assert.equal(after.status, 'out_for_delivery');
    assert.equal(after.paymentStatus, 'paid');
  });
});

// ---------------------------------------------------------------------------
// Forgery
// ---------------------------------------------------------------------------

describe('a forged payment confirmation', () => {
  it('is rejected and the order is untouched', async () => {
    const { orderId, order } = await seedOrder();
    const body = capturedEvent(orderId, order.pricing.totalPaise);

    // The whole attack: a well-formed event, posted to a public URL, signed
    // with a secret the attacker guessed.
    const res = await post(body, { signature: sign(body, 'whsec_guessed') });

    assert.equal(res.status, 400);
    assert.equal(res.outcome, 'bad-signature');

    assert.equal(await getPayment(orderId), null, 'a payment doc was created by a forgery');
    const after = await getOrder(orderId);
    assert.equal(after.paymentStatus, 'unpaid');
    assert.equal(after.status, 'awaiting_payment');
  });

  it('is rejected with no signature at all', async () => {
    const { orderId, order } = await seedOrder();

    const res = await post(capturedEvent(orderId, order.pricing.totalPaise), {
      signature: undefined,
    });

    assert.equal(res.status, 400);
    assert.equal(res.outcome, 'missing-signature');
    assert.equal(await getPayment(orderId), null);
    assert.equal((await getOrder(orderId)).paymentStatus, 'unpaid');
  });

  it('is rejected when the amount is edited after signing', async () => {
    const { orderId } = await seedOrder();
    const honest = capturedEvent(orderId, 100); // ₹1
    const signature = sign(honest);
    const tampered = capturedEvent(orderId, 24300); // ₹243, same signature

    const res = await post(tampered, { signature });

    assert.equal(res.outcome, 'bad-signature');
    assert.equal(await getPayment(orderId), null);
  });

  it('cannot be replayed against a different order', async () => {
    const mine = await seedOrder();
    const theirs = await seedOrder();

    // A genuine signature for my own ₹243 order, repointed at theirs.
    const body = capturedEvent(mine.orderId, mine.order.pricing.totalPaise);
    const genuine = sign(body);
    const repointed = body.replace(mine.orderId, theirs.orderId);

    const res = await post(repointed, { signature: genuine });

    assert.equal(res.outcome, 'bad-signature');
    assert.equal(await getPayment(theirs.orderId), null);
    assert.equal((await getOrder(theirs.orderId)).paymentStatus, 'unpaid');
  });

  it('is refused on GET, before anything else is considered', async () => {
    const { orderId, order } = await seedOrder();
    const res = await post(capturedEvent(orderId, order.pricing.totalPaise), {
      method: 'GET',
    });
    assert.equal(res.status, 405);
    assert.equal(res.outcome, 'bad-method');
  });

  it('is rejected on a correctly-signed but unparseable body', async () => {
    const res = await post('this is not json');
    assert.equal(res.status, 400);
    assert.equal(res.outcome, 'bad-payload');
  });
});

// ---------------------------------------------------------------------------
// Re-delivery
// ---------------------------------------------------------------------------

describe('re-delivered events', () => {
  it('are idempotent — Razorpay retries for 24 hours', async () => {
    const { orderId, order } = await seedOrder();
    const body = capturedEvent(orderId, order.pricing.totalPaise);

    const first = await post(body);
    const second = await post(body);
    const third = await post(body);

    assert.equal(first.outcome, 'paid');
    assert.equal(second.outcome, 'already-paid');
    assert.equal(third.outcome, 'already-paid');

    // All three return 200, or Razorpay would keep retrying.
    for (const r of [first, second, third]) assert.equal(r.status, 200);

    const after = await getOrder(orderId);
    assert.equal(after.pricing.totalPaise, order.pricing.totalPaise, 'the total moved');
    // One paid transition, not three.
    assert.equal(after.timeline.filter((t) => t.status === 'paid').length, 1);
  });

  it('survive ten concurrent deliveries of the same event', async () => {
    const { orderId, order } = await seedOrder();
    const body = capturedEvent(orderId, order.pricing.totalPaise);

    const results = await Promise.all(Array.from({ length: 10 }, () => post(body)));

    // Exactly one delivery may settle the money. This is the assertion that
    // matters — the rest is about what the losers are told.
    assert.equal(
      results.filter((r) => r.outcome === 'paid').length,
      1,
      'more than one delivery was treated as a fresh payment',
    );

    // Ten simultaneous transactions on the same two documents will contend,
    // and a loser is aborted. That surfaces as a 500, which is deliberate:
    // Razorpay retries a 5xx, so the event is not lost — it arrives again a
    // moment later, finds the payment already settled, and is acknowledged.
    // Anything other than 200-or-retryable-500 would be a real failure.
    for (const r of results) {
      assert.ok(
        r.status === 200 || (r.status === 500 && r.outcome === 'error'),
        `unexpected ${r.status} / ${r.outcome}`,
      );
    }

    const after = await getOrder(orderId);
    assert.equal(after.timeline.filter((t) => t.status === 'paid').length, 1);
  });
});

// ---------------------------------------------------------------------------
// Short payment
// ---------------------------------------------------------------------------

describe('a short payment', () => {
  it('is not treated as a payment', async () => {
    const { orderId } = await seedOrder(); // ₹243 total

    const res = await post(capturedEvent(orderId, 100)); // ₹1 arrives

    assert.equal(res.status, 200); // acknowledged, so Razorpay stops retrying
    assert.equal(res.outcome, 'short');

    const payment = await getPayment(orderId);
    assert.equal(payment?.state, 'awaiting_confirmation');
    assert.equal(payment?.receivedPaise, 100);

    // The order must NOT advance. This is the one that would have let a ₹1
    // payment collect a ₹243 basket of medicine.
    const after = await getOrder(orderId);
    assert.equal(after.status, 'awaiting_payment');
    assert.notEqual(after.paymentStatus, 'paid');
  });

  it('can still be completed by a later full payment', async () => {
    const { orderId, order } = await seedOrder();

    await post(capturedEvent(orderId, 100));
    const res = await post(capturedEvent(orderId, order.pricing.totalPaise, 'pay_R2'));

    assert.equal(res.outcome, 'paid');
    assert.equal((await getPayment(orderId))?.state, 'paid');
    assert.equal((await getOrder(orderId)).status, 'paid');
  });
});

// ---------------------------------------------------------------------------
// The other events
// ---------------------------------------------------------------------------

describe('failure and refund events', () => {
  it('records a failure without touching the order status', async () => {
    const { orderId } = await seedOrder();

    const body = JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: { id: 'pay_x', error_description: 'Insufficient funds', notes: { orderId } },
        },
      },
    });

    const res = await post(body);
    assert.equal(res.outcome, 'failed');

    const payment = await getPayment(orderId);
    assert.equal(payment?.state, 'failed');
    assert.equal(payment?.failureReason, 'Insufficient funds');
    assert.equal((await getOrder(orderId)).status, 'awaiting_payment');
  });

  it('records a refund', async () => {
    const { orderId, order } = await seedOrder();
    await post(capturedEvent(orderId, order.pricing.totalPaise));

    const body = JSON.stringify({
      event: 'refund.processed',
      payload: {
        payment: { entity: { id: 'pay_R1abc', notes: { orderId } } },
        refund: { entity: { id: 'rfnd_1', payment_id: 'pay_R1abc', amount: 24300 } },
      },
    });

    const res = await post(body);
    assert.equal(res.outcome, 'refunded');
    assert.equal((await getPayment(orderId))?.state, 'refunded');
    assert.equal((await getOrder(orderId)).paymentStatus, 'refunded');
  });

  it('acknowledges an event it does not handle', async () => {
    const res = await post(JSON.stringify({ event: 'subscription.charged', payload: {} }));
    assert.equal(res.status, 200);
    assert.equal(res.outcome, 'ignored');
  });

  it('acknowledges a signed event for an order that does not exist', async () => {
    // Genuine signature, unknown order. A 500 here would earn 24 hours of
    // retries for an event that can never succeed.
    const res = await post(capturedEvent('o_does_not_exist', 24300));
    assert.equal(res.status, 200);
    assert.equal(res.outcome, 'no-order');
  });

  it('acknowledges a signed event carrying no orderId', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_z', amount: 100 } } },
    });
    const res = await post(body);
    assert.equal(res.status, 200);
    assert.equal(res.outcome, 'ignored');
  });
});
