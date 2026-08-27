/**
 * Payments.
 *
 * Three ways money moves in this product, and they are genuinely different:
 *
 *   cash      the rider collects at the door. Needs change arithmetic and a
 *             shift-end reconciliation, not a gateway.
 *   upi_intent a deep link into GPay/PhonePe/Paytm. Works with no gateway and
 *             no merchant onboarding — which is how most small Indian
 *             businesses actually take money. The catch is honest below.
 *   gateway   Razorpay/PhonePe hosted checkout. The only option that can
 *             *verify* a payment without a human looking.
 *
 * ── The thing to understand about UPI intent links ──────────────────────────
 * A `upi://pay` link opens the payer's app and it works. What it cannot do is
 * tell you the money arrived: there is no callback a client can trust. The
 * payer's app returns a status string that a modified app can forge, so
 * treating it as proof is how you get robbed.
 *
 * So `upi_intent` here always lands in `awaiting_confirmation`, and a human on
 * the DFC side matches it against the bank statement or the UPI SMS before the
 * order moves. That is a real, working, honest flow for day one — and
 * `gateway` is wired as a drop-in replacement for when credentials exist, at
 * which point a webhook confirms and the human step disappears.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { formatInr } from './money';
import type { PaymentStatus as OrderPaymentStatus } from './types';

export type PaymentMethod = 'cash' | 'upi_intent' | 'gateway';

/**
 * The payment lifecycle. Deliberately separate from OrderStatus: an order can
 * be delivered while its payment is still being reconciled, and a refund can
 * happen long after.
 */
export type PaymentState =
  | 'unpaid' //                 nothing attempted
  | 'awaiting_customer' //      link sent, customer has not acted
  | 'awaiting_confirmation' //  customer says they paid; DFC has not verified
  | 'paid' //                   verified
  | 'collected' //              cash in the rider's hand
  | 'settled' //                cash handed in at shift end
  | 'failed'
  | 'refund_pending'
  | 'refunded';

export const PAYMENT_STATE_LABEL: Record<PaymentState, { en: string; ta: string }> = {
  unpaid: { en: 'Not paid', ta: 'பணம் செலுத்தப்படவில்லை' },
  awaiting_customer: { en: 'Waiting for payment', ta: 'பணத்திற்காக காத்திருப்பு' },
  awaiting_confirmation: { en: 'Checking payment', ta: 'சரிபார்க்கப்படுகிறது' },
  paid: { en: 'Paid', ta: 'பணம் செலுத்தப்பட்டது' },
  collected: { en: 'Cash collected', ta: 'பணம் வாங்கப்பட்டது' },
  settled: { en: 'Settled', ta: 'ஒப்படைக்கப்பட்டது' },
  failed: { en: 'Payment failed', ta: 'பணம் செலுத்த முடியவில்லை' },
  refund_pending: { en: 'Refund on the way', ta: 'பணம் திரும்ப வருகிறது' },
  refunded: { en: 'Refunded', ta: 'பணம் திரும்பியது' },
};

/** Which states mean DFC has the money (or a rider does). */
export const SETTLED_STATES: PaymentState[] = ['paid', 'collected', 'settled'];
export const isPaid = (s: PaymentState): boolean => SETTLED_STATES.includes(s);

/** Legal next states, so a client cannot invent a transition. */
const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  unpaid: ['awaiting_customer', 'awaiting_confirmation', 'collected', 'paid', 'failed'],
  awaiting_customer: ['awaiting_confirmation', 'paid', 'failed', 'unpaid'],
  awaiting_confirmation: ['paid', 'failed', 'unpaid'],
  paid: ['refund_pending'],
  collected: ['settled', 'refund_pending'],
  settled: ['refund_pending'],
  failed: ['unpaid', 'awaiting_customer'],
  refund_pending: ['refunded'],
  refunded: [],
};

export function canTransitionPayment(from: PaymentState, to: PaymentState): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Projects the payment's own state onto the coarse flag denormalised on the
 * order document.
 *
 * These are two different vocabularies on purpose — `Payment.state` is the
 * ledger, `Order.paymentStatus` is what the board and the vendor query on. The
 * mapping lives here so a caller cannot write a PaymentState into a field
 * typed as PaymentStatus, which is exactly the bug this replaced.
 */
