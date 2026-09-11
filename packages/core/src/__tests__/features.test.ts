import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createManualAdminOrder,
  createProduct,
  deleteProductFromList,
  etaMinutes,
  reactivateRider,
  recordRiderCancellation,
  reportOrderDelay,
  toggleProductActive,
  type Order,
  type OrderItem,
  type Rider,
} from '../index';

describe('Rider cancellation constraints', () => {
  const dummyRider: Rider = {
    uid: 'rider-1',
    name: 'A. Dhanush',
    phone: '+919876500004',
    isOnline: true,
    activeOrderId: 'order-1',
    cancellationsToday: 0,
    maxDailyCancellations: 2,
    cancellationHistory: [],
  };

  const dummyOrder: Order = {
    id: 'order-1',
    code: 1042,
    customerUid: 'cust-1',
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2, 2nd Main Road',
    category: 'grocery',
    status: 'dispatched',
    items: [],
    storeId: 'amma-mini-mart',
    storeName: 'Amma Mini Mart',
    riderUid: 'rider-1',
    riderName: 'A. Dhanush',
    pricing: { itemsPaise: 1000, deliveryPaise: 3000, servicePaise: 0, totalPaise: 4000 },
    paymentMode: 'cod',
    paymentStatus: 'unpaid',
    source: { kind: 'text' },
    ai: null,
    deliveryOtp: '1234',
    timeline: [],
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
  };

  it('allows cancellation 1 and keeps rider online', () => {
    const res = recordRiderCancellation(dummyRider, dummyOrder, 'Vehicle breakdown');
    assert.equal(res.autoOffline, false);
    assert.equal(res.rider.cancellationsToday, 1);
    assert.equal(res.rider.isOnline, true);
    assert.equal(res.rider.isOfflineDueToCancellations, false);
    assert.equal(res.rider.activeOrderId, null);
    assert.equal(res.rider.cancellationHistory?.length, 1);
    assert.equal(res.orderPatch.riderUid, null);
    assert.equal(res.orderPatch.status, 'ready_for_pickup');
  });

  it('allows cancellation 2 and keeps rider online', () => {
    const riderAfter1 = { ...dummyRider, cancellationsToday: 1 };
    const res = recordRiderCancellation(riderAfter1, dummyOrder, 'Heavy rain');
    assert.equal(res.autoOffline, false);
    assert.equal(res.rider.cancellationsToday, 2);
    assert.equal(res.rider.isOnline, true);
  });

  it('exceeding 2 cancellations triggers automatic Offline status and records explanation', () => {
    const riderAfter2 = { ...dummyRider, cancellationsToday: 2 };
    const res = recordRiderCancellation(
      riderAfter2,
      dummyOrder,
      'Emergency',
      'Sudden family emergency, cannot ride today',
    );
    assert.equal(res.autoOffline, true);
    assert.equal(res.rider.cancellationsToday, 3);
    assert.equal(res.rider.isOnline, false);
    assert.equal(res.rider.isOfflineDueToCancellations, true);
    assert.equal(res.rider.explanationGiven, 'Sudden family emergency, cannot ride today');
  });

  it('admin reactivates rider back to good standing', () => {
    const lockedRider: Rider = {
      ...dummyRider,
      cancellationsToday: 3,
      isOnline: false,
      isOfflineDueToCancellations: true,
    };
    const reactivated = reactivateRider(lockedRider);
    assert.equal(reactivated.isOnline, true);
    assert.equal(reactivated.isOfflineDueToCancellations, false);
    assert.equal(reactivated.cancellationsToday, 0);
  });
});

describe('Vendor Delay Reporting & ETA calculation', () => {
  const sampleOrder: Order = {
    id: 'order-2',
    code: 1043,
    customerUid: 'cust-1',
    customerName: 'Karthik',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: 'Address',
    category: 'food',
    status: 'vendor_accepted',
    items: [],
    storeId: 'muniyandi-vilas',
    storeName: 'Muniyandi Vilas',
    riderUid: null,
    riderName: null,
    pricing: { itemsPaise: 1000, deliveryPaise: 3000, servicePaise: 0, totalPaise: 4000 },
    paymentMode: 'cod',
    paymentStatus: 'unpaid',
    source: { kind: 'text' },
    ai: null,
    deliveryOtp: '1234',
    timeline: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('calculates baseline ETA and extends it when delay is reported', () => {
    const baseEta = etaMinutes(sampleOrder);
    const delayPatch = reportOrderDelay(sampleOrder, 15, 'Kitchen rush', 'vendor-1');
    const updatedOrder = { ...sampleOrder, ...delayPatch };
    const newEta = etaMinutes(updatedOrder);

    assert.equal(updatedOrder.delayMinutes, 15);
    assert.equal(updatedOrder.delayReason, 'Kitchen rush');
    assert.equal(newEta, baseEta + 15);
  });
});

describe('Catalogue management', () => {
  it('creates product with correct fields and toggles availability', () => {
    const p = createProduct({
      storeId: 'amma-mini-mart',
      name: 'Paneer Butter Masala',
      category: 'food',
      unit: '300 g',
      mrpPaise: 16000,
      sellPaise: 14000,
    });
    assert.equal(p.name, 'Paneer Butter Masala');
    assert.equal(p.isActive, true);
    assert.equal(p.sellPaise, 14000);

    const toggled = toggleProductActive(p, false);
    assert.equal(toggled.isActive, false);

    const list = [p];
    const afterDelete = deleteProductFromList(list, p.id);
    assert.equal(afterDelete.length, 0);
  });
});

describe('Manual Admin Order Creation', () => {
  it('creates a complete valid order', () => {
    const item1: OrderItem = {
      id: 'i1',
      name: 'Idli Rice',
      unit: '5 kg',
      quantity: 1,
      unitPricePaise: 32000,
      confidence: 1,
      included: true,
    };
    const order = createManualAdminOrder({
      id: 'manual-1',
      code: 1045,
      customerName: 'S. Ramanathan',
      customerPhone: '+919876543210',
      localityId: 'anna-nagar',
      addressLine: 'Flat 3B, Temple View',
      category: 'grocery',
      storeId: 'amma-mini-mart',
      items: [item1],
      adminUid: 'admin-1',
      notes: 'Call before delivery',
    });

    assert.equal(order.code, 1045);
    assert.equal(order.customerName, 'S. Ramanathan');
    assert.equal(order.status, 'admin_review');
    assert.equal(order.pricing.itemsPaise, 32000);
    assert.equal(order.pricing.totalPaise > 32000, true);
    assert.equal(order.timeline[0]?.by, 'admin-1');
  });
});
