/**
 * Mock Tracking Repository for Demo Mode
 */

import type { OrderStatus } from '@dfc/core';
import { DEMO_CONFIG } from '../config';
import { demoStorage } from '../storage';
import type { DemoTrackingState } from '../types';

export const mockTrackingRepository = {
  getTracking(orderId: string): DemoTrackingState | null {
    const order = demoStorage.getOrderById(orderId);
    if (!order) return null;

    const stages: Array<{ status: OrderStatus; title: string }> = [
      { status: 'paid', title: 'Order Placed & Confirmed' },
      { status: 'vendor_accepted', title: 'Store Accepted Order' },
      { status: 'packing', title: 'Items Being Packed & Checked' },
      { status: 'ready_for_pickup', title: 'Ready for Captain Pickup' },
      { status: 'dispatched', title: 'Captain Picked Up Parcel' },
      { status: 'out_for_delivery', title: 'Captain on the Way to Your Door' },
      { status: 'delivered', title: 'Delivered with OTP' },
    ];

    const currentIdx = stages.findIndex((s) => s.status === order.status);
    const timeline = stages.map((s, idx) => ({
      status: s.status,
      title: s.title,
      timestamp: order.createdAt + idx * 3 * 60 * 1000,
      completed: idx <= (currentIdx >= 0 ? currentIdx : 0),
      current: idx === currentIdx,
    }));

    return {
      orderId: order.id,
      status: order.status,
      captainName: DEMO_CONFIG.captain.name,
      captainPhone: DEMO_CONFIG.captain.phone,
      captainRating: DEMO_CONFIG.captain.rating,
      captainVehicle: DEMO_CONFIG.captain.vehicle,
      otp: '8492',
      etaMinutes: order.status === 'delivered' ? 0 : Math.max(2, 18 - (currentIdx >= 0 ? currentIdx * 3 : 0)),
      timeline,
    };
  },
};
