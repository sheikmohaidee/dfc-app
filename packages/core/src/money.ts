/**
 * Money.
 *
 * One rule: money is an integer number of paise everywhere — in Firestore, in
 * props, in the AI contract. Floats never touch a rupee amount. Only these
 * helpers turn paise into something a human reads.
 */

/** ₹1 = 100 paise. */
export const PAISE = 100;

export const rupees = (paise: number): number => paise / PAISE;
export const toPaise = (rupees: number): number => Math.round(rupees * PAISE);

/**
 * Indian digit grouping: last three digits, then pairs.
 *   1234    -> 1,234
 *   124500  -> 1,24,500
 *   10000000 -> 1,00,00,000
 */
export function groupIndian(n: number): string {
  const neg = n < 0;
  const s = Math.abs(Math.trunc(n)).toString();
  if (s.length <= 3) return (neg ? '-' : '') + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}${grouped},${last3}`;
}

export interface FormatInrOptions {
  /**
   * Show paise. Off by default — customer surfaces are whole rupees; only the
   * vendor payout ledger turns this on.
   */
  paise?: boolean;
  /** Drop the ₹ symbol (for inputs that render their own prefix). */
  bare?: boolean;
}

/** `formatInr(24300)` -> `'₹243'` */
export function formatInr(amountPaise: number, opts: FormatInrOptions = {}): string {
  const sym = opts.bare ? '' : '₹';
  if (opts.paise) {
    const whole = Math.trunc(Math.abs(amountPaise) / PAISE);
    const frac = Math.abs(amountPaise) % PAISE;
    const sign = amountPaise < 0 ? '-' : '';
    return `${sign}${sym}${groupIndian(whole)}.${frac.toString().padStart(2, '0')}`;
  }
  return `${amountPaise < 0 ? '-' : ''}${sym}${groupIndian(Math.round(Math.abs(amountPaise) / PAISE))}`;
}

/** Nothing priced yet. Rendered in verify-amber, never as a zero. */
export const UNPRICED = '₹ —';

/**
 * An AI estimate the model is not sure about. The trailing question mark is
 * part of the design system, not decoration — see the Foundations artboard.
 */
export const estimate = (amountPaise: number): string => `${formatInr(amountPaise)}?`;

/** `priceLabel(null)` -> '₹ —'  ·  `priceLabel(12400, 0.4)` -> '₹124?' */
export function priceLabel(
  amountPaise: number | null,
  confidence = 1,
  threshold = 0.6,
): string {
  if (amountPaise === null) return UNPRICED;
  return confidence < threshold ? estimate(amountPaise) : formatInr(amountPaise);
}

// ---------------------------------------------------------------------------
// Totals
// ---------------------------------------------------------------------------

import type { ConciergeStop, OrderItem, Pricing } from './types';

/** Base delivery fee before distance, in paise. */
export const BASE_DELIVERY_PAISE = 2500;
/** Added per kilometre beyond the first two. */
export const PER_KM_PAISE = 800;
/** Concierge multi-stop surcharge, per extra stop. */
export const PER_EXTRA_STOP_PAISE = 1500;
/** Flat fee for running an ad-hoc errand. */
export const CONCIERGE_SERVICE_PAISE = 2500;

export function suggestDeliveryPaise(distanceKm: number, stops = 1): number {
  const beyond = Math.max(0, distanceKm - 2);
  const extraStops = Math.max(0, stops - 1);
  const raw =
    BASE_DELIVERY_PAISE +
    Math.round(beyond * PER_KM_PAISE) +
    extraStops * PER_EXTRA_STOP_PAISE;
  // Round to the nearest ₹5 — riders and customers deal in notes, not paise.
  return Math.round(raw / 500) * 500;
}

export function itemsTotalPaise(items: OrderItem[]): number {
  return items.reduce((sum, it) => {
    if (!it.included || it.unitPricePaise === null) return sum;
    return sum + it.unitPricePaise * it.quantity;
  }, 0);
}

export function stopsTotalPaise(stops: ConciergeStop[] = []): number {
  return stops.reduce((sum, s) => sum + (s.available && s.costPaise ? s.costPaise : 0), 0);
}

/** Recomputes a whole Pricing block. The single source of truth for totals. */
export function computePricing(input: {
  items?: OrderItem[];
  stops?: ConciergeStop[];
  deliveryPaise: number;
  servicePaise?: number;
}): Pricing {
  const itemsPaise = itemsTotalPaise(input.items ?? []) + stopsTotalPaise(input.stops);
  const servicePaise = input.servicePaise ?? 0;
  return {
    itemsPaise,
    deliveryPaise: input.deliveryPaise,
    servicePaise,
    totalPaise: itemsPaise + input.deliveryPaise + servicePaise,
  };
}

/** True when every included item has a price — the gate on "send to customer". */
export function isFullyPriced(items: OrderItem[], stops: ConciergeStop[] = []): boolean {
  const itemsOk = items.every((i) => !i.included || i.unitPricePaise !== null);
  const stopsOk = stops.every((s) => s.available === false || s.costPaise !== null);
  return itemsOk && stopsOk;
}
