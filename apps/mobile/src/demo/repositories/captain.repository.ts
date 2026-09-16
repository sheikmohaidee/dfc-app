/**
 * Mock Captain Repository
 *
 * Implements Captain management, assignment eligibility, cancellation limit tracking,
 * mandatory explanation logic, automatic offline enforcement, and admin cancellation reviews.
 */

import type { Captain, OrderCancellation } from '@dfc/core';

const now = Date.now();

let memCaptains: Captain[] = [
  {
    id: 'captain_001',
    name: 'Karthik',
    phone: '+91 98765 00001',
    status: 'OFFLINE',
    offlineReason: 'Cancellation limit exceeded',
    cancellationCount: 3,
    maxFreeCancellations: 2,
    vehicle: 'TVS Jupiter • TN 59 AZ 1234',
    rating: 4.9,
    activeOrderId: null,
  },
  {
    id: 'captain_002',
    name: 'Arun',
    phone: '+91 98765 00002',
    status: 'ONLINE',
    cancellationCount: 0,
    maxFreeCancellations: 2,
    vehicle: 'Honda Activa 6G • TN 59 BX 5678',
    rating: 4.8,
    activeOrderId: null,
  },
  {
    id: 'captain_003',
    name: 'Suresh',
    phone: '+91 98765 00003',
    status: 'OFFLINE',
    offlineReason: 'Off duty',
    cancellationCount: 1,
    maxFreeCancellations: 2,
    vehicle: 'Bajaj Pulsar 150 • TN 59 CQ 9012',
    rating: 4.7,
    activeOrderId: null,
  },
];

let memCancellations: OrderCancellation[] = [
  {
    id: 'canc_001',
    captainId: 'captain_001',
    captainName: 'Karthik',
    orderId: 'ord-hist-1012',
    orderCode: 1012,
    reason: 'Vehicle breakdown / tyre puncture',
    explanation: 'Rear tyre puncture near Simmakkal bridge. Needed repair shop.',
    createdAt: now - 3 * 24 * 60 * 60 * 1000,
    adminReviewStatus: 'reviewed',
    reviewedAt: now - 2 * 24 * 60 * 60 * 1000,
    reviewedBy: 'Admin (Muthu)',
  },
  {
    id: 'canc_002',
    captainId: 'captain_001',
    captainName: 'Karthik',
    orderId: 'ord-hist-1018',
    orderCode: 1018,
    reason: 'Unable to reach pickup due to heavy rain and waterlogging',
    explanation: 'Heavy waterlogging near Mattuthavani bus stand, road cordoned off.',
    createdAt: now - 24 * 60 * 60 * 1000,
    adminReviewStatus: 'reviewed',
    reviewedAt: now - 18 * 60 * 60 * 1000,
    reviewedBy: 'Admin (Muthu)',
  },
  {
    id: 'canc_003',
    captainId: 'captain_001',
    captainName: 'Karthik',
    orderId: 'ord-demo-past-1024',
    orderCode: 1024,
    reason: 'Customer / location issue',
    explanation: 'Road blocked due to temple festival in Ismail Puram, unable to enter street.',
    createdAt: now - 2 * 60 * 60 * 1000,
    adminReviewStatus: 'pending',
  },
];

const listeners: Array<() => void> = [];
const notify = () => listeners.forEach((fn) => fn());

