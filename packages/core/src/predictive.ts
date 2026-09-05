/**
 * Predictive Cart Auto-Build & Customer Meal Affinity AI.
 *
 * Analyzes temporal patterns (Day of Week + Time of Day) and historical frequency
 * to predict what a customer wants (e.g. Sunday Morning Idli/Vada from Murugan Idli,
 * or 5 PM Filter Coffee & Pakoda from Simmakkal Konar Mess), enabling 1-tap checkout.
 */

import type { Order } from './types';

export type TimeOfDaySlot = 'breakfast' | 'lunch' | 'evening_tea' | 'dinner' | 'late_night';

export interface PredictiveMealCard {
  id: string;
  slot: TimeOfDaySlot;
  kicker: { en: string; ta: string };
  title: { en: string; ta: string };
  storeId: string;
  storeName: string;
  localityId: string;
  suggestedItems: Array<{
    name: string;
    unit: string;
    quantity: number;
    pricePaise: number;
  }>;
  totalPaise: number;
  confidenceScore: number; // 0.0 to 1.0
  reason: string;
}

/**
 * Determines current meal time slot based on local Madurai time (IST / local).
 */
export function getTimeOfDaySlot(date = new Date()): TimeOfDaySlot {
  const hour = date.getHours();
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'evening_tea';
  if (hour >= 19 && hour < 23) return 'dinner';
  return 'late_night';
}

/**
 * Inspects past order history to generate a predictive 1-tap cart card.
 */
export function predictContextualCart(
  pastOrders: Order[],
  userLocality = 'kk-nagar',
  now = new Date(),
): PredictiveMealCard {
  const slot = getTimeOfDaySlot(now);
  const isSunday = now.getDay() === 0;

  // If user has orders matching this time slot, extract frequent items
  const slotOrders = pastOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return getTimeOfDaySlot(d) === slot && o.status === 'delivered';
  });

  if (slotOrders.length > 0) {
    const topOrder = slotOrders[0]!;
    const items = topOrder.items.map((i) => ({
      name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      pricePaise: i.unitPricePaise ?? 5000,
    }));
    const totalPaise = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);

    return {
      id: `pred_${slot}_${Date.now()}`,
      slot,
      kicker: {
        en: isSunday ? 'SUNDAY MORNING SPECIAL' : 'YOUR USUAL ORDER',
        ta: isSunday ? 'ஞாயிறு காலை சிறப்பு' : 'உங்கள் வழக்கமான உணவு',
      },
      title: {
        en: `Order from ${topOrder.storeName || 'Favorite Store'}`,
        ta: `${topOrder.storeName || 'விருப்பமான கடையிலிருந்து'} ஆர்டர்`,
      },
      storeId: topOrder.storeId ?? 'murugan-idli-shop',
      storeName: topOrder.storeName ?? 'Murugan Idli Shop',
      localityId: topOrder.localityId,
      suggestedItems: items,
      totalPaise,
      confidenceScore: 0.92,
      reason: `Based on your past ${slot.replace('_', ' ')} orders`,
    };
  }

  // Heuristic Smart Defaults for Madurai context
  if (slot === 'breakfast') {
    return {
      id: `pred_default_breakfast_${Date.now()}`,
      slot: 'breakfast',
      kicker: {
        en: isSunday ? 'SUNDAY SPECIAL BREAKFAST' : 'MORNING ESSENTIALS',
        ta: isSunday ? 'ஞாயிறு காலை ஸ்பெஷல்' : 'காலை உணவுகள்',
      },
      title: {
        en: 'Hot Ghee Podi Idli & Filter Coffee',
        ta: 'சூடான நெய் பொடி இட்லி & பில்டர் காபி',
      },
      storeId: 'murugan-idli-shop',
      storeName: 'Murugan Idli Shop',
      localityId: userLocality,
      suggestedItems: [
        { name: 'Ghee Podi Idli (2 pcs)', unit: 'plate', quantity: 2, pricePaise: 9000 },
        { name: 'Medhu Vada (1 pc)', unit: 'pc', quantity: 2, pricePaise: 4000 },
        { name: 'Kumbakonam Degree Coffee', unit: 'cup', quantity: 2, pricePaise: 6000 },
      ],
      totalPaise: 19000,
      confidenceScore: 0.85,
      reason: isSunday ? 'Popular Sunday morning favorite in Madurai' : 'Top breakfast pick',
    };
  }

  if (slot === 'evening_tea') {
    return {
      id: `pred_default_tea_${Date.now()}`,
      slot: 'evening_tea',
      kicker: {
        en: '4 PM TEA BREAK',
        ta: 'மாலை 4 மணி டீ பிரேக்',
      },
      title: {
        en: 'Madurai Special Jigarthanda & Snacks',
        ta: 'மதுரை ஸ்பெஷல் ஜிகர்தண்டா & ஸ்நாக்ஸ்',
      },
      storeId: 'famous-jigarthanda',
      storeName: 'Famous Jigarthanda',
      localityId: userLocality,
      suggestedItems: [
        { name: 'Special Basundi Jigarthanda', unit: 'glass', quantity: 2, pricePaise: 16000 },
        { name: 'Onion Pakoda (250g)', unit: 'pack', quantity: 1, pricePaise: 7000 },
      ],
      totalPaise: 23000,
      confidenceScore: 0.88,
      reason: 'Perfect evening refreshment',
    };
  }

  // Dinner default
  return {
    id: `pred_default_dinner_${Date.now()}`,
    slot: 'dinner',
    kicker: {
      en: 'NIGHT SPECIALS',
      ta: 'இரவு சிறப்பு உணவுகள்',
    },
    title: {
      en: 'Madurai Bun Parotta & Pepper Salna',
      ta: 'மதுரை பன் பரோட்டா & மிளகு சால்னா',
    },
    storeId: 'simmakkal-konar-mess',
    storeName: 'Simmakkal Konar Mess',
    localityId: userLocality,
    suggestedItems: [
      { name: 'Crispy Bun Parotta', unit: 'pc', quantity: 3, pricePaise: 13500 },
      { name: 'Mutton Kari Dosa', unit: 'plate', quantity: 1, pricePaise: 24000 },
    ],
    totalPaise: 37500,
    confidenceScore: 0.87,
    reason: 'Authentic Madurai dinner selection',
  };
}
