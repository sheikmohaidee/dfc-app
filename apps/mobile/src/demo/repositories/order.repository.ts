/**
 * Mock Order Repository for Demo Mode
 * Implements client business logic: Manual Captain Assignment, Reassignment,
 * Preparation & Delivery timing tracking, unified timeline updates, and Captain cancellation limit hooks.
 */

import type { Category, Order, OrderItem, OrderStatus, PaymentMethod, PaymentMode, PaymentStatus } from '@dfc/core';
import { DEMO_CONFIG } from '../config';
import { demoStorage } from '../storage';
import { mockCartRepository } from './cart.repository';
import { mockCaptainRepository } from './captain.repository';
import type { CartState, SavedAddress } from '../types';

let nextOrderSeq = 1048;

export const mockOrderRepository = {
  getOrders(): Order[] {
    return demoStorage.getOrders();
  },

  getOrderById(id: string): Order | null {
    return demoStorage.getOrderById(id);
  },

  async createFromCart(
    cart: CartState,
    address: SavedAddress,
    paymentMethod: PaymentMethod = 'upi_intent',
  ): Promise<Order> {
    const user = demoStorage.getUser() ?? {
      ...DEMO_CONFIG.defaultCustomer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const bill = mockCartRepository.calculateBill(cart);
    const code = nextOrderSeq++;
    const now = Date.now();
    const primaryItem = cart.items[0];

    const orderItems: OrderItem[] = cart.items.map((i, idx) => ({
      id: `it-${now}-${idx}`,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit || 'portion',
      unitPricePaise: i.pricePaise,
      confidence: 1.0,
      included: true,
    }));

    const isCod = paymentMethod === 'cash';
    const newOrder: Order = {
      id: `ord-demo-${now}`,
      code,
      category: (primaryItem?.sourceCategory as Category) || 'food',
      status: 'paid',
      paymentMode: isCod ? 'cod' : 'prepaid',
      paymentStatus: isCod ? 'unpaid' : 'paid',
      customerUid: user.uid,
      customerName: user.name,
      customerPhone: user.phone,
      localityId: address.localityId || user.localityId || 'anna-nagar',
      addressLine: `${address.street}, ${address.pincode}`,
      storeId: primaryItem?.sourceId || 'rest-amma-mess',
      storeName: primaryItem?.sourceName || 'Amma Mess',
      items: orderItems,
      pricing: {
        itemsPaise: bill.itemsSubtotalPaise,
        deliveryPaise: bill.deliveryFeePaise,
        servicePaise: bill.platformFeePaise,
        discountPaise: bill.discountPaise,
        totalPaise: bill.totalPaise,
        pricedAt: now,
      },
      source: {
        kind: 'text',
        transcript: `Cart checkout with ${cart.items.length} items`,
      },
      riderUid: null,
      riderName: null,
      captainUid: null,
      captainName: null,
      captainPhone: null,
      assignmentStatus: 'UNASSIGNED',
      assignmentHistory: [],
      ai: null,
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'paid',
          at: now,
          by: user.uid,
          note: isCod ? 'Order placed with Cash on Delivery' : 'Order placed and paid via UPI',
        },
      ],
    };

    await demoStorage.saveOrder(newOrder);
    // Only this order's service cart is consumed — other service carts and
    // in-flight orders are untouched, so the customer can keep ordering.
    await mockCartRepository.clearCart((primaryItem?.sourceCategory as Category) || 'food');
    return newOrder;
  },

  async createDirectOrder(args: {
    category: Category;
    storeName?: string;
    storeId?: string;
    items: Array<{
      name: string;
      quantity: number;
      unit?: string;
      pricePaise?: number;
      flag?: string | null;
    }>;
    totalPaise: number;
    sourceKind?: 'photo' | 'voice' | 'text';
    transcript?: string;
  }): Promise<Order> {
    const user = demoStorage.getUser() ?? {
      ...DEMO_CONFIG.defaultCustomer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const code = nextOrderSeq++;
    const now = Date.now();

    const orderItems: OrderItem[] = args.items.map((i, idx) => ({
      id: `it-${now}-${idx}`,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit || 'portion',
      unitPricePaise: i.pricePaise || 15000,
      confidence: 0.98,
      included: true,
      note: i.flag || undefined,
    }));

    const newOrder: Order = {
      id: `ord-demo-${now}`,
      code,
      category: args.category,
      status: 'paid',
      paymentMode: 'prepaid',
      paymentStatus: 'paid',
      customerUid: user.uid,
      customerName: user.name,
      customerPhone: user.phone,
      localityId: user.localityId || 'anna-nagar',
      addressLine: 'Flat 3B, Sri Meenakshi Enclave, Anna Nagar, Madurai',
      storeId: args.storeId || 'rest-amma-mess',
      storeName: args.storeName || 'Amma Mess',
      items: orderItems,
      pricing: {
        itemsPaise: Math.max(args.totalPaise - 3500, 0),
        deliveryPaise: 3000,
        servicePaise: 500,
        totalPaise: args.totalPaise,
        pricedAt: now,
      },
      source: {
        kind: args.sourceKind || 'text',
        transcript: args.transcript || 'Direct mobile order',
      },
      riderUid: null,
      riderName: null,
      captainUid: null,
      captainName: null,
      captainPhone: null,
      assignmentStatus: 'UNASSIGNED',
      assignmentHistory: [],
      ai: null,
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'paid',
          at: now,
          by: user.uid,
          note: 'AI parsed order confirmed and paid',
        },
      ],
    };

    await demoStorage.saveOrder(newOrder);
    return newOrder;
  },

  // ---------------------------------------------------------------------------
  // Client Requirement #14 & #18: Vendor Preparation Timers
  // ---------------------------------------------------------------------------

  async vendorAccept(orderId: string, vendorId = 'vendor-amma-mess'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();
    const updated: Order = {
      ...order,
      status: 'vendor_accepted',
      acceptedAt: now,
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        { status: 'vendor_accepted', at: now, by: vendorId, note: 'Store accepted order' },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  async startPreparation(orderId: string, vendorId = 'vendor-amma-mess'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();
    const updated: Order = {
      ...order,
      status: 'packing',
      preparationStartedAt: now,
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        { status: 'packing', at: now, by: vendorId, note: 'Preparation started • Timer active' },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  async completePreparation(orderId: string, vendorId = 'vendor-amma-mess'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();
    const prepStart = order.preparationStartedAt || order.acceptedAt || order.createdAt;
    const durationMinutes = Math.max(1, Math.round((now - prepStart) / (60 * 1000)));

    const updated: Order = {
      ...order,
      status: 'ready_for_pickup',
      preparationCompletedAt: now,
      preparationDurationMinutes: durationMinutes,
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: 'ready_for_pickup',
          at: now,
          by: vendorId,
          note: `Food packed & ready for pickup (${durationMinutes} min prep)`,
        },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  // ---------------------------------------------------------------------------
  // Client Requirement #2 & #5: Manual Captain Assignment & Reassignment by Admin
  // ---------------------------------------------------------------------------

  async assignCaptain(orderId: string, captainId: string, adminId = 'Admin (Muthu)'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const captain = mockCaptainRepository.getCaptainById(captainId);
    if (!captain) throw new Error(`Captain ${captainId} not found`);

    if (captain.status === 'OFFLINE') {
      throw new Error(`Cannot assign offline Captain (${captain.offlineReason || 'Inactive'})`);
    }

    const now = Date.now();
    mockCaptainRepository.setActiveOrder(captainId, orderId);

    const historyItem = {
      captainId: captain.id,
      captainName: captain.name,
      assignedAt: now,
      assignedBy: adminId,
      status: 'ASSIGNED',
    };

    const updated: Order = {
      ...order,
      status: 'dispatched',
      riderUid: captain.id,
      riderName: `Captain ${captain.name}`,
      captainUid: captain.id,
      captainName: captain.name,
      captainPhone: captain.phone,
      captainAssignedAt: now,
      assignmentStatus: 'ASSIGNED',
      assignmentHistory: [...(order.assignmentHistory || []), historyItem],
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: 'dispatched',
          at: now,
          by: adminId,
          note: `Captain Assigned: ${captain.name} (${captain.phone})`,
        },
      ],
    };

    await demoStorage.saveOrder(updated);
    return updated;
  },

  async reassignCaptain(orderId: string, newCaptainId: string, adminId = 'Admin (Muthu)'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;

    // Release old captain if assigned
    if (order.captainUid) {
      mockCaptainRepository.setActiveOrder(order.captainUid, null);
    }

    return this.assignCaptain(orderId, newCaptainId, adminId);
  },

  // ---------------------------------------------------------------------------
  // Client Requirement #4 & #19: Captain Order Workflow (Accept, Pickup, Deliver)
  // ---------------------------------------------------------------------------

  async captainAccept(orderId: string, captainId: string): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();

    const updated: Order = {
      ...order,
      assignmentStatus: 'ACCEPTED',
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: order.status,
          at: now,
          by: captainId,
          note: `Captain ${order.captainName || 'Arun'} accepted assignment`,
        },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  async captainPickup(orderId: string, captainId: string): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();

    const updated: Order = {
      ...order,
      status: 'picked_up',
      pickedUpAt: now,
      deliveryStartedAt: now,
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: 'picked_up',
          at: now,
          by: captainId,
          note: `Order picked up from ${order.storeName || 'restaurant'}`,
        },
        {
          status: 'out_for_delivery',
          at: now,
          by: captainId,
          note: 'Captain on the way to delivery address',
        },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  async captainDeliver(orderId: string, captainId: string, otp?: string): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;
    const now = Date.now();

    const deliveryStart = order.deliveryStartedAt || order.pickedUpAt || order.captainAssignedAt || order.createdAt;
    const deliveryDurationMinutes = Math.max(1, Math.round((now - deliveryStart) / (60 * 1000)));
    const totalDurationMinutes = Math.max(1, Math.round((now - order.createdAt) / (60 * 1000)));

    if (order.captainUid) {
      mockCaptainRepository.setActiveOrder(order.captainUid, null);
    }

    const updated: Order = {
      ...order,
      status: 'delivered',
      paymentStatus: 'paid',
      deliveredAt: now,
      deliveryDurationMinutes,
      totalOrderDurationMinutes: totalDurationMinutes,
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: 'delivered',
          at: now,
          by: captainId,
          note: `Delivered to customer (${deliveryDurationMinutes} min delivery • ${totalDurationMinutes} min total)`,
        },
      ],
    };
    await demoStorage.saveOrder(updated);
    return updated;
  },

  // ---------------------------------------------------------------------------
  // Client Requirement #6, #7, #8: Captain Cancellation with Limit & Auto-Offline
  // ---------------------------------------------------------------------------

  async captainCancel(args: {
    orderId: string;
    captainId: string;
    reason: string;
    explanation?: string;
  }): Promise<{
    success: boolean;
    requiresExplanation?: boolean;
    wentOffline: boolean;
    order: Order | null;
  }> {
    const order = demoStorage.getOrderById(args.orderId);
    if (!order) throw new Error(`Order ${args.orderId} not found`);

    const result = mockCaptainRepository.cancelOrderByCaptain({
      orderId: args.orderId,
      orderCode: order.code,
      captainId: args.captainId,
      reason: args.reason,
      explanation: args.explanation,
    });

    if (!result.success && result.requiresExplanation) {
      return {
        success: false,
        requiresExplanation: true,
        wentOffline: false,
        order,
      };
    }

    const now = Date.now();
    // Return order to ready_for_pickup with UNASSIGNED captain
    const updated: Order = {
      ...order,
      status: 'ready_for_pickup',
      riderUid: null,
      riderName: null,
      captainUid: null,
      captainName: null,
      captainPhone: null,
      assignmentStatus: 'UNASSIGNED',
      updatedAt: now,
      timeline: [
        ...(order.timeline || []),
        {
          status: 'ready_for_pickup',
          at: now,
          by: args.captainId,
          note: `Captain ${result.captain.name} cancelled: ${args.reason}${
            args.explanation ? ` (${args.explanation})` : ''
          }. Order returned to unassigned pool.`,
        },
      ],
    };

    await demoStorage.saveOrder(updated);
    return {
      success: true,
      requiresExplanation: false,
      wentOffline: result.wentOffline,
      order: updated,
    };
  },

  advanceStatus(orderId: string): Order | null {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;

    const stages: OrderStatus[] = [
      'paid',
      'vendor_accepted',
      'packing',
      'ready_for_pickup',
      'dispatched',
      'picked_up',
      'out_for_delivery',
      'delivered',
    ];

    const currentIdx = stages.indexOf(order.status);
    const nextIdx = currentIdx < stages.length - 1 ? currentIdx + 1 : currentIdx;
    const nextStatus = stages[nextIdx]!;

    const updated: Order = {
      ...order,
      status: nextStatus,
      updatedAt: Date.now(),
      timeline: [
        ...(order.timeline || []),
        {
          status: nextStatus,
          at: Date.now(),
          by: 'system',
          note: `Status progressed to ${nextStatus}`,
        },
      ],
    };

    void demoStorage.saveOrder(updated);
    return updated;
  },

  async cancelOrder(orderId: string, reason = 'Customer requested cancellation'): Promise<Order | null> {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;

    if (order.captainUid) {
      mockCaptainRepository.setActiveOrder(order.captainUid, null);
    }

    const updated: Order = {
      ...order,
      status: 'cancelled',
      updatedAt: Date.now(),
      timeline: [
        ...(order.timeline || []),
        {
          status: 'cancelled',
          at: Date.now(),
          by: order.customerUid,
          note: reason,
        },
      ],
    };

    await demoStorage.saveOrder(updated);
    return updated;
  },
};