export const mockCaptainRepository = {
  subscribe(fn: () => void): () => void {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  getAllCaptains(): Captain[] {
    return [...memCaptains];
  },

  getAvailableCaptains(): Captain[] {
    return memCaptains.filter((c) => c.status === 'ONLINE' && !c.activeOrderId);
  },

  getCaptainById(id: string): Captain | null {
    return memCaptains.find((c) => c.id === id) ?? null;
  },

  getCaptainByName(name: string): Captain | null {
    return memCaptains.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null;
  },

  setCaptainStatus(captainId: string, status: 'ONLINE' | 'OFFLINE' | 'BUSY', reason?: string): Captain | null {
    const captain = memCaptains.find((c) => c.id === captainId);
    if (!captain) return null;
    captain.status = status;
    captain.offlineReason = reason;
    notify();
    return captain;
  },

  setActiveOrder(captainId: string, orderId: string | null): void {
    const captain = memCaptains.find((c) => c.id === captainId);
    if (captain) {
      captain.activeOrderId = orderId;
      if (orderId && captain.status === 'ONLINE') {
        captain.status = 'BUSY';
      } else if (!orderId && captain.status === 'BUSY') {
        captain.status = 'ONLINE';
      }
      notify();
    }
  },

  /**
   * Evaluates cancellation rules:
   * 1. If cancellationCount < 2: Free cancellation allowed.
   * 2. If cancellationCount >= 2: Mandatory explanation required.
   * 3. When cancellation is submitted after reaching limit:
   *    cancellationCount reaches 3 -> automatically set to OFFLINE ("Cancellation limit exceeded").
   */
  cancelOrderByCaptain(args: {
    orderId: string;
    orderCode: number | string;
    captainId: string;
    reason: string;
    explanation?: string;
  }): {
    success: boolean;
    requiresExplanation?: boolean;
    wentOffline: boolean;
    cancellation: OrderCancellation;
    captain: Captain;
  } {
    const captain = memCaptains.find((c) => c.id === args.captainId);
    if (!captain) {
      throw new Error(`Captain ${args.captainId} not found`);
    }

    // Check if cancellation count requires explanation
    const isOverLimit = captain.cancellationCount >= captain.maxFreeCancellations;
    if (isOverLimit && (!args.explanation || !args.explanation.trim())) {
      return {
        success: false,
        requiresExplanation: true,
        wentOffline: false,
        cancellation: null as any,
        captain,
      };
    }

    captain.cancellationCount += 1;
    let wentOffline = false;

    if (captain.cancellationCount > captain.maxFreeCancellations) {
      captain.status = 'OFFLINE';
      captain.offlineReason = 'Cancellation limit exceeded';
      wentOffline = true;
    }

    if (captain.activeOrderId === args.orderId) {
      captain.activeOrderId = null;
    }

    const newCancellation: OrderCancellation = {
      id: `canc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      captainId: captain.id,
      captainName: captain.name,
      orderId: args.orderId,
      orderCode: args.orderCode,
      reason: args.reason,
      explanation: args.explanation?.trim() || undefined,
      createdAt: Date.now(),
      adminReviewStatus: 'pending',
    };

    memCancellations = [newCancellation, ...memCancellations];
    notify();

    return {
      success: true,
      wentOffline,
      cancellation: newCancellation,
      captain,
    };
  },

  getCancellations(): OrderCancellation[] {
    return [...memCancellations];
  },

  getCancellationsByCaptain(captainId: string): OrderCancellation[] {
    return memCancellations.filter((c) => c.captainId === captainId);
  },

  reviewCancellation(
    cancellationId: string,
    status: 'reviewed' | 'penalized' | 'waived',
    reviewedBy: string = 'Admin',
  ): OrderCancellation | null {
    const record = memCancellations.find((c) => c.id === cancellationId);
    if (!record) return null;
    record.adminReviewStatus = status;
    record.reviewedAt = Date.now();
    record.reviewedBy = reviewedBy;
    notify();
    return record;
  },

  /**
   * Reinstate Captain after review:
   * Sets status back to ONLINE and resets/adjusts offlineReason.
   */
  reinstateCaptain(captainId: string, resetCount: boolean = true): Captain | null {
    const captain = memCaptains.find((c) => c.id === captainId);
    if (!captain) return null;
    captain.status = 'ONLINE';
    captain.offlineReason = undefined;
    if (resetCount) {
      captain.cancellationCount = 0;
    }
    notify();
    return captain;
  },
};
