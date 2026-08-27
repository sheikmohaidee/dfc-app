/**
 * Money, invoicing and change.
 *
 * These are the tests that matter most in the product: everything here decides
 * what a customer is charged, what a rider hands back, and what an auditor
 * sees. A bug in any of it is a bug you find out about from someone angry.
 *
 * Run with `npm test -w @dfc/core` — node:test, no framework.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_DELIVERY_PAISE,
  amountInWords,
  buildInvoice,
  changeBreakdown,
  changeBreakdownBalances,
  changeFor,
  computePricing,
  financialYear,
  formatInr,
  groupIndian,
  invoiceBalances,
  invoiceNumber,
  isFullyPriced,
  priceLabel,
  splitInclusive,
  suggestDeliveryPaise,
  tenderSuggestions,
  toPaise,
  type Order,
  type OrderItem,
} from '../index';

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe('Indian digit grouping', () => {
  it('leaves three digits alone', () => {
    assert.equal(groupIndian(243), '243');
  });

  it('groups thousands', () => {
    assert.equal(groupIndian(1234), '1,234');
  });

  it('uses lakh, not hundred-thousand', () => {
    assert.equal(groupIndian(124500), '1,24,500');
  });

  it('uses crore', () => {
    assert.equal(groupIndian(10000000), '1,00,00,000');
  });

  it('handles negatives', () => {
    assert.equal(groupIndian(-124500), '-1,24,500');
  });
});

describe('formatInr', () => {
  it('renders whole rupees by default', () => {
    assert.equal(formatInr(24300), '₹243');
  });

  it('renders paise only when asked', () => {
    assert.equal(formatInr(24350, { paise: true }), '₹243.50');
  });

  it('rounds to the nearest rupee otherwise', () => {
    assert.equal(formatInr(24350), '₹244');
    assert.equal(formatInr(24340), '₹243');
  });

  it('can drop the symbol for inputs that render their own', () => {
    assert.equal(formatInr(24300, { bare: true }), '243');
  });
});

describe('priceLabel', () => {
  it('shows an em dash when nothing is priced', () => {
    assert.equal(priceLabel(null), '₹ —');
  });

  it('marks a low-confidence price with a question mark', () => {
    assert.equal(priceLabel(12400, 0.42), '₹124?');
  });

  it('leaves a confident price alone', () => {
    assert.equal(priceLabel(12400, 0.95), '₹124');
  });
});

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

describe('inclusive GST split', () => {
  it('re-sums exactly for every plausible fee', () => {
    for (let fee = 0; fee <= 100000; fee += 100) {
      const s = splitInclusive(fee);
      assert.equal(
        s.taxablePaise + s.cgstPaise + s.sgstPaise,
        fee,
        `₹${fee / 100} did not re-sum`,
      );
    }
  });

  it('splits the tax as evenly as paise allow', () => {
    for (const fee of [2900, 6000, 12345, 999]) {
      const s = splitInclusive(fee);
      // CGST takes the odd paisa, so it is never more than 1p ahead.
      assert.ok(
        s.cgstPaise - s.sgstPaise === 0 || s.cgstPaise - s.sgstPaise === 1,
        `uneven split at ₹${fee / 100}`,
      );
    }
  });

  it('puts ~18% of a ₹29 fee into tax', () => {
    const s = splitInclusive(2900);
    const tax = s.cgstPaise + s.sgstPaise;
    // 29 / 1.18 = 24.576 -> tax is 4.42
    assert.equal(tax, 442);
  });
});

// ---------------------------------------------------------------------------
// Amount in words
// ---------------------------------------------------------------------------

describe('amountInWords', () => {
  const cases: [number, string][] = [
    [0, 'Rupees Zero Only'],
    [100, 'Rupees One Only'],
    [1500, 'Rupees Fifteen Only'],
    [2100, 'Rupees Twenty One Only'],
    [24300, 'Rupees Two Hundred Forty Three Only'],
    [100000, 'Rupees One Thousand Only'],
    [12450000, 'Rupees One Lakh Twenty Four Thousand Five Hundred Only'],
    [1000000000, 'Rupees One Crore Only'],
  ];

  for (const [paise, words] of cases) {
    it(`${formatInr(paise)} reads correctly`, () => {
      assert.equal(amountInWords(paise), words);
    });
  }

  it('rounds paise to the nearest rupee, as an invoice does', () => {
    assert.equal(amountInWords(24350), 'Rupees Two Hundred Forty Four Only');
  });
});

// ---------------------------------------------------------------------------
// Invoice numbering
// ---------------------------------------------------------------------------

describe('financial year', () => {
  it('starts in April', () => {
    assert.equal(financialYear(new Date('2026-04-01').getTime()), '2026-27');
  });

  it('still counts March as the previous year', () => {
    assert.equal(financialYear(new Date('2027-03-31').getTime()), '2026-27');
  });

  it('rolls on 1 April', () => {
    assert.equal(financialYear(new Date('2027-04-01').getTime()), '2027-28');
  });

  it('pads the invoice sequence', () => {
    assert.equal(
      invoiceNumber(7, new Date('2026-08-24').getTime()),
      'DFC/2026-27/000007',
    );
  });
});

// ---------------------------------------------------------------------------
// Delivery pricing
// ---------------------------------------------------------------------------

describe('delivery fee', () => {
  it('is the base fee inside two kilometres', () => {
    assert.equal(suggestDeliveryPaise(1.5), BASE_DELIVERY_PAISE);
  });

  it('rises with distance', () => {
    assert.ok(suggestDeliveryPaise(8) > suggestDeliveryPaise(3));
  });

  it('charges for extra concierge stops', () => {
    assert.ok(suggestDeliveryPaise(4, 3) > suggestDeliveryPaise(4, 1));
  });

  it('always lands on a round ₹5, because riders deal in notes', () => {
    for (let km = 0; km <= 20; km += 0.3) {
      assert.equal(suggestDeliveryPaise(km) % 500, 0, `${km} km was not a round ₹5`);
    }
  });
});

// ---------------------------------------------------------------------------
// Cash
// ---------------------------------------------------------------------------

describe('change', () => {
  it('breaks down exactly, for every amount up to ₹1000', () => {
    for (let p = 0; p <= 100000; p += 100) {
      assert.ok(changeBreakdownBalances(p), `₹${p / 100} did not break down exactly`);
    }
  });

  it('uses coins below ₹10 — the bug that lost ₹7 on a ₹257 change', () => {
    const parts = changeBreakdown(toPaise(257));
    const sum = parts.reduce((s, b) => s + b.note * b.count, 0);
    assert.equal(sum, toPaise(257));
    assert.ok(parts.some((b) => b.note < 1000), 'no coin denominations were used');
  });

  it('gives nothing back on exact money', () => {
    assert.equal(changeFor(toPaise(243), toPaise(243)), 0);
    assert.deepEqual(changeBreakdown(0), []);
  });

  it('never returns negative change when underpaid', () => {
    assert.equal(changeFor(toPaise(243), toPaise(100)), 0);
  });

  it('suggests the exact amount first, then round notes above it', () => {
    const s = tenderSuggestions(toPaise(243));
    assert.equal(s[0], toPaise(243));
    assert.ok(s.every((v) => v >= toPaise(243)));
    assert.ok(s.length > 1, 'no round-note suggestions offered');
  });
});

// ---------------------------------------------------------------------------
// A whole invoice
// ---------------------------------------------------------------------------

function item(name: string, rupees: number | null, qty = 1, included = true): OrderItem {
  return {
    id: `i_${name}`,
    name,
    unit: 'each',
    quantity: qty,
    unitPricePaise: rupees === null ? null : toPaise(rupees),
    confidence: 1,
    included,
  };
}

function orderWith(items: OrderItem[], deliveryRupees = 29, serviceRupees = 0): Order {
  const pricing = computePricing({
    items,
    deliveryPaise: toPaise(deliveryRupees),
    servicePaise: toPaise(serviceRupees),
  });
  return {
    id: 'o1',
    code: 1042,
    customerUid: 'u1',
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2, 2nd Main Road',
    category: 'pharmacy',
    status: 'delivered',
    items,
    storeId: 'meenakshi-medicals',
    storeName: 'Meenakshi Medicals',
    riderUid: null,
    riderName: null,
    pricing,
    paymentMode: 'prepaid',
    paymentStatus: 'paid',
    source: { kind: 'photo' },
    ai: null,
    deliveryOtp: '4419',
    timeline: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('invoice', () => {
  const order = orderWith([
    item('Paracetamol 500mg', 22),
    item('Amoxicillin 500mg', 96),
    item('Pantoprazole 40mg', 78),
    item('Cetirizine 10mg', 18),
    item('Excluded', 999, 1, false),
  ]);

  const inv = buildInvoice({ order, sequence: 123, issuedAt: new Date('2026-08-24').getTime() });

  it('balances', () => {
    assert.ok(invoiceBalances(inv));
  });

  it('totals exactly what the customer approved', () => {
    assert.equal(inv.totalPaise, toPaise(243));
  });

  it('does not bill an excluded item', () => {
    assert.ok(!inv.lines.some((l) => l.description === 'Excluded'));
  });

  it('charges no DFC GST on goods — they are a pure-agent recovery', () => {
    for (const line of inv.lines.filter((l) => l.kind === 'reimbursement')) {
      assert.equal(line.cgstPaise, 0, `${line.description} was taxed`);
      assert.equal(line.sgstPaise, 0, `${line.description} was taxed`);
    }
  });

  it('charges GST on the delivery fee, which is DFC’s own supply', () => {
    const delivery = inv.lines.find((l) => l.kind === 'service');
    if (!delivery) throw new Error('no service line on the invoice');
    assert.ok(delivery.cgstPaise > 0 && delivery.sgstPaise > 0);
    assert.equal(delivery.totalPaise, toPaise(29));
  });

  it('reimbursement equals the goods total', () => {
    assert.equal(inv.reimbursementPaise, toPaise(214));
  });

  it('carries an SAC code on every taxable line', () => {
    for (const line of inv.lines.filter((l) => l.kind === 'service')) {
      assert.ok(line.sac, `${line.description} has no SAC`);
    }
  });

  it('balances for a concierge order with a service fee', () => {
    const concierge = orderWith([item('Jasmine', 160), item('Parotta', 120, 4)], 60, 25);
    const ci = buildInvoice({ order: concierge, sequence: 124 });
    assert.ok(invoiceBalances(ci));
    assert.equal(ci.totalPaise, concierge.pricing.totalPaise);
  });

  it('balances when there is nothing but a delivery fee', () => {
    const bare = orderWith([], 29);
    const bi = buildInvoice({ order: bare, sequence: 125 });
    assert.ok(invoiceBalances(bi));
    assert.equal(bi.totalPaise, toPaise(29));
  });
});

// ---------------------------------------------------------------------------
// Pricing gates
// ---------------------------------------------------------------------------

describe('isFullyPriced', () => {
  it('is false while an included item has no price', () => {
    assert.equal(isFullyPriced([item('A', 10), item('B', null)]), false);
  });

  it('ignores excluded items', () => {
    assert.equal(isFullyPriced([item('A', 10), item('B', null, 1, false)]), true);
  });

  it('is true for an empty basket', () => {
    assert.equal(isFullyPriced([]), true);
  });
});

describe('computePricing', () => {
  it('counts quantity', () => {
    const p = computePricing({ items: [item('A', 10, 3)], deliveryPaise: 0 });
    assert.equal(p.itemsPaise, toPaise(30));
  });

  it('skips unpriced and excluded items', () => {
    const p = computePricing({
      items: [item('A', 10), item('B', null), item('C', 50, 1, false)],
      deliveryPaise: toPaise(29),
    });
    assert.equal(p.itemsPaise, toPaise(10));
    assert.equal(p.totalPaise, toPaise(39));
  });
});
