/**
 * Push fan-out — who gets told what.
 *
 * Notifications are the part of a delivery product that people judge it by.
 * A vendor who is not told has lost the sale inside three minutes; a rider who
 * is not told is standing still; and a customer told about every internal
 * status change has muted the app by the end of the week. None of that shows
 * up in an FCM response code, so it is tested here as a decision instead.
 */

import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { COL, type Order, type OrderStatus } from '@dfc/core';

import {
  CHANNEL,
  CUSTOMER_MILESTONES,
  deadTokens,
  planArrival,
  planFanOut,
  type PlannedPush,
} from '../src/fanout';
import { runPlan, toMessages, type Sender } from '../src/notifications';
import { clearFirestore, db, seedOrder, shutdown } from './harness';

const ORDER_ID = 'o_1';

/** Builds an Order without touching Firestore — planning is pure. */
function order(over: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    code: 1042,
    customerUid: 'u_cust',
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2, 2nd Main Road',
    category: 'pharmacy',
    status: 'incoming',
    items: [
      { id: 'i1', name: 'Paracetamol', unit: 'strip', quantity: 1, unitPricePaise: 21400, confidence: 1, included: true },
    ],
    storeId: 'meenakshi-medicals',
    storeName: 'Meenakshi Medicals',
    riderUid: null,
    riderName: null,
    pricing: { itemsPaise: 21400, deliveryPaise: 2900, servicePaise: 0, totalPaise: 24300 },
    paymentMode: 'prepaid',
    paymentStatus: 'unpaid',
    source: { kind: 'photo' },
    ai: null,
    deliveryOtp: '441907',
    timeline: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...over,
  } as Order;
}

const kinds = (plan: PlannedPush[]) => plan.map((p) => p.audience.kind);

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

