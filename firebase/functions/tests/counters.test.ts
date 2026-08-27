/**
 * Atomic counters under concurrency.
 *
 * Three counters in DFC can be corrupted by two requests arriving at once:
 *
 *   promo budget      overspending a campaign — real money given away
 *   promo redemptions a wrong ROAS, which is a decision made on bad data
 *   invoice sequence  a duplicate invoice number, which is a GST problem
 *                     rather than a software one
 *
 * A concurrency test that passes is weak evidence on its own — it may simply
 * never have raced. So this file also runs the NAIVE version of each pattern
 * and asserts that it *does* break. If the naive test ever stops failing, the
 * harness is not generating real contention and the passing tests below mean
 * nothing.
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COL } from '@dfc/core';

import { redeemPromotionLogic } from '../src/admin';
import {
  CUSTOMER_UID,
  assertHonestRejections,
  clearFirestore,
  db,
  getOrder,
  getPromotion,
  seedOrder,
  seedPromotion,
  shutdown,
} from './harness';

before(() => {
  db();
});
after(shutdown);
beforeEach(clearFirestore);

/** Runs `n` copies of `fn` at once and reports what each one did. */
async function race<T>(n: number, fn: (i: number) => Promise<T>) {
  const settled = await Promise.allSettled(Array.from({ length: n }, (_, i) => fn(i)));
  return {
    fulfilled: settled.filter((s) => s.status === 'fulfilled').map((s) => s.value),
    rejected: settled.filter((s) => s.status === 'rejected').map((s) => s.reason as Error),
  };
}

// ---------------------------------------------------------------------------
// Promo budget
// ---------------------------------------------------------------------------

describe('promotion budget', () => {
  it('is never overspent, however many orders redeem at once', async () => {
    // ₹100 budget, ₹20 discount: at most five may succeed, twelve try at once.
    //
    // This test is about SAFETY, not about exactly how many get through. All
    // twelve contend for one promotion document, so some may come back
    // ABORTED on a lock timeout — a caller that was aborted simply retries,
    // and no money moved. Overspending the budget is the failure that costs
    // real rupees, so that is what is asserted absolutely. The exact boundary
    // is pinned down by the uncontended test below.
    const promotionId = await seedPromotion();
    const orders = await Promise.all(Array.from({ length: 12 }, () => seedOrder()));

    const { fulfilled, rejected } = await race(12, (i) =>
      redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orders[i]!.orderId),
    );

    const promo = await getPromotion(promotionId);

    assert.ok(
      promo.spentPaise <= promo.budgetPaise,
      `overspent: ₹${promo.spentPaise / 100} against a ₹${promo.budgetPaise / 100} budget`,
    );
    assert.ok(fulfilled.length <= 5, `${fulfilled.length} redemptions fit in a five-redemption budget`);

    // The counters must agree with each other, not just with their own caps.
    assert.equal(promo.spentPaise, promo.redemptions * 2000);
    assert.equal(promo.redemptions, fulfilled.length);

    // Every rejection must be an honest one. There are three acceptable
    // reasons and they are all different: a caller that loses the budget race
    // is told the offer ran out; one that arrives after the budget is gone
    // sees the promo already self-paused by `effectiveStatus`, so the discount
    // evaluates to zero and it is told the offer does not apply; and one that
    // simply lost the write lock is aborted. What would not be acceptable is a
    // permission or not-found error, which would mean the budget guard was
    // never what stopped them.
    assertHonestRejections(rejected, /run out|does not apply/i);
  });

  it('lets exactly five ₹20 discounts out of a ₹100 budget', async () => {
    // The same twelve attempts, one at a time. No contention, so this pins the
    // boundary exactly: five succeed, the sixth is refused, and nothing after
    // it slips through.
    const promotionId = await seedPromotion();
    const orders = await Promise.all(Array.from({ length: 12 }, () => seedOrder()));

    let succeeded = 0;
    let refused = 0;
    for (const { orderId } of orders) {
      try {
        await redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orderId);
        succeeded += 1;
      } catch {
        refused += 1;
      }
    }

    assert.equal(succeeded, 5);
    assert.equal(refused, 7);

    const promo = await getPromotion(promotionId);
    assert.equal(promo.spentPaise, 10000);
    assert.equal(promo.redemptions, 5);
  });

  it('discounts exactly the orders it charged the budget for', async () => {
    const promotionId = await seedPromotion();
    const orders = await Promise.all(Array.from({ length: 12 }, () => seedOrder()));

    await race(12, (i) =>
      redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orders[i]!.orderId),
    );

    const after = await Promise.all(orders.map((o) => getOrder(o.orderId)));
    const discounted = after.filter((o) => o.appliedPromotionId === promotionId);

    assert.equal(discounted.length, 5, 'budget spend and discounted orders disagree');
    for (const o of discounted) {
      assert.equal(o.pricing.discountPaise, 2000);
      assert.equal(o.pricing.totalPaise, 24300 - 2000);
    }
    // Everyone else pays full price.
    for (const o of after.filter((x) => !x.appliedPromotionId)) {
      assert.equal(o.pricing.totalPaise, 24300);
    }
  });

  it('tracks revenue against the pre-discount total', async () => {
    const promotionId = await seedPromotion();
    const { orderId } = await seedOrder();

    await redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orderId);

    const promo = await getPromotion(promotionId);
    assert.equal(promo.revenuePaise, 24300);
  });
});

