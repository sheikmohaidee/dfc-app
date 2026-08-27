/**
 * The things a client must not be trusted to do.
 *
 *   setUserRole    writes the custom claim every security rule reads. If a
 *                  client could set this, every rule in the project is
 *                  decorative.
 *   redeemPromotion increments spend, redemptions and revenue atomically. A
 *                  client-side counter is a client-editable ROAS.
 *   repriceOrder   replaces the model's guessed prices with catalogue prices,
 *                  and flags anything the catalogue does not carry.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

import {
  COL,
  discountFor,
  matchProduct,
  type Order,
  type Product,
  type Promotion,
  type Role,
} from '@dfc/core';

const REGION = 'asia-south1';

const ROLES: Role[] = ['customer', 'vendor', 'rider', 'admin'];

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** The subset of the Auth SDK this needs — injectable so tests can drive it. */
export interface ClaimWriter {
  setCustomUserClaims(uid: string, claims: object | null): Promise<void>;
}

/**
 * Grants a role.
 *
 * This is the most powerful function in the project. The custom claim it
 * writes is what every single security rule reads: if a caller could reach
 * this, every rule in `firestore.rules` and `storage.rules` becomes
 * decorative. So the caller check is the first thing that happens and it
 * checks the *token claim*, not a Firestore document — a profile doc a user
 * can write is not an authorisation source.
 */
export async function setUserRoleLogic(
  auth: ClaimWriter,
  db: Firestore,
  caller: { uid: string; role?: unknown },
  input: { uid?: unknown; role?: unknown; storeId?: unknown },
): Promise<{ ok: true; note: string }> {
  // Bootstrapping problem: the first admin cannot be granted by an admin.
  // Do that one by hand with the Admin SDK, then this function covers the rest.
  if (caller.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only an admin can change roles.');
  }

  const { uid, role, storeId } = input as { uid?: string; role?: Role; storeId?: string };

  if (!uid || typeof uid !== 'string' || !role || !ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'uid and a valid role are required.');
  }
  if (role === 'vendor' && !storeId) {
    throw new HttpsError('invalid-argument', 'A vendor account needs a storeId.');
  }
  // A storeId on a non-vendor is meaningless and would sit in the token
  // forever; refuse it rather than silently dropping it, so a miswired admin
  // call is visible instead of quietly half-applied.
  if (role !== 'vendor' && storeId) {
    throw new HttpsError('invalid-argument', 'Only a vendor account carries a storeId.');
  }

  // The claim is what the rules read; the profile is what the UI reads. Both,
  // or they drift. The claim goes first: if the profile write fails, the
  // person has the access their claim says and the UI catches up, which is
  // recoverable. The other order grants a role the rules do not honour.
  await auth.setCustomUserClaims(uid, { role, ...(storeId ? { storeId } : {}) });
  await db
    .doc(`${COL.users}/${uid}`)
    .set({ role, ...(storeId ? { storeId } : {}), updatedAt: Date.now() }, { merge: true });

  logger.info('role changed', { uid, role, by: caller.uid });

  // The claim only reaches the client on its next token refresh, so the app
  // has to force one. Told here rather than assumed.
  return { ok: true, note: 'The user must refresh their ID token for this to take effect.' };
}

export const setUserRole = onCall({ region: REGION, cors: false }, async (request) =>
  setUserRoleLogic(
    getAuth(),
    getFirestore(),
    { uid: request.auth?.uid ?? '', role: request.auth?.token.role },
    (request.data ?? {}) as Record<string, unknown>,
  ),
);

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export interface RedeemResult {
  discountPaise: number;
  totalPaise: number;
  /** True when the order already carried this promotion and nothing changed. */
  alreadyApplied: boolean;
}