describe('a new order', () => {
  it('tells whoever is on the board, and nobody else', async () => {
    const plan = planFanOut(undefined, order({ status: 'incoming' }), ORDER_ID);

    assert.deepEqual(kinds(plan), ['admins']);
    assert.match(plan[0]!.notification.title, /new pharmacy request/i);
    assert.match(plan[0]!.notification.body, /#1042/);
    // Not urgent: a new request is a queue item, not an alarm.
    assert.notEqual(plan[0]!.urgent, true);
  });

  it('does not wake the customer to tell them they placed an order', async () => {
    const plan = planFanOut(undefined, order({ status: 'incoming' }), ORDER_ID);
    assert.ok(!kinds(plan).includes('customer'));
  });
});

describe('when payment lands', () => {
  it('wakes the vendor loudly and confirms to the customer', async () => {
    const plan = planFanOut(
      order({ status: 'awaiting_payment' }),
      order({ status: 'paid' }),
      ORDER_ID,
    );

    assert.deepEqual(kinds(plan), ['vendor', 'customer']);

    const vendor = plan[0]!;
    // The vendor push is the one that must never be missed: its own channel,
    // its own sound, high priority.
    assert.equal(vendor.channel, CHANNEL.vendorOrders);
    assert.equal(vendor.sound, 'dfc_order');
    assert.equal(vendor.urgent, true);
    assert.match(vendor.notification.title, /3 minutes/);
    assert.match(vendor.notification.body, /₹243/);

    const customer = plan[1]!;
    assert.equal(customer.channel, CHANNEL.customerUpdates);
    assert.notEqual(customer.urgent, true, 'a confirmation should not be an alarm');
    assert.equal(customer.notification.title, 'Order confirmed');
  });

  it('counts only the items the vendor has to pack', async () => {
    const items = [
      { id: 'a', name: 'A', unit: 'x', quantity: 1, unitPricePaise: 100, confidence: 1, included: true },
      { id: 'b', name: 'B', unit: 'x', quantity: 1, unitPricePaise: 100, confidence: 1, included: true },
      { id: 'c', name: 'C', unit: 'x', quantity: 1, unitPricePaise: 100, confidence: 1, included: false },
    ];
    const plan = planFanOut(
      order({ status: 'awaiting_payment', items }),
      order({ status: 'paid', items }),
      ORDER_ID,
    );
    assert.match(plan[0]!.notification.body, /2 items/);
  });
});

describe('assigning a rider', () => {
  it('tells the rider, urgently', async () => {
    const plan = planFanOut(
      order({ status: 'ready_for_pickup', riderUid: null }),
      order({ status: 'ready_for_pickup', riderUid: 'u_rider' }),
      ORDER_ID,
    );

    assert.deepEqual(kinds(plan), ['rider']);
    assert.equal(plan[0]!.channel, CHANNEL.riderTasks);
    assert.equal(plan[0]!.urgent, true);
    assert.match(plan[0]!.notification.body, /Meenakshi Medicals/);
  });

  it('puts the amount in the title for a cash job', async () => {
    // A rider who does not know it is cash until they arrive has to ask, which
    // is the most awkward moment in the whole flow.
    const plan = planFanOut(
      order({ riderUid: null, paymentMode: 'cod' }),
      order({ riderUid: 'u_rider', paymentMode: 'cod' }),
      ORDER_ID,
    );
    assert.match(plan[0]!.notification.title, /Cash delivery · collect ₹243/);
  });

  it('says nothing about cash on a prepaid job', async () => {
    const plan = planFanOut(
      order({ riderUid: null }),
      order({ riderUid: 'u_rider' }),
      ORDER_ID,
    );
    assert.equal(plan[0]!.notification.title, 'New delivery');
  });

  it('does not re-notify when the rider is unchanged', async () => {
    const plan = planFanOut(
      order({ riderUid: 'u_rider', status: 'dispatched' }),
      order({ riderUid: 'u_rider', status: 'dispatched' }),
      ORDER_ID,
    );
    assert.deepEqual(plan, []);
  });

  it('does not notify when a rider is UNassigned', async () => {
    const plan = planFanOut(
      order({ riderUid: 'u_rider' }),
      order({ riderUid: null }),
      ORDER_ID,
    );
    assert.ok(!kinds(plan).includes('rider'));
  });

  it('tells the new rider when a task is reassigned', async () => {
    const plan = planFanOut(
      order({ riderUid: 'u_rider_a' }),
      order({ riderUid: 'u_rider_b' }),
      ORDER_ID,
    );
    assert.deepEqual(kinds(plan), ['rider']);
    assert.equal((plan[0]!.audience as { uid: string }).uid, 'u_rider_b');
  });
});

describe('the customer hears about milestones only', () => {
  const loud: OrderStatus[] = [
    'paid',
    'vendor_accepted',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'rejected',
    'cancelled',
  ];
  const quiet: OrderStatus[] = ['admin_review', 'awaiting_payment', 'packing', 'picked_up'];

  for (const status of loud) {
    it(`says something on ${status}`, async () => {
      const plan = planFanOut(order({ status: 'incoming' }), order({ status }), ORDER_ID);
      const c = plan.find((p) => p.audience.kind === 'customer');
      assert.ok(c, `nothing sent to the customer on ${status}`);
      assert.equal(c!.notification.title, CUSTOMER_MILESTONES[status]);
    });
  }

  for (const status of quiet) {
    it(`stays quiet on ${status}`, async () => {
      // These are internal bookkeeping. A phone buzzing because an admin
      // opened the order is how an app gets uninstalled.
      const plan = planFanOut(order({ status: 'incoming' }), order({ status }), ORDER_ID);
      assert.ok(
        !plan.some((p) => p.audience.kind === 'customer'),
        `${status} woke the customer`,
      );
    });
  }

  it('never marks a milestone urgent', async () => {
    for (const status of loud) {
      const plan = planFanOut(order({ status: 'incoming' }), order({ status }), ORDER_ID);
      const c = plan.find((p) => p.audience.kind === 'customer');
      assert.notEqual(c?.urgent, true, `${status} was sent as time-sensitive`);
    }
  });
});

describe('writes nobody needs to hear about', () => {
  it('a price edit sends nothing', async () => {
    const plan = planFanOut(
      order({ status: 'admin_review' }),
      order({
        status: 'admin_review',
        pricing: { itemsPaise: 30000, deliveryPaise: 2900, servicePaise: 0, totalPaise: 32900 },
      }),
      ORDER_ID,
    );
    assert.deepEqual(plan, []);
  });

  it('a timeline append sends nothing', async () => {
    const plan = planFanOut(
      order({ status: 'packing' }),
      order({ status: 'packing', timeline: [{ status: 'packing', at: Date.now(), by: 'u_v' }] }),
      ORDER_ID,
    );
    assert.deepEqual(plan, []);
  });

  it('a deleted document sends nothing', async () => {
    assert.deepEqual(planFanOut(order(), undefined, ORDER_ID), []);
  });
});

// ---------------------------------------------------------------------------
// Arrival
// ---------------------------------------------------------------------------

describe('the rider arriving', () => {
  it('tells the customer, urgently, with their code', async () => {
    const plan = planArrival(
      order({ status: 'out_for_delivery', deliveryOtp: '111111' }),
      order({ status: 'out_for_delivery', deliveryOtp: '441907' }),
      ORDER_ID,
    );

    assert.deepEqual(kinds(plan), ['customer']);
    assert.equal(plan[0]!.urgent, true);
    assert.match(plan[0]!.notification.body, /441907/);
  });

  it('tells a cash customer what to have ready', async () => {
    const plan = planArrival(
      order({ status: 'out_for_delivery', deliveryOtp: '1', paymentMode: 'cod' }),
      order({ status: 'out_for_delivery', deliveryOtp: '441907', paymentMode: 'cod' }),
      ORDER_ID,
    );
    assert.match(plan[0]!.notification.body, /Keep ₹243/);
    assert.match(plan[0]!.notification.body, /441907/);
  });

  it('fires exactly once — a second identical write is silent', async () => {
    const same = order({ status: 'out_for_delivery', deliveryOtp: '441907' });
    assert.deepEqual(planArrival(same, same, ORDER_ID), []);
  });

  it('does not fire before the rider is out for delivery', async () => {
    const plan = planArrival(
      order({ status: 'picked_up', deliveryOtp: '1' }),
      order({ status: 'picked_up', deliveryOtp: '2' }),
      ORDER_ID,
    );
    assert.deepEqual(plan, []);
  });

  it('does not fire on the transition INTO out_for_delivery', async () => {
    // That is the "on the way" milestone's job, not this one's.
    const plan = planArrival(
      order({ status: 'picked_up', deliveryOtp: '1' }),
      order({ status: 'out_for_delivery', deliveryOtp: '2' }),
      ORDER_ID,
    );
    assert.deepEqual(plan, []);
  });
});

// ---------------------------------------------------------------------------
// Payload shape
// ---------------------------------------------------------------------------

describe('the FCM payload', () => {
  const target = { uid: 'u_v', tokens: ['tok-a', 'tok-b'] };

  it('is built once per device', async () => {
    const [p] = planFanOut(order({ status: 'awaiting_payment' }), order({ status: 'paid' }), ORDER_ID);
    const msgs = toMessages(target, p!);
    assert.equal(msgs.length, 2);
    assert.deepEqual(msgs.map((m) => (m as { token: string }).token), ['tok-a', 'tok-b']);
  });

  it('marks an urgent push time-sensitive on both platforms', async () => {
    const [p] = planFanOut(order({ status: 'awaiting_payment' }), order({ status: 'paid' }), ORDER_ID);
    const [m] = toMessages(target, p!) as Array<Record<string, any>>;

    assert.equal(m!.android.priority, 'high');
    assert.equal(m!.android.notification.channelId, CHANNEL.vendorOrders);
    assert.equal(m!.android.notification.sound, 'dfc_order');
    assert.equal(m!.apns.headers['apns-priority'], '10');
    assert.equal(m!.apns.payload.aps['interruption-level'], 'time-sensitive');
    // iOS wants the file extension; Android does not.
    assert.equal(m!.apns.payload.aps.sound, 'dfc_order.caf');
  });

  it('leaves a routine push at normal priority', async () => {
    const plan = planFanOut(order({ status: 'paid' }), order({ status: 'delivered' }), ORDER_ID);
    const [m] = toMessages(target, plan[0]!) as Array<Record<string, any>>;

    assert.equal(m!.android.priority, 'normal');
    assert.equal(m!.apns.headers['apns-priority'], '5');
    assert.equal(m!.apns.payload.aps['interruption-level'], undefined);
  });

  it('carries the orderId so a tap can open the right screen', async () => {
    const plan = planFanOut(order({ status: 'paid' }), order({ status: 'delivered' }), ORDER_ID);
    const [m] = toMessages(target, plan[0]!) as Array<Record<string, any>>;
    assert.equal(m!.data.orderId, ORDER_ID);
    assert.equal(m!.data.kind, 'status');
  });
});

// ---------------------------------------------------------------------------
// Dead tokens
// ---------------------------------------------------------------------------

describe('pruning dead tokens', () => {
  it('drops a token the device has thrown away', async () => {
    const dead = deadTokens(
      ['good', 'reinstalled'],
      [{ success: true }, { success: false, errorCode: 'messaging/registration-token-not-registered' }],
    );
    assert.deepEqual(dead, ['reinstalled']);
  });

  it('drops a malformed token', async () => {
    const dead = deadTokens(['x'], [{ success: false, errorCode: 'messaging/invalid-argument' }]);
    assert.deepEqual(dead, ['x']);
  });

  it('KEEPS a token that failed for a transient reason', async () => {
    // The important one. A bad five minutes at Google must not silently
    // unsubscribe the entire rider fleet.
    for (const code of [
      'messaging/server-unavailable',
      'messaging/internal-error',
      'messaging/quota-exceeded',
      'messaging/unknown-error',
      undefined,
    ]) {
      assert.deepEqual(deadTokens(['keep-me'], [{ success: false, errorCode: code }]), []);
    }
  });

  it('drops nothing when everything succeeded', async () => {
    assert.deepEqual(deadTokens(['a', 'b'], [{ success: true }, { success: true }]), []);
  });

  it('maps outcomes to tokens by position', async () => {
    const dead = deadTokens(
      ['a', 'b', 'c'],
      [
        { success: false, errorCode: 'messaging/server-unavailable' },
        { success: false, errorCode: 'messaging/registration-token-not-registered' },
        { success: true },
      ],
    );
    assert.deepEqual(dead, ['b'], 'the wrong token was pruned');
  });
});

// ---------------------------------------------------------------------------
// Delivery, against the emulator
// ---------------------------------------------------------------------------

/** Records what would have been sent. */
function recorder(outcomes?: (t: string) => { success: boolean; errorCode?: string }): Sender & {
  sent: Array<Record<string, any>>;
} {
  const sent: Array<Record<string, any>> = [];
  return {
    sent,
    async sendEach(messages) {
      sent.push(...(messages as unknown as Array<Record<string, any>>));
      return {
        responses: messages.map((m) =>
          outcomes ? outcomes((m as unknown as { token: string }).token) : { success: true },
        ),
      };
    },
  };
}

before(() => {
  db();
});
after(shutdown);
beforeEach(clearFirestore);

describe('delivering a plan', () => {
  it('sends to every admin with a registered device', async () => {
    await db().doc(`${COL.users}/u_a1`).set({ role: 'admin', pushTokens: ['a1'] });
    await db().doc(`${COL.users}/u_a2`).set({ role: 'admin', pushTokens: ['a2', 'a2b'] });
    await db().doc(`${COL.users}/u_a3`).set({ role: 'admin', pushTokens: [] }); // signed out
    await db().doc(`${COL.users}/u_c1`).set({ role: 'customer', pushTokens: ['c1'] });

    const fcm = recorder();
    await runPlan(db(), fcm, planFanOut(undefined, order({ status: 'incoming' }), ORDER_ID));

    const tokens = fcm.sent.map((m) => m.token).sort();
    assert.deepEqual(tokens, ['a1', 'a2', 'a2b'], 'a non-admin or a tokenless admin was messaged');
  });

  it('finds the vendor through the store’s owner', async () => {
    await db().doc(`${COL.stores}/meenakshi-medicals`).set({ ownerUid: 'u_vendor' });
    await db().doc(`${COL.users}/u_vendor`).set({ role: 'vendor', pushTokens: ['v1'] });

    const fcm = recorder();
    await runPlan(
      db(),
      fcm,
      planFanOut(order({ status: 'awaiting_payment' }), order({ status: 'paid' }), ORDER_ID),
    );

    assert.deepEqual(fcm.sent.map((m) => m.token), ['v1']);
  });

  it('sends nothing when the store has no owner yet', async () => {
    const fcm = recorder();
    await runPlan(
      db(),
      fcm,
      planFanOut(order({ status: 'awaiting_payment' }), order({ status: 'paid' }), ORDER_ID),
    );
    assert.equal(fcm.sent.length, 0);
  });

  it('prunes a dead token and keeps the live one', async () => {
    await db().doc(`${COL.users}/u_cust`).set({ role: 'customer', pushTokens: ['live', 'dead'] });

    const fcm = recorder((t) =>
      t === 'dead'
        ? { success: false, errorCode: 'messaging/registration-token-not-registered' }
        : { success: true },
    );

    await runPlan(db(), fcm, planFanOut(order({ status: 'paid' }), order({ status: 'delivered' }), ORDER_ID));

    const profile = (await db().doc(`${COL.users}/u_cust`).get()).data();
    assert.deepEqual(profile?.pushTokens, ['live']);
  });

  it('does NOT prune on a transient failure', async () => {
    await db().doc(`${COL.users}/u_cust`).set({ role: 'customer', pushTokens: ['a', 'b'] });

    const fcm = recorder(() => ({ success: false, errorCode: 'messaging/server-unavailable' }));
    await runPlan(db(), fcm, planFanOut(order({ status: 'paid' }), order({ status: 'delivered' }), ORDER_ID));

    const profile = (await db().doc(`${COL.users}/u_cust`).get()).data();
    assert.deepEqual(profile?.pushTokens, ['a', 'b'], 'a live device was unsubscribed');
  });

  it('is a no-op for a user who has never opened the app', async () => {
    const fcm = recorder();
    await runPlan(db(), fcm, planFanOut(order({ status: 'paid' }), order({ status: 'delivered' }), ORDER_ID));
    assert.equal(fcm.sent.length, 0);
  });

  it('delivers a real order’s paid transition to vendor and customer both', async () => {
    const { orderId, order: seeded } = await seedOrder({ status: 'awaiting_payment' });
    await db().doc(`${COL.stores}/meenakshi-medicals`).set({ ownerUid: 'u_vendor' });
    await db().doc(`${COL.users}/u_vendor`).set({ role: 'vendor', pushTokens: ['v1'] });
    await db().doc(`${COL.users}/${seeded.customerUid}`).set({ role: 'customer', pushTokens: ['c1'] });

    const fcm = recorder();
    await runPlan(
      db(),
      fcm,
      planFanOut({ ...seeded }, { ...seeded, status: 'paid' }, orderId),
    );

    assert.deepEqual(fcm.sent.map((m) => m.token).sort(), ['c1', 'v1']);
    // And they were not sent the same way.
    const vendor = fcm.sent.find((m) => m.token === 'v1');
    const customer = fcm.sent.find((m) => m.token === 'c1');
    assert.equal(vendor!.android.priority, 'high');
    assert.equal(customer!.android.priority, 'normal');
  });
});
