/**
 * Shared setup for the Cloud Functions tests.
 *
 * These run against the Firestore emulator with the Admin SDK, which means
 * security rules are bypassed — deliberately. Rules are already covered by
 * firebase/tests/rules.test.ts, 60 tests of what a *client* may write. This
 * suite covers the other half: what the server does once a request is past the
 * rules, where the only protection left is the code itself.
 *
 * Run with:
 *   npm run test:functions -w @dfc/firebase
 */

import { randomUUID } from 'node:crypto';

import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { COL, computePricing, type Order, type Promotion } from '@dfc/core';

export const PROJECT_ID = 'dfc-functions-test';

/** Test credentials. Real ones live in Secret Manager and are never in a repo. */
export const TEST_KEY_ID = 'rzp_test_key_id';
export const TEST_KEY_SECRET = 'rzp_test_key_secret';
export const TEST_WEBHOOK_SECRET = 'whsec_test_only_not_a_real_secret';

let app: App | null = null;

export function db(): Firestore {
  if (!app) {
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      throw new Error(
        'FIRESTORE_EMULATOR_HOST is not set. Run these through `firebase emulators:exec`, ' +
          'never against a real project — they write and delete freely.',
      );
    }
    process.env.GCLOUD_PROJECT ??= PROJECT_ID;
    app = initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore(app);
}

export async function shutdown(): Promise<void> {
  // Claim the handle before awaiting, not after. Writing `app = null` on the
  // far side of the await leaves a window where a second caller sees the old
  // handle and deletes it twice — benign in a serial test run, and exactly the
  // pattern that is not benign anywhere else.
  const current = app;
  if (!current) return;
  app = null;
  await deleteApp(current);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export const CUSTOMER_UID = 'u_karthikeyan';

/**
 * Writes a priced, unpaid order and returns its id.
 *
 * Defaults to ₹243 — the same basket the money tests use, so a number that
 * shows up in a failure is recognisable rather than arbitrary.
 */
export async function seedOrder(
  overrides: Partial<Order> = {},
): Promise<{ orderId: string; order: Order }> {
  const orderId = `o_${randomUUID().slice(0, 8)}`;
  const items = overrides.items ?? [
    {
      id: 'i1',
      name: 'Paracetamol 500mg',
      unit: 'strip of 15',
      quantity: 1,
      unitPricePaise: 21400,
      confidence: 1,
      included: true,
    },
  ];

  const order: Order = {
    id: orderId,
    code: 1000 + Math.floor(Math.random() * 8999),
    customerUid: CUSTOMER_UID,
    customerName: 'R. Karthikeyan',
    customerPhone: '+919876500002',
    localityId: 'kk-nagar',
    addressLine: '14/2, 2nd Main Road',
    category: 'pharmacy',
    status: 'awaiting_payment',
    items,
    storeId: 'meenakshi-medicals',
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
    ...overrides,
  };

  await db().doc(`${COL.orders}/${orderId}`).set(order);
  return { orderId, order };
}

/**
 * A live banner promo giving ₹20 off, with a ₹100 budget.
 *
 * The budget is deliberately an exact multiple of the discount: five
 * redemptions fit and the sixth must not. A budget that did not divide evenly
 * would let an off-by-one hide.
 */
export async function seedPromotion(overrides: Partial<Promotion> = {}): Promise<string> {
  const id = `p_${randomUUID().slice(0, 8)}`;
  const promo: Promotion = {
    id,
    kind: 'banner',
    status: 'live',
    creative: {
      headline: 'Flat ₹20 off medicines',
      headlineTa: 'மருந்துகளில் ₹20 தள்ளுபடி',
      sub: 'On pharmacy orders in K.K. Nagar',
      accent: 'pharmacy',
      ctaLabel: 'Use offer',
    },
    discountKind: 'flat',
    discountValue: 2000, // ₹20
    maxDiscountPaise: 0,
    minOrderPaise: 0,
    categories: ['pharmacy'],
    localityIds: [],
    startsAt: Date.now() - 60_000,
    endsAt: Date.now() + 86_400_000,
    budgetPaise: 10000, // ₹100 — exactly five redemptions, then it is out
    spentPaise: 0,
    impressions: 0,
    clicks: 0,
    redemptions: 0,
    revenuePaise: 0,
    createdBy: 'u_admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
  await db().doc(`${COL.promotions}/${id}`).set(promo);
  return id;
}

export async function getPromotion(id: string): Promise<Promotion> {
  const snap = await db().doc(`${COL.promotions}/${id}`).get();
  if (!snap.exists) throw new Error(`promotion ${id} vanished`);
  return snap.data() as Promotion;
}

export async function getOrder(orderId: string): Promise<Order> {
  const snap = await db().doc(`${COL.orders}/${orderId}`).get();
  if (!snap.exists) throw new Error(`order ${orderId} vanished`);
  return snap.data() as Order;
}

export async function getPayment(orderId: string): Promise<Record<string, unknown> | null> {
  const snap = await db().doc(`${COL.payments}/${orderId}_gateway`).get();
  return snap.exists ? (snap.data() as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// A fake Razorpay
// ---------------------------------------------------------------------------

export interface FakeRazorpay {
  /** Every request the code under test made. Length is the assertion. */
  calls: { url: string; body: unknown }[];
  fetch: typeof fetch;
}

/**
 * Stands in for api.razorpay.com.
 *
 * Counting calls is the entire point: idempotency is not "the same URL comes
 * back", it is "the second request never reached the payment provider". A stub
 * that returned a cached response would pass a weaker test and miss a real
 * double-billing bug.
 */
export function fakeRazorpay(opts: { failWith?: number } = {}): FakeRazorpay {
  const calls: { url: string; body: unknown }[] = [];
  let n = 0;

  const impl = (async (url: unknown, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ url: String(url), body });

    if (opts.failWith) {
      return {
        ok: false,
        status: opts.failWith,
        text: async () => 'razorpay said no',
        json: async () => ({}),
      };
    }

    n += 1;
    // A fresh id per call, so reusing a link and minting a new one are
    // distinguishable by the returned URL alone.
    const id = `plink_${n}`;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id }),
      json: async () => ({ id, short_url: `https://rzp.io/i/${id}` }),
    };
  }) as unknown as typeof fetch;

  return { calls, fetch: impl };
}

