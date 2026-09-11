'use client';

/**
 * In-Memory Reactive Mock Store for DFC Admin Web.
 *
 * Allows the entire admin interface to operate in full fidelity without
 * needing a connected live Firebase instance. Pre-seeded with Madurai data.
 */

import {
  SEED_AD_CAMPAIGNS,
  SEED_INGREDIENTS,
  SEED_STORES,
  claimFoodRescueListing,
  computeSpatialHexSurge,
  createFoodRescueListing,
  createManualAdminOrder,
  createProduct,
  deleteProductFromList,
  findBatchOpportunities,
  reactivateRider as coreReactivateRider,
  reportOrderDelay as coreReportDelay,
  setItemPrice as coreSetItemPrice,
  toPaise,
  toggleIngredientStock,
  toggleItem as coreToggleItem,
  withDeliveryFee as coreWithDeliveryFee,
  withStatus,
  DEFAULT_PLATFORM_CONFIG,
  type AdCampaign,
  type BatchCandidate,
  type FoodRescueListing,
  type Ingredient,
  type ManualOrderInput,
  type Order,
  type OrderStatus,
  type Payment,
  type PlatformConfig,
  type PlatformStatus,
  type Product,
  type Rider,
  type Role,
  type SpatialHexCell,
  type Store,
} from '@dfc/core';

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

const now = Date.now();
const min = 60 * 1000;

