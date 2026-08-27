/**
 * Seeds a usable Madurai dataset: stores, one account per role, a rider, the
 * order-code counter, and a handful of orders spread across the board so the
 * admin Kanban has something to render on first run.
 *
 *   cp .env.example .env      # set GOOGLE_APPLICATION_CREDENTIALS
 *   npm run seed
 *
 * Safe to run repeatedly — everything is written by a deterministic id.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

import {
  COL,
  ORDER_CODE_COUNTER,
  SEED_STORES,
  computePricing,
  newOtp,
  routeKm,
  suggestDeliveryPaise,
  toPaise,
  blankPromotion,
  type Order,
  type OrderItem,
  type Product,
  type Promotion,
  type Role,
} from '@dfc/core';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const KEY_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  resolve(process.cwd(), '../dfc-app-bdb4e-firebase-adminsdk-fbsvc-d4f4d66081.json');

if (getApps().length === 0) {
  const raw = readFileSync(resolve(process.cwd(), KEY_PATH), 'utf8');
  initializeApp({ credential: cert(JSON.parse(raw)) });
}

const db = getFirestore();
const auth = getAuth();

const log = (...a: unknown[]) => console.log('  ', ...a);

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

interface SeedAccount {
  uid: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  phone: string;
  localityId: string;
  addressLine?: string;
  storeId?: string;
}

const ACCOUNTS: SeedAccount[] = [
  {
    uid: 'seed-admin',
    email: 'admin@dfc.test',
    password: 'dfc-admin-2026',
    role: 'admin',
    name: 'Arun R.',
    phone: '+919876500001',
    localityId: 'anna-nagar',
  },
  {
    uid: 'seed-customer',
    email: 'customer@dfc.test',
    password: 'dfc-customer-2026',
    role: 'customer',
    name: 'R. Karthikeyan',
    phone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2, 2nd Main Road, K.K. Nagar',
  },
  {
    uid: 'seed-vendor',
    email: 'vendor@dfc.test',
    password: 'dfc-vendor-2026',
    role: 'vendor',
    name: 'S. Meenakshi',
    phone: '+919876500003',
    localityId: 'anna-nagar',
    storeId: 'meenakshi-medicals',
  },
  {
    uid: 'seed-rider',
    email: 'rider@dfc.test',
    password: 'dfc-rider-2026',
    role: 'rider',
    name: 'A. Dhanush',
    phone: '+919876500004',
    localityId: 'villapuram',
  },
];

async function seedAccounts() {
  console.log('\nAccounts');
  for (const a of ACCOUNTS) {
    try {
      await auth.getUser(a.uid);
      await auth.updateUser(a.uid, { email: a.email, password: a.password, displayName: a.name });
    } catch {
      await auth.createUser({
        uid: a.uid,
        email: a.email,
        password: a.password,
        displayName: a.name,
      });
    }
    // The role lives on a custom claim — the Firestore rules read it from the
    // token, so a client can never grant itself one.
    await auth.setCustomUserClaims(a.uid, { role: a.role });

    await db.doc(`${COL.users}/${a.uid}`).set(
      {
        uid: a.uid,
        role: a.role,
        name: a.name,
        phone: a.phone,
        localityId: a.localityId,
        ...(a.addressLine ? { addressLine: a.addressLine } : {}),
        ...(a.storeId ? { storeId: a.storeId } : {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    log(`${a.role.padEnd(9)} ${a.email}  /  ${a.password}`);
  }

  await db.doc(`${COL.riders}/seed-rider`).set(
    {
      uid: 'seed-rider',
      name: 'A. Dhanush',
      phone: '+919876500004',
      isOnline: true,
      activeOrderId: null,
    },
    { merge: true },
  );
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

async function seedStores() {
  console.log('\nStores');
  const batch = db.batch();
  for (const s of SEED_STORES) {
    batch.set(
      db.doc(`${COL.stores}/${s.id}`),
      {
        ...s,
        ownerUid: s.id === 'meenakshi-medicals' ? 'seed-vendor' : null,
        isOpen: true,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    log(s.name);
  }
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

let codeCursor = 1042;
const nextCode = () => codeCursor++;

function item(
  name: string,
  unit: string,
  rupees: number | null,
  confidence = 0.95,
  quantity = 1,
): OrderItem {
  return {
    id: `itm_${Math.random().toString(36).slice(2, 10)}`,
    name,
    unit,
    quantity,
    unitPricePaise: rupees === null ? null : toPaise(rupees),
    confidence,
    included: confidence >= 0.6,
  };
}

function buildOrder(partial: {
  code: number;
  category: Order['category'];
  status: Order['status'];
  storeId: string;
  localityId: string;
  items: OrderItem[];
  paymentMode: Order['paymentMode'];
  paymentStatus?: Order['paymentStatus'];
  riderUid?: string | null;
  minutesAgo: number;
  sourceKind: Order['source']['kind'];
  transcript?: string;
}): Order {
  const store = SEED_STORES.find((s) => s.id === partial.storeId)!;
  const km = routeKm(store.localityId, partial.localityId);
  const delivery = suggestDeliveryPaise(km);
  const pricing = computePricing({ items: partial.items, deliveryPaise: delivery });
  const at = Date.now() - partial.minutesAgo * 60_000;

  return {
    id: `seed-${partial.code}`,
    code: partial.code,
    customerUid: 'seed-customer',
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: partial.localityId,
    addressLine: '14/2, 2nd Main Road',
    category: partial.category,
    status: partial.status,
    items: partial.items,
    storeId: store.id,
    storeName: store.name,
    riderUid: partial.riderUid ?? null,
    riderName: partial.riderUid ? 'A. Dhanush' : null,
    pricing,
    paymentMode: partial.paymentMode,
    paymentStatus: partial.paymentStatus ?? 'unpaid',
    source: {
      kind: partial.sourceKind,
      ...(partial.transcript ? { transcript: partial.transcript } : {}),
    },
    ai: {
      model: 'gemini-2.5-flash',
      latencyMs: 1400,
      raw: '{"seeded":true}',
      minConfidence: Math.min(...partial.items.map((i) => i.confidence), 1),
      parsedAt: at,
    },
    deliveryOtp: newOtp(),
    timeline: [{ status: 'incoming', at, by: 'system' }],
    createdAt: at,
    updatedAt: at,
  };
}

const ORDERS: Order[] = [
  buildOrder({
    code: nextCode(),
    category: 'pharmacy',
    status: 'incoming',
    storeId: 'meenakshi-medicals',
    localityId: 'kk-nagar',
    paymentMode: 'prepaid',
    minutesAgo: 2,
    sourceKind: 'photo',
    items: [
      item('Paracetamol 500mg', 'strip of 15', 22),
      item('Amoxicillin 500mg', '10 capsules', 96),
      item('Pantoprazole 40mg', 'strip of 10', 78),
      item('Cetirizine 10mg', 'strip of 10', 18),
      item('Ascoril LS syrup', '100 ml', 124, 0.42),
    ],
  }),
  buildOrder({
    code: nextCode(),
    category: 'grocery',
    status: 'incoming',
    storeId: 'amma-mini-mart',
    localityId: 'kk-nagar',
    paymentMode: 'cod',
    minutesAgo: 5,
    sourceKind: 'voice',
    transcript:
      'Anna, 5 kilo idli arisi, oru kilo thuvaram paruppu, sunflower oil, Aavin paal rendu, appuram konjam malligai poo',
    items: [
      item('Ponni boiled rice', '5 kg', 340, 0.72),
      item('Toor dal', '1 kg', 148),
      item('Sunflower oil', '1 L pouch', 142),
      item('Aavin milk', '500 ml', 26, 0.95, 2),
      item('Madurai malligai', '1 muzham', 40, 0.88),
    ],
  }),
  buildOrder({
    code: nextCode(),
    category: 'pharmacy',
    status: 'admin_review',
    storeId: 'meenakshi-medicals',
    localityId: 'goripalayam',
    paymentMode: 'prepaid',
    minutesAgo: 8,
    sourceKind: 'photo',
    items: [
      item('Metformin 500mg', 'strip of 15', 34),
      item('Telmisartan 40mg', 'strip of 10', 92),
      item('Atorvastatin 10mg', 'strip of 10', 78),
    ],
  }),
  buildOrder({
    code: nextCode(),
    category: 'food',
    status: 'admin_review',
    storeId: 'muniyandi-vilas',
    localityId: 'villapuram',
    paymentMode: 'cod',
    minutesAgo: 3,
    sourceKind: 'text',
    transcript: '6 parotta and 2 salna please',
    items: [item('Parotta', 'piece', null, 0.98, 6), item('Salna', 'cup', null, 0.98, 2)],
  }),
  buildOrder({
    code: nextCode(),
    category: 'pharmacy',
    status: 'awaiting_payment',
    storeId: 'vilakkuthoon-pharma',
    localityId: 'tallakulam',
    paymentMode: 'prepaid',
    paymentStatus: 'link_sent',
    minutesAgo: 18,
    sourceKind: 'photo',
    items: [item('Azithromycin 500mg', 'strip of 3', 68), item('ORS sachet', 'pack of 5', 26)],
  }),
  buildOrder({
    code: nextCode(),
    category: 'grocery',
    status: 'out_for_delivery',
    storeId: 'amma-mini-mart',
    localityId: 'thirunagar',
    paymentMode: 'cod',
    riderUid: 'seed-rider',
    minutesAgo: 34,
    sourceKind: 'voice',
    items: [
      item('Idli rice', '5 kg', 320),
      item('Groundnut oil', '1 L', 210),
      item('Sugar', '1 kg', 46),
      item('Aavin curd', '500 ml', 30),
    ],
  }),
];

async function seedOrders() {
  console.log('\nOrders');
  const batch = db.batch();
  for (const o of ORDERS) {
    batch.set(db.doc(`${COL.orders}/${o.id}`), o);
    log(`#${o.code}  ${o.category.padEnd(9)} ${o.status}`);
  }
  batch.set(db.doc(ORDER_CODE_COUNTER), { value: codeCursor }, { merge: true });
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Catalogue and stock
// ---------------------------------------------------------------------------

interface SeedProduct {
  storeId: string;
  name: string;
  nameTa?: string;
  category: Order['category'];
  unit: string;
  mrp: number;
  sell: number;
  qty: number;
  low?: number;
  rx?: boolean;
}

const SEED_PRODUCTS: SeedProduct[] = [
  { storeId: 'meenakshi-medicals', name: 'Paracetamol 500mg', nameTa: 'பாராசிட்டமால் 500mg', category: 'pharmacy', unit: 'strip of 15', mrp: 25, sell: 22, qty: 140, low: 30 },
  { storeId: 'meenakshi-medicals', name: 'Amoxicillin 500mg', category: 'pharmacy', unit: '10 capsules', mrp: 108, sell: 96, qty: 42, low: 15, rx: true },
  { storeId: 'meenakshi-medicals', name: 'Pantoprazole 40mg', category: 'pharmacy', unit: 'strip of 10', mrp: 88, sell: 78, qty: 8, low: 15, rx: true },
  { storeId: 'meenakshi-medicals', name: 'Cetirizine 10mg', category: 'pharmacy', unit: 'strip of 10', mrp: 21, sell: 18, qty: 96, low: 25 },
  { storeId: 'meenakshi-medicals', name: 'Ascoril LS syrup', category: 'pharmacy', unit: '100 ml', mrp: 138, sell: 124, qty: 0, low: 10, rx: true },
  { storeId: 'meenakshi-medicals', name: 'ORS sachet', category: 'pharmacy', unit: 'pack of 5', mrp: 30, sell: 26, qty: 64, low: 20 },
  { storeId: 'vilakkuthoon-pharma', name: 'Metformin 500mg', category: 'pharmacy', unit: 'strip of 15', mrp: 38, sell: 34, qty: 55, low: 20, rx: true },
  { storeId: 'vilakkuthoon-pharma', name: 'Telmisartan 40mg', category: 'pharmacy', unit: 'strip of 10', mrp: 104, sell: 92, qty: 3, low: 12, rx: true },

  { storeId: 'amma-mini-mart', name: 'Ponni boiled rice', nameTa: 'பொன்னி புழுங்கல் அரிசி', category: 'grocery', unit: '5 kg', mrp: 375, sell: 340, qty: 26, low: 8 },
  { storeId: 'amma-mini-mart', name: 'Idli rice', nameTa: 'இட்லி அரிசி', category: 'grocery', unit: '5 kg', mrp: 350, sell: 320, qty: 0, low: 8 },
  { storeId: 'amma-mini-mart', name: 'Toor dal', nameTa: 'துவரம் பருப்பு', category: 'grocery', unit: '1 kg', mrp: 165, sell: 148, qty: 34, low: 10 },
  { storeId: 'amma-mini-mart', name: 'Sunflower oil', category: 'grocery', unit: '1 L pouch', mrp: 155, sell: 142, qty: 48, low: 12 },
  { storeId: 'amma-mini-mart', name: 'Aavin milk', nameTa: 'ஆவின் பால்', category: 'grocery', unit: '500 ml', mrp: 28, sell: 26, qty: 5, low: 20 },
  { storeId: 'amma-mini-mart', name: 'Aavin curd', category: 'grocery', unit: '500 ml', mrp: 33, sell: 30, qty: 18, low: 15 },
  { storeId: 'amma-mini-mart', name: 'Sugar', category: 'grocery', unit: '1 kg', mrp: 50, sell: 46, qty: 62, low: 15 },
  { storeId: 'sri-balaji-stores', name: 'Groundnut oil', category: 'grocery', unit: '1 L', mrp: 230, sell: 210, qty: 21, low: 8 },
  { storeId: 'simmakkal-flowers', name: 'Madurai malligai', nameTa: 'மதுரை மல்லிகை', category: 'grocery', unit: '1 muzham', mrp: 45, sell: 40, qty: 30, low: 10 },

  { storeId: 'muniyandi-vilas', name: 'Parotta', nameTa: 'பரோட்டா', category: 'food', unit: 'piece', mrp: 18, sell: 16, qty: 200, low: 40 },
  { storeId: 'muniyandi-vilas', name: 'Salna', nameTa: 'சால்னா', category: 'food', unit: 'cup', mrp: 30, sell: 28, qty: 80, low: 20 },
  { storeId: 'konar-kadai', name: 'Kari dosai', category: 'food', unit: 'plate', mrp: 120, sell: 110, qty: 40, low: 10 },
];

async function seedProducts() {
  console.log('\nProducts');
  const batch = db.batch();
  for (const sp of SEED_PRODUCTS) {
    const id = `${sp.storeId}__${sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const product: Product = {
      id,
      storeId: sp.storeId,
      name: sp.name,
      ...(sp.nameTa ? { nameTa: sp.nameTa } : {}),
      category: sp.category,
      unit: sp.unit,
      mrpPaise: toPaise(sp.mrp),
      sellPaise: toPaise(sp.sell),
      stockQty: sp.qty,
      lowStockAt: sp.low ?? 10,
      ...(sp.rx ? { prescriptionOnly: true } : {}),
      isActive: true,
      updatedAt: Date.now(),
    };
    batch.set(db.doc(`${COL.products}/${id}`), product, { merge: true });
  }
  await batch.commit();
  log(
    `${SEED_PRODUCTS.length} products across ${new Set(SEED_PRODUCTS.map((p) => p.storeId)).size} stores`,
  );
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

async function seedPromotions() {
  console.log('\nPromotions');
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const promos: Promotion[] = [
    {
      ...blankPromotion('promo-villapuram-evening', 'seed-admin'),
      kind: 'banner',
      status: 'scheduled',
      creative: {
        headline: 'Free delivery in Villapuram tonight',
        headlineTa: 'இன்று இரவு இலவச டெலிவரி',
        sub: 'On grocery orders over ₹200, until 10 PM.',
        accent: 'grocery',
        ctaLabel: 'Order now',
      },
      discountKind: 'free_delivery',
      discountValue: 0,
      maxDiscountPaise: toPaise(60),
      minOrderPaise: toPaise(200),
      categories: ['grocery'],
      localityIds: ['villapuram'],
      startsAt: now - 2 * 60 * 60 * 1000,
      endsAt: now + day,
      budgetPaise: toPaise(5000),
      spentPaise: toPaise(1840),
      impressions: 2410,
      clicks: 386,
      redemptions: 61,
      revenuePaise: toPaise(28640),
    },
    {
      ...blankPromotion('promo-first-rx', 'seed-admin'),
      kind: 'coupon',
      status: 'scheduled',
      creative: {
        headline: '₹50 off your first prescription',
        headlineTa: 'முதல் மருந்து ஆர்டருக்கு ₹50 தள்ளுபடி',
        sub: 'Snap the prescription, we read it and deliver.',
        accent: 'pharmacy',
        ctaLabel: 'Use MADURAI50',
      },
      couponCode: 'MADURAI50',
      discountKind: 'flat',
      discountValue: toPaise(50),
      maxDiscountPaise: toPaise(50),
      minOrderPaise: toPaise(150),
      categories: ['pharmacy'],
      localityIds: [],
      startsAt: now - 5 * day,
      endsAt: now + 25 * day,
      budgetPaise: toPaise(20000),
      spentPaise: toPaise(9350),
      impressions: 8930,
      clicks: 1204,
      redemptions: 187,
      revenuePaise: toPaise(74800),
    },
    {
      ...blankPromotion('promo-parotta-hour', 'seed-admin'),
      kind: 'banner',
      status: 'draft',
      creative: {
        headline: 'Parotta hour · 7 to 9 PM',
        headlineTa: 'பரோட்டா நேரம்',
        sub: '15% off Muniyandi Vilas and Konar Kadai.',
        accent: 'food',
        ctaLabel: 'See the menu',
      },
      discountKind: 'percent',
      discountValue: 15,
      maxDiscountPaise: toPaise(80),
      minOrderPaise: toPaise(120),
      categories: ['food'],
      localityIds: ['villapuram', 'goripalayam', 'simmakkal'],
      startsAt: now + day,
      endsAt: now + 8 * day,
      budgetPaise: toPaise(8000),
    },
  ];

  const batch = db.batch();
  for (const p of promos) {
    batch.set(db.doc(`${COL.promotions}/${p.id}`), p, { merge: true });
    log(p.creative.headline);
  }
  await batch.commit();
}

// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding project via ${KEY_PATH}`);
  await seedAccounts();
  await seedStores();
  await seedProducts();
  await seedPromotions();
  await seedOrders();
  console.log(`\nDone. Order codes continue from ${codeCursor}.\n`);
  console.log('Sign in to the admin board with admin@dfc.test / dfc-admin-2026\n');
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exitCode = 1;
});

void FieldValue; // kept for future incremental updates
