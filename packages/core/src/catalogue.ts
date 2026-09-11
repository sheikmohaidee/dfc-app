/**
 * Catalogue, stock and promotions.
 *
 * Two jobs live here. Stock is what the admin console maintains so pricing
 * stops being guesswork — once a product has a price and a count, the model's
 * estimate can be replaced with a real number and the vendor's "not available"
 * becomes rarer. Promotions are how DFC pushes demand at a specific locality
 * on a specific evening, which is the whole advantage of being hyper-local.
 */

import type { Category } from './types';

// ---------------------------------------------------------------------------
// Products and stock
// ---------------------------------------------------------------------------

export type DietaryTag = 'pure_veg' | 'halal' | 'jain' | 'fssai_5star';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  nameTa?: string;
  category: Category;
  /** 'strip of 15', '1 kg', '500 ml' — matches what OrderItem.unit carries. */
  unit: string;
  /** Printed maximum retail price. Paise. */
  mrpPaise: number;
  /** What DFC actually charges. Paise, never above MRP. */
  sellPaise: number;
  stockQty: number;
  /** Below this, the product shows as low and the console nags. */
  lowStockAt: number;
  /** Pharmacy items that legally need a prescription on file. */
  prescriptionOnly?: boolean;
  dietary?: DietaryTag[];
  isActive: boolean;
  updatedAt: number;
}

export type StockState = 'out' | 'low' | 'ok';

export function stockState(p: Product): StockState {
  if (p.stockQty <= 0) return 'out';
  if (p.stockQty <= p.lowStockAt) return 'low';
  return 'ok';
}

export const STOCK_LABEL: Record<StockState, { en: string; ta: string }> = {
  out: { en: 'Out of stock', ta: 'கையிருப்பில் இல்லை' },
  low: { en: 'Low stock', ta: 'குறைவாக உள்ளது' },
  ok: { en: 'In stock', ta: 'உள்ளது' },
};

/** Margin in paise, and as a percentage of the sell price. */
export function margin(p: Product): { paise: number; percent: number } {
  const paise = p.sellPaise - Math.round(p.mrpPaise * 0.82); // assumed 18% trade discount
  const percent = p.sellPaise > 0 ? (paise / p.sellPaise) * 100 : 0;
  return { paise, percent: Math.round(percent * 10) / 10 };
}

export const isDiscounted = (p: Product): boolean => p.sellPaise < p.mrpPaise;

export function discountPercent(p: Product): number {
  if (p.mrpPaise <= 0 || p.sellPaise >= p.mrpPaise) return 0;
  return Math.round(((p.mrpPaise - p.sellPaise) / p.mrpPaise) * 100);
}

/**
 * Matches a free-text item name from the model against the catalogue, so an
 * order can be priced automatically instead of by hand. Deliberately
 * conservative: a near miss returns null rather than the wrong medicine.
 */
