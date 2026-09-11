/**
 * Dynamic Group Ordering & Split Billing Engine.
 *
 * Allows friends/colleagues to join a shared room via link/code, add items
 * from their own phones, view individual subtotals with proportional delivery
 * fee splits, and submit a single consolidated KOT to the restaurant.
 */

import { computePricing } from './money';
import type { OrderItem, Pricing } from './types';

export interface GroupMember {
  uid: string;
  name: string;
  phone: string;
  avatarColor: string;
  isHost: boolean;
  joinedAt: number;
  paidStatus: 'pending' | 'paid_online' | 'cash_on_delivery';
}

export interface GroupOrderItem extends OrderItem {
  addedByUid: string;
  addedByName: string;
  pricePaise?: number;
}

export interface MemberSplitBill {
  memberUid: string;
  memberName: string;
  items: GroupOrderItem[];
  subtotalPaise: number;
  shareOfDeliveryPaise: number;
  totalPaise: number;
  paidStatus: 'pending' | 'paid_online' | 'cash_on_delivery';
}

export interface GroupOrderRoom {
  id: string;
  roomCode: string; // e.g. "DFC-8492"
  hostUid: string;
  hostName: string;
  storeId: string;
  storeName: string;
  localityId: string;
  members: GroupMember[];
  items: GroupOrderItem[];
  deliveryFeePaise: number;
  status: 'open' | 'locked' | 'submitted' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export function generateRoomCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DFC-${digits}`;
}

/**
 * Creates a new Group Order Room hosted by a customer.
 */
export function createGroupOrderRoom(
  host: { uid: string; name: string; phone: string },
  store: { id: string; name: string; localityId: string },
  deliveryFeePaise = 2900,
  now = Date.now(),
): GroupOrderRoom {
  const hostMember: GroupMember = {
    uid: host.uid,
    name: host.name,
    phone: host.phone,
    avatarColor: '#2563EB',
    isHost: true,
    joinedAt: now,
    paidStatus: 'pending',
  };

  return {
    id: `grp_${now}_${Math.random().toString(36).substring(2, 7)}`,
    roomCode: generateRoomCode(),
    hostUid: host.uid,
    hostName: host.name,
    storeId: store.id,
    storeName: store.name,
    localityId: store.localityId,
    members: [hostMember],
    items: [],
    deliveryFeePaise,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Adds a new member to an active Group Order Room.
 */
export function joinGroupOrderRoom(
  room: GroupOrderRoom,
  user: { uid: string; name: string; phone: string },
  now = Date.now(),
): GroupOrderRoom {
  if (room.status !== 'open') {
    throw new Error('Group order room is locked or already submitted');
  }

  const existing = room.members.find((m) => m.uid === user.uid);
  if (existing) return room;

  const colors = ['#16A34A', '#D97706', '#9333EA', '#DC2626', '#0891B2', '#4F46E5'];
  const avatarColor = colors[room.members.length % colors.length]!;

  const newMember: GroupMember = {
    uid: user.uid,
    name: user.name,
    phone: user.phone,
    avatarColor,
    isHost: false,
    joinedAt: now,
    paidStatus: 'pending',
  };

  return {
    ...room,
    members: [...room.members, newMember],
    updatedAt: now,
  };
}

/**
 * Calculates individual item breakdowns and proportional bill splits across all room members.
 */
export function computeGroupBillSplit(room: GroupOrderRoom): {
  pricing: Pricing;
  splits: MemberSplitBill[];
} {
  // Ensure unitPricePaise is set for items calculation
  const normalizedItems: OrderItem[] = room.items.map((i) => ({
    ...i,
    unitPricePaise: i.unitPricePaise ?? i.pricePaise ?? null,
  }));

  const overallPricing = computePricing({
    items: normalizedItems,
    deliveryPaise: room.deliveryFeePaise,
    servicePaise: 0,
  });
  const activeMembers = room.members;

  if (activeMembers.length === 0 || overallPricing.itemsPaise === 0) {
    const emptySplits: MemberSplitBill[] = activeMembers.map((m) => ({
      memberUid: m.uid,
      memberName: m.name,
      items: [],
      subtotalPaise: 0,
      shareOfDeliveryPaise: Math.round(room.deliveryFeePaise / Math.max(1, activeMembers.length)),
      totalPaise: Math.round(room.deliveryFeePaise / Math.max(1, activeMembers.length)),
      paidStatus: m.paidStatus,
    }));
    return { pricing: overallPricing, splits: emptySplits };
  }

  const splits: MemberSplitBill[] = activeMembers.map((m) => {
    const memberItems = room.items.filter((i) => i.addedByUid === m.uid && i.included);
    const memberSubtotal = memberItems.reduce(
      (sum, i) => sum + (i.unitPricePaise ?? i.pricePaise ?? 0) * i.quantity,
      0,
    );

    // Proportional ratio of basket
    const ratio =
      overallPricing.itemsPaise > 0
        ? memberSubtotal / overallPricing.itemsPaise
        : 1 / activeMembers.length;
    const shareOfDelivery = Math.round(overallPricing.deliveryPaise * ratio);
    const memberTotal = memberSubtotal + shareOfDelivery;

    return {
      memberUid: m.uid,
      memberName: m.name,
      items: memberItems,
      subtotalPaise: memberSubtotal,
      shareOfDeliveryPaise: shareOfDelivery,
      totalPaise: memberTotal,
      paidStatus: m.paidStatus,
    };
  });

  return { pricing: overallPricing, splits };
}
