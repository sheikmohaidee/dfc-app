/**
 * Correcting what OCR read.
 *
 * A photograph of a handwritten prescription is the hardest input this product
 * takes, and the model gets names wrong. These are the edits that let the
 * customer fix it themselves instead of an admin telephoning them.
 *
 * They change the basket, which makes them money-adjacent — so the thing most
 * of these tests actually check is what an edit is *not* allowed to do. A
 * customer may correct a name; a customer may not set a price.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  addItem,
  computePricing,
  editItem,
  isFullyPriced,
  removeItem,
  toggleItem,
  type Order,
  type OrderItem,
} from '../index';

function ordItem(over: Partial<OrderItem> = {}): OrderItem {
  return {
    id: `i_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Paracetmol 500',
    unit: 'strip',
    quantity: 1,
    unitPricePaise: 2200,
    confidence: 0.42,
    included: true,
    ...over,
  };
}

function ordWith(items: OrderItem[]): Order {
  return {
    id: 'o1',
    code: 1042,
    customerUid: 'u1',
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2',
    category: 'pharmacy',
    status: 'incoming',
    items,
    storeId: 's1',
    storeName: 'Meenakshi Medicals',
    riderUid: null,
    riderName: null,
    pricing: computePricing({ items, deliveryPaise: 2900, servicePaise: 0 }),
    paymentMode: 'prepaid',
    paymentStatus: 'unpaid',
    source: { kind: 'photo' },
    ai: null,
    deliveryOtp: '441907',
    timeline: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------

describe('editItem', () => {
  it('corrects a misread name', () => {
    const it0 = ordItem({ name: 'Paracetmol 500' });
    const patch = editItem(ordWith([it0]), it0.id, { name: 'Paracetamol 500mg' });
    assert.equal(patch.items![0]!.name, 'Paracetamol 500mg');
  });

  it('clears the VERIFY flag once a human has fixed the line', () => {
    // The customer taking the medicine is a better authority than the model.
    // Leaving confidence low would keep nagging an admin about a line that has
    // already been checked by the only person who can really check it.
    const it0 = ordItem({ confidence: 0.42 });
    const patch = editItem(ordWith([it0]), it0.id, { name: 'Paracetamol 500mg' });
    assert.equal(patch.items![0]!.confidence, 1);
    assert.equal(patch.items![0]!.editedByCustomer, true);
  });

  it('does NOT promote confidence when nothing actually changed', () => {
    // Opening the editor and closing it must not silently mark a guess as
    // verified.
    const it0 = ordItem({ name: 'Paracetmol 500', confidence: 0.42 });
    const patch = editItem(ordWith([it0]), it0.id, { name: 'Paracetmol 500' });
    assert.equal(patch.items![0]!.confidence, 0.42);
    assert.notEqual(patch.items![0]!.editedByCustomer, true);
  });

  it('trims whitespace rather than storing it', () => {
    const it0 = ordItem();
    const patch = editItem(ordWith([it0]), it0.id, { name: '  Amoxicillin 500mg  ' });
    assert.equal(patch.items![0]!.name, 'Amoxicillin 500mg');
  });

  it('ignores an empty name instead of blanking the line', () => {
    const it0 = ordItem({ name: 'Paracetamol' });
    const patch = editItem(ordWith([it0]), it0.id, { name: '   ' });
    assert.equal(patch.items![0]!.name, 'Paracetamol');
  });

  it('clamps quantity to a sane range', () => {
    const it0 = ordItem();
    const o = ordWith([it0]);
    assert.equal(editItem(o, it0.id, { quantity: 0 }).items![0]!.quantity, 1);
    assert.equal(editItem(o, it0.id, { quantity: -5 }).items![0]!.quantity, 1);
    assert.equal(editItem(o, it0.id, { quantity: 999 }).items![0]!.quantity, 99);
    assert.equal(editItem(o, it0.id, { quantity: 2.6 }).items![0]!.quantity, 3);
  });

  it('reprices the order when quantity changes', () => {
    const it0 = ordItem({ unitPricePaise: 2200, quantity: 1 });
    const patch = editItem(ordWith([it0]), it0.id, { quantity: 3 });
    assert.equal(patch.pricing!.itemsPaise, 6600);
    assert.equal(patch.pricing!.totalPaise, 6600 + 2900);
  });

  it('leaves every other line untouched', () => {
    const a = ordItem({ name: 'A' });
    const b = ordItem({ name: 'B', confidence: 0.3 });
    const patch = editItem(ordWith([a, b]), a.id, { name: 'A corrected' });
    assert.equal(patch.items![1]!.name, 'B');
    assert.equal(patch.items![1]!.confidence, 0.3);
  });

  it('never changes a price, whatever it is handed', () => {
    // Money belongs to the admin. The patch type does not admit a price, but
    // types are not a runtime guard — a hand-built payload from a patched
    // client would sail past them. This smuggles one in anyway and proves the
    // function ignores it, which is what keeps a customer edit from becoming
    // a customer discount.
    const it0 = ordItem({ unitPricePaise: 2200 });
    const smuggled = { name: 'X', unitPricePaise: 1, included: true } as unknown as Parameters<
      typeof editItem
    >[2];

    const patch = editItem(ordWith([it0]), it0.id, smuggled);
    assert.equal(patch.items![0]!.unitPricePaise, 2200);
    assert.equal(patch.pricing!.itemsPaise, 2200);
  });

  it('cannot re-include a line the customer unticked', () => {
    // Ticking is its own action with its own affordance; an edit must not
    // quietly put something back in the basket.
    const it0 = ordItem({ included: false });
    const patch = editItem(ordWith([it0, ordItem()]), it0.id, { name: 'Renamed' });
    assert.equal(patch.items![0]!.included, false);
  });

  it('is a no-op for an id that is not there', () => {
    const o = ordWith([ordItem()]);
    const patch = editItem(o, 'i_nope', { name: 'X' });
    assert.deepEqual(patch.items, o.items);
  });
});

describe('addItem', () => {
  it('adds a line the model missed', () => {
    const patch = addItem(ordWith([ordItem()]), {
      name: 'Cetirizine 10mg',
      unit: 'strip of 10',
    });
    assert.equal(patch.items!.length, 2);
    assert.equal(patch.items![1]!.name, 'Cetirizine 10mg');
    assert.equal(patch.items![1]!.addedByCustomer, true);
  });

  it('leaves it unpriced, so checkout stays gated until a human quotes it', () => {
    const patch = addItem(ordWith([ordItem()]), { name: 'Something new' });
    assert.equal(patch.items![1]!.unitPricePaise, null);
    assert.equal(isFullyPriced(patch.items!), false);
  });

  it('is confident, because a person typed it', () => {
    const patch = addItem(ordWith([ordItem()]), { name: 'Something new' });
    assert.equal(patch.items![1]!.confidence, 1);
  });

  it('defaults the unit rather than leaving it blank', () => {
    assert.equal(addItem(ordWith([ordItem()]), { name: 'Rice' }).items![1]!.unit, 'each');
  });

  it('refuses an empty name', () => {
    assert.deepEqual(addItem(ordWith([ordItem()]), { name: '   ' }), {});
  });

  it('does not change the total, since the new line has no price', () => {
    const patch = addItem(ordWith([ordItem({ unitPricePaise: 2200 })]), { name: 'Unpriced' });
    assert.equal(patch.pricing!.itemsPaise, 2200);
  });

  it('gives every added line a distinct id', () => {
    let o = ordWith([ordItem()]);
    for (let i = 0; i < 25; i += 1) {
      o = { ...o, ...addItem(o, { name: `item ${i}` }) } as Order;
    }
    assert.equal(new Set(o.items.map((i) => i.id)).size, o.items.length, 'two lines share an id');
  });
});

describe('removeItem', () => {
  it('drops a line the model invented', () => {
    const a = ordItem({ name: 'Real' });
    const b = ordItem({ name: 'Hallucinated' });
    const patch = removeItem(ordWith([a, b]), b.id);
    assert.equal(patch.items!.length, 1);
    assert.equal(patch.items![0]!.name, 'Real');
  });

  it('reprices without the removed line', () => {
    const a = ordItem({ unitPricePaise: 2200 });
    const b = ordItem({ unitPricePaise: 5000 });
    assert.equal(removeItem(ordWith([a, b]), b.id).pricing!.itemsPaise, 2200);
  });

  it('refuses to empty the order', () => {
    // An order with nothing in it is a support call, not an order. Cancelling
    // is the way out, and it is a different button meaning a different thing.
    const only = ordItem();
    assert.deepEqual(removeItem(ordWith([only]), only.id), {});
  });

  it('is a no-op for an id that is not there', () => {
    assert.deepEqual(removeItem(ordWith([ordItem(), ordItem()]), 'i_nope'), {});
  });

  it('is different from unticking — removed is gone, unticked is still visible', () => {
    // Unticking says "not today" and keeps the line, so a pharmacist can see it
    // was on the prescription and deliberately skipped. Removing says the line
    // was never real. Collapsing the two would lose that distinction.
    const a = ordItem({ name: 'Keep' });
    const b = ordItem({ name: 'Skip' });
    const o = ordWith([a, b]);

    const unticked = { ...o, ...toggleItem(o, b.id) } as Order;
    assert.equal(unticked.items.length, 2);
    assert.equal(unticked.items[1]!.included, false);

    const removed = { ...o, ...removeItem(o, b.id) } as Order;
    assert.equal(removed.items.length, 1);
  });
});

describe('a full correction pass over a bad OCR read', () => {
  it('ends with a basket that balances and is still gated', () => {
    // The realistic case: three lines read, one name wrong, one invented, one
    // missing from the photo entirely.
    const good = ordItem({ name: 'Paracetamol 500mg', unitPricePaise: 2200, confidence: 0.95 });
    const wrong = ordItem({ name: 'Amoxicilin 250', unitPricePaise: 9600, confidence: 0.38 });
    const invented = ordItem({ name: 'Vitmin D3??', unitPricePaise: null, confidence: 0.11 });

    let o = ordWith([good, wrong, invented]);

    o = {
      ...o,
      ...editItem(o, wrong.id, { name: 'Amoxicillin 500mg', unit: 'strip of 10' }),
    } as Order;
    o = { ...o, ...removeItem(o, invented.id) } as Order;
    o = { ...o, ...addItem(o, { name: 'Pantoprazole 40mg', unit: 'strip of 15' }) } as Order;

    assert.deepEqual(
      o.items.map((i) => i.name),
      ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Pantoprazole 40mg'],
    );

    // Nothing the customer did moved a price.
    assert.equal(o.items[1]!.unitPricePaise, 9600, 'an edit changed a price');
    assert.equal(o.items[2]!.unitPricePaise, null);

    // The total still equals the sum of the priced, included lines.
    const expected = o.items.reduce(
      (s, i) => (i.included && i.unitPricePaise !== null ? s + i.unitPricePaise * i.quantity : s),
      0,
    );
    assert.equal(o.pricing.itemsPaise, expected);
    assert.equal(o.pricing.totalPaise, expected + o.pricing.deliveryPaise);

    // And checkout stays gated, because the added line has no price yet.
    assert.equal(isFullyPriced(o.items), false);
  });

  it('survives a hundred random edits without breaking its own arithmetic', () => {
    let o = ordWith([ordItem(), ordItem(), ordItem()]);

    for (let n = 0; n < 100; n += 1) {
      const pick = o.items[n % o.items.length]!;
      const move = n % 4;

      if (move === 0) o = { ...o, ...editItem(o, pick.id, { name: `edited ${n}` }) } as Order;
      else if (move === 1) o = { ...o, ...editItem(o, pick.id, { quantity: (n % 9) + 1 }) } as Order;
      else if (move === 2) o = { ...o, ...addItem(o, { name: `added ${n}` }) } as Order;
      else o = { ...o, ...removeItem(o, pick.id) } as Order;

      const expected = o.items.reduce(
        (s, i) => (i.included && i.unitPricePaise !== null ? s + i.unitPricePaise * i.quantity : s),
        0,
      );
      assert.equal(o.pricing.itemsPaise, expected, `basket stopped balancing at step ${n}`);
      assert.ok(o.items.length > 0, `order was emptied at step ${n}`);
      assert.equal(
        new Set(o.items.map((i) => i.id)).size,
        o.items.length,
        `duplicate id appeared at step ${n}`,
      );
    }
  });
});