const SEED_RIDERS: Rider[] = [
  {
    uid: 'rider-1',
    name: 'A. Dhanush',
    phone: '+919876500004',
    isOnline: true,
    activeOrderId: 'seed-1044',
    cancellationsToday: 0,
    maxDailyCancellations: 2,
    cancellationHistory: [],
  },
  {
    uid: 'rider-2',
    name: 'K. Karthik',
    phone: '+919876500005',
    isOnline: true,
    activeOrderId: null,
    cancellationsToday: 1,
    maxDailyCancellations: 2,
    cancellationHistory: [
      {
        orderId: 'seed-1038',
        orderCode: 1038,
        timestamp: now - 3 * 60 * min,
        reason: 'Heavy rain flooded road in Sellur',
        explanation: 'Water level reached silencer, waited for water to recede',
      },
    ],
  },
  {
    uid: 'rider-3',
    name: 'S. Vijay',
    phone: '+919876500006',
    isOnline: false,
    activeOrderId: null,
    cancellationsToday: 3,
    maxDailyCancellations: 2,
    isOfflineDueToCancellations: true,
    cancellationHistory: [
      {
        orderId: 'seed-1021',
        orderCode: 1021,
        timestamp: now - 5 * 60 * min,
        reason: 'Tyre puncture near Goripalayam junction',
        explanation: 'Took 45 mins to find a mechanic shop',
      },
      {
        orderId: 'seed-1029',
        orderCode: 1029,
        timestamp: now - 4 * 60 * min,
        reason: 'Vehicle breakdown',
        explanation: 'Clutch wire snapped on flyover',
      },
      {
        orderId: 'seed-1035',
        orderCode: 1035,
        timestamp: now - 2 * 60 * min,
        reason: 'Personal emergency',
        explanation: 'Family emergency, had to rush to hospital',
      },
    ],
  },
];

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-ghee-podi-idli',
    storeId: 'murugan-idli-shop',
    name: 'Ghee Podi Idli (2 pcs)',
    nameTa: 'நெய் பொடி இட்லி (2 எண்ணிக்கை)',
    category: 'food',
    sellPaise: toPaise(90),
    mrpPaise: toPaise(90),
    stockQty: 50,
    lowStockAt: 10,
    isActive: true,
    unit: 'plate',
    updatedAt: now,
  },
  {
    id: 'prod-plain-idli',
    storeId: 'murugan-idli-shop',
    name: 'Steamed Idli (2 pcs)',
    nameTa: 'மல்லிகைப் பூ இட்லி (2 எண்ணிக்கை)',
    category: 'food',
    sellPaise: toPaise(50),
    mrpPaise: toPaise(50),
    stockQty: 80,
    lowStockAt: 15,
    isActive: true,
    unit: 'plate',
    updatedAt: now,
  },
  {
    id: 'prod-bun-parotta',
    storeId: 'simmakkal-konar-mess',
    name: 'Madurai Special Bun Parotta',
    nameTa: 'மதுரை ஸ்பெஷல் பன் பரோட்டா',
    category: 'food',
    sellPaise: toPaise(45),
    mrpPaise: toPaise(45),
    stockQty: 100,
    lowStockAt: 20,
    isActive: true,
    unit: 'pc',
    updatedAt: now,
  },
  {
    id: 'prod-mutton-kari-dosa',
    storeId: 'simmakkal-konar-mess',
    name: 'Mutton Kari Dosa',
    nameTa: 'மட்டன் கறி தோசை',
    category: 'food',
    sellPaise: toPaise(240),
    mrpPaise: toPaise(250),
    stockQty: 30,
    lowStockAt: 5,
    isActive: true,
    unit: 'plate',
    updatedAt: now,
  },
  {
    id: 'prod-jigarthanda-special',
    storeId: 'famous-jigarthanda',
    name: 'Special Basundi Jigarthanda',
    nameTa: 'ஸ்பெஷல் பாசுந்தி ஜிகர்தண்டா',
    category: 'food',
    sellPaise: toPaise(80),
    mrpPaise: toPaise(80),
    stockQty: 60,
    lowStockAt: 10,
    isActive: true,
    unit: 'glass',
    updatedAt: now,
  },
  {
    id: 'prod-sona-masoori-rice',
    storeId: 'amma-mini-mart',
    name: 'Sona Masoori Rice (5kg)',
    nameTa: 'சோனா மசூரி அரிசி (5 கிலோ)',
    category: 'grocery',
    sellPaise: toPaise(320),
    mrpPaise: toPaise(350),
    stockQty: 25,
    lowStockAt: 5,
    isActive: true,
    unit: 'bag',
    updatedAt: now,
  },
  {
    id: 'prod-malligai-poo',
    storeId: 'simmakkal-flowers',
    name: 'Madurai Malligai (2 muzham)',
    nameTa: 'மதுரை மல்லிகை (2 முழம்)',
    category: 'grocery',
    sellPaise: toPaise(60),
    mrpPaise: toPaise(70),
    stockQty: 40,
    lowStockAt: 8,
    isActive: true,
    unit: 'pack',
    updatedAt: now,
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: 'seed-1045',
    code: 1045,
    customerUid: 'cust-101',
    customerName: 'S. Meenakshi Sundaram',
    customerPhone: '+919876500101',
    localityId: 'kk-nagar',
    addressLine: '14, 80 Feet Road, Near Apollo Hospital',
    category: 'food',
    status: 'incoming',
    items: [
      { id: 'i1', name: 'Ghee Podi Idli (2 pcs)', quantity: 3, unit: 'plate', unitPricePaise: toPaise(90), included: true, confidence: 1.0 },
      { id: 'i2', name: 'Medhu Vada', quantity: 2, unit: 'pc', unitPricePaise: toPaise(35), included: true, confidence: 1.0 },
    ],
    storeId: 'murugan-idli-shop',
    storeName: 'Murugan Idli Shop',
    riderUid: null,
    riderName: null,
    pricing: {
      itemsPaise: toPaise(340),
      deliveryPaise: toPaise(29),
      servicePaise: 0,
      totalPaise: toPaise(369),
    },
    paymentMode: 'cod',
    paymentStatus: 'unpaid',
    source: { kind: 'voice', transcript: 'Murugan Idli Shop-la rendu set Ghee Podi Idli, rendu Vada KK Nagar Apollo pakka.' },
    ai: null,
    deliveryOtp: '5821',
    timeline: [{ status: 'incoming', at: now - 4 * min, by: 'customer', note: 'Voice order parsed' }],
    createdAt: now - 4 * min,
    updatedAt: now - 4 * min,
  },
  {
    id: 'seed-1044',
    code: 1044,
    customerUid: 'cust-102',
    customerName: 'K. Rameshwaran',
    customerPhone: '+919876500102',
    localityId: 'simmakkal',
    addressLine: '82, North Veli Street',
    category: 'food',
    status: 'dispatched',
    items: [
      { id: 'i1', name: 'Madurai Special Bun Parotta', quantity: 4, unit: 'pc', unitPricePaise: toPaise(45), included: true, confidence: 1.0 },
      { id: 'i2', name: 'Mutton Kari Dosa', quantity: 1, unit: 'plate', unitPricePaise: toPaise(240), included: true, confidence: 1.0 },
    ],
    storeId: 'simmakkal-konar-mess',
    storeName: 'Simmakkal Konar Mess',
    riderUid: 'rider-1',
    riderName: 'A. Dhanush',
    pricing: {
      itemsPaise: toPaise(420),
      deliveryPaise: toPaise(35),
      servicePaise: 0,
      totalPaise: toPaise(455),
    },
    paymentMode: 'prepaid',
    paymentStatus: 'paid',
    source: { kind: 'text', transcript: '4 Bun Parotta and 1 Mutton Kari Dosa' },
    ai: null,
    deliveryOtp: '7412',
    timeline: [
      { status: 'incoming', at: now - 22 * min, by: 'customer' },
      { status: 'paid', at: now - 20 * min, by: 'gateway' },
      { status: 'vendor_accepted', at: now - 18 * min, by: 'vendor' },
      { status: 'packing', at: now - 12 * min, by: 'vendor' },
      { status: 'ready_for_pickup', at: now - 6 * min, by: 'vendor' },
      { status: 'dispatched', at: now - 2 * min, by: 'admin', note: 'Assigned to Captain Dhanush' },
    ],
    prepStartedAt: now - 18 * min,
    prepCompletedAt: now - 6 * min,
    actualPrepMinutes: 12,
    dispatchedAt: now - 2 * min,
    createdAt: now - 22 * min,
    updatedAt: now - 2 * min,
  },
  {
    id: 'seed-1043',
    code: 1043,
    customerUid: 'cust-103',
    customerName: 'P. Kavitha',
    customerPhone: '+919876500103',
    localityId: 'anna-nagar',
    addressLine: 'Plot 42, Kuruvikaran Salai',
    category: 'grocery',
    status: 'packing',
    items: [
      { id: 'i1', name: 'Sona Masoori Rice (5kg)', quantity: 1, unit: 'bag', unitPricePaise: toPaise(320), included: true, confidence: 1.0 },
      { id: 'i2', name: 'Madurai Malligai (2 muzham)', quantity: 2, unit: 'pack', unitPricePaise: toPaise(60), included: true, confidence: 1.0 },
    ],
    storeId: 'amma-mini-mart',
    storeName: 'Amma Mini Mart',
    riderUid: null,
    riderName: null,
    pricing: {
      itemsPaise: toPaise(440),
      deliveryPaise: toPaise(29),
      servicePaise: 0,
      totalPaise: toPaise(469),
    },
    paymentMode: 'cod',
    paymentStatus: 'unpaid',
    source: { kind: 'photo', mimeType: 'image/jpeg' },
    ai: null,
    deliveryOtp: '9103',
    timeline: [
      { status: 'incoming', at: now - 15 * min, by: 'customer' },
      { status: 'vendor_accepted', at: now - 12 * min, by: 'vendor' },
      { status: 'packing', at: now - 5 * min, by: 'vendor' },
    ],
    delayMinutes: 10,
    delayReason: 'Restocking fresh morning jasmine flowers',
    delayReportedAt: now - 4 * min,
    createdAt: now - 15 * min,
    updatedAt: now - 4 * min,
  },
];

