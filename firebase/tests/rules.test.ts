/**
 * Firestore security rules, executed against the emulator.
 *
 * The rules are the actual security boundary of this product — the client-side
 * state machine is UX, this is the guard. Two real bugs were already found in
 * them by reading; this file exists because reading is not enough.
 *
 * Every test is written from the attacker's side where it can be: not "can a
 * customer pay" but "can a customer mark their own order paid".
 *
 *   npm run test:rules -w @dfc/firebase
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));

let env: RulesTestEnvironment;

// --- fixtures ---------------------------------------------------------------

const CUSTOMER = 'cust-1';
const OTHER_CUSTOMER = 'cust-2';
const VENDOR = 'vendor-1';
const RIDER = 'rider-1';
const OTHER_RIDER = 'rider-2';
const ADMIN = 'admin-1';
const STORE = 'store-1';

const ctx = {
  customer: () => env.authenticatedContext(CUSTOMER, { role: 'customer' }).firestore(),
  otherCustomer: () =>
    env.authenticatedContext(OTHER_CUSTOMER, { role: 'customer' }).firestore(),
  vendor: () =>
    env.authenticatedContext(VENDOR, { role: 'vendor', storeId: STORE }).firestore(),
  rider: () => env.authenticatedContext(RIDER, { role: 'rider' }).firestore(),
  otherRider: () => env.authenticatedContext(OTHER_RIDER, { role: 'rider' }).firestore(),
  admin: () => env.authenticatedContext(ADMIN, { role: 'admin' }).firestore(),
  anon: () => env.unauthenticatedContext().firestore(),
};

function order(over: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    code: 1042,
    customerUid: CUSTOMER,
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2',
    category: 'pharmacy',
    status: 'incoming',
    items: [
      { id: 'i1', name: 'Paracetamol', unit: 'strip', quantity: 1, unitPricePaise: 2200, confidence: 1, included: true },
    ],
    storeId: STORE,
    storeName: 'Meenakshi Medicals',
    riderUid: null,
    riderName: null,
    pricing: { itemsPaise: 2200, deliveryPaise: 2900, servicePaise: 0, totalPaise: 5100 },
    paymentMode: 'prepaid',
    paymentStatus: 'unpaid',
    source: { kind: 'photo' },
    ai: null,
    deliveryOtp: '4419',
    timeline: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...over,
  };
}

/** Writes fixtures with rules disabled, so a test starts from a known state. */
async function seed(fn: (db: unknown) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (c) => {
    await fn(c.firestore());
  });
}

// ---------------------------------------------------------------------------

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'dfc-rules-test',
    firestore: {
      rules: readFileSync(resolve(here, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // A store the vendor owns, so myStore() resolves.
  await seed(async (db) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await setDoc(doc(db as any, 'stores', STORE), {
      id: STORE,
      name: 'Meenakshi Medicals',
      ownerUid: VENDOR,
      category: 'pharmacy',
      localityId: 'anna-nagar',
      isOpen: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Orders — reading
// ---------------------------------------------------------------------------

describe('orders · who can read', () => {
  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await seed(async (db) => setDoc(doc(db as any, 'orders', 'o1'), order()));
  });

  it('the customer can read their own', async () => {
    await assertSucceeds(getDoc(doc(ctx.customer(), 'orders', 'o1')));
  });

  it('another customer cannot', async () => {
    await assertFails(getDoc(doc(ctx.otherCustomer(), 'orders', 'o1')));
  });

  it('an anonymous visitor cannot', async () => {
    await assertFails(getDoc(doc(ctx.anon(), 'orders', 'o1')));
  });

  it('the store handling it can', async () => {
    await assertSucceeds(getDoc(doc(ctx.vendor(), 'orders', 'o1')));
  });

  it('a rider who is not assigned cannot', async () => {
    await assertFails(getDoc(doc(ctx.rider(), 'orders', 'o1')));
  });

  it('the assigned rider can', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o2'), order({ riderUid: RIDER })),
    );
    await assertSucceeds(getDoc(doc(ctx.rider(), 'orders', 'o2')));
    await assertFails(getDoc(doc(ctx.otherRider(), 'orders', 'o2')));
  });

  it('an admin can read anything', async () => {
    await assertSucceeds(getDoc(doc(ctx.admin(), 'orders', 'o1')));
  });
});

// ---------------------------------------------------------------------------
// Orders — the money attacks
// ---------------------------------------------------------------------------

describe('orders · a customer cannot pay themselves', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'admin_review' })),
    );
  });

  it('cannot skip review and mark it paid', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        status: 'paid',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot price their own order', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        status: 'awaiting_payment',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot lower the delivery fee', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        pricing: { itemsPaise: 2200, deliveryPaise: 0, servicePaise: 0, totalPaise: 2200 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot assign themselves a rider', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        riderUid: RIDER,
        updatedAt: Date.now(),
      }),
    );
  });
});

