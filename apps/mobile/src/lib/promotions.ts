/**
 * Live Promotions & Coupon Validation for DFC Mobile
 *
 * Connects to Firestore `promotions` collection with fallback for demo mode.
 */

import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  COL,
  formatInr,
  type Category,
  type Promotion,
} from '@dfc/core';

import { db, isConfigured } from './firebase';
import { DEMO_MODE } from '@/demo/config';

export interface CouponValidationResult {
  success: boolean;
  message: string;
  discountPaise: number;
  promo?: Promotion;
}

/**
 * Validate and apply a coupon code against live Firestore promotions.
 */
export async function validateAndApplyCoupon(
  code: string,
  subtotalPaise: number,
  category?: Category,
): Promise<CouponValidationResult> {
  const clean = code.trim().toUpperCase();
  if (!clean) {
    return { success: false, message: 'Please enter a coupon code.', discountPaise: 0 };
  }

  // Live Firestore check
  if (!DEMO_MODE && isConfigured) {
    try {
      const q = query(
        collection(db(), COL.promotions),
        where('couponCode', '==', clean),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const promoDoc = snap.docs[0]!;
        const promo = { ...(promoDoc.data() as Promotion), id: promoDoc.id };

        // Check if promo is active
        if (promo.status !== 'live' && promo.status !== 'scheduled') {
          return { success: false, message: 'This coupon is no longer active.', discountPaise: 0 };
        }

        // Check min order value
        if (promo.minOrderPaise && subtotalPaise < promo.minOrderPaise) {
          return {
            success: false,
            message: `Add items worth ${formatInr(promo.minOrderPaise)} or more to apply this coupon.`,
            discountPaise: 0,
          };
        }

        // Calculate discount
        let discount = 0;
        if (promo.discountKind === 'flat') {
          discount = promo.discountValue;
        } else if (promo.discountKind === 'percent') {
          discount = Math.round((subtotalPaise * promo.discountValue) / 100);
        } else if (promo.discountKind === 'free_delivery') {
          discount = 2500;
        }

        if (promo.maxDiscountPaise > 0) {
          discount = Math.min(discount, promo.maxDiscountPaise);
        }

        return {
          success: true,
          message: `Coupon ${clean} applied! Savings: ${formatInr(discount)}`,
          discountPaise: discount,
          promo,
        };
      }
    } catch (err) {
      console.warn('Live coupon check error, checking fallbacks:', err);
    }
  }

  // Fallback / Built-in codes
  if (clean === 'DFC50' || clean === 'MADURAI50') {
    if (subtotalPaise < 15000) {
      return { success: false, message: 'Add items worth ₹150 or more to apply this code.', discountPaise: 0 };
    }
    return { success: true, message: `Coupon ${clean} applied! Flat ₹50 off.`, discountPaise: 5000 };
  }

  if (clean === 'FIRSTORDER') {
    return { success: true, message: 'Coupon FIRSTORDER applied! Free delivery.', discountPaise: 2500 };
  }

  return { success: false, message: 'Invalid coupon code. Try MADURAI50 or FIRSTORDER.', discountPaise: 0 };
}

/**
 * Subscribe to active customer promotions.
 */
export function subscribeActivePromotions(
  onData: (promos: Promotion[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    onData([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db(), COL.promotions),
      where('status', 'in', ['live', 'scheduled']),
    );
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...(d.data() as Promotion), id: d.id })));
      },
      (err) => {
        onError?.(err);
        onData([]);
      },
    );
  } catch {
    onData([]);
    return () => {};
  }
}