// ---------------------------------------------------------------------------
// Mock Store Implementation
// ---------------------------------------------------------------------------

let nextMockCode = 1050;

class MockStore {
  private orders: Order[] = [...SEED_ORDERS];
  private riders: Rider[] = [...SEED_RIDERS];
  private stores: Store[] = SEED_STORES.map((s) => ({
    ...s,
    ownerUid: 'vendor-1',
    isOpen: true,
  }));
  private products: Product[] = [...SEED_PRODUCTS];
  private payments: Payment[] = [];
  private adCampaigns: AdCampaign[] = [...SEED_AD_CAMPAIGNS];
  private ingredients: Ingredient[] = [...SEED_INGREDIENTS];
  private foodRescueListings: FoodRescueListing[] = [];
  private platformConfig: PlatformConfig = { ...DEFAULT_PLATFORM_CONFIG };
  private listeners = new Set<() => void>();

  constructor() {
    // Seed initial Food Rescue deal from a canceled order
    const canceledDemo = { ...SEED_ORDERS[0]!, id: 'demo-canceled-1', code: 1039, status: 'cancelled' as OrderStatus };
    this.foodRescueListings.push(createFoodRescueListing(canceledDemo, 65, now - 2 * min));
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  // --- Getters ---
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrder(id: string): Order | null {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  public getRiders(): Rider[] {
    return [...this.riders];
  }

  public getStores(): Store[] {
    return [...this.stores];
  }

  public getProducts(): Product[] {
    return [...this.products];
  }

  public getPaymentFor(orderId: string): Payment | null {
    return this.payments.find((p) => p.orderId === orderId) ?? null;
  }

  // --- Tier-1 Advanced Getters ---
  public getAdCampaigns(): AdCampaign[] {
    return [...this.adCampaigns];
  }

  public getIngredients(): Ingredient[] {
    return [...this.ingredients];
  }

  public getFoodRescueListings(): FoodRescueListing[] {
    return [...this.foodRescueListings];
  }

  public getBatchOpportunities(): BatchCandidate[] {
    return findBatchOpportunities(this.orders);
  }

  public getHexSurgeMap(): Record<string, SpatialHexCell> {
    return computeSpatialHexSurge(this.orders, this.riders);
  }

  public getPlatformConfig(): PlatformConfig {
    return { ...this.platformConfig };
  }

  public updatePlatformConfig(updates: Partial<PlatformConfig>): void {
    this.platformConfig = {
      ...this.platformConfig,
      ...updates,
      updatedAt: Date.now(),
      updatedBy: 'admin-dispatch',
    };
    this.notify();
  }

  public toggleSleepMode(enabled?: boolean): void {
    const nextStatus: PlatformStatus =
      enabled !== undefined
        ? enabled
          ? 'sleep'
          : 'online'
        : this.platformConfig.status === 'sleep'
          ? 'online'
          : 'sleep';

    this.updatePlatformConfig({
      status: nextStatus,
      manualOverride: true,
    });
  }

  public toggleRainSurge(active?: boolean, multiplier = 1.25, bonusPaise = 2000): void {
    const nextActive = active !== undefined ? active : !this.platformConfig.rainSurge.active;
    this.updatePlatformConfig({
      rainSurge: {
        ...this.platformConfig.rainSurge,
        active: nextActive,
        multiplier,
        riderSafetyBonusPaise: bonusPaise,
      },
    });
  }

  public runAutoBatching(): { batchedCount: number; candidateBatches: BatchCandidate[] } {
    const candidates = findBatchOpportunities(
      this.orders,
      this.platformConfig.automations.maxBatchDistanceMeters,
    );
    return {
      batchedCount: candidates.reduce((sum, b) => sum + b.orders.length, 0),
      candidateBatches: candidates,
    };
  }

  // --- Mutations ---
  public moveOrder(orderId: string, to: OrderStatus, role = 'admin', uid = 'admin-1', note?: string): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    if (order.status === to) return;
    const patch = withStatus(order, to, role as Role, uid, note);
    this.orders[idx] = { ...order, ...patch } as Order;

    // If order was cancelled and had items prepared, auto-create Food Rescue listing!
    if (to === 'cancelled' && (order.status === 'packing' || order.status === 'ready_for_pickup' || order.status === 'dispatched')) {
      const listing = createFoodRescueListing(this.orders[idx]!, 60);
      this.foodRescueListings.unshift(listing);
    }

    this.notify();
  }

  public setItemPrice(orderId: string, itemId: string, pricePaise: number | null): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    const patch = coreSetItemPrice(order, itemId, pricePaise);
    this.orders[idx] = { ...order, ...patch } as Order;
    this.notify();
  }

