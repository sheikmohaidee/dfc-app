/**
 * The state machines, the AI contract, and promotion targeting.
 *
 * The order transition table here and the one in firebase/firestore.rules have
 * to agree — if they drift, the client offers a button the server rejects. The
 * first test in this file is the one that catches that drift.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BOARD_COLUMNS,
  CONFIDENCE_THRESHOLD,
  OPEN_STATUSES,
  TERMINAL_STATUSES,
  canTransition,
  canTransitionPayment,
  buildUpiUrl,
  columnOf,
  discountFor,
  effectiveStatus,
  isPaid,
  isValidUtr,
  matchProduct,
  nearestLocality,
  needsVerification,
  nextStatuses,
  orderPaymentStatus,
  parseAiJson,
  promoApplies,
  routeKm,
  stockState,
  suggestStore,
  toOrderItems,
  toPaise,
  transition,
  type OrderStatus,
  type PaymentState,
  type Product,
  type Promotion,
} from '../index';

// ---------------------------------------------------------------------------
// Order lifecycle
// ---------------------------------------------------------------------------

describe('order transitions', () => {
  it('walks the happy path from request to delivered', () => {
    const path: [OrderStatus, OrderStatus, 'admin' | 'customer' | 'vendor' | 'rider'][] = [
      ['incoming', 'admin_review', 'admin'],
      ['admin_review', 'awaiting_payment', 'admin'],
      ['awaiting_payment', 'paid', 'customer'],
      ['paid', 'vendor_accepted', 'vendor'],
      ['vendor_accepted', 'packing', 'vendor'],
      ['packing', 'ready_for_pickup', 'vendor'],
      ['ready_for_pickup', 'dispatched', 'admin'],
      ['dispatched', 'picked_up', 'rider'],
      ['picked_up', 'out_for_delivery', 'rider'],
      ['out_for_delivery', 'delivered', 'rider'],
    ];

    for (const [from, to, role] of path) {
      assert.ok(canTransition(from, to, role), `${role} could not do ${from} -> ${to}`);
    }
  });

  it('refuses to skip the store', () => {
    assert.equal(canTransition('paid', 'dispatched', 'admin'), false);
  });

  it('refuses to rewind a delivered order', () => {
    assert.equal(canTransition('delivered', 'out_for_delivery', 'admin'), false);
    assert.deepEqual(nextStatuses('delivered', 'admin'), []);
  });

  it('does not let a customer price their own order', () => {
    assert.equal(canTransition('incoming', 'admin_review', 'customer'), false);
    assert.equal(canTransition('admin_review', 'awaiting_payment', 'customer'), false);
  });

  it('does not let a rider mark an order paid', () => {
    assert.equal(canTransition('awaiting_payment', 'paid', 'rider'), false);
  });

  it('does not let a vendor dispatch to themselves', () => {
    assert.equal(canTransition('ready_for_pickup', 'dispatched', 'vendor'), false);
  });

  it('throws with a readable message on an illegal move', () => {
    assert.throws(
      () => transition('delivered', 'packing', 'admin', 'u1'),
      /cannot move an order from "delivered" to "packing"/,
    );
  });

  it('stamps the timeline event', () => {
    const e = transition('incoming', 'admin_review', 'admin', 'admin-1', 'Started');
    assert.equal(e.status, 'admin_review');
    assert.equal(e.by, 'admin-1');
    assert.equal(e.note, 'Started');
    assert.ok(e.at > 0);
  });
});

describe('board columns', () => {
  it('places every open status in exactly one column', () => {
    for (const status of OPEN_STATUSES) {
      const cols = BOARD_COLUMNS.filter((c) => columnOf(status) === c);
      assert.equal(cols.length, 1, `${status} is not in exactly one column`);
    }
  });

  it('takes finished orders off the board', () => {
    for (const status of TERMINAL_STATUSES) {
      assert.equal(columnOf(status), null, `${status} is still on the board`);
    }
  });

  it('never lists a terminal status as open', () => {
    for (const status of TERMINAL_STATUSES) {
      assert.ok(!OPEN_STATUSES.includes(status));
    }
  });
});

// ---------------------------------------------------------------------------
// Payment lifecycle
// ---------------------------------------------------------------------------

describe('payment transitions', () => {
  it('allows the cash path', () => {
    assert.ok(canTransitionPayment('unpaid', 'collected'));
    assert.ok(canTransitionPayment('collected', 'settled'));
  });

  it('allows the UPI claim path but not a self-declared success', () => {
    assert.ok(canTransitionPayment('awaiting_customer', 'awaiting_confirmation'));
    assert.ok(canTransitionPayment('awaiting_confirmation', 'paid'));
    // Nothing rewinds a settled payment except a refund.
    assert.equal(canTransitionPayment('paid', 'collected'), false);
    assert.equal(canTransitionPayment('refunded', 'paid'), false);
  });

  it('treats held cash as money we have', () => {
    assert.ok(isPaid('collected'));
    assert.ok(isPaid('settled'));
    assert.ok(isPaid('paid'));
    assert.equal(isPaid('awaiting_confirmation'), false);
    assert.equal(isPaid('failed'), false);
  });

  it('projects every payment state onto a valid order flag', () => {
    const valid = ['unpaid', 'link_sent', 'paid', 'collected', 'refunded'];
    const states: PaymentState[] = [
      'unpaid',
      'awaiting_customer',
      'awaiting_confirmation',
      'paid',
      'collected',
      'settled',
      'failed',
      'refund_pending',
      'refunded',
    ];
    for (const s of states) {
      assert.ok(valid.includes(orderPaymentStatus(s)), `${s} projected to something invalid`);
    }
  });
});

// ---------------------------------------------------------------------------
// UPI
// ---------------------------------------------------------------------------

describe('UPI link', () => {
  const url = buildUpiUrl({
    amountPaise: toPaise(243),
    reference: 'DFC1042A7K3',
    orderCode: 1042,
    payee: { vpa: 'dinasari@okhdfcbank', name: 'Dinasari Food Courier' },
  });

  it('quotes the amount with two decimals', () => {
    assert.ok(url.includes('am=243.00'), url);
  });

  it('is in rupees', () => {
    assert.ok(url.includes('cu=INR'));
  });

  it('encodes spaces as %20, not + — some UPI apps render the plus', () => {
    assert.ok(!url.includes('+'), url);
    assert.ok(url.includes('%20'));
  });

  it('carries the reference a human will match against the bank', () => {
    assert.ok(url.includes('tr=DFC1042A7K3'));
  });

  it('validates a UTR as exactly twelve digits', () => {
    assert.ok(isValidUtr('123456789012'));
    assert.equal(isValidUtr('12345'), false);
    assert.equal(isValidUtr('12345678901a'), false);
  });
});

// ---------------------------------------------------------------------------
// The AI contract
// ---------------------------------------------------------------------------

describe('parsing model output', () => {
  const good = JSON.stringify({
    category: 'pharmacy',
    items: [
      { name: 'Paracetamol 500mg', unit: 'strip of 15', quantity: 1, estimatedPriceRupees: 22, confidence: 0.95 },
      { name: 'Ascoril LS', unit: '100 ml', quantity: 1, estimatedPriceRupees: 124, confidence: 0.42 },
    ],
    stops: [],
    summary: 'I read 2 items.',
    needsHuman: false,
  });

  it('parses clean JSON', () => {
    const r = parseAiJson(good);
    assert.equal(r.category, 'pharmacy');
    assert.equal(r.items.length, 2);
  });

  it('survives a markdown fence the model was told not to use', () => {
    const r = parseAiJson('```json\n' + good + '\n```');
    assert.equal(r.items.length, 2);
  });

  it('survives the model chattering before the object', () => {
    const r = parseAiJson(`Here is the order:\n${good}`);
    assert.equal(r.items.length, 2);
  });

  it('throws on something that is not JSON at all', () => {
    assert.throws(() => parseAiJson('I could not read that.'), /did not return JSON/);
  });

  it('throws when a required field is missing', () => {
    assert.throws(
      () => parseAiJson(JSON.stringify({ items: [] })),
      /failed validation/,
    );
  });

  it('converts rupees to paise', () => {
    const items = toOrderItems(parseAiJson(good));
    assert.equal(items[0]!.unitPricePaise, toPaise(22));
  });

  it('unticks anything the model was unsure of, so nobody pays for a guess', () => {
    const items = toOrderItems(parseAiJson(good));
    assert.equal(items[0]!.included, true);
    assert.equal(items[1]!.included, false);
    assert.ok(needsVerification(items[1]!));
    assert.ok(items[1]!.confidence < CONFIDENCE_THRESHOLD);
  });
});

// ---------------------------------------------------------------------------
// Madurai
// ---------------------------------------------------------------------------

describe('geography', () => {
  it('finds the nearest locality to a K.K. Nagar fix', () => {
    assert.equal(nearestLocality(9.9095, 78.0985).id, 'kk-nagar');
  });

  it('gives a non-zero distance between two localities', () => {
    assert.ok(routeKm('anna-nagar', 'villapuram') > 0);
  });

  it('is symmetric', () => {
    assert.equal(routeKm('anna-nagar', 'villapuram'), routeKm('villapuram', 'anna-nagar'));
  });

  it('picks a store of the right category', () => {
    assert.equal(suggestStore('pharmacy', 'kk-nagar')?.category, 'pharmacy');
    assert.equal(suggestStore('food', 'kk-nagar')?.category, 'food');
  });

  it('honours a store named in the prescription letterhead', () => {
    const s = suggestStore('pharmacy', 'thirunagar', 'Meenakshi Medicals');
    assert.equal(s?.id, 'meenakshi-medicals');
  });
});

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

function product(name: string, unit: string, qty = 10): Product {
  return {
    id: name,
    storeId: 's',
    name,
    category: 'pharmacy',
    unit,
    mrpPaise: toPaise(25),
    sellPaise: toPaise(22),
    stockQty: qty,
    lowStockAt: 5,
    isActive: true,
    updatedAt: 0,
  };
}

describe('catalogue matching', () => {
  const catalogue = [
    product('Paracetamol 500mg', 'strip of 15'),
    product('Paracetamol 650mg', 'strip of 15'),
    product('Cetirizine 10mg', 'strip of 10'),
  ];

  it('matches exactly', () => {
    assert.equal(matchProduct(catalogue, 'Cetirizine 10mg')?.name, 'Cetirizine 10mg');
  });

  it('refuses an ambiguous match rather than guessing', () => {
    // "Paracetamol" matches both strengths — dispensing either would be wrong.
    assert.equal(matchProduct(catalogue, 'Paracetamol'), null);
  });

  it('returns null when nothing is close', () => {
    assert.equal(matchProduct(catalogue, 'Insulin glargine'), null);
  });

  it('reports stock state honestly', () => {
    assert.equal(stockState(product('x', 'y', 0)), 'out');
    assert.equal(stockState(product('x', 'y', 3)), 'low');
    assert.equal(stockState(product('x', 'y', 50)), 'ok');
  });
});

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

function promo(over: Partial<Promotion> = {}): Promotion {
  const now = Date.now();
  return {
    id: 'p1',
    kind: 'banner',
    status: 'scheduled',
    creative: { headline: 'Free delivery', sub: '', accent: 'grocery', ctaLabel: 'Order' },
    discountKind: 'percent',
    discountValue: 10,
    maxDiscountPaise: toPaise(100),
    minOrderPaise: toPaise(200),
    categories: [],
    localityIds: [],
    startsAt: now - 3600_000,
    endsAt: now + 3600_000,
    budgetPaise: toPaise(5000),
    spentPaise: 0,
    impressions: 0,
    clicks: 0,
    redemptions: 0,
    revenuePaise: 0,
    createdBy: 'admin',
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

const basket = {
  category: 'grocery' as const,
  localityId: 'villapuram',
  itemsPaise: toPaise(500),
  deliveryPaise: toPaise(29),
};

describe('promotions', () => {
  it('applies inside its window', () => {
    assert.ok(promoApplies(promo(), basket));
  });

  it('is over once the window closes, whatever the stored status says', () => {
    const ended = promo({ status: 'live', endsAt: Date.now() - 1000 });
    assert.equal(effectiveStatus(ended), 'ended');
    assert.equal(discountFor(ended, basket), 0);
  });

  it('pauses itself when the budget runs out', () => {
    const spent = promo({ spentPaise: toPaise(5000) });
    assert.equal(effectiveStatus(spent), 'paused');
  });

  it('respects the minimum order', () => {
    assert.equal(discountFor(promo(), { ...basket, itemsPaise: toPaise(50) }), 0);
  });

  it('respects locality targeting', () => {
    const local = promo({ localityIds: ['thirunagar'] });
    assert.equal(discountFor(local, basket), 0);
    assert.ok(discountFor(local, { ...basket, localityId: 'thirunagar' }) > 0);
  });

  it('respects category targeting', () => {
    const rxOnly = promo({ categories: ['pharmacy'] });
    assert.equal(discountFor(rxOnly, basket), 0);
  });

  it('caps a percentage discount', () => {
    const big = promo({ discountValue: 50, maxDiscountPaise: toPaise(100) });
    assert.equal(discountFor(big, basket), toPaise(100));
  });

  it('never discounts more than the basket is worth', () => {
    const huge = promo({
      discountKind: 'flat',
      discountValue: toPaise(100000),
      maxDiscountPaise: 0,
    });
    assert.ok(discountFor(huge, basket) <= basket.itemsPaise + basket.deliveryPaise);
  });

  it('refunds exactly the delivery fee on a free-delivery promo', () => {
    const free = promo({ discountKind: 'free_delivery', maxDiscountPaise: toPaise(100) });
    assert.equal(discountFor(free, basket), basket.deliveryPaise);
  });

  it('requires the right coupon code', () => {
    const coupon = promo({ kind: 'coupon', couponCode: 'MADURAI50' });
    assert.equal(discountFor(coupon, basket), 0);
    assert.ok(discountFor(coupon, { ...basket, couponCode: 'madurai50' }) > 0);
  });
});