export function matchProduct(items: Product[], name: string, unit?: string): Product | null {
  const needle = name.trim().toLowerCase();
  if (!needle) return null;

  const exact = items.find((p) => p.name.toLowerCase() === needle);
  if (exact) return exact;

  const withUnit = unit?.trim().toLowerCase();
  const candidates = items.filter((p) => {
    const hay = p.name.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;

  // Several partial matches — only accept one if the unit disambiguates it.
  if (withUnit) {
    const byUnit = candidates.filter((p) => p.unit.toLowerCase() === withUnit);
    if (byUnit.length === 1) return byUnit[0]!;
  }
  return null;
}

export interface CreateProductInput {
  id?: string;
  storeId: string;
  name: string;
  nameTa?: string;
  category: Category;
  unit: string;
  mrpPaise: number;
  sellPaise: number;
  stockQty?: number;
  lowStockAt?: number;
  isActive?: boolean;
}

export function createProduct(input: CreateProductInput): Product {
  const now = Date.now();
  const id =
    input.id ??
    `${input.storeId}__${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    storeId: input.storeId,
    name: input.name.trim(),
    ...(input.nameTa ? { nameTa: input.nameTa.trim() } : {}),
    category: input.category,
    unit: input.unit.trim(),
    mrpPaise: input.mrpPaise,
    sellPaise: input.sellPaise,
    stockQty: input.stockQty ?? 20,
    lowStockAt: input.lowStockAt ?? 5,
    isActive: input.isActive ?? true,
    updatedAt: now,
  };
}

export function toggleProductActive(product: Product, isActive?: boolean): Product {
  return {
    ...product,
    isActive: isActive !== undefined ? isActive : !product.isActive,
    updatedAt: Date.now(),
  };
}

export function deleteProductFromList(products: Product[], productId: string): Product[] {
  return products.filter((p) => p.id !== productId);
}

// ---------------------------------------------------------------------------
// Promotions and in-app ads
// ---------------------------------------------------------------------------

export type PromoKind = 'banner' | 'coupon' | 'combo';
export type DiscountKind = 'flat' | 'percent' | 'free_delivery';
export type PromoStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'ended';

/** The visual half — what the customer actually sees in the thread. */
export interface PromoCreative {
  headline: string;
  headlineTa?: string;
  sub: string;
  /** One of the four category hues, or 'neutral'. */
  accent: Category | 'neutral';
  /** Storage path of an optional image. */
  imagePath?: string;
  ctaLabel: string;
}

export interface Promotion {
  id: string;
  kind: PromoKind;
  status: PromoStatus;

  creative: PromoCreative;

  discountKind: DiscountKind;
  /** Paise for 'flat', whole percent for 'percent', ignored for free delivery. */
  discountValue: number;
  /** Never discount more than this, whatever the percentage works out to. */
  maxDiscountPaise: number;
  minOrderPaise: number;

  couponCode?: string;

  /** Empty means every category. */
  categories: Category[];
  /** Empty means all of Madurai. */
  localityIds: string[];

  startsAt: number;
  endsAt: number;

  /** Spend cap in paise. The promo pauses itself when spent hits it. */
  budgetPaise: number;
  spentPaise: number;

  /** Counters, incremented server-side. */
  impressions: number;
  clicks: number;
  redemptions: number;
  /** Revenue attributable to this promo, paise. */
  revenuePaise: number;

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export const PROMO_STATUS_LABEL: Record<PromoStatus, { en: string; ta: string }> = {
  draft: { en: 'Draft', ta: 'வரைவு' },
  scheduled: { en: 'Scheduled', ta: 'திட்டமிடப்பட்டது' },
  live: { en: 'Live', ta: 'நடப்பில்' },
  paused: { en: 'Paused', ta: 'நிறுத்தப்பட்டது' },
  ended: { en: 'Ended', ta: 'முடிந்தது' },
};

/**
 * The real status, derived from the clock and the budget rather than trusted
 * from the stored field — a promo whose window closed is over, whatever the
 * document says.
 */
export function effectiveStatus(p: Promotion, now = Date.now()): PromoStatus {
  if (p.status === 'draft' || p.status === 'paused') return p.status;
  if (now > p.endsAt) return 'ended';
  if (p.budgetPaise > 0 && p.spentPaise >= p.budgetPaise) return 'paused';
  if (now < p.startsAt) return 'scheduled';
  return 'live';
}

export interface PromoContext {
  category: Category;
  localityId: string;
  itemsPaise: number;
  deliveryPaise: number;
  couponCode?: string;
}

/** Does this promo apply to this basket right now? */
export function promoApplies(p: Promotion, ctx: PromoContext, now = Date.now()): boolean {
  if (effectiveStatus(p, now) !== 'live') return false;
  if (ctx.itemsPaise < p.minOrderPaise) return false;
  if (p.categories.length > 0 && !p.categories.includes(ctx.category)) return false;
  if (p.localityIds.length > 0 && !p.localityIds.includes(ctx.localityId)) return false;
  if (p.kind === 'coupon') {
    if (!p.couponCode) return false;
    if (ctx.couponCode?.trim().toUpperCase() !== p.couponCode.toUpperCase()) return false;
  }
  return true;
}

/** Discount in paise. Never exceeds the cap, never exceeds the basket. */
export function discountFor(p: Promotion, ctx: PromoContext, now = Date.now()): number {
  if (!promoApplies(p, ctx, now)) return 0;

  let raw: number;
  switch (p.discountKind) {
    case 'flat':
      raw = p.discountValue;
      break;
    case 'percent':
      raw = Math.round((ctx.itemsPaise * p.discountValue) / 100);
      break;
    case 'free_delivery':
      raw = ctx.deliveryPaise;
      break;
  }

  const capped = p.maxDiscountPaise > 0 ? Math.min(raw, p.maxDiscountPaise) : raw;
  return Math.max(0, Math.min(capped, ctx.itemsPaise + ctx.deliveryPaise));
}

/** Picks the single best promo for a basket — they never stack. */
export function bestPromo(
  promos: Promotion[],
  ctx: PromoContext,
  now = Date.now(),
): { promo: Promotion; discountPaise: number } | null {
  let best: { promo: Promotion; discountPaise: number } | null = null;
  for (const p of promos) {
    const d = discountFor(p, ctx, now);
    if (d > 0 && (!best || d > best.discountPaise)) best = { promo: p, discountPaise: d };
  }
  return best;
}

// --- performance ------------------------------------------------------------

export const ctr = (p: Promotion): number =>
  p.impressions === 0 ? 0 : Math.round((p.clicks / p.impressions) * 1000) / 10;

export const conversionRate = (p: Promotion): number =>
  p.clicks === 0 ? 0 : Math.round((p.redemptions / p.clicks) * 1000) / 10;

/** Return on ad spend — revenue per rupee of discount given away. */
export const roas = (p: Promotion): number =>
  p.spentPaise === 0 ? 0 : Math.round((p.revenuePaise / p.spentPaise) * 100) / 100;

export const budgetUsed = (p: Promotion): number =>
  p.budgetPaise === 0 ? 0 : Math.min(100, Math.round((p.spentPaise / p.budgetPaise) * 100));

export function blankPromotion(id: string, createdBy: string): Promotion {
  const now = Date.now();
  return {
    id,
    kind: 'banner',
    status: 'draft',
    creative: {
      headline: '',
      sub: '',
      accent: 'neutral',
      ctaLabel: 'Order now',
    },
    discountKind: 'percent',
    discountValue: 10,
    maxDiscountPaise: 10000,
    minOrderPaise: 20000,
    categories: [],
    localityIds: [],
    startsAt: now,
    endsAt: now + 7 * 24 * 60 * 60 * 1000,
    budgetPaise: 500000,
    spentPaise: 0,
    impressions: 0,
    clicks: 0,
    redemptions: 0,
    revenuePaise: 0,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
