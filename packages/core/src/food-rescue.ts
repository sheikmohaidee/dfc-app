/**
 * "Food Rescue" / Canceled Order Instant Bidding Radar.
 *
 * When an order is canceled after food preparation, it is instantly
 * broadcasted to nearby customers within a 3km radius at a 50%–70% discount.
 * Includes a strict 15-minute expiration clock to ensure food stays piping hot.
 */

import type { Order, OrderItem } from './types';

export interface FoodRescueListing {
  id: string;
  originalOrderId: string;
  storeId: string;
  storeName: string;
  localityId: string;
  items: OrderItem[];
  originalSubtotalPaise: number;
  rescuePricePaise: number;
  discountPercentage: number; // e.g. 60 (60% off)
  createdAt: number;
  expiresAt: number; // Exactly createdAt + 15 minutes
  status: 'active' | 'claimed' | 'expired';
  claimedByUid?: string;
  claimedByName?: string;
  claimedOrderId?: string;
}

export const FOOD_RESCUE_WINDOW_MS = 15 * 60 * 1000; // 15 Minutes
export const DEFAULT_RESCUE_DISCOUNT_PERCENT = 60; // 60% OFF

/**
 * Creates a Food Rescue listing from a canceled prepared order.
 */
export function createFoodRescueListing(
  order: Order,
  discountPercentage = DEFAULT_RESCUE_DISCOUNT_PERCENT,
  now = Date.now(),
): FoodRescueListing {
  const originalSubtotal = order.pricing.itemsPaise;
  const discountMultiplier = (100 - discountPercentage) / 100;
  // Round to nearest rupee (100 paise)
  const rescuePricePaise = Math.max(
    1000, // minimum ₹10
    Math.round((originalSubtotal * discountMultiplier) / 100) * 100,
  );

  return {
    id: `rescue_${order.id}_${now}`,
    originalOrderId: order.id,
    storeId: order.storeId ?? 'unknown-store',
    storeName: order.storeName ?? 'Local Kitchen',
    localityId: order.localityId,
    items: order.items.filter((i) => i.included),
    originalSubtotalPaise: originalSubtotal,
    rescuePricePaise,
    discountPercentage,
    createdAt: now,
    expiresAt: now + FOOD_RESCUE_WINDOW_MS,
    status: 'active',
  };
}

/**
 * Checks remaining milliseconds before a food rescue deal expires.
 */
export function getRescueRemainingMs(listing: FoodRescueListing, now = Date.now()): number {
  if (listing.status !== 'active') return 0;
  return Math.max(0, listing.expiresAt - now);
}

/**
 * Checks if a food rescue listing is still valid for claiming.
 */
export function isRescueClaimable(listing: FoodRescueListing, now = Date.now()): boolean {
  return listing.status === 'active' && listing.expiresAt > now;
}

/**
 * Marks a food rescue listing as claimed by a buyer.
 */
export function claimFoodRescueListing(
  listing: FoodRescueListing,
  claimedByUid: string,
  claimedByName: string,
  claimedOrderId: string,
  now = Date.now(),
): FoodRescueListing {
  if (!isRescueClaimable(listing, now)) {
    throw new Error('Food rescue deal has expired or was already claimed');
  }

  return {
    ...listing,
    status: 'claimed',
    claimedByUid,
    claimedByName,
    claimedOrderId,
  };
}
