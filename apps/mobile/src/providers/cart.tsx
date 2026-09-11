/**
 * Global Cart Provider for DFC Mobile
 *
 * The customer can run several orders at once, so carts are scoped per service
 * (food, grocery, print, genie, pickup & drop, buy & deliver). `useCart()`
 * binds every read and mutation to one service; existing orders, their
 * Captains and tracking are untouched while a new order is being built.
 */

import * as React from 'react';
import type { Category } from '@dfc/core';
import { mockCartRepository } from '@/demo/repositories/cart.repository';
import type { AddItemResult } from '@/demo/repositories/cart.repository';
import { CART_SERVICES, demoStorage } from '@/demo/storage';
import type { CartItem, CartState } from '@/demo/types';

export type { AddItemResult };

interface CartContextValue {
  cart: CartState;
  /** The service this cart belongs to. */
  service: Category;
  itemCount: number;
  subtotalPaise: number;
  totalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  addItem: (item: CartItem) => Promise<AddItemResult>;
  updateQuantity: (itemId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  setDeliveryAddress: (addressId: string) => Promise<void>;
}

const AllCartsContext = React.createContext<{ carts: Record<string, CartState> } | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = React.useState<Record<string, CartState>>(() => demoStorage.getCarts());

  React.useEffect(() => {
    return demoStorage.subscribe(() => {
      setCarts({ ...demoStorage.getCarts() });
    });
  }, []);

  return <AllCartsContext.Provider value={{ carts }}>{children}</AllCartsContext.Provider>;
}

/** Cart + operations bound to one service. */
export function useCart(service: Category = 'food'): CartContextValue {
  const ctx = React.useContext(AllCartsContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');

  const cart = ctx.carts[service] ?? demoStorage.getCart(service);
  const bill = React.useMemo(() => mockCartRepository.calculateBill(cart), [cart]);

  return React.useMemo(
    () => ({
      cart,
      service,
      itemCount: bill.itemCount,
      subtotalPaise: bill.itemsSubtotalPaise,
      totalPaise: bill.totalPaise,
      deliveryFeePaise: bill.deliveryFeePaise,
      platformFeePaise: bill.platformFeePaise,
      taxPaise: bill.taxPaise,
      discountPaise: bill.discountPaise,
      addItem: async (item) => {
        return mockCartRepository.addItem(item);
      },
      updateQuantity: async (itemId, delta) => {
        await mockCartRepository.updateQuantity(service, itemId, delta);
      },
      removeItem: async (itemId) => {
        await mockCartRepository.removeItem(service, itemId);
      },
      clearCart: async () => {
        await mockCartRepository.clearCart(service);
      },
      applyCoupon: async (code) => {
        return mockCartRepository.applyCoupon(service, code);
      },
      removeCoupon: async () => {
        await mockCartRepository.removeCoupon(service);
      },
      setDeliveryAddress: async (addressId) => {
        await mockCartRepository.setDeliveryAddress(service, addressId);
      },
    }),
    [cart, service, bill],
  );
}

export interface CartsSummary {
  /** Total items across every service cart. */
  itemCount: number;
  totalPaise: number;
  /** First service (in fixed order) whose cart has items, for shared surfaces. */
  serviceWithItems: Category | null;
}

/** Cross-service rollup used by shared surfaces like the home cart indicator. */
export function useCartsSummary(): CartsSummary {
  const ctx = React.useContext(AllCartsContext);
  if (!ctx) throw new Error('useCartsSummary must be used within <CartProvider>');

  return React.useMemo(() => {
    let itemCount = 0;
    let totalPaise = 0;
    let serviceWithItems: Category | null = null;
    for (const s of CART_SERVICES) {
      const c = ctx.carts[s];
      if (!c || c.items.length === 0) continue;
      itemCount += c.items.reduce((n, i) => n + i.quantity, 0);
      totalPaise += mockCartRepository.calculateBill(c).totalPaise;
      if (!serviceWithItems) serviceWithItems = s as Category;
    }
    return { itemCount, totalPaise, serviceWithItems };
  }, [ctx.carts]);
}

export function useAllCarts(): Record<string, CartState> {
  const ctx = React.useContext(AllCartsContext);
  if (!ctx) throw new Error('useAllCarts must be used within <CartProvider>');
  return ctx.carts;
}
