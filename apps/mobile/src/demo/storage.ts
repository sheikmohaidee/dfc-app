/**
 * Demo Local Storage Engine
 *
 * Persists demo state in AsyncStorage with in-memory caching for instant synchronous reads.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, UserProfile } from '@dfc/core';
import { DEMO_CONFIG } from './config';
import { SEED_DEMO_ORDERS } from './data/seed-orders';
import { SEED_NOTIFICATIONS } from './data/notifications';
import type { CartState, DemoNotification, SavedAddress } from './types';

const KEYS = {
  USER: 'dfc.demo.user',
  LOCALITY: 'dfc.demo.locality',
  ORDERS: 'dfc.demo.orders',
  CART: 'dfc.demo.cart',
  CARTS: 'dfc.demo.carts_v2',
  ADDRESSES: 'dfc.demo.addresses',
  NOTIFICATIONS: 'dfc.demo.notifications',
  SEEDED: 'dfc.demo.seeded_v1',
};

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-home',
    label: 'Home',
    title: 'Sri Meenakshi Enclave',
    street: 'Flat 3B, 80 Feet Road, Anna Nagar',
    landmark: 'Opposite Ambika Theatre',
    localityId: 'anna-nagar',
    pincode: '625020',
    phone: '+919876543210',
    isDefault: true,
  },
  {
    id: 'addr-work',
    label: 'Work',
    title: 'Madurai IT Park',
    street: 'Plot 12, Ring Road, Mattuthavani',
    landmark: 'Near Bus Stand',
    localityId: 'mattuthavani',
    pincode: '625007',
    phone: '+919876543210',
    isDefault: false,
  },
  {
    id: 'addr-parents',
    label: 'Other',
    title: 'Parents House',
    street: 'No 45, West Tower Street, Simmakkal',
    landmark: 'Near Perumal Koil',
    localityId: 'simmakkal',
    pincode: '625001',
    phone: '+919876500002',
    isDefault: false,
  },
];

const DEFAULT_CART: CartState = {
  items: [],
  appliedCoupon: null,
  couponDiscountPaise: 0,
  deliveryAddressId: 'addr-home',
  paymentMethod: 'upi_intent',
};

/**
 * One cart per service so a customer can build a new order while existing
 * orders continue independently. Keyed by Category; 'pharmacy' is legacy.
 */
export const CART_SERVICES = ['food', 'grocery', 'print', 'concierge', 'pickup_drop', 'buy_deliver'] as const;
export type CartService = (typeof CART_SERVICES)[number];

const emptyCarts = (): Record<string, CartState> =>
  Object.fromEntries(CART_SERVICES.map((s) => [s, { ...DEFAULT_CART }]));

// In-memory cache for speed
let memUser: UserProfile | null = null;
let memLocalityId: string = DEMO_CONFIG.defaultLocalityId;
let memOrders: Order[] = [...SEED_DEMO_ORDERS];
let memCarts: Record<string, CartState> = emptyCarts();
let memAddresses: SavedAddress[] = [...DEFAULT_ADDRESSES];
let memNotifications: DemoNotification[] = [...SEED_NOTIFICATIONS];

const listeners: Array<() => void> = [];
const notify = () => listeners.forEach((fn) => fn());

