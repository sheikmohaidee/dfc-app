/**
 * Mock Cart Repository for Demo Mode
 *
 * One cart per service (food, grocery, print, genie, pickup & drop, buy &
 * deliver) so a customer can start a completely new order while their existing
 * orders continue independently. Food enforces the single-restaurant rule:
 * one Food order = one restaurant.
 */

import type { Category } from '@dfc/core';
import { DEMO_CONFIG } from '../config';
import { demoStorage } from '../storage';
import type { CartItem, CartState } from '../types';
import { routeKm } from '@dfc/core';

export type AddItemResult =
  | { ok: true }
  | { ok: false; reason: 'restaurant_conflict'; conflict: { sourceId: string; sourceName: string } };

/** The service a cart item belongs to. Defaults to food for legacy items. */
export const serviceOfItem = (item: Pick<CartItem, 'sourceCategory'>): Category =>
  (item.sourceCategory as Category) || 'food';

export const mockCartRepository = {
  getCart(service: Category = 'food'): CartState {
    return demoStorage.getCart(service);
  },

  async addItem(item: CartItem): Promise<AddItemResult> {
    const service = serviceOfItem(item);
    const current = demoStorage.getCart(service);

    // Single-restaurant rule: one Food order = one restaurant. Another
    // restaurant's items must go into a separate Food order instead.
    if (service === 'food' && current.items.length > 0) {
      const other = current.items.find((i) => i.sourceId !== item.sourceId);
      if (other) {
        return {
          ok: false,
          reason: 'restaurant_conflict',
          conflict: { sourceId: other.sourceId, sourceName: other.sourceName },
        };
      }
    }

    const existingIdx = current.items.findIndex(
      (i) => i.id === item.id && i.sourceId === item.sourceId,
    );

    let updatedItems: CartItem[];
    if (existingIdx >= 0) {
      updatedItems = [...current.items];
      updatedItems[existingIdx] = {
        ...updatedItems[existingIdx]!,
        quantity: updatedItems[existingIdx]!.quantity + (item.quantity || 1),
      };
    } else {
      updatedItems = [...current.items, { ...item, quantity: item.quantity || 1 }];
    }

    const updated: CartState = { ...current, items: updatedItems };
    await demoStorage.saveCartFor(service, updated);
    return { ok: true };
  },

  async updateQuantity(service: Category, itemId: string, delta: number): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const existingIdx = current.items.findIndex((i) => i.id === itemId);
    if (existingIdx < 0) return current;

    const newQty = current.items[existingIdx]!.quantity + delta;
    let updatedItems: CartItem[];

    if (newQty <= 0) {
      updatedItems = current.items.filter((i) => i.id !== itemId);
    } else {
      updatedItems = [...current.items];
      updatedItems[existingIdx] = { ...updatedItems[existingIdx]!, quantity: newQty };
    }

    const updated: CartState = { ...current, items: updatedItems };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  async removeItem(service: Category, itemId: string): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const updated: CartState = {
      ...current,
      items: current.items.filter((i) => i.id !== itemId),
    };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  async clearCart(service: Category = 'food'): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const updated: CartState = {
      ...current,
      items: [],
      appliedCoupon: null,
      couponDiscountPaise: 0,
    };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  async clear(service: Category = 'food'): Promise<CartState> {
    return this.clearCart(service);
  },

  async applyCoupon(
    service: Category,
    code: string,
  ): Promise<{ success: boolean; message: string; cart: CartState }> {
    const current = demoStorage.getCart(service);
    const clean = code.trim().toUpperCase();
    const subtotal = current.items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);

    if (clean === 'DFC50') {
      if (subtotal < 29900) {
        return { success: false, message: 'Add items worth ₹299 or more to apply DFC50', cart: current };
      }
      const updated: CartState = { ...current, appliedCoupon: 'DFC50', couponDiscountPaise: 5000 };
      await demoStorage.saveCartFor(service, updated);
      return { success: true, message: 'Coupon DFC50 applied! Flat ₹50 off.', cart: updated };
    }

    if (clean === 'FIRSTORDER') {
      const updated: CartState = { ...current, appliedCoupon: 'FIRSTORDER', couponDiscountPaise: 2500 };
      await demoStorage.saveCartFor(service, updated);
      return { success: true, message: 'Coupon FIRSTORDER applied! Free delivery.', cart: updated };
    }

    return { success: false, message: 'Invalid coupon code. Try DFC50 or FIRSTORDER.', cart: current };
  },

  async removeCoupon(service: Category): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const updated: CartState = { ...current, appliedCoupon: null, couponDiscountPaise: 0 };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  async setDeliveryAddress(service: Category, addressId: string): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const updated: CartState = { ...current, deliveryAddressId: addressId };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  async setPaymentMethod(service: Category, method: any): Promise<CartState> {
    const current = demoStorage.getCart(service);
    const updated: CartState = { ...current, paymentMethod: method };
    await demoStorage.saveCartFor(service, updated);
    return updated;
  },

  calculateBill(cart: CartState): {
    itemsSubtotalPaise: number;
    deliveryFeePaise: number;
    platformFeePaise: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
    itemCount: number;
  } {
    const itemsSubtotalPaise = cart.items.reduce((s, i) => s + i.pricePaise * i.quantity, 0);
    const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

    if (itemsSubtotalPaise === 0) {
      return {
        itemsSubtotalPaise: 0,
        deliveryFeePaise: 0,
        platformFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 0,
        itemCount: 0,
      };
    }

    const currentLocId = demoStorage.getLocalityId();
    const sourceLocId = cart.items[0]?.localityId || 'anna-nagar';
    const km = routeKm(sourceLocId, currentLocId);

    let deliveryFeePaise = DEMO_CONFIG.deliveryBasePaise + Math.round(km * 400);
    const platformFeePaise = DEMO_CONFIG.platformFeePaise;
    let discountPaise = cart.couponDiscountPaise;

    if (cart.appliedCoupon === 'FIRSTORDER') {
      discountPaise = deliveryFeePaise;
    }

    // 18% GST only on delivery fee + platform fee
    const feeSubjectToGst = Math.max(0, deliveryFeePaise + platformFeePaise - discountPaise);
    const taxPaise = Math.round(feeSubjectToGst * 0.18);

    const totalPaise = Math.max(0, itemsSubtotalPaise + deliveryFeePaise + platformFeePaise + taxPaise - discountPaise);

    return {
      itemsSubtotalPaise,
      deliveryFeePaise,
      platformFeePaise,
      taxPaise,
      discountPaise,
      totalPaise,
      itemCount,
    };
  },
};
