/**
 * Genie & Concierge Services for Demo
 */

export const GENIE_CATEGORIES = [
  {
    id: 'pickup_drop',
    title: 'Pickup & Drop',
    titleTa: 'பொருட்கள் எடுப்பது & கொடுப்பது',
    icon: 'Package',
    desc: 'Send keys, tiffin, documents, clothes or charger across Madurai in 20 mins.',
    basePaise: 4000,
    perKmPaise: 1200,
  },
  {
    id: 'buy_deliver',
    title: 'Buy & Deliver',
    titleTa: 'வாங்கி தருவது',
    icon: 'ShoppingBag',
    desc: 'Tell us any specific shop or item, captain will buy with cash advance and deliver.',
    basePaise: 5000,
    perKmPaise: 1400,
  },
  {
    id: 'queue_errand',
    title: 'Stand in Queue',
    titleTa: 'வரிசையில் நிற்பது',
    icon: 'Users',
    desc: 'Captain will collect tokens or wait at registrar office, bank or temple counter.',
    basePaise: 10000,
    perKmPaise: 0,
  },
  {
    id: 'other',
    title: 'Custom Task',
    titleTa: 'பிற பணிகள்',
    icon: 'Sparkles',
    desc: 'Any errand you need done in Madurai. Dedicated concierge captain.',
    basePaise: 6000,
    perKmPaise: 1200,
  },
];

export function calculateGenieFare(
  kind: 'pickup_drop' | 'buy_deliver' | 'queue_errand' | 'other',
  distanceKm: number = 3.5,
): {
  deliveryPaise: number;
  platformFeePaise: number;
  totalPaise: number;
} {
  const cat = GENIE_CATEGORIES.find((c) => c.id === kind) ?? GENIE_CATEGORIES[0]!;
  const deliveryPaise = cat.basePaise + Math.round(cat.perKmPaise * distanceKm);
  const platformFeePaise = 500;
  const totalPaise = deliveryPaise + platformFeePaise;
  return { deliveryPaise, platformFeePaise, totalPaise };
}
