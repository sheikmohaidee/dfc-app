/**
 * Daily Morning Subscriptions Engine.
 *
 * Manages recurring scheduled deliveries for daily essentials
 * (Fresh Aavin Milk, Idli/Dosa Batter, Madurai Malligai, Newspapers)
 * dispatched between 6:00 AM - 7:30 AM before morning peak hours.
 */

export type SubscriptionFrequency = 'daily' | 'weekdays' | 'weekends';

export interface SubscriptionItem {
  id: string;
  name: string;
  nameTa: string;
  unit: string;
  unitPricePaise: number;
  category: 'milk' | 'batter' | 'flowers' | 'newspaper' | 'grocery';
}

export interface DailySubscription {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  localityId: string;
  addressLine: string;
  item: SubscriptionItem;
  quantity: number;
  frequency: SubscriptionFrequency;
  deliverySlot: string; // e.g. "06:00 AM - 07:30 AM"
  isActive: boolean;
  startDate: string; // YYYY-MM-DD
  nextDeliveryDate: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export const ESSENTIAL_SUBSCRIPTION_CATALOGUE: SubscriptionItem[] = [
  {
    id: 'sub-aavin-milk-500',
    name: 'Aavin Green Full Cream Milk (500ml)',
    nameTa: 'ஆவின் பசும்பால் (500 மி.லி)',
    unit: 'pouch',
    unitPricePaise: 3000, // ₹30
    category: 'milk',
  },
  {
    id: 'sub-idli-batter-1kg',
    name: 'Fresh Stone-Ground Idli Batter (1kg)',
    nameTa: 'ஆரோக்கிய இட்லி/தோசை மாவு (1 கிலோ)',
    unit: 'pack',
    unitPricePaise: 4000, // ₹40
    category: 'batter',
  },
  {
    id: 'sub-madurai-malligai',
    name: 'Fresh Madurai Malligai (2 Muzham)',
    nameTa: 'மணக்கும் மதுரை மல்லிகை (2 முழம்)',
    unit: 'pack',
    unitPricePaise: 6000, // ₹60
    category: 'flowers',
  },
  {
    id: 'sub-daily-thanthi',
    name: 'Daily Thanthi Morning Edition',
    nameTa: 'தினத்தந்தி நாளிதழ்',
    unit: 'copy',
    unitPricePaise: 700, // ₹7
    category: 'newspaper',
  },
];

export const SEED_SUBSCRIPTIONS: DailySubscription[] = [
  {
    id: 'sub-101',
    customerUid: 'cust-101',
    customerName: 'S. Meenakshi Sundaram',
    customerPhone: '+919876500101',
    localityId: 'kk-nagar',
    addressLine: '14, 80 Feet Road, Near Apollo Hospital',
    item: ESSENTIAL_SUBSCRIPTION_CATALOGUE[0]!,
    quantity: 2,
    frequency: 'daily',
    deliverySlot: '06:00 AM - 07:30 AM',
    isActive: true,
    startDate: '2026-09-01',
    nextDeliveryDate: '2026-09-02',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'sub-102',
    customerUid: 'cust-101',
    customerName: 'S. Meenakshi Sundaram',
    customerPhone: '+919876500101',
    localityId: 'kk-nagar',
    addressLine: '14, 80 Feet Road, Near Apollo Hospital',
    item: ESSENTIAL_SUBSCRIPTION_CATALOGUE[1]!,
    quantity: 1,
    frequency: 'weekdays',
    deliverySlot: '06:00 AM - 07:30 AM',
    isActive: true,
    startDate: '2026-09-01',
    nextDeliveryDate: '2026-09-02',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

/**
 * Calculates monthly estimated cost of a recurring essential subscription.
 */
export function calculateMonthlySubscriptionPaise(
  sub: Pick<DailySubscription, 'quantity' | 'item' | 'frequency'>,
): number {
  const deliveriesPerMonth =
    sub.frequency === 'daily' ? 30 : sub.frequency === 'weekdays' ? 22 : 8;
  return sub.item.unitPricePaise * sub.quantity * deliveriesPerMonth;
}

/**
 * Checks if a subscription is due for delivery on a given date.
 */
export function isSubscriptionDueOnDate(
  sub: DailySubscription,
  date: Date = new Date(),
): boolean {
  if (!sub.isActive) return false;
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  if (sub.frequency === 'weekdays' && (day === 0 || day === 6)) return false;
  if (sub.frequency === 'weekends' && day !== 0 && day !== 6) return false;
  return true;
}