// ---------------------------------------------------------------------------
// Double redemption
// ---------------------------------------------------------------------------

describe('one order, one discount', () => {
  it('cannot be discounted twice by calling twice', async () => {
    const promotionId = await seedPromotion();
    const { orderId } = await seedOrder();

    const first = await redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orderId);
    const second = await redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orderId);

    assert.equal(first.alreadyApplied, false);
    assert.equal(second.alreadyApplied, true);
    assert.equal(second.totalPaise, first.totalPaise, 'the basket was discounted twice');

    const promo = await getPromotion(promotionId);
    assert.equal(promo.spentPaise, 2000, 'the budget was charged twice for one order');
    assert.equal(promo.redemptions, 1);

    assert.equal((await getOrder(orderId)).pricing.totalPaise, 22300);
  });

  it('cannot be discounted twice by eight simultaneous calls', async () => {
    const promotionId = await seedPromotion();
    const { orderId } = await seedOrder();

    const { fulfilled, rejected } = await race(8, () =>
      redeemPromotionLogic(db(), CUSTOMER_UID, promotionId, orderId),
    );

    // Eight callers contending for the same two documents; some may be
    // aborted on a lock timeout, and a caller that was aborted just retries.
    // What must hold is that the discount landed exactly once.
    assert.equal(
      fulfilled.filter((r) => !r.alreadyApplied).length,
      1,
      'more than one call believed it applied the discount',
    );
    assertHonestRejections(rejected);

    const promo = await getPromotion(promotionId);
    assert.equal(promo.spentPaise, 2000, 'the budget was charged more than once');
    assert.equal(promo.redemptions, 1);
    assert.equal((await getOrder(orderId)).pricing.totalPaise, 22300);
  });

  it('refuses a second, different offer on the same order', async () => {
    const first = await seedPromotion();
    const second = await seedPromotion();
    const { orderId } = await seedOrder();

    await redeemPromotionLogic(db(), CUSTOMER_UID, first, orderId);
    await assert.rejects(
      () => redeemPromotionLogic(db(), CUSTOMER_UID, second, orderId),
      /already on this order/i,
    );

    assert.equal((await getPromotion(second)).spentPaise, 0);
  });

  it('refuses an order that is not the caller’s', async () => {
    const promotionId = await seedPromotion();
    const { orderId } = await seedOrder();

    await assert.rejects(
      () => redeemPromotionLogic(db(), 'u_stranger', promotionId, orderId),
      /not your order/i,
    );
    assert.equal((await getPromotion(promotionId)).spentPaise, 0);
  });
});

// ---------------------------------------------------------------------------
// Sequence counters
// ---------------------------------------------------------------------------

/**
 * The transactional counter increment.
 *
 * This mirrors `issueInvoice` in apps/mobile/src/lib/payments.ts, which runs
 * the same read-modify-write against `counters/{id}` on the client SDK. The
 * Firestore rule for that collection only permits `value == existing + 1`, so
 * the two halves — rule and pattern — are tested in different suites:
 * firebase/tests/rules.test.ts proves a client cannot jump the counter, and
 * this proves the pattern itself does not lose increments under contention.
 */
async function nextSequence(counterId: string): Promise<number> {
  const ref = db().doc(`${COL.counters}/${counterId}`);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = snap.exists ? (snap.data()!.value as number) + 1 : 1;
    tx.set(ref, { value: next }, { merge: true });
    return next;
  });
}

