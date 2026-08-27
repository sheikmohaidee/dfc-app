/**
 * The order state machine.
 *
 * Every surface writes status through `transition()`. Firestore rules mirror
 * the same table (firebase/firestore.rules) so a compromised client cannot
 * skip a step — the client-side check is for UX, the rules are the guard.
 */

import type { BoardColumn, OrderStatus, Role, TimelineEvent } from './types';

/** Who may move an order out of a given status, and where to. */
const TRANSITIONS: Record<OrderStatus, { to: OrderStatus[]; by: Role[] }> = {
  incoming: { to: ['admin_review', 'cancelled', 'rejected'], by: ['admin'] },
  admin_review: { to: ['awaiting_payment', 'cancelled', 'rejected'], by: ['admin'] },
  awaiting_payment: { to: ['paid', 'cancelled'], by: ['admin', 'customer'] },
  paid: { to: ['vendor_accepted', 'rejected', 'cancelled'], by: ['vendor', 'admin'] },
  vendor_accepted: { to: ['packing', 'cancelled'], by: ['vendor', 'admin'] },
  packing: { to: ['ready_for_pickup', 'cancelled'], by: ['vendor', 'admin'] },
  ready_for_pickup: { to: ['dispatched', 'cancelled'], by: ['admin'] },
  dispatched: { to: ['picked_up', 'cancelled'], by: ['rider', 'admin'] },
  picked_up: { to: ['out_for_delivery', 'cancelled'], by: ['rider', 'admin'] },
  out_for_delivery: { to: ['delivered', 'cancelled'], by: ['rider', 'admin'] },
  delivered: { to: [], by: [] },
  cancelled: { to: [], by: [] },
  rejected: { to: ['admin_review'], by: ['admin'] },
};

export function canTransition(from: OrderStatus, to: OrderStatus, role: Role): boolean {
  const rule = TRANSITIONS[from];
  if (!rule) return false;
  return rule.to.includes(to) && rule.by.includes(role);
}

export function nextStatuses(from: OrderStatus, role: Role): OrderStatus[] {
  const rule = TRANSITIONS[from];
  if (!rule || !rule.by.includes(role)) return [];
  return rule.to;
}

export class TransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus, role: Role) {
    super(`A ${role} cannot move an order from "${from}" to "${to}".`);
    this.name = 'TransitionError';
  }
}

/**
 * Returns the timeline event to append. Throws if the move is not allowed, so
 * callers can wrap it in a Firestore transaction and fail loudly.
 */
export function transition(
  from: OrderStatus,
  to: OrderStatus,
  role: Role,
  by: string,
  note?: string,
): TimelineEvent {
  if (!canTransition(from, to, role)) throw new TransitionError(from, to, role);
  return { status: to, at: Date.now(), by, ...(note ? { note } : {}) };
}

// ---------------------------------------------------------------------------
// Board mapping
// ---------------------------------------------------------------------------

/** Statuses that are still moving, in the order the board shows them. */
export const COLUMN_STATUSES: Record<BoardColumn, OrderStatus[]> = {
  incoming: ['incoming'],
  review: ['admin_review'],
  payment: ['awaiting_payment'],
  dispatched: [
    'paid',
    'vendor_accepted',
    'packing',
    'ready_for_pickup',
    'dispatched',
    'picked_up',
    'out_for_delivery',
  ],
};

export const BOARD_COLUMNS: BoardColumn[] = ['incoming', 'review', 'payment', 'dispatched'];

export function columnOf(status: OrderStatus): BoardColumn | null {
  for (const col of BOARD_COLUMNS) {
    if (COLUMN_STATUSES[col].includes(status)) return col;
  }
  return null; // delivered / cancelled / rejected leave the board
}

/** Every status that still belongs on the board — the live-query filter. */
export const OPEN_STATUSES: OrderStatus[] = BOARD_COLUMNS.flatMap((c) => COLUMN_STATUSES[c]);

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'rejected'];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const STATUS_LABEL: Record<OrderStatus, { en: string; ta: string }> = {
  incoming: { en: 'New request', ta: 'புதிய கோரிக்கை' },
  admin_review: { en: 'Under review', ta: 'சரிபார்ப்பில்' },
  awaiting_payment: { en: 'Awaiting payment', ta: 'பணத்திற்காக காத்திருப்பு' },
  paid: { en: 'Paid', ta: 'பணம் செலுத்தப்பட்டது' },
  vendor_accepted: { en: 'Store accepted', ta: 'கடை ஏற்றுக்கொண்டது' },
  packing: { en: 'Packing', ta: 'தயாராகிறது' },
  ready_for_pickup: { en: 'Ready for pickup', ta: 'எடுக்க தயார்' },
  dispatched: { en: 'Rider assigned', ta: 'டெலிவரிக்கு அனுப்பப்பட்டது' },
  picked_up: { en: 'Picked up', ta: 'பொருள் எடுத்தாயிற்று' },
  out_for_delivery: { en: 'Out for delivery', ta: 'வழியில் உள்ளது' },
  delivered: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
  cancelled: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  rejected: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
};

export const COLUMN_LABEL: Record<BoardColumn, { en: string; ta: string }> = {
  incoming: { en: 'Incoming AI Requests', ta: 'புதிய கோரிக்கைகள்' },
  review: { en: 'Admin Review & Pricing', ta: 'சரிபார்ப்பு & விலை' },
  payment: { en: 'Awaiting Customer Payment', ta: 'பணத்திற்காக காத்திருப்பு' },
  dispatched: { en: 'Dispatched to Rider', ta: 'டெலிவரிக்கு அனுப்பப்பட்டது' },
};