export function orderPaymentStatus(state: PaymentState): OrderPaymentStatus {
  switch (state) {
    case 'paid':
      return 'paid';
    case 'collected':
    case 'settled':
      return 'collected';
    case 'awaiting_customer':
    case 'awaiting_confirmation':
      return 'link_sent';
    case 'refund_pending':
    case 'refunded':
      return 'refunded';
    case 'unpaid':
    case 'failed':
      return 'unpaid';
  }
}

// ---------------------------------------------------------------------------
// The payment record
// ---------------------------------------------------------------------------

export interface Payment {
  id: string;
  orderId: string;
  orderCode: number;
  customerUid: string;

  method: PaymentMethod;
  state: PaymentState;

  /** Paise. What was asked for. */
  amountPaise: number;
  /** Paise. What actually arrived — differs when a rider takes a round sum. */
  receivedPaise: number;

  /** UPI: the transaction reference DFC generated and quoted in the link. */
  reference: string;
  /** UPI: the 12-digit UTR the customer reads off their app. */
  utr?: string;
  /** Gateway: provider order/payment ids. */
  gatewayOrderId?: string;
  gatewayPaymentId?: string;

  /** Cash: what the customer handed over, so change is arithmetic not memory. */
  tenderedPaise?: number;
  changePaise?: number;
  /** Cash: which rider is holding it until shift end. */
  heldByUid?: string;

  /** Who confirmed it, for the audit trail. 'webhook' when a gateway did. */
  confirmedBy?: string;
  confirmedAt?: number;

