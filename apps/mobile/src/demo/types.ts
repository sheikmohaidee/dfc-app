/**
 * Demo Data Entities & Types
 */

import type {
  Captain,
  Category,
  Locality,
  Order,
  OrderCancellation,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from '@dfc/core';

export type { Captain, OrderCancellation };

export interface MenuItem {
  id: string;
  vendorId?: string;
  name: string;
  nameTa?: string;
  description?: string;
  price?: number; // In INR
  pricePaise: number; // In Paise
  category: string;
  isVeg: boolean;
  isPopular?: boolean;
  image?: string;
  isAvailable?: boolean; // Dynamic ON/OFF availability control, defaults to true
  createdAt?: number;
  updatedAt?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  nameTa?: string;
  localityId: string;
  localityName: string;
  cuisines: string[];
  rating: number;
  reviewCount: number;
  avgPrepMinutes: number;
  deliveryFeePaise: number;
  priceForTwoPaise: number;
  isPureVeg: boolean;
  isOpen: boolean;
  featuredDish: string;
  bannerGradient: [string, string];
  menu: MenuItem[];
}

export interface GroceryProduct {
  id: string;
  name: string;
  nameTa?: string;
  category: 'Dairy & Eggs' | 'Staples & Rice' | 'Oils & Ghee' | 'Flowers & Puja' | 'Snacks & Beverages' | 'Spices';
  unit: string;
  mrpPaise: number;
  sellPaise: number;
  storeId: string;
  storeName: string;
  inStock: boolean;
}

export interface GroceryStore {
  id: string;
  name: string;
  nameTa?: string;
  localityId: string;
  localityName: string;
  rating: number;
  deliveryMinutes: number;
  isOpen: boolean;
}

export interface PrintOptions {
  color: 'bw' | 'color';
  paperSize: 'A4' | 'A3';
  side: 'single' | 'double';
  binding: 'none' | 'staple' | 'spiral' | 'hard';
  copies: number;
  pageCount: number;
  deliveryNotes?: string;
}

export interface GenieTask {
  kind: 'pickup_drop' | 'buy_deliver' | 'queue_errand' | 'other';
  pickupAddress: string;
  pickupPhone: string;
  dropAddress: string;
  dropPhone: string;
  instructions: string;
  packageDescription?: string;
  estimatedBudgetPaise?: number;
  urgent?: boolean;
}

export interface CartItem {
  id: string;
  sourceId: string; // restaurantId or storeId
  sourceName: string;
  sourceCategory: Category;
  localityId: string;
  name: string;
  unit?: string;
  pricePaise: number;
  quantity: number;
  isVeg?: boolean;
  isAvailable?: boolean;
}

export interface CartState {
  items: CartItem[];
  appliedCoupon: string | null;
  couponDiscountPaise: number;
  deliveryAddressId: string | null;
  paymentMethod: PaymentMethod;
}

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  title: string;
  street: string;
  landmark?: string;
  localityId: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface DemoNotification {
  id: string;
  title: string;
  titleTa?: string;
  message: string;
  timestamp: number;
  read: boolean;
  orderId?: string;
  type: 'order' | 'promo' | 'system';
}

export interface DemoTrackingState {
  orderId: string;
  status: OrderStatus;
  captainName: string;
  captainPhone: string;
  captainRating: number;
  captainVehicle: string;
  otp: string;
  etaMinutes: number;
  timeline: Array<{
    status: OrderStatus;
    title: string;
    timestamp: number;
    completed: boolean;
    current: boolean;
  }>;
}
