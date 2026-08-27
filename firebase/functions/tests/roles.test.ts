/**
 * Role granting — the root of the whole authorisation model.
 *
 * Every rule in firestore.rules and storage.rules reads `request.auth.token.role`.
 * `setUserRole` is the only thing that writes it. If this function can be
 * reached by the wrong caller, the 101 rules tests in this repo are testing a
 * lock on a door that anybody can walk around.
 *
 * So most of what follows is about who is refused.
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COL } from '@dfc/core';

import { repriceOrderLogic, setUserRoleLogic, type ClaimWriter } from '../src/admin';
import { clearFirestore, db, seedOrder, shutdown } from './harness';

/**
 * Records claim writes instead of performing them.
 *
 * The Auth emulator would work here, but it would test Firebase's SDK rather
 * than this function's decisions. What matters is *which claims get written*,
 * and a recorder states that directly.
 */
function claimRecorder(): ClaimWriter & { writes: { uid: string; claims: unknown }[] } {
  const writes: { uid: string; claims: unknown }[] = [];
  return {
    writes,
    async setCustomUserClaims(uid, claims) {
      writes.push({ uid, claims });
    },
  };
}

const ADMIN = { uid: 'u_admin', role: 'admin' };

before(() => {
  db();
});
after(shutdown);
beforeEach(clearFirestore);

// ---------------------------------------------------------------------------

describe('granting a role', () => {
  it('writes the claim and the profile together', async () => {
    const auth = claimRecorder();

    const res = await setUserRoleLogic(auth, db(), ADMIN, { uid: 'u_new', role: 'rider' });

    assert.equal(res.ok, true);
    // The note is not decoration: a client holding a stale ID token still has
    // the old role until it refreshes, and the caller has to be told.
    assert.match(res.note, /refresh/i);

    assert.deepEqual(auth.writes, [{ uid: 'u_new', claims: { role: 'rider' } }]);

    const profile = (await db().doc(`${COL.users}/u_new`).get()).data();
    assert.equal(profile?.role, 'rider');
  });

  it('carries the storeId for a vendor', async () => {
    const auth = claimRecorder();

    await setUserRoleLogic(auth, db(), ADMIN, {
      uid: 'u_vendor',
      role: 'vendor',
      storeId: 'meenakshi-medicals',
    });

    // The rules read storeId off the token to scope a vendor to one shop. A
    // vendor claim without it would match no store and see nothing.
    assert.deepEqual(auth.writes[0]?.claims, {
      role: 'vendor',
      storeId: 'meenakshi-medicals',
    });

    const profile = (await db().doc(`${COL.users}/u_vendor`).get()).data();
    assert.equal(profile?.storeId, 'meenakshi-medicals');
  });

  it('accepts each of the four roles', async () => {
    for (const role of ['customer', 'vendor', 'rider', 'admin'] as const) {
      const auth = claimRecorder();
      const extra = role === 'vendor' ? { storeId: 's1' } : {};
      await setUserRoleLogic(auth, db(), ADMIN, { uid: `u_${role}`, role, ...extra });
      assert.equal((auth.writes[0]?.claims as { role: string }).role, role);
    }
  });

  it('writes the claim before the profile', async () => {
    // If the profile write fails, the person has the access their claim says
    // and the UI catches up. The other order grants a role the rules do not
    // honour, which looks like a broken product rather than a failed write.
    const order: string[] = [];
    const auth: ClaimWriter = {
      async setCustomUserClaims() {
        order.push('claim');
      },
    };
    const spyDb = {
      doc: () => ({
        set: async () => {
          order.push('profile');
        },
      }),
    } as unknown as ReturnType<typeof db>;

    await setUserRoleLogic(auth, spyDb, ADMIN, { uid: 'u_x', role: 'rider' });
    assert.deepEqual(order, ['claim', 'profile']);
  });
});

// ---------------------------------------------------------------------------
// Who cannot call it
// ---------------------------------------------------------------------------