  failureReason?: string;

  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// UPI
// ---------------------------------------------------------------------------

/** Fill this in from your bank / UPI provider before taking a rupee. */
export const UPI_PAYEE = {
  /** Virtual Payment Address, e.g. dinasari@okhdfcbank */
  vpa: '[YOUR-VPA@BANK]',
  /** The name the payer sees in their UPI app. Must match the registered name. */
  name: 'Dinasari Food Courier',
  /** Merchant category code for couriers/local delivery. Optional. */
  mcc: '4215',
} as const;

export const isUpiConfigured = (): boolean => !UPI_PAYEE.vpa.includes('[');

/**
 * A DFC-side reference, quoted in the UPI link and shown to the customer. It
 * is what a human matches against the bank statement, so it has to be short
 * enough to read aloud and unique enough to be unambiguous.
 *
 *   DFC1042A7K3
 */
export function paymentReference(orderCode: number): string {
  const salt = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DFC${orderCode}${salt}`;
}

export interface UpiLinkInput {
  amountPaise: number;
  reference: string;
  orderCode: number;
  /** Override the payee — used by tests and by the emulator. */
  payee?: { vpa: string; name: string };
}

/**
 * Builds a `upi://pay` intent URL.
 *
 * `am` must be a plain decimal with two places; several UPI apps silently drop
 * a malformed amount and open with a blank field, which looks like the app is
 * broken. `cu` must be INR. `tn` is capped because some apps truncate it and
 * others reject the whole link.
 */
export function buildUpiUrl(input: UpiLinkInput): string {
  const payee = input.payee ?? UPI_PAYEE;
  const rupees = (input.amountPaise / 100).toFixed(2);
  const note = `DFC order ${input.orderCode}`.slice(0, 50);

  // Hand-encoded rather than URLSearchParams: that encodes a space as "+",
  // and several UPI apps render the payee note literally with the plus signs
  // in it. encodeURIComponent gives %20, which every app decodes correctly.
  const params: [string, string][] = [
    ['pa', payee.vpa],
    ['pn', payee.name],
    ['am', rupees],
    ['cu', 'INR'],
    ['tn', note],
    ['tr', input.reference],
  ];

  const query = params
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  return `upi://pay?${query}`;
}

/** The apps worth offering by name. `null` scheme means "any UPI app". */
export interface UpiApp {
  id: string;
  name: string;
  /** iOS needs a per-app scheme; Android resolves `upi://` to a chooser. */
  iosScheme: string | null;
  androidPackage: string | null;
}

export const UPI_APPS: UpiApp[] = [
  { id: 'gpay', name: 'Google Pay', iosScheme: 'gpay://upi/pay', androidPackage: 'com.google.android.apps.nbu.paisa.user' },
  { id: 'phonepe', name: 'PhonePe', iosScheme: 'phonepe://pay', androidPackage: 'com.phonepe.app' },
  { id: 'paytm', name: 'Paytm', iosScheme: 'paytmmp://pay', androidPackage: 'net.one97.paytm' },
  { id: 'bhim', name: 'BHIM', iosScheme: 'bhim://upi/pay', androidPackage: 'in.org.npci.upiapp' },
  { id: 'any', name: 'Other UPI app', iosScheme: null, androidPackage: null },
];

/** Swaps the scheme while keeping the query, for the iOS per-app links. */
export function upiUrlFor(app: UpiApp, base: string): string {
  if (!app.iosScheme) return base;
  const query = base.slice(base.indexOf('?'));
  return `${app.iosScheme}${query}`;
}

/** A UTR is 12 digits. Rejecting a bad one early saves a reconciliation call. */
export function isValidUtr(utr: string): boolean {
  return /^\d{12}$/.test(utr.trim());
}

// ---------------------------------------------------------------------------
// Cash
// ---------------------------------------------------------------------------

/**
 * Every denomination in circulation, largest first — notes down to ₹10, then
 * coins. The coins matter: a bill of ₹243 paid with ₹500 needs ₹257 back, and
 * a breakdown that stops at ₹10 silently loses ₹7 at the doorway.
 */
export const DENOMINATIONS = [
  50000, 20000, 10000, 5000, 2000, 1000, // ₹500 ₹200 ₹100 ₹50 ₹20 ₹10 notes
  500, 200, 100, // ₹5 ₹2 ₹1 coins
] as const;

/** @deprecated Use DENOMINATIONS — this stopped at ₹10 and lost the coins. */
export const NOTES = DENOMINATIONS;

/**
 * The round sums a customer is likely to hand over for a given bill, so the
 * rider taps one instead of doing arithmetic at a doorway in the rain.
 */
export function tenderSuggestions(amountPaise: number): number[] {
  const out = new Set<number>([amountPaise]);
  for (const step of [10000, 20000, 50000]) {
    const rounded = Math.ceil(amountPaise / step) * step;
    if (rounded !== amountPaise) out.add(rounded);
  }
  return [...out].sort((a, b) => a - b).slice(0, 4);
}

export function changeFor(amountPaise: number, tenderedPaise: number): number {
  return Math.max(0, tenderedPaise - amountPaise);
}

/**
 * What to hand back, so a rider does not do arithmetic at a doorway in the
 * rain. Greedy over DENOMINATIONS, which is optimal for the Indian set.
 *
 * The result always sums to exactly `changePaise` — anything else would be
 * worse than useless, because a rider would trust it.
 */
export function changeBreakdown(changePaise: number): { note: number; count: number }[] {
  let left = Math.max(0, Math.round(changePaise));
  const out: { note: number; count: number }[] = [];
  for (const note of DENOMINATIONS) {
    const count = Math.floor(left / note);
    if (count > 0) {
      out.push({ note, count });
      left -= count * note;
    }
  }
  return out;
}

/** Guards the invariant above. Used in tests and asserted in dev builds. */
export function changeBreakdownBalances(changePaise: number): boolean {
  const sum = changeBreakdown(changePaise).reduce((s, b) => s + b.note * b.count, 0);
  return sum === Math.max(0, Math.round(changePaise));
}

export function describeChange(changePaise: number): string {
  if (changePaise === 0) return 'Exact change';
  return changeBreakdown(changePaise)
    .map((b) => `${b.count} × ${formatInr(b.note)}`)
    .join(' + ');
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export function newPayment(input: {
  id: string;
  orderId: string;
  orderCode: number;
  customerUid: string;
  method: PaymentMethod;
  amountPaise: number;
}): Payment {
  const now = Date.now();
  return {
    id: input.id,
    orderId: input.orderId,
    orderCode: input.orderCode,
    customerUid: input.customerUid,
    method: input.method,
    state: input.method === 'cash' ? 'unpaid' : 'awaiting_customer',
    amountPaise: input.amountPaise,
    receivedPaise: 0,
    reference: paymentReference(input.orderCode),
    createdAt: now,
    updatedAt: now,
  };
}

export class PaymentTransitionError extends Error {
  constructor(from: PaymentState, to: PaymentState) {
    super(`A payment cannot move from "${from}" to "${to}".`);
    this.name = 'PaymentTransitionError';
  }
}

export function withPaymentState(
  payment: Payment,
  to: PaymentState,
  patch: Partial<Payment> = {},
): Partial<Payment> {
  if (!canTransitionPayment(payment.state, to)) {
    throw new PaymentTransitionError(payment.state, to);
  }
  return { ...patch, state: to, updatedAt: Date.now() };
}