describe('orders · a customer editing their own basket', () => {
  it('can edit items while the order is still incoming', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'incoming' })),
    );
    await assertSucceeds(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        items: [],
        pricing: { itemsPaise: 0, deliveryPaise: 2900, servicePaise: 0, totalPaise: 2900 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot edit items once it has been priced and sent', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'awaiting_payment' })),
    );
    await assertFails(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        items: [],
        pricing: { itemsPaise: 0, deliveryPaise: 2900, servicePaise: 0, totalPaise: 2900 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot edit somebody else’s basket', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order()),
    );
    await assertFails(
      updateDoc(doc(ctx.otherCustomer(), 'orders', 'o1'), {
        items: [],
        pricing: { itemsPaise: 0, deliveryPaise: 0, servicePaise: 0, totalPaise: 0 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('can agree to cash, which advances the order', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'awaiting_payment' })),
    );
    await assertSucceeds(
      updateDoc(doc(ctx.customer(), 'orders', 'o1'), {
        status: 'paid',
        paymentStatus: 'unpaid',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });
});

describe('orders · creation', () => {
  it('a customer can create their own, at incoming and unpaid', async () => {
    await assertSucceeds(setDoc(doc(ctx.customer(), 'orders', 'new1'), order({ id: 'new1' })));
  });

  it('cannot create one that is already paid', async () => {
    await assertFails(
      setDoc(
        doc(ctx.customer(), 'orders', 'new2'),
        order({ id: 'new2', status: 'paid', paymentStatus: 'paid' }),
      ),
    );
  });

  it('cannot create one in somebody else’s name', async () => {
    await assertFails(
      setDoc(doc(ctx.customer(), 'orders', 'new3'), order({ id: 'new3', customerUid: OTHER_CUSTOMER })),
    );
  });

  it('cannot create one with a rider already attached', async () => {
    await assertFails(
      setDoc(doc(ctx.customer(), 'orders', 'new4'), order({ id: 'new4', riderUid: RIDER })),
    );
  });

  it('nobody can delete an order — the ledger has to survive an audit', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order()),
    );
    await assertFails(deleteDoc(doc(ctx.customer(), 'orders', 'o1')));
    await assertFails(deleteDoc(doc(ctx.admin(), 'orders', 'o1')));
  });
});

// ---------------------------------------------------------------------------
// Orders — the vendor
// ---------------------------------------------------------------------------

