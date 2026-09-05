/**
 * Omnichannel WhatsApp KOT Sync & Kitchen Live Stream Integration.
 *
 * Formats structured Kitchen Order Tickets (KOT) for direct WhatsApp Business API
 * messaging and manages high-transparency Live Kitchen IP Stream metadata.
 */

import { formatInr } from './money';
import type { Order, OrderStatus } from './types';

export interface WhatsAppKotMessage {
  recipientPhone: string;
  orderCode: number;
  headerText: string;
  formattedKdsBody: string;
  dispatchedAt: number;
}

export interface KitchenLiveStream {
  storeId: string;
  storeName: string;
  cameraName: string;
  hlsStreamUrl: string;
  isLive: boolean;
  hygieneRating: string; // e.g. "FSSAI 5-Star Clean Kitchen"
}

/**
 * Formats an order into a clean, legible Kitchen Order Ticket for WhatsApp.
 */
export function formatWhatsAppKotPayload(
  order: Order,
  vendorPhone = '+919876500002',
  now = Date.now(),
): WhatsAppKotMessage {
  const timeStr = new Date(now).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    `🍳 *DFC KITCHEN ORDER TICKET (KOT)* #${order.code}`,
    `⏰ *Time:* ${timeStr} | *Category:* ${order.category.toUpperCase()}`,
    `👤 *Customer:* ${order.customerName}`,
    `----------------------------------------`,
    ...order.items
      .filter((i) => i.included)
      .map((i, idx) => `${idx + 1}. *${i.name}* × *${i.quantity}* (${i.unit})`),
    `----------------------------------------`,
    `💵 *Order Value:* ${formatInr(order.pricing.itemsPaise)} [${order.paymentMode.toUpperCase()}]`,
    `🛵 *Assigned Captain:* ${order.riderName || 'Assigning soon...'}`,
    `⚠️ *Special Note:* Please pack hot & seal securely.`,
  ];

  return {
    recipientPhone: vendorPhone,
    orderCode: order.code,
    headerText: `DFC KOT #${order.code}`,
    formattedKdsBody: lines.join('\n'),
    dispatchedAt: now,
  };
}

/**
 * Seed IP Stream endpoints for partner kitchens in Madurai.
 */
export const SEED_KITCHEN_STREAMS: Record<string, KitchenLiveStream> = {
  'murugan-idli-shop': {
    storeId: 'murugan-idli-shop',
    storeName: 'Murugan Idli Shop (West Masi)',
    cameraName: 'Steam & Packing Bay Cam 1',
    hlsStreamUrl:
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isLive: true,
    hygieneRating: 'FSSAI Grade A+ / 5-Star Hygiene',
  },
  'famous-jigarthanda': {
    storeId: 'famous-jigarthanda',
    storeName: 'Famous Jigarthanda',
    cameraName: 'Basundi Prep Counter Cam',
    hlsStreamUrl:
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isLive: true,
    hygieneRating: '100% Pure Buffalo Milk Certified',
  },
  'simmakkal-konar-mess': {
    storeId: 'simmakkal-konar-mess',
    storeName: 'Simmakkal Konar Mess',
    cameraName: 'Tawa & Parotta Station Cam',
    hlsStreamUrl:
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isLive: true,
    hygieneRating: 'FSSAI Hygiene Verified',
  },
};

export type KdsStage = 'new' | 'preparing' | 'ready' | 'dispatched';

export const KDS_STAGES: { key: KdsStage; label: string; labelTa: string; color: string }[] = [
  { key: 'new', label: 'New Orders', labelTa: 'புதிய ஆர்டர்கள்', color: '#2563EB' },
  { key: 'preparing', label: 'Preparing', labelTa: 'சமையல் தயாரிப்பில்', color: '#D97706' },
  { key: 'ready', label: 'Ready for Pickup', labelTa: 'எடுத்துச் செல்ல தயார்', color: '#16A34A' },
  { key: 'dispatched', label: 'Dispatched', labelTa: 'டெலிவரி புறப்பட்டது', color: '#7C3AED' },
];

export function getKdsStage(status: OrderStatus): KdsStage | null {
  if (['paid', 'vendor_accepted'].includes(status)) return 'new';
  if (status === 'packing') return 'preparing';
  if (status === 'ready_for_pickup') return 'ready';
  if (['dispatched', 'picked_up', 'out_for_delivery'].includes(status)) return 'dispatched';
  return null;
}
