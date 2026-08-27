/**
 * Payment link idempotency — the double-billing tests.
 *
 * The app calls `createPaymentLink` every time the customer taps "Pay now".
 * On a bad connection that is three or four taps, and the failure mode is not
 * a wasted API call: it is three live Razorpay links for one order, all of
 * them payable, and Razorpay will collect on every one.
 *
 * The assertion throughout is on `razorpay.calls.length` rather than on the
 * returned URL. "The same URL came back" can be true of a broken
 * implementation that mints a link and throws it away; "the payment provider
 * was never asked a second time" cannot.
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COL } from '@dfc/core';

import { createGatewayOrderLogic, createPaymentLinkLogic } from '../src/payments';
import {
  CUSTOMER_UID,
  TEST_KEY_ID,
  TEST_KEY_SECRET,
  clearFirestore,
  db,
  fakeRazorpay,
  getPayment,
  seedOrder,
  shutdown,
  type FakeRazorpay,
} from './harness';

function deps(razorpay: FakeRazorpay) {
  return {
    db: db(),
    keyId: TEST_KEY_ID,
    keySecret: TEST_KEY_SECRET,
    fetchImpl: razorpay.fetch,
  };
}

before(() => {
  db();
});
after(shutdown);
beforeEach(clearFirestore);

// ---------------------------------------------------------------------------

describe('createPaymentLink', () => {
  it('creates a link on the first call', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    const r = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(rz.calls.length, 1);
    assert.equal(r.reused, false);
    assert.match(r.url, /^https:\/\/rzp\.io\/i\//);
    assert.equal(r.amountPaise, 24300);

    const payment = await getPayment(orderId);
    assert.equal(payment?.state, 'awaiting_customer');
    assert.equal(payment?.paymentLinkUrl, r.url);
    assert.equal(payment?.amountPaise, 24300);
  });

  it('sends the amount from Firestore, never from the caller', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    const body = rz.calls[0]?.body as { amount: number; notes: { orderId: string } };
    assert.equal(body.amount, 24300);
    // The webhook finds its way home through this. Without it every payment
    // is an unattributable line in a Razorpay dashboard.
    assert.equal(body.notes.orderId, orderId);
  });

  it('reuses the link on a second call — the double-tap case', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    const first = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);
    const second = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(rz.calls.length, 1, 'a second link was minted — the customer can pay twice');
    assert.equal(second.url, first.url);
    assert.equal(second.reused, true);
  });

  it('reuses the link across twenty impatient taps', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    const urls = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      urls.add((await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId)).url);
    }

    assert.equal(rz.calls.length, 1);
    assert.equal(urls.size, 1);
  });

  it('mints a fresh link once the order is repriced', async () => {
    // The opposite failure. Reusing a ₹243 link after the basket grew to ₹310
    // is underbilling — correct behaviour is a new link for the new total.
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    const first = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    await db().doc(`${COL.orders}/${orderId}`).update({
      'pricing.itemsPaise': 28100,
      'pricing.totalPaise': 31000,
    });

    const second = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(rz.calls.length, 2);
    assert.notEqual(second.url, first.url);
    assert.equal(second.amountPaise, 31000);
    assert.equal((rz.calls[1]?.body as { amount: number }).amount, 31000);
  });

  it('never hands out a link for an order that is already paid', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);
    await db().doc(`${COL.payments}/${orderId}_gateway`).update({ state: 'paid' });

    const second = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(second.reused, false, 'a paid order was handed its old payment link');
    assert.equal(rz.calls.length, 2);
  });

  it('mints a fresh link after a failed one', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);
    await db().doc(`${COL.payments}/${orderId}_gateway`).update({ state: 'failed' });

    const second = await createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(second.reused, false);
    assert.equal(rz.calls.length, 2);
  });

  it('writes nothing when Razorpay refuses', async () => {
    const rz = fakeRazorpay({ failWith: 502 });
    const { orderId } = await seedOrder();

    await assert.rejects(() => createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId));

    // A payment doc pointing at a link that was never created is worse than
    // no payment doc: the next call would reuse the phantom.
    assert.equal(await getPayment(orderId), null);
  });
});

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

describe('createPaymentLink refuses', () => {
  it('somebody else’s order', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    await assert.rejects(
      () => createPaymentLinkLogic(deps(rz), 'u_stranger', orderId),
      /not your order/i,
    );
    assert.equal(rz.calls.length, 0);
  });

  it('an order that does not exist', async () => {
    const rz = fakeRazorpay();
    await assert.rejects(
      () => createPaymentLinkLogic(deps(rz), CUSTOMER_UID, 'o_nope'),
      /does not exist/i,
    );
    assert.equal(rz.calls.length, 0);
  });

  it('an order nobody has priced', async () => {
    const rz = fakeRazorpay();
    // An empty basket is not an unpriced one — it still carries the delivery
    // fee. Zero the total explicitly, which is the state an order sits in
    // between `incoming` and an admin pricing it.
    const { orderId } = await seedOrder({
      items: [],
      status: 'incoming',
      pricing: { itemsPaise: 0, deliveryPaise: 0, servicePaise: 0, totalPaise: 0 },
    });

    await assert.rejects(
      () => createPaymentLinkLogic(deps(rz), CUSTOMER_UID, orderId),
      /not been priced/i,
    );
    assert.equal(rz.calls.length, 0);
  });
});

// ---------------------------------------------------------------------------
// The other callable
// ---------------------------------------------------------------------------

describe('createGatewayOrder', () => {
  it('is idempotent too', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    const first = await createGatewayOrderLogic(deps(rz), CUSTOMER_UID, orderId);
    const second = await createGatewayOrderLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal(rz.calls.length, 1);
    assert.equal(second.gatewayOrderId, first.gatewayOrderId);
    assert.equal(second.reused, true);
  });

  it('reads the amount from the server’s copy of the order', async () => {
    const rz = fakeRazorpay();
    const { orderId } = await seedOrder();

    await createGatewayOrderLogic(deps(rz), CUSTOMER_UID, orderId);

    assert.equal((rz.calls[0]?.body as { amount: number }).amount, 24300);
  });
});