// ---------------------------------------------------------------------------
// Contention
// ---------------------------------------------------------------------------

/**
 * Is this error Firestore refusing to serialise, rather than a real failure?
 *
 * Several tests deliberately push many writers at one document to prove that
 * concurrency cannot corrupt a counter. Some of those writers lose, and the
 * losing shape is not stable — the emulator returns at least three different
 * messages depending on where in the transaction it gave up:
 *
 *   ABORTED: Too much contention on these documents
 *   ABORTED: Transaction lock timeout
 *   INVALID_ARGUMENT: Transaction is invalid or closed
 *
 * All three mean the same thing operationally: nothing was written and the
 * caller should retry. Keeping the list in one place stops each test growing
 * its own slightly different regex and then flaking when it meets a shape the
 * others already knew about.
 *
 * What must never be accepted here is a permission error, a not-found, or a
 * validation failure — those would mean the guard under test was not the thing
 * that stopped the caller.
 */
export function isContention(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /ABORTED|lock timeout|too much contention|transaction is invalid or closed|deadline exceeded|UNAVAILABLE/i.test(
    message,
  );
}

/** Asserts every rejection is contention or one of the given honest reasons. */
export function assertHonestRejections(
  errors: Error[],
  alsoAllow: RegExp = /$^/,
): void {
  for (const err of errors) {
    if (isContention(err) || alsoAllow.test(err.message)) continue;
    throw new Error(`unexpected refusal: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/** Wipes the emulator between suites so leftovers cannot make a test pass. */
export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const res = await fetch(
    `http://${host}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`emulator wipe failed: ${res.status}`);
}