describe('granting a role is refused', () => {
  const cases: [string, { uid: string; role?: unknown }][] = [
    ['a customer', { uid: 'u_1', role: 'customer' }],
    ['a vendor', { uid: 'u_2', role: 'vendor' }],
    ['a rider', { uid: 'u_3', role: 'rider' }],
    ['a caller with no role claim at all', { uid: 'u_4' }],
    ['a caller whose role is undefined', { uid: 'u_5', role: undefined }],
    ['a caller claiming a made-up role', { uid: 'u_6', role: 'superadmin' }],
  ];

  for (const [who, caller] of cases) {
    it(`for ${who}`, async () => {
      const auth = claimRecorder();
      await assert.rejects(
        () => setUserRoleLogic(auth, db(), caller, { uid: 'u_victim', role: 'admin' }),
        /only an admin/i,
      );
      assert.equal(auth.writes.length, 0, 'a claim was written by a non-admin');
    });
  }

  it('for a caller trying to promote themselves', async () => {
    // The self-promotion attack, stated plainly.
    const auth = claimRecorder();
    await assert.rejects(
      () => setUserRoleLogic(auth, db(), { uid: 'u_me', role: 'customer' }, {
        uid: 'u_me',
        role: 'admin',
      }),
      /only an admin/i,
    );
    assert.equal(auth.writes.length, 0);
  });

  it('for a role that is not one of the four', async () => {
    const auth = claimRecorder();
    for (const role of ['superadmin', 'root', '', 'ADMIN', 'customer ', 1, null, {}]) {
      await assert.rejects(
        () => setUserRoleLogic(auth, db(), ADMIN, { uid: 'u_x', role }),
        /valid role/i,
        `accepted role: ${JSON.stringify(role)}`,
      );
    }
    assert.equal(auth.writes.length, 0);
  });

  it('for a missing or malformed uid', async () => {
    const auth = claimRecorder();
    for (const uid of [undefined, '', null, 42, {}]) {
      await assert.rejects(
        () => setUserRoleLogic(auth, db(), ADMIN, { uid, role: 'rider' }),
        /uid and a valid role/i,
      );
    }
    assert.equal(auth.writes.length, 0);
  });

  it('for a vendor with no storeId — they would see no store', async () => {
    const auth = claimRecorder();
    await assert.rejects(
      () => setUserRoleLogic(auth, db(), ADMIN, { uid: 'u_v', role: 'vendor' }),
      /needs a storeId/i,
    );
    assert.equal(auth.writes.length, 0);
  });

  it('for a non-vendor carrying a storeId', async () => {
    // Refused rather than silently dropped, so a miswired admin call is
    // visible instead of half-applied.
    const auth = claimRecorder();
    await assert.rejects(
      () => setUserRoleLogic(auth, db(), ADMIN, { uid: 'u_r', role: 'rider', storeId: 's1' }),
      /only a vendor/i,
    );
    assert.equal(auth.writes.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Auto-repricing
// ---------------------------------------------------------------------------

async function seedProduct(over: Record<string, unknown> = {}) {
  const id = `pr_${Math.random().toString(36).slice(2, 8)}`;
  await db().doc(`${COL.products}/${id}`).set({
    id,
    storeId: 'meenakshi-medicals',
    name: 'Paracetamol 500mg',
    unit: 'strip of 15',
    sellPaise: 2200,
    costPaise: 1800,
    stockQty: 40,
    isActive: true,
    category: 'pharmacy',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...over,
  });
  return id;
}

function item(over: Record<string, unknown> = {}) {
  return {
    id: `i_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Paracetamol 500mg',
    unit: 'strip of 15',
    quantity: 1,
    unitPricePaise: 9900, // the model's guess — deliberately wrong
    confidence: 0.8,
    included: true,
    ...over,
  };
}

describe('auto-repricing an incoming order', () => {
  it('replaces the model’s guess with the catalogue price', async () => {
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'incoming', items: [item()] });

    const res = await repriceOrderLogic(db(), orderId);

    assert.deepEqual(res, { matched: 1, of: 1, repriced: true });

    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[0].unitPricePaise, 2200, 'the ₹99 guess survived');
    // Total must be rebuilt from the new prices, not left stale.
    assert.equal(after?.pricing.itemsPaise, 2200);
    assert.equal(after?.pricing.totalPaise, 2200 + after?.pricing.deliveryPaise);
  });

  it('counts quantity when rebuilding the total', async () => {
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'incoming', items: [item({ quantity: 3 })] });

    await repriceOrderLogic(db(), orderId);

    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.pricing.itemsPaise, 6600);
  });

  it('excludes an out-of-stock item and says why', async () => {
    await seedProduct({ stockQty: 0 });
    const { orderId } = await seedOrder({ status: 'incoming', items: [item()] });

    await repriceOrderLogic(db(), orderId);

    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[0].included, false);
    assert.match(after?.items[0].note, /out of stock/i);
    // Excluded means not billed.
    assert.equal(after?.pricing.itemsPaise, 0);
  });

  it('promotes confidence only for an item the model was already sure of', async () => {
    // A 0.3 reading that happens to fuzzy-match a product name is still a 0.3
    // reading, and must keep its VERIFY chip in front of a human.
    await seedProduct();
    const { orderId } = await seedOrder({
      status: 'incoming',
      items: [item({ confidence: 0.9 }), item({ confidence: 0.3 })],
    });

    await repriceOrderLogic(db(), orderId);

    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[0].confidence, 1);
    assert.equal(after?.items[1].confidence, 0.3, 'a low-confidence read was promoted');
  });

  it('leaves an unmatched item exactly as it was', async () => {
    await seedProduct();
    const { orderId } = await seedOrder({
      status: 'incoming',
      items: [item(), item({ name: 'Something the shop does not stock', unitPricePaise: 5000 })],
    });

    const res = await repriceOrderLogic(db(), orderId);
    assert.equal(res.matched, 1);
    assert.equal(res.of, 2);

    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[1].unitPricePaise, 5000);
    assert.equal(after?.items[1].confidence, 0.8);
  });

  it('only ever prices from the order’s own store', async () => {
    // Another shop's catalogue must not price this order. Cheaper stock at a
    // different shop is not a discount, it is the wrong price.
    await seedProduct({ storeId: 'someone-else', sellPaise: 100 });
    const { orderId } = await seedOrder({ status: 'incoming', items: [item()] });

    const res = await repriceOrderLogic(db(), orderId);

    assert.equal(res.repriced, false);
    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[0].unitPricePaise, 9900);
  });

  it('ignores a de-listed product', async () => {
    await seedProduct({ isActive: false });
    const { orderId } = await seedOrder({ status: 'incoming', items: [item()] });

    assert.equal((await repriceOrderLogic(db(), orderId)).repriced, false);
  });

  it('does nothing to an order a human has already touched', async () => {
    // The trigger is for `incoming` only. Repricing an order an admin has
    // already reviewed would overwrite their judgement.
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'admin_review', items: [item()] });

    const res = await repriceOrderLogic(db(), orderId);

    assert.equal(res.repriced, false);
    const after = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    assert.equal(after?.items[0].unitPricePaise, 9900);
  });

  it('does nothing for an order with no store yet', async () => {
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'incoming', storeId: null, items: [item()] });
    assert.equal((await repriceOrderLogic(db(), orderId)).repriced, false);
  });

  it('does nothing for an empty basket, or an order that does not exist', async () => {
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'incoming', items: [] });
    assert.equal((await repriceOrderLogic(db(), orderId)).repriced, false);
    assert.equal((await repriceOrderLogic(db(), 'o_nope')).repriced, false);
  });

  it('is safe to run twice', async () => {
    // Triggers get re-delivered. The second run must land on the same numbers.
    await seedProduct();
    const { orderId } = await seedOrder({ status: 'incoming', items: [item()] });

    await repriceOrderLogic(db(), orderId);
    const once = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    await repriceOrderLogic(db(), orderId);
    const twice = (await db().doc(`${COL.orders}/${orderId}`).get()).data();

    assert.equal(twice?.pricing.itemsPaise, once?.pricing.itemsPaise);
    assert.equal(twice?.pricing.totalPaise, once?.pricing.totalPaise);
  });

  it('never leaves the total disagreeing with the lines', async () => {
    // The invariant that matters: whatever it decides, the arithmetic holds.
    await seedProduct();
    await seedProduct({ name: 'Cetirizine 10mg', unit: 'strip of 10', sellPaise: 1800 });

    const { orderId } = await seedOrder({
      status: 'incoming',
      items: [
        item({ quantity: 2 }),
        item({ name: 'Cetirizine 10mg', unit: 'strip of 10', quantity: 3 }),
        item({ name: 'Unmatchable thing', unitPricePaise: 700 }),
      ],
    });

    await repriceOrderLogic(db(), orderId);

    const a = (await db().doc(`${COL.orders}/${orderId}`).get()).data();
    const expected = (a?.items as { included: boolean; unitPricePaise: number | null; quantity: number }[])
      .reduce((s, i) => (i.included && i.unitPricePaise !== null ? s + i.unitPricePaise * i.quantity : s), 0);

    assert.equal(a?.pricing.itemsPaise, expected);
    assert.equal(
      a?.pricing.totalPaise,
      a?.pricing.itemsPaise + a?.pricing.deliveryPaise + a?.pricing.servicePaise,
    );
  });
});