describe('invoice sequence counter', () => {
  it('never issues the same number twice, however hard it is pushed', async () => {
    // 25 simultaneous callers on ONE document is past what Firestore will do:
    // a single doc sustains roughly one write per second, and a counter is the
    // textbook hotspot. Some of these will come back ABORTED with a lock
    // timeout, and that is the correct behaviour rather than a bug.
    //
    // So the assertion is not "all 25 succeed". It is the invariant that
    // actually matters: nobody who DID get a number shares it with anybody
    // else. A caller that was aborted simply retries and gets the next one;
    // two invoices carrying DFC/2026-27/000007 is a problem no retry fixes,
    // because it has already gone to a customer and into a GST return.
    const { fulfilled, rejected } = await race(25, () => nextSequence('invoice-2026-27'));

    const unique = new Set(fulfilled);
    assert.equal(unique.size, fulfilled.length, 'two invoices were issued the same number');

    // Contiguous from 1 with no holes. An auditor reading 000001 through
    // 0000NN must find NN invoices, not NN-2 and two gaps.
    assert.deepEqual(
      [...unique].sort((a, b) => a - b),
      Array.from({ length: fulfilled.length }, (_, i) => i + 1),
    );

    // The counter agrees with what was handed out.
    const snap = await db().doc(`${COL.counters}/invoice-2026-27`).get();
    assert.equal(snap.data()?.value, fulfilled.length);

    // Every refusal must be contention, not corruption.
    assertHonestRejections(rejected);
  });

  it('serves a realistic burst without dropping anyone', async () => {
    // Eight at once is well beyond a real evening in Madurai — orders arrive
    // seconds apart, not in the same millisecond — and all eight must survive.
    // If this one starts flaking, the counter has become a genuine bottleneck
    // and needs sharding rather than a looser test.
    const { fulfilled, rejected } = await race(8, () => nextSequence('invoice-2026-27'));

    assert.equal(rejected.length, 0, rejected[0]?.message);
    assert.deepEqual(
      [...fulfilled].sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
  });

  it('starts at 1 for a new financial year', async () => {
    assert.equal(await nextSequence('invoice-2027-28'), 1);
  });

  it('keeps separate years separate', async () => {
    // Two counters, so the two financial years cannot contend with each other
    // — which is the point. On 1 April the new year starts at 1 while the old
    // one keeps its final number for the audit trail.
    await race(6, () => nextSequence('invoice-2026-27'));
    await race(4, () => nextSequence('invoice-2027-28'));

    const a = await db().doc(`${COL.counters}/invoice-2026-27`).get();
    const b = await db().doc(`${COL.counters}/invoice-2027-28`).get();
    assert.equal(a.data()?.value, 6);
    assert.equal(b.data()?.value, 4);
  });
});

// ---------------------------------------------------------------------------
// Proof the tests above have teeth
// ---------------------------------------------------------------------------

describe('the naive patterns really do break', () => {
  it('a read-then-write counter loses increments', async () => {
    // No transaction: read, add one, write. This is the bug the transactional
    // version exists to prevent, and it must fail here — otherwise the
    // passing test above proves only that nothing raced.
    const ref = db().doc(`${COL.counters}/naive`);
    await ref.set({ value: 0 });

    const results = await Promise.all(
      Array.from({ length: 25 }, async () => {
        const snap = await ref.get();
        const next = (snap.data()!.value as number) + 1;
        await ref.set({ value: next });
        return next;
      }),
    );

    const snap = await ref.get();
    const lost = snap.data()!.value < 25 || new Set(results).size < 25;

    assert.ok(
      lost,
      'the naive counter survived 25 concurrent writers — this harness is not ' +
        'producing real contention, so the atomicity tests above are not proving anything',
    );
  });

  it('an unguarded budget check overspends', async () => {
    // Check-then-increment, with the check outside the transaction. The
    // guarded version refuses the sixth redemption; this one does not.
    const promotionId = await seedPromotion();
    const ref = db().doc(`${COL.promotions}/${promotionId}`);

    await Promise.all(
      Array.from({ length: 12 }, async () => {
        const snap = await ref.get();
        const spent = snap.data()!.spentPaise as number;
        const budget = snap.data()!.budgetPaise as number;
        if (spent + 2000 > budget) return;
        await ref.update({ spentPaise: spent + 2000 });
      }),
    );

    const promo = await getPromotion(promotionId);
    assert.notEqual(
      promo.spentPaise,
      10000,
      'the unguarded budget landed exactly on target — no contention was generated',
    );
  });
});