describe('orders · the vendor', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'paid' })),
    );
  });

  it('can accept an order for their own store', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.vendor(), 'orders', 'o1'), {
        status: 'vendor_accepted',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  /**
   * This is the case that was broken. Confirming a flagged medicine recomputes
   * the total, so the write carries `pricing` — and the old rule rejected it.
   */
  it('can resolve a flagged item, which lowers the total', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.vendor(), 'orders', 'o1'), {
        items: [],
        pricing: { itemsPaise: 0, deliveryPaise: 2900, servicePaise: 0, totalPaise: 2900 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot inflate the bill', async () => {
    await assertFails(
      updateDoc(doc(ctx.vendor(), 'orders', 'o1'), {
        pricing: { itemsPaise: 99900, deliveryPaise: 2900, servicePaise: 0, totalPaise: 102800 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot raise the delivery fee it does not collect', async () => {
    await assertFails(
      updateDoc(doc(ctx.vendor(), 'orders', 'o1'), {
        pricing: { itemsPaise: 0, deliveryPaise: 9900, servicePaise: 0, totalPaise: 9900 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot dispatch to a rider', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o2'), order({ status: 'ready_for_pickup' })),
    );
    await assertFails(
      updateDoc(doc(ctx.vendor(), 'orders', 'o2'), {
        status: 'dispatched',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot touch an order belonging to another store', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o3'), order({ status: 'paid', storeId: 'someone-else' })),
    );
    await assertFails(
      updateDoc(doc(ctx.vendor(), 'orders', 'o3'), {
        status: 'vendor_accepted',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Orders — the rider
// ---------------------------------------------------------------------------

describe('orders · the rider', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'orders', 'o1'), order({ status: 'dispatched', riderUid: RIDER })),
    );
  });

  it('can advance their own delivery', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.rider(), 'orders', 'o1'), {
        status: 'picked_up',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot advance somebody else’s', async () => {
    await assertFails(
      updateDoc(doc(ctx.otherRider(), 'orders', 'o1'), {
        status: 'picked_up',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot change the price', async () => {
    await assertFails(
      updateDoc(doc(ctx.rider(), 'orders', 'o1'), {
        pricing: { itemsPaise: 0, deliveryPaise: 9900, servicePaise: 0, totalPaise: 9900 },
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot skip straight to delivered', async () => {
    await assertFails(
      updateDoc(doc(ctx.rider(), 'orders', 'o1'), {
        status: 'delivered',
        timeline: [],
        updatedAt: Date.now(),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Payments — the highest-value target in the system
// ---------------------------------------------------------------------------

function payment(over: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    orderId: 'o1',
    orderCode: 1042,
    customerUid: CUSTOMER,
    method: 'upi_intent',
    state: 'awaiting_customer',
    amountPaise: 5100,
    receivedPaise: 0,
    reference: 'DFC1042ABCD',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...over,
  };
}

describe('payments · nobody but an admin can say a payment cleared', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setDoc(doc(db as any, 'orders', 'o1'), order());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setDoc(doc(db as any, 'payments', 'p1'), payment());
    });
  });

  it('a customer CANNOT write paid — this is the whole security model', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'payments', 'p1'), {
        state: 'paid',
        updatedAt: Date.now(),
      }),
    );
  });

  it('a customer CAN claim they paid', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.customer(), 'payments', 'p1'), {
        state: 'awaiting_confirmation',
        utr: '123456789012',
        updatedAt: Date.now(),
      }),
    );
  });

  it('a customer cannot change the amount owed', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'payments', 'p1'), {
        state: 'awaiting_confirmation',
        amountPaise: 1,
        updatedAt: Date.now(),
      }),
    );
  });

  it('a rider cannot write paid either', async () => {
    await assertFails(
      updateDoc(doc(ctx.rider(), 'payments', 'p1'), { state: 'paid', updatedAt: Date.now() }),
    );
  });

  it('an admin can confirm it', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.admin(), 'payments', 'p1'), {
        state: 'paid',
        receivedPaise: 5100,
        confirmedBy: ADMIN,
        confirmedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('an admin cannot quietly change the amount while confirming', async () => {
    await assertFails(
      updateDoc(doc(ctx.admin(), 'payments', 'p1'), {
        state: 'paid',
        amountPaise: 100,
        updatedAt: Date.now(),
      }),
    );
  });

  it('another customer cannot read it', async () => {
    await assertFails(getDoc(doc(ctx.otherCustomer(), 'payments', 'p1')));
  });

  it('nobody can delete a payment record', async () => {
    await assertFails(deleteDoc(doc(ctx.admin(), 'payments', 'p1')));
  });
});

describe('payments · cash at the door', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setDoc(doc(db as any, 'orders', 'o1'), order({ riderUid: RIDER }));
      await setDoc(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc(db as any, 'payments', 'p1'),
        payment({ method: 'cash', state: 'unpaid' }),
      );
    });
  });

  it('a rider can record the cash they took', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.rider(), 'payments', 'p1'), {
        state: 'collected',
        receivedPaise: 5100,
        tenderedPaise: 10000,
        changePaise: 4900,
        heldByUid: RIDER,
        confirmedBy: RIDER,
        confirmedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot record collecting less than the order total', async () => {
    await assertFails(
      updateDoc(doc(ctx.rider(), 'payments', 'p1'), {
        state: 'collected',
        receivedPaise: 100,
        heldByUid: RIDER,
        updatedAt: Date.now(),
      }),
    );
  });

  it('cannot pin the cash on a different rider', async () => {
    await assertFails(
      updateDoc(doc(ctx.rider(), 'payments', 'p1'), {
        state: 'collected',
        receivedPaise: 5100,
        heldByUid: OTHER_RIDER,
        updatedAt: Date.now(),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Invoices — immutable once issued
// ---------------------------------------------------------------------------

describe('invoices', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await setDoc(doc(db as any, 'orders', 'o1'), order({ riderUid: RIDER }));
    });
  });

  it('the customer on the order can issue theirs', async () => {
    await assertSucceeds(
      setDoc(doc(ctx.customer(), 'invoices', 'o1'), { number: 'DFC/2026-27/000001' }),
    );
  });

  it('a stranger cannot issue one against someone else’s order', async () => {
    await assertFails(
      setDoc(doc(ctx.otherCustomer(), 'invoices', 'o1'), { number: 'DFC/2026-27/000002' }),
    );
  });

  it('an issued invoice cannot be edited — a correction is a credit note', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'invoices', 'o1'), { number: 'DFC/2026-27/000001', totalPaise: 5100 }),
    );
    await assertFails(
      updateDoc(doc(ctx.admin(), 'invoices', 'o1'), { totalPaise: 1 }),
    );
    await assertFails(deleteDoc(doc(ctx.admin(), 'invoices', 'o1')));
  });
});

