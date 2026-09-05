import test from 'node:test';
import assert from 'node:assert/strict';

import {
  // Telemetry
  haversineDistanceMeters,
  calculateBearingDeg,
  projectDeadReckoning,
  interpolateTelemetryPosition,
  lookupIndoorWaypoint,
  // Food Rescue
  createFoodRescueListing,
  getRescueRemainingMs,
  isRescueClaimable,
  claimFoodRescueListing,
  // Group Order
  createGroupOrderRoom,
  joinGroupOrderRoom,
  computeGroupBillSplit,
  // Predictive
  getTimeOfDaySlot,
  predictContextualCart,
  // Batching
  findBatchOpportunities,
  // Spatial Hex
  computeSpatialHexSurge,
  // Safety
  detectCrashAnomaly,
  evaluateShiftFatigue,
  // Kitchen Sync
  formatWhatsAppKotPayload,
  // Ingredient BOM
  toggleIngredientStock,
  SEED_INGREDIENTS,
  // Ads Auction
  resolveSponsoredPlacements,
  SEED_AD_CAMPAIGNS,
  // Types & mocks
  blankOrder,
  type Order,
  type Rider,
  type Product,
} from '../index';

const sampleUser = {
  uid: 'cust-1',
  name: 'Anand Kumar',
  phone: '+919876543210',
  role: 'customer' as const,
  localityId: 'kk-nagar',
  addressLine: '12 80 Feet Road',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

test('Telemetry: Geodesic and Dead Reckoning', async (t) => {
  await t.test('haversineDistanceMeters calculates accurate distance', () => {
    // Distance between KK Nagar and Simmakkal (~4-5 km)
    const d = haversineDistanceMeters(
      { lat: 9.9252, lng: 78.1466 },
      { lat: 9.9288, lng: 78.1215 },
    );
    assert.ok(d > 2500 && d < 4000, `Expected distance around 2.7km, got ${d}`);
  });

  await t.test('calculateBearingDeg returns correct directional angle', () => {
    const bearing = calculateBearingDeg(
      { lat: 9.92, lng: 78.12 },
      { lat: 9.93, lng: 78.12 }, // Due North
    );
    assert.ok(Math.abs(bearing - 0) < 1.0 || Math.abs(bearing - 360) < 1.0);
  });

  await t.test('projectDeadReckoning advances position based on speed and time', () => {
    const start = { lat: 9.9252, lng: 78.1466 };
    // 36 km/h = 10 m/s. In 3 seconds = 30 meters North (0 deg)
    const projected = projectDeadReckoning(start, 0, 36, 3000);
    assert.ok(projected.lat > start.lat, 'Latitude should advance North');
  });

  await t.test('interpolateTelemetryPosition smoothly interpolates', () => {
    const p1 = { lat: 9.0, lng: 78.0 };
    const p2 = { lat: 10.0, lng: 79.0 };
    const mid = interpolateTelemetryPosition(p1, p2, 0.5);
    assert.equal(mid.lat, 9.5);
    assert.equal(mid.lng, 78.5);
  });

  await t.test('lookupIndoorWaypoint finds landmark for ELCOT IT Park', () => {
    const wp = lookupIndoorWaypoint('kk-nagar', 'ELCOT IT Park Ilandhaikulam');
    assert.ok(wp !== null);
    assert.equal(wp?.id, 'elcot-it-park');
  });
});

test('Food Rescue: Canceled Order 15m Radar', async (t) => {
  const order = blankOrder('ord-1', 101, sampleUser);
  order.storeId = 'murugan-idli-shop';
  order.storeName = 'Murugan Idli Shop';
  order.items = [
    { id: 'i1', name: 'Ghee Podi Idli', quantity: 2, unit: 'plate', unitPricePaise: 10000, confidence: 1, included: true },
  ];
  order.pricing.itemsPaise = 20000; // ₹200

  await t.test('creates rescue listing with 60% discount', () => {
    const listing = createFoodRescueListing(order, 60, 1000000);
    assert.equal(listing.discountPercentage, 60);
    assert.equal(listing.originalSubtotalPaise, 20000);
    assert.equal(listing.rescuePricePaise, 8000); // 40% of 200 = ₹80 = 8000 paise
    assert.equal(listing.expiresAt, 1000000 + 15 * 60 * 1000);
    assert.equal(isRescueClaimable(listing, 1000000 + 5000), true);
  });

  await t.test('getRescueRemainingMs counts down to expiry', () => {
    const listing = createFoodRescueListing(order, 60, 1000000);
    const rem = getRescueRemainingMs(listing, 1000000 + 10 * 60 * 1000);
    assert.equal(rem, 5 * 60 * 1000); // 5 min left
  });

  await t.test('claimFoodRescueListing claims active deal and prevents double claim', () => {
    const listing = createFoodRescueListing(order, 60, 1000000);
    const claimed = claimFoodRescueListing(listing, 'buyer-1', 'Ramesh', 'new-ord-2', 1000000 + 1000);
    assert.equal(claimed.status, 'claimed');
    assert.equal(claimed.claimedByUid, 'buyer-1');

    assert.throws(() => {
      claimFoodRescueListing(claimed, 'buyer-2', 'Suresh', 'new-ord-3', 1000000 + 2000);
    });
  });
});

test('Group Order: Room & Split Billing Engine', async (t) => {
  const room = createGroupOrderRoom(
    { uid: 'u1', name: 'Host Anand', phone: '+919876500001' },
    { id: 'simmakkal-konar-mess', name: 'Simmakkal Konar Mess', localityId: 'simmakkal' },
    3000, // ₹30 delivery fee
  );

  const updatedRoom = joinGroupOrderRoom(room, {
    uid: 'u2',
    name: 'Friend Priya',
    phone: '+919876500002',
  });

  assert.equal(updatedRoom.members.length, 2);

  // Anand adds items worth ₹200
  updatedRoom.items.push({
    id: 'it1',
    name: 'Mutton Kari Dosa',
    unit: 'portion',
    unitPricePaise: 20000,
    confidence: 1,
    quantity: 1,
    pricePaise: 20000,
    included: true,
    addedByUid: 'u1',
    addedByName: 'Host Anand',
  });

  // Priya adds items worth ₹100
  updatedRoom.items.push({
    id: 'it2',
    name: 'Bun Parotta',
    unit: 'pc',
    unitPricePaise: 5000,
    confidence: 1,
    quantity: 2,
    pricePaise: 10000,
    included: true,
    addedByUid: 'u2',
    addedByName: 'Friend Priya',
  });

  await t.test('computes proportional bill split', () => {
    const { splits, pricing } = computeGroupBillSplit(updatedRoom);
    assert.equal(pricing.itemsPaise, 30000); // ₹300 total food

    const anandSplit = splits.find((s) => s.memberUid === 'u1')!;
    const priyaSplit = splits.find((s) => s.memberUid === 'u2')!;

    // Anand had 2/3 of food (₹200 / ₹300) -> 2/3 of ₹30 delivery fee = ₹20 (2000 paise)
    assert.equal(anandSplit.subtotalPaise, 20000);
    assert.equal(anandSplit.shareOfDeliveryPaise, 2000);

    // Priya had 1/3 of food (₹100 / ₹300) -> 1/3 of ₹30 delivery fee = ₹10 (1000 paise)
    assert.equal(priyaSplit.subtotalPaise, 10000);
    assert.equal(priyaSplit.shareOfDeliveryPaise, 1000);
  });
});

test('Predictive Cart: Meal Affinities', async () => {
  const breakfastTime = new Date('2026-09-06T08:30:00'); // Sunday 8:30 AM
  const slot = getTimeOfDaySlot(breakfastTime);
  assert.equal(slot, 'breakfast');

  const card = predictContextualCart([], 'kk-nagar', breakfastTime);
  assert.equal(card.slot, 'breakfast');
  assert.ok(card.suggestedItems.length > 0);
  assert.ok(card.kicker.en.includes('SUNDAY'));
});

test('Batching: Multi-Order Route Minimization', async () => {
  const o1 = blankOrder('ord-101', 101, sampleUser);
  o1.storeId = 'simmakkal-konar-mess';
  o1.storeName = 'Simmakkal Konar Mess';
  o1.localityId = 'goripalayam';
  o1.status = 'ready_for_pickup';
  o1.createdAt = 1000000;

  const o2 = blankOrder('ord-102', 102, { ...sampleUser, uid: 'cust-2', name: 'Bala' });
  o2.storeId = 'simmakkal-konar-mess';
  o2.storeName = 'Simmakkal Konar Mess';
  o2.localityId = 'tallakulam'; // adjacent to Goripalayam (~1.2 km)
  o2.status = 'packing';
  o2.createdAt = 1000000 + 60 * 1000; // 1 min apart

  const batches = findBatchOpportunities([o1, o2]);
  assert.equal(batches.length, 1);
  assert.equal(batches[0]?.orders.length, 2);
  assert.ok((batches[0]?.efficiencyGainPercent ?? 0) >= 20);
});

test('Spatial Hex: Dynamic Surge Multipliers', async () => {
  const orders: Order[] = [
    { ...blankOrder('o1', 1, sampleUser), localityId: 'anna-nagar', status: 'incoming' },
    { ...blankOrder('o2', 2, sampleUser), localityId: 'anna-nagar', status: 'paid' },
    { ...blankOrder('o3', 3, sampleUser), localityId: 'anna-nagar', status: 'vendor_accepted' },
    { ...blankOrder('o4', 4, sampleUser), localityId: 'anna-nagar', status: 'packing' },
  ];

  const riders: Rider[] = [
    {
      uid: 'r1',
      name: 'Dhanush',
      phone: '+919876500004',
      isOnline: true,
      activeOrderId: null,
      cancellationsToday: 0,
      maxDailyCancellations: 2,
    },
  ];

  const hexMap = computeSpatialHexSurge(orders, riders);
  const annaNagarHex = hexMap['hex_anna-nagar'];
  assert.ok(annaNagarHex);
  assert.ok(annaNagarHex.activeOrderDemand >= 4);
  assert.ok(annaNagarHex.surgeMultiplier > 1.0, 'Anna Nagar should have surge multiplier');
});

test('Safety: Crash SOS & Fatigue Detection', async () => {
  const crashSample = {
    accelX: 38.0, // High G deceleration (~3.8G)
    accelY: 0.5,
    accelZ: 9.8,
    gyroAlpha: 120,
    gyroBeta: 45,
    gyroGamma: 10,
    speedKmph: 42,
    timestamp: Date.now(),
  };

  const crash = detectCrashAnomaly(crashSample, 'rider-1', 'ord-99');
  assert.ok(crash !== null);
  assert.equal(crash?.riderUid, 'rider-1');

  // Fatigue test: 6.5 hours continuous shift
  const shiftStartedAt = Date.now() - 6.5 * 60 * 60 * 1000;
  const fatigue = evaluateShiftFatigue('rider-1', shiftStartedAt);
  assert.equal(fatigue.isMandatoryBreakActive, true);
});

test('Kitchen Sync: WhatsApp KOT Payload', async () => {
  const order = blankOrder('ord-kot', 555, sampleUser);
  order.storeName = 'Murugan Idli Shop';
  order.items = [
    { id: 'i1', name: 'Ghee Podi Idli', quantity: 2, unit: 'plate', unitPricePaise: 9000, confidence: 1, included: true },
  ];
  order.pricing.itemsPaise = 18000;

  const kot = formatWhatsAppKotPayload(order);
  assert.ok(kot.formattedKdsBody.includes('KITCHEN ORDER TICKET'));
  assert.ok(kot.formattedKdsBody.includes('Ghee Podi Idli'));
  assert.ok(kot.formattedKdsBody.includes('₹180'));
});

test('Ingredient BOM: Cascading Out of Stock', async () => {
  const doughIngredient = SEED_INGREDIENTS[0]!; // Parotta dough
  const products: Product[] = [
    {
      id: 'prod-bun-parotta',
      name: 'Bun Parotta',
      category: 'food',
      storeId: 'simmakkal-konar-mess',
      unit: 'pc',
      mrpPaise: 4500,
      sellPaise: 4500,
      stockQty: 50,
      lowStockAt: 5,
      isActive: true,
      updatedAt: 0,
    },
    {
      id: 'prod-other-tea',
      name: 'Sulaimani Tea',
      category: 'food',
      storeId: 'simmakkal-konar-mess',
      unit: 'cup',
      mrpPaise: 2000,
      sellPaise: 2000,
      stockQty: 50,
      lowStockAt: 5,
      isActive: true,
      updatedAt: 0,
    },
  ];

  const result = toggleIngredientStock(doughIngredient, false, products);
  const bunParotta = result.updatedProducts.find((p) => p.id === 'prod-bun-parotta');
  const tea = result.updatedProducts.find((p) => p.id === 'prod-other-tea');

  assert.equal(bunParotta?.isActive, false, 'Bun parotta should be auto-disabled');
  assert.equal(tea?.isActive, true, 'Tea should remain active');
});

test('Ads Auction: CPC Second-Price Winner Resolution', async () => {
  const winners = resolveSponsoredPlacements(SEED_AD_CAMPAIGNS, 'food', 2);
  assert.equal(winners.length, 2);
  assert.ok(winners[0]!.rankScore >= winners[1]!.rankScore);
  // Second-price charge must be <= bid
  assert.ok(winners[0]!.effectiveCpcPaise <= winners[0]!.campaign.bidPerClickPaise);
});