  public toggleItem(orderId: string, itemId: string): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    const patch = coreToggleItem(order, itemId);
    this.orders[idx] = { ...order, ...patch } as Order;
    this.notify();
  }

  public setDeliveryFee(orderId: string, paise: number): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    const patch = coreWithDeliveryFee(order, paise);
    this.orders[idx] = { ...order, ...patch } as Order;
    this.notify();
  }

  public dispatchToRider(orderId: string, rider: Rider, adminUid: string): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    const assign = { riderUid: rider.uid, riderName: rider.name, updatedAt: Date.now() };
    const move =
      order.status === 'ready_for_pickup' || order.status === 'packing' || order.status === 'vendor_accepted'
        ? withStatus(order, 'dispatched', 'admin', adminUid, `Assigned to rider ${rider.name}`)
        : {};

    this.orders[idx] = { ...order, ...assign, ...move } as Order;

    // Update rider active order
    const rIdx = this.riders.findIndex((r) => r.uid === rider.uid);
    if (rIdx !== -1) {
      this.riders[rIdx] = { ...this.riders[rIdx]!, activeOrderId: orderId };
    }
    this.notify();
  }

  public createCustomOrder(input: ManualOrderInput): string {
    const code = nextMockCode++;
    const order = createManualAdminOrder({
      ...input,
      id: `manual-${code}`,
      code,
    });
    this.orders.unshift(order);
    this.notify();
    return order.id;
  }

  public reportDelay(orderId: string, delayMinutes: number, reason: string, adminUid: string): void {
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = this.orders[idx]!;
    const patch = coreReportDelay(order, delayMinutes, reason, adminUid);
    this.orders[idx] = { ...order, ...patch } as Order;
    this.notify();
  }

  public reactivateRider(riderUid: string): void {
    const idx = this.riders.findIndex((r) => r.uid === riderUid);
    if (idx === -1) return;
    this.riders[idx] = coreReactivateRider(this.riders[idx]!);
    this.notify();
  }

  public addProduct(p: Parameters<typeof createProduct>[0]): string {
    const prod = createProduct(p);
    this.products.unshift(prod);
    this.notify();
    return prod.id;
  }

  public patchProduct(productId: string, patch: Partial<Product>): void {
    const idx = this.products.findIndex((p) => p.id === productId);
    if (idx === -1) return;
    this.products[idx] = { ...this.products[idx]!, ...patch, updatedAt: Date.now() };
    this.notify();
  }

  public deleteProduct(productId: string): void {
    this.products = deleteProductFromList(this.products, productId);
    this.notify();
  }

  // --- Advanced Tier-1 Mutations ---
  public updateAdCampaignBid(campaignId: string, bidPaise: number): void {
    const idx = this.adCampaigns.findIndex((c) => c.id === campaignId);
    if (idx === -1) return;
    this.adCampaigns[idx] = { ...this.adCampaigns[idx]!, bidPerClickPaise: bidPaise };
    this.notify();
  }

  public toggleAdCampaign(campaignId: string): void {
    const idx = this.adCampaigns.findIndex((c) => c.id === campaignId);
    if (idx === -1) return;
    const current = this.adCampaigns[idx]!;
    this.adCampaigns[idx] = {
      ...current,
      status: current.status === 'active' ? 'paused' : 'active',
    };
    this.notify();
  }

  public toggleIngredient(ingredientId: string, inStock: boolean): void {
    const idx = this.ingredients.findIndex((i) => i.id === ingredientId);
    if (idx === -1) return;
    const ing = this.ingredients[idx]!;
    const res = toggleIngredientStock(ing, inStock, this.products);

    this.ingredients[idx] = { ...ing, inStock, updatedAt: Date.now() };
    this.products = res.updatedProducts;
    this.notify();
  }

  public toggleProductStock(productId: string, active: boolean): void {
    const idx = this.products.findIndex((p) => p.id === productId);
    if (idx === -1) return;
    this.products[idx] = { ...this.products[idx]!, isActive: active, updatedAt: Date.now() };
    this.notify();
  }

  public claimFoodRescue(rescueId: string, buyerUid: string, buyerName: string): string {
    const idx = this.foodRescueListings.findIndex((r) => r.id === rescueId);
    if (idx === -1) throw new Error('Rescue listing not found');
    const listing = this.foodRescueListings[idx]!;
    const claimedCode = nextMockCode++;
    const claimedOrderId = `rescue-ord-${claimedCode}`;

    this.foodRescueListings[idx] = claimFoodRescueListing(listing, buyerUid, buyerName, claimedOrderId);

    // Create immediate dispatched rescue order
    const rescueOrder: Order = {
      id: claimedOrderId,
      code: claimedCode,
      customerUid: buyerUid,
      customerName: buyerName,
      customerPhone: '+919876500999',
      localityId: listing.localityId,
      addressLine: 'Food Rescue Fast Delivery',
      category: 'food',
      status: 'ready_for_pickup',
      items: listing.items,
      storeId: listing.storeId,
      storeName: listing.storeName,
      riderUid: null,
      riderName: null,
      pricing: {
        itemsPaise: listing.rescuePricePaise,
        deliveryPaise: toPaise(19), // Discounted rescue delivery fee
        servicePaise: 0,
        totalPaise: listing.rescuePricePaise + toPaise(19),
      },
      paymentMode: 'prepaid',
      paymentStatus: 'paid',
      source: { kind: 'text', transcript: `Food Rescue Deal (Claimed ${listing.discountPercentage}% OFF)` },
      ai: null,
      deliveryOtp: '4092',
      timeline: [{ status: 'ready_for_pickup', at: Date.now(), by: 'customer', note: 'Food Rescue Claimed' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.orders.unshift(rescueOrder);
    this.notify();
    return claimedOrderId;
  }
}

export const mockStore = new MockStore();
