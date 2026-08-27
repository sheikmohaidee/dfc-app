/**
 * Webhook signature verification.
 *
 * This is the single most security-sensitive function in the project. It is
 * the only thing standing between DFC and a stranger POSTing
 * `{"event":"payment.captured"}` at a public URL to mark their own order paid.
 *
 * No emulator, no network, no Firestore — these are pure and exhaustive on
 * purpose, because a test that is slow to run is a test that stops being run.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';

import {
  computeSignature,
  decideSettlement,
  isHandled,
  parseEvent,
  verifyWebhookSignature,
} from '../src/razorpay';

const SECRET = 'whsec_test_only_not_a_real_secret';
const OTHER_SECRET = 'whsec_someone_elses_secret';

const BODY = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_R1abc',
        amount: 24300,
        notes: { orderId: 'o_real', orderCode: '1042' },
      },
    },
  },
});

const raw = (s: string) => Buffer.from(s, 'utf8');
const sign = (s: string, secret = SECRET) =>
  createHmac('sha256', secret).update(raw(s)).digest('hex');

// ---------------------------------------------------------------------------

describe('a genuine webhook', () => {
  it('is accepted', () => {
    const r = verifyWebhookSignature(raw(BODY), sign(BODY), SECRET);
    assert.equal(r.ok, true);
  });

  it('is accepted when the body is passed as a string', () => {
    const r = verifyWebhookSignature(BODY, sign(BODY), SECRET);
    assert.equal(r.ok, true);
  });

  it('produces a 64-character lowercase hex signature', () => {
    assert.match(computeSignature(raw(BODY), SECRET), /^[0-9a-f]{64}$/);
  });

  it('is accepted for a hundred random payloads', () => {
    for (let i = 0; i < 100; i += 1) {
      const body = JSON.stringify({ event: 'payment.captured', nonce: randomBytes(16).toString('hex') });
      assert.equal(verifyWebhookSignature(raw(body), sign(body), SECRET).ok, true);
    }
  });
});

// ---------------------------------------------------------------------------
// The attacks
// ---------------------------------------------------------------------------

describe('a forged webhook is rejected', () => {
  it('with no signature header at all', () => {
    const r = verifyWebhookSignature(raw(BODY), undefined, SECRET);
    assert.deepEqual(r, { ok: false, reason: 'missing-signature' });
  });

  it('with an empty signature header', () => {
    const r = verifyWebhookSignature(raw(BODY), '', SECRET);
    assert.deepEqual(r, { ok: false, reason: 'missing-signature' });
  });

  it('with a signature made using the wrong secret', () => {
    // The exact attack: someone knows the payload format but not the secret.
    const r = verifyWebhookSignature(raw(BODY), sign(BODY, OTHER_SECRET), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with a valid signature over a DIFFERENT body', () => {
    // Replaying yesterday's genuine signature onto today's forged payload.
    const genuine = sign(JSON.stringify({ event: 'payment.captured', amount: 100 }));
    const r = verifyWebhookSignature(raw(BODY), genuine, SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('when a single byte of the body is changed after signing', () => {
    // ₹243.00 becomes ₹2.43 — the signature must not survive it.
    const tampered = BODY.replace('24300', '00243');
    assert.notEqual(tampered, BODY);
    const r = verifyWebhookSignature(raw(tampered), sign(BODY), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('when the orderId is swapped for someone else’s order', () => {
    const stolen = BODY.replace('o_real', 'o_mine');
    const r = verifyWebhookSignature(raw(stolen), sign(BODY), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with a truncated signature', () => {
    const r = verifyWebhookSignature(raw(BODY), sign(BODY).slice(0, 63), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with a padded signature', () => {
    const r = verifyWebhookSignature(raw(BODY), `${sign(BODY)}0`, SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with an uppercase signature — Razorpay sends lowercase hex', () => {
    const r = verifyWebhookSignature(raw(BODY), sign(BODY).toUpperCase(), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with a signature that is not hex at all', () => {
    const r = verifyWebhookSignature(raw(BODY), 'x'.repeat(64), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'mismatch' });
  });

  it('with an empty body', () => {
    const r = verifyWebhookSignature(raw(''), sign(''), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'missing-body' });
  });

  it('with no body', () => {
    const r = verifyWebhookSignature(undefined, sign(BODY), SECRET);
    assert.deepEqual(r, { ok: false, reason: 'missing-body' });
  });

  it('for every single-character mutation of a valid signature', () => {
    // 64 positions x 15 other hex digits = 960 near-miss forgeries. This is
    // the test that would catch a prefix comparison or a length-only check.
    const good = sign(BODY);
    const hex = '0123456789abcdef';
    let checked = 0;

    for (let i = 0; i < good.length; i += 1) {
      for (const c of hex) {
        if (c === good[i]) continue;
        const forged = good.slice(0, i) + c + good.slice(i + 1);
        const r = verifyWebhookSignature(raw(BODY), forged, SECRET);
        assert.equal(r.ok, false, `accepted a forgery differing only at index ${i}`);
        checked += 1;
      }
    }

    assert.equal(checked, 64 * 15);
  });
});

// ---------------------------------------------------------------------------

describe('signature comparison is constant-time', () => {
  it('rejects a signature whose first 63 characters are correct', () => {
    // A short-circuiting `===` returns at the last character here and at the
    // first character below. The timing gap is what makes a signature
    // forgeable one byte at a time; both must take the same path.
    const good = sign(BODY);
    const nearMiss = good.slice(0, 63) + (good[63] === 'a' ? 'b' : 'a');
    const farMiss = (good[0] === 'a' ? 'b' : 'a') + good.slice(1);

    assert.equal(verifyWebhookSignature(raw(BODY), nearMiss, SECRET).ok, false);
    assert.equal(verifyWebhookSignature(raw(BODY), farMiss, SECRET).ok, false);
  });

  it('does not throw on a length mismatch', () => {
    // timingSafeEqual throws on unequal lengths; an unguarded call turns a
    // forged request into a 500, which Razorpay then retries forever.
    for (const len of [0, 1, 32, 63, 65, 128, 1000]) {
      assert.doesNotThrow(() =>
        verifyWebhookSignature(raw(BODY), 'a'.repeat(len), SECRET),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Event parsing
// ---------------------------------------------------------------------------

describe('parseEvent', () => {
  it('reads notes off a payment entity', () => {
    const p = parseEvent(JSON.parse(BODY));
    assert.equal(p.orderId, 'o_real');
    assert.equal(p.amountPaise, 24300);
    assert.equal(p.gatewayPaymentId, 'pay_R1abc');
  });

  it('reads notes off a payment LINK entity', () => {
    // Different shape, same meaning. Reading only the payment entity here
    // silently drops every payment-link webhook.
    const p = parseEvent({
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: { id: 'plink_1', amount_paid: 24300, notes: { orderId: 'o_link' } },
        },
      },
    });
    assert.equal(p.orderId, 'o_link');
    assert.equal(p.amountPaise, 24300);
  });

  it('returns nulls rather than throwing on a payload with nothing in it', () => {
    const p = parseEvent({ event: 'payment.captured' });
    assert.equal(p.orderId, null);
    assert.equal(p.amountPaise, null);
  });

  it('knows which events it handles', () => {
    assert.equal(isHandled('payment.captured'), true);
    assert.equal(isHandled('payment_link.paid'), true);
    assert.equal(isHandled('payment.failed'), true);
    assert.equal(isHandled('refund.processed'), true);
    assert.equal(isHandled('order.paid'), false);
    assert.equal(isHandled('subscription.charged'), false);
  });
});

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

describe('decideSettlement', () => {
  const base = { currentState: 'awaiting_customer', expectedPaise: 24300, orderExists: true };

  it('pays on the exact amount', () => {
    const d = decideSettlement({ ...base, receivedPaise: 24300 });
    assert.deepEqual(d, { action: 'pay', receivedPaise: 24300 });
  });

  it('pays on an overpayment — that is a refund problem, not a fraud one', () => {
    const d = decideSettlement({ ...base, receivedPaise: 25000 });
    assert.equal(d.action, 'pay');
  });

  it('refuses to release goods on a short payment', () => {
    const d = decideSettlement({ ...base, receivedPaise: 24299 });
    assert.deepEqual(d, { action: 'short', receivedPaise: 24299, expectedPaise: 24300 });
  });

  it('refuses one paisa short, and every amount below', () => {
    for (const received of [0, 1, 100, 12150, 24299]) {
      assert.equal(
        decideSettlement({ ...base, receivedPaise: received }).action,
        'short',
        `₹${received / 100} was accepted against a ₹243 order`,
      );
    }
  });

  it('ignores a re-delivered event for an order already paid', () => {
    const d = decideSettlement({ ...base, currentState: 'paid', receivedPaise: 24300 });
    assert.deepEqual(d, { action: 'ignore', why: 'already-paid' });
  });

  it('ignores an event for an order that does not exist', () => {
    const d = decideSettlement({ ...base, orderExists: false, receivedPaise: 24300 });
    assert.deepEqual(d, { action: 'ignore', why: 'no-order' });
  });

  it('trusts the order total when the event carries no amount', () => {
    const d = decideSettlement({ ...base, receivedPaise: null });
    assert.deepEqual(d, { action: 'pay', receivedPaise: 24300 });
  });
});