/**
 * Applies a promotion to an order, exactly once.
 *
 * Two separate races have to be lost here for this to be correct, and they are
 * not the same race:
 *
 *   Two calls for the SAME order. Retrying a tap, or a double tap, must not
 *   discount the basket twice. Guarded by `appliedPromotionId` — read inside
 *   the transaction, so a concurrent pair serialises and the loser sees the
 *   winner's write.
 *
 *   Two calls for DIFFERENT orders against one budget. The budget check and
 *   the increment must be atomic or a ₹5,000 campaign spends ₹8,000 on a busy
 *   evening. Guarded by reading the promo doc inside the transaction: that
 *   read puts the doc in the transaction's conflict set, so Firestore aborts
 *   and retries the loser against fresh data rather than blindly incrementing.
 *
 * The second is why the budget is checked against `promo.spentPaise` read in
 * the transaction rather than with a bare `FieldValue.increment`. An increment
 * alone is atomic but unconditional — it cannot refuse to overspend.
 */
export async function redeemPromotionLogic(
  db: Firestore,
  uid: string,
  promotionId: string,
  orderId: string,
): Promise<RedeemResult> {
  return db.runTransaction(async (tx) => {
    const [promoSnap, orderSnap] = await Promise.all([
      tx.get(db.doc(`${COL.promotions}/${promotionId}`)),
      tx.get(db.doc(`${COL.orders}/${orderId}`)),
    ]);

    if (!promoSnap.exists) throw new HttpsError('not-found', 'That offer no longer exists.');
    if (!orderSnap.exists) throw new HttpsError('not-found', 'That order does not exist.');

    const promo = promoSnap.data() as Promotion;
    const order = orderSnap.data() as Order;

    if (order.customerUid !== uid) {
      throw new HttpsError('permission-denied', 'That is not your order.');
    }

    // Already discounted. Return what the order carries rather than throwing:
    // the common cause is a retried call, and the caller's intent — this order
    // has this offer on it — is satisfied.
    if (order.appliedPromotionId) {
      if (order.appliedPromotionId !== promotionId) {
        throw new HttpsError('failed-precondition', 'Another offer is already on this order.');
      }
      return {
        discountPaise: order.pricing.discountPaise ?? 0,
        totalPaise: order.pricing.totalPaise,
        alreadyApplied: true,
      };
    }

    // Re-evaluated server-side against the server's copy of the basket. The
    // client's opinion of the discount is not consulted.
    const discountPaise = discountFor(promo, {
      category: order.category,
      localityId: order.localityId,
      itemsPaise: order.pricing.itemsPaise,
      deliveryPaise: order.pricing.deliveryPaise,
      couponCode: promo.couponCode,
    });

    if (discountPaise <= 0) {
      throw new HttpsError('failed-precondition', 'That offer does not apply to this order.');
    }
    if (promo.budgetPaise > 0 && promo.spentPaise + discountPaise > promo.budgetPaise) {
      throw new HttpsError('resource-exhausted', 'That offer has run out for today.');
    }

    tx.update(promoSnap.ref, {
      spentPaise: FieldValue.increment(discountPaise),
      redemptions: FieldValue.increment(1),
      revenuePaise: FieldValue.increment(order.pricing.totalPaise),
      updatedAt: Date.now(),
    });

    const nextTotal = Math.max(0, order.pricing.totalPaise - discountPaise);
    tx.update(orderSnap.ref, {
      'pricing.discountPaise': discountPaise,
      'pricing.totalPaise': nextTotal,
      appliedPromotionId: promotionId,
      updatedAt: Date.now(),
    });

    return { discountPaise, totalPaise: nextTotal, alreadyApplied: false };
  });
}

export const redeemPromotion = onCall({ region: REGION, cors: false }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const { promotionId, orderId } = (request.data ?? {}) as {
    promotionId?: string;
    orderId?: string;
  };
  if (!promotionId || !orderId) {
    throw new HttpsError('invalid-argument', 'promotionId and orderId are required.');
  }

  const { discountPaise, totalPaise } = await redeemPromotionLogic(
    getFirestore(),
    uid,
    promotionId,
    orderId,
  );

  return { discountPaise, totalPaise };
});

/** Impressions and clicks, batched from the client. Cheap and unauthenticated-safe. */
export const trackPromotion = onCall({ region: REGION, cors: false }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const { promotionId, event } = (request.data ?? {}) as {
    promotionId?: string;
    event?: 'impression' | 'click';
  };
  if (!promotionId || (event !== 'impression' && event !== 'click')) {
    throw new HttpsError('invalid-argument', 'promotionId and a valid event are required.');
  }

  await getFirestore()
    .doc(`${COL.promotions}/${promotionId}`)
    .set(
      {
        [event === 'impression' ? 'impressions' : 'clicks']: FieldValue.increment(1),
        updatedAt: Date.now(),
      },
      { merge: true },
    );

  return { ok: true };
});