export const demoStorage = {
  subscribe(fn: () => void): () => void {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  async init(): Promise<void> {
    try {
      const [u, loc, ord, cartsRaw, legacyCart, addr, notif] = await Promise.all([
        AsyncStorage.getItem(KEYS.USER),
        AsyncStorage.getItem(KEYS.LOCALITY),
        AsyncStorage.getItem(KEYS.ORDERS),
        AsyncStorage.getItem(KEYS.CARTS),
        AsyncStorage.getItem(KEYS.CART),
        AsyncStorage.getItem(KEYS.ADDRESSES),
        AsyncStorage.getItem(KEYS.NOTIFICATIONS),
      ]);

      if (u) memUser = JSON.parse(u);
      else memUser = null;

      if (loc) memLocalityId = loc;
      if (ord) memOrders = JSON.parse(ord);
      if (cartsRaw) {
        memCarts = { ...emptyCarts(), ...JSON.parse(cartsRaw) };
      } else if (legacyCart) {
        // Migrate the pre-multi-order single cart into the food slot.
        const legacy = JSON.parse(legacyCart);
        if (legacy && Array.isArray(legacy.items)) {
          memCarts = { ...emptyCarts(), food: legacy };
        }
      }
      if (addr) memAddresses = JSON.parse(addr);
      if (notif) memNotifications = JSON.parse(notif);
      notify();
    } catch {
      // Memory fallback is active
    }
  },

  // User Profile
  getUser(): UserProfile | null {
    return memUser;
  },
  async setUser(u: UserProfile | null): Promise<void> {
    memUser = u;
    if (u) await AsyncStorage.setItem(KEYS.USER, JSON.stringify(u)).catch(() => {});
    else await AsyncStorage.removeItem(KEYS.USER).catch(() => {});
    notify();
  },

  // Locality
  getLocalityId(): string {
    return memLocalityId;
  },
  async setLocalityId(id: string): Promise<void> {
    memLocalityId = id;
    await AsyncStorage.setItem(KEYS.LOCALITY, id).catch(() => {});
    if (memUser) {
      memUser = { ...memUser, localityId: id };
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(memUser)).catch(() => {});
    }
    notify();
  },

  // Orders
  getOrders(): Order[] {
    return memOrders;
  },
  getOrderById(id: string): Order | null {
    return memOrders.find((o) => o.id === id) ?? null;
  },
  async saveOrder(order: Order): Promise<void> {
    const existingIdx = memOrders.findIndex((o) => o.id === order.id);
    if (existingIdx >= 0) {
      memOrders[existingIdx] = order;
    } else {
      memOrders = [order, ...memOrders];
    }
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(memOrders)).catch(() => {});
    notify();
  },

  // Carts — one per service
  getCarts(): Record<string, CartState> {
    return memCarts;
  },
  getCart(service: string = 'food'): CartState {
    return memCarts[service] ?? { ...DEFAULT_CART };
  },
  async saveCartFor(service: string, cart: CartState): Promise<void> {
    memCarts = { ...memCarts, [service]: cart };
    await AsyncStorage.setItem(KEYS.CARTS, JSON.stringify(memCarts)).catch(() => {});
    notify();
  },

  // Addresses
  getAddresses(): SavedAddress[] {
    return memAddresses;
  },
  async saveAddresses(addrs: SavedAddress[]): Promise<void> {
    memAddresses = addrs;
    await AsyncStorage.setItem(KEYS.ADDRESSES, JSON.stringify(addrs)).catch(() => {});
    notify();
  },

  // Notifications
  getNotifications(): DemoNotification[] {
    return memNotifications;
  },
  async saveNotifications(notifs: DemoNotification[]): Promise<void> {
    memNotifications = notifs;
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs)).catch(() => {});
    notify();
  },

  // Reset Everything to Pristine Baseline
  async resetDemoData(): Promise<void> {
    memUser = { ...DEMO_CONFIG.defaultCustomer, createdAt: Date.now(), updatedAt: Date.now() };
    memLocalityId = DEMO_CONFIG.defaultLocalityId;
    memOrders = [...SEED_DEMO_ORDERS];
    memCarts = emptyCarts();
    memAddresses = [...DEFAULT_ADDRESSES];
    memNotifications = [...SEED_NOTIFICATIONS];

    await Promise.all([
      AsyncStorage.setItem(KEYS.USER, JSON.stringify(memUser)),
      AsyncStorage.setItem(KEYS.LOCALITY, memLocalityId),
      AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(memOrders)),
      AsyncStorage.setItem(KEYS.CARTS, JSON.stringify(memCarts)),
      AsyncStorage.setItem(KEYS.ADDRESSES, JSON.stringify(memAddresses)),
      AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(memNotifications)),
    ]).catch(() => {});
    notify();
  },
};

// Auto-initialize memory state
void demoStorage.init();