// ---------------------------------------------------------------------------
// Counters — the bug that would have fired on 1 April
// ---------------------------------------------------------------------------

describe('counters', () => {
  it('a customer can create the first counter of a financial year', async () => {
    await assertSucceeds(
      setDoc(doc(ctx.customer(), 'counters', 'invoice-2026-27'), { value: 1 }),
    );
  });

  it('a rider can too — whoever completes the first order after 1 April', async () => {
    await assertSucceeds(
      setDoc(doc(ctx.rider(), 'counters', 'invoice-2027-28'), { value: 1 }),
    );
  });

  it('it only ever steps forward by one', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'counters', 'orderCode'), { value: 1042 }),
    );
    await assertSucceeds(updateDoc(doc(ctx.customer(), 'counters', 'orderCode'), { value: 1043 }));
  });

  it('cannot jump the sequence — a gap is a compliance problem', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'counters', 'orderCode'), { value: 1042 }),
    );
    await assertFails(updateDoc(doc(ctx.customer(), 'counters', 'orderCode'), { value: 2000 }));
  });

  it('cannot be wound backwards to reuse an invoice number', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'counters', 'orderCode'), { value: 1042 }),
    );
    await assertFails(updateDoc(doc(ctx.customer(), 'counters', 'orderCode'), { value: 1 }));
  });

  it('cannot be deleted', async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'counters', 'orderCode'), { value: 1042 }),
    );
    await assertFails(deleteDoc(doc(ctx.admin(), 'counters', 'orderCode')));
  });
});

// ---------------------------------------------------------------------------
// Roles and profiles
// ---------------------------------------------------------------------------

describe('users', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'users', CUSTOMER), {
        uid: CUSTOMER,
        role: 'customer',
        name: 'R. Karthikeyan',
      }),
    );
  });

  it('a user can edit their own profile', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.customer(), 'users', CUSTOMER), { name: 'New Name', role: 'customer' }),
    );
  });

  it('a user CANNOT promote themselves to admin', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'users', CUSTOMER), { role: 'admin' }),
    );
  });

  it('a user cannot read another user', async () => {
    await assertFails(getDoc(doc(ctx.otherCustomer(), 'users', CUSTOMER)));
  });

  it('a user can store their own push token', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.customer(), 'users', CUSTOMER), {
        pushTokens: ['ExponentPushToken[abc]'],
        role: 'customer',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Catalogue and promotions
// ---------------------------------------------------------------------------

describe('products', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'products', 'prod-1'), {
        id: 'prod-1',
        storeId: STORE,
        name: 'Paracetamol 500mg',
        sellPaise: 2200,
        mrpPaise: 2500,
        stockQty: 10,
        isActive: true,
      }),
    );
  });

  it('a vendor can adjust their own stock', async () => {
    await assertSucceeds(
      updateDoc(doc(ctx.vendor(), 'products', 'prod-1'), { stockQty: 4, updatedAt: Date.now() }),
    );
  });

  it('a vendor cannot change the price — that stays with ops', async () => {
    await assertFails(
      updateDoc(doc(ctx.vendor(), 'products', 'prod-1'), { sellPaise: 1, updatedAt: Date.now() }),
    );
  });

  it('a customer cannot touch the catalogue', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'products', 'prod-1'), { stockQty: 0, updatedAt: Date.now() }),
    );
  });
});

describe('promotions', () => {
  beforeEach(async () => {
    await seed(async (db) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDoc(doc(db as any, 'promotions', 'promo-1'), {
        id: 'promo-1',
        spentPaise: 0,
        redemptions: 0,
        revenuePaise: 100000,
      }),
    );
  });

  it('a customer can read a live offer', async () => {
    await assertSucceeds(getDoc(doc(ctx.customer(), 'promotions', 'promo-1')));
  });

  it('a customer cannot edit its counters to inflate its ROAS', async () => {
    await assertFails(
      updateDoc(doc(ctx.customer(), 'promotions', 'promo-1'), { revenuePaise: 99999999 }),
    );
  });

  it('a customer cannot invent an offer', async () => {
    await assertFails(setDoc(doc(ctx.customer(), 'promotions', 'promo-2'), { id: 'promo-2' }));
  });
});