// ---------------------------------------------------------------------------
// Auto-repricing
// ---------------------------------------------------------------------------

/**
 * The moment an order lands, try to replace the model's price *estimates* with
 * real catalogue prices.
 *
 * Deliberately conservative. `matchProduct` returns null on an ambiguous match
 * rather than guessing, and an unmatched item keeps its estimate and its
 * VERIFY chip — so the admin still sees exactly which lines a human has to
 * price. Being wrong here means dispensing the wrong medicine.
 */
export interface RepriceResult {
  /** How many of the order's items were matched to a catalogue product. */
  matched: number;
  of: number;
  /** False when nothing was written — no store, no catalogue, or no match. */
  repriced: boolean;
}

/**
 * Replaces a model's price *estimates* with catalogue prices, where it can.
 *
 * Split out of the trigger so it can be tested: this function silently changes
 * what a customer is charged, and "silently changes prices" is not something
 * to leave to a manual check. Returns what it did rather than nothing, so a
 * test can tell "matched nothing" apart from "did not run".
 */
export async function repriceOrderLogic(
  db: Firestore,
  orderId: string,
): Promise<RepriceResult> {
  const ref = db.doc(`${COL.orders}/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) return { matched: 0, of: 0, repriced: false };

  const order = snap.data() as Order;
  if (order.status !== 'incoming' || !order.storeId || order.items.length === 0) {
    return { matched: 0, of: order.items?.length ?? 0, repriced: false };
  }

  return repriceFrom(db, ref, order);
}

async function repriceFrom(
  db: Firestore,
  ref: FirebaseFirestore.DocumentReference,
  order: Order,
): Promise<RepriceResult> {
    const products = await db
      .collection(COL.products)
      .where('storeId', '==', order.storeId)
      .where('isActive', '==', true)
      .get();

    if (products.empty) return { matched: 0, of: order.items.length, repriced: false };
    const catalogue = products.docs.map((d) => ({ ...(d.data() as Product), id: d.id }));

    let matched = 0;
    const items = order.items.map((item) => {
      const product = matchProduct(catalogue, item.name, item.unit);
      if (!product) return item;

      matched += 1;

      // Out of stock is worth knowing before a human picks the order up.
      if (product.stockQty <= 0) {
        return {
          ...item,
          unitPricePaise: product.sellPaise,
          included: false,
          note: 'Out of stock at the store',
        };
      }

      return {
        ...item,
        name: product.name,
        ...(product.nameTa ? { nameTa: product.nameTa } : {}),
        unit: product.unit,
        unitPricePaise: product.sellPaise,
        // A catalogue hit is a fact, not a guess — but only promote confidence
        // for an item the model was already fairly sure of. A 0.3 reading that
        // happens to fuzzy-match a product name is still a 0.3 reading.
        confidence: item.confidence >= 0.6 ? 1 : item.confidence,
      };
    });

    if (matched === 0) return { matched: 0, of: order.items.length, repriced: false };

    const itemsPaise = items.reduce(
      (s, i) => (i.included && i.unitPricePaise !== null ? s + i.unitPricePaise * i.quantity : s),
      0,
    );

    await ref.set(
      {
        items,
        pricing: {
          ...order.pricing,
          itemsPaise,
          totalPaise: itemsPaise + order.pricing.deliveryPaise + order.pricing.servicePaise,
        },
        autoPricedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    logger.info('auto-repriced', { orderId: ref.id, matched, of: order.items.length });
    return { matched, of: order.items.length, repriced: true };
}

export const repriceOnCreate = onDocumentCreated(
  { region: REGION, document: `${COL.orders}/{orderId}` },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const order = snap.data() as Order;
    if (order.status !== 'incoming' || !order.storeId || order.items.length === 0) return;

    await repriceFrom(getFirestore(), snap.ref, order);
  },
);
