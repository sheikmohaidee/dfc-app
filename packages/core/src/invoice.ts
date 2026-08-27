/**
 * Invoicing.
 *
 * ── What DFC is actually selling ────────────────────────────────────────────
 * This is the bit most delivery-app invoices get wrong, so it is worth being
 * explicit. DFC is a courier and errand service. It does not sell paracetamol
 * — the pharmacy does. So a DFC tax invoice has two different kinds of line:
 *
 *   Reimbursement   what DFC paid the shop on the customer's behalf. A
 *                   pure-agent recovery under Rule 33 of the CGST Rules. No
 *                   GST is charged on it by DFC, because DFC is not supplying
 *                   the goods — the shop's own GST is already inside the MRP.
 *
 *   Taxable supply  the delivery fee and any concierge/service fee. This is
 *                   DFC's own service, and it attracts GST at 18%.
 *
 * Charging GST on the whole basket would be double taxation on the goods and
 * would not survive an audit. Charging none would understate DFC's own supply.
 *
 * Place of supply is Tamil Nadu and DFC is registered in Tamil Nadu, so every
 * invoice is intra-state: CGST 9% + SGST 9%. `TAX` below is the single place
 * to change that if you ever register elsewhere.
 *
 * NOT LEGAL OR TAX ADVICE. The structure is right and the arithmetic is right;
 * whether pure-agent treatment applies to your exact contracts with stores is
 * a question for your CA, and the answer changes what `reimbursement` means.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { COMPANY, PHARMACY_DISCLOSURE } from './legal';
import { formatInr } from './money';
import type { Order } from './types';

/** SAC 9968 — postal and courier services. */
export const SAC_COURIER = '996813';
/** SAC 9985 — support services, used for the concierge errand fee. */
export const SAC_ERRAND = '998599';

export const TAX = {
  /** Combined GST rate on DFC's own services. */
  ratePercent: 18,
  /** Intra-state splits in half; change this if you register outside TN. */
  intraState: true,
  placeOfSupply: 'Tamil Nadu (33)',
} as const;

export type LineKind = 'reimbursement' | 'service';

export interface InvoiceLine {
  description: string;
  descriptionTa?: string;
  kind: LineKind;
  /** SAC/HSN. Only meaningful on taxable lines. */
  sac?: string;
  quantity: number;
  /** Paise, per unit, exclusive of DFC's GST. */
  unitPaise: number;
  /** Paise. quantity × unitPaise. */
  taxablePaise: number;
  /** Paise. Zero on reimbursement lines. */
  cgstPaise: number;
  sgstPaise: number;
  totalPaise: number;
}

export interface Invoice {
  /** DFC/2026-27/000123 */
  number: string;
  orderId: string;
  orderCode: number;
  issuedAt: number;

  supplier: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    /** Legally required on any invoice covering food or grocery delivery. */
    fssai: string;
  };

  customer: {
    name: string;
    phone: string;
    address: string;
  };

  lines: InvoiceLine[];

  /** Paise. Goods bought on the customer's behalf — outside DFC's GST. */
  reimbursementPaise: number;
  /** Paise. DFC's own taxable supply, before GST. */
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  /** Paise. reimbursement + taxable + tax, before rounding. */
  subtotalPaise: number;
  /** Paise. Rounded to the nearest rupee, as invoices are. */
  roundOffPaise: number;
  totalPaise: number;

  amountInWords: string;
  placeOfSupply: string;
  /** Reverse charge does not apply to B2C courier services. */
  reverseCharge: boolean;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

/** Indian financial year: April to March. 2026-08 -> "2026-27". */
export function financialYear(at = Date.now()): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/**
 * A GST invoice number must be unique, sequential and unbroken within a
 * financial year. The sequence comes from a Firestore counter, not from a
 * timestamp or a random id — gaps are a compliance problem.
 */
export function invoiceNumber(sequence: number, at = Date.now()): string {
  return `DFC/${financialYear(at)}/${String(sequence).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Amount in words
// ---------------------------------------------------------------------------

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]!;
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t]! + (o ? ` ${ONES[o]}` : '');
}

/**
 * Indian numbering: crore, lakh, thousand, hundred. An invoice is legally
 * required to carry the amount in words, and "Rupees One Lakh Twenty" is what
 * an Indian auditor expects — not "One Hundred Twenty Thousand".
 */
export function amountInWords(paise: number): string {
  const rupees = Math.round(paise / 100);
  if (rupees === 0) return 'Rupees Zero Only';

  const parts: string[] = [];
  let n = rupees;

  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1_000);
  n %= 1_000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));

  return `Rupees ${parts.join(' ')} Only`;
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/**
 * Splits a GST-inclusive service charge into its taxable base and tax.
 *
 * The fee the customer was quoted is what they pay — so the ₹29 delivery fee
 * is inclusive of GST, and the base is ₹29 / 1.18. Quoting exclusive and
 * adding tax at the end would mean the total on the invoice does not match the
 * total the customer approved, which is the fastest way to a support call.
 */
export function splitInclusive(inclusivePaise: number): {
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
} {
  const taxable = Math.round((inclusivePaise * 100) / (100 + TAX.ratePercent));
  const tax = inclusivePaise - taxable;
  // Halve the tax, giving the odd paisa to CGST so the parts always re-sum.
  const cgst = Math.ceil(tax / 2);
  const sgst = tax - cgst;
  return { taxablePaise: taxable, cgstPaise: cgst, sgstPaise: sgst };
}

export interface BuildInvoiceInput {
  order: Order;
  sequence: number;
  issuedAt?: number;
}

export function buildInvoice({ order, sequence, issuedAt = Date.now() }: BuildInvoiceInput): Invoice {
  const lines: InvoiceLine[] = [];

  // --- goods: pure-agent reimbursement, no DFC GST -------------------------
  for (const item of order.items) {
    if (!item.included || item.unitPricePaise === null) continue;
    const total = item.unitPricePaise * item.quantity;
    lines.push({
      description: item.name,
      ...(item.nameTa ? { descriptionTa: item.nameTa } : {}),
      kind: 'reimbursement',
      quantity: item.quantity,
      unitPaise: item.unitPricePaise,
      taxablePaise: total,
      cgstPaise: 0,
      sgstPaise: 0,
      totalPaise: total,
    });
  }

  for (const stop of order.stops ?? []) {
    if (stop.available !== true || stop.costPaise === null) continue;
    lines.push({
      description: `${stop.storeName} — ${stop.what}`,
      kind: 'reimbursement',
      quantity: 1,
      unitPaise: stop.costPaise,
      taxablePaise: stop.costPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      totalPaise: stop.costPaise,
    });
  }

  // --- DFC's own services: taxable at 18% ----------------------------------
  if (order.pricing.deliveryPaise > 0) {
    const s = splitInclusive(order.pricing.deliveryPaise);
    lines.push({
      description: 'Delivery service',
      descriptionTa: 'டெலிவரி கட்டணம்',
      kind: 'service',
      sac: SAC_COURIER,
      quantity: 1,
      unitPaise: s.taxablePaise,
      taxablePaise: s.taxablePaise,
      cgstPaise: s.cgstPaise,
      sgstPaise: s.sgstPaise,
      totalPaise: order.pricing.deliveryPaise,
    });
  }

  if (order.pricing.servicePaise > 0) {
    const s = splitInclusive(order.pricing.servicePaise);
    lines.push({
      description: 'Concierge service',
      descriptionTa: 'சேவை கட்டணம்',
      kind: 'service',
      sac: SAC_ERRAND,
      quantity: 1,
      unitPaise: s.taxablePaise,
      taxablePaise: s.taxablePaise,
      cgstPaise: s.cgstPaise,
      sgstPaise: s.sgstPaise,
      totalPaise: order.pricing.servicePaise,
    });
  }

  const reimbursement = lines
    .filter((l) => l.kind === 'reimbursement')
    .reduce((s, l) => s + l.totalPaise, 0);
  const taxable = lines.filter((l) => l.kind === 'service').reduce((s, l) => s + l.taxablePaise, 0);
  const cgst = lines.reduce((s, l) => s + l.cgstPaise, 0);
  const sgst = lines.reduce((s, l) => s + l.sgstPaise, 0);

  const subtotal = reimbursement + taxable + cgst + sgst;
  const total = Math.round(subtotal / 100) * 100; // nearest rupee
  const roundOff = total - subtotal;

  return {
    number: invoiceNumber(sequence, issuedAt),
    orderId: order.id,
    orderCode: order.code,
    issuedAt,

    supplier: {
      name: COMPANY.legalName,
      address: COMPANY.address,
      gstin: COMPANY.gstin,
      state: 'Tamil Nadu (33)',
      fssai: COMPANY.fssaiLicence,
    },

    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.addressLine,
    },

    lines,
    reimbursementPaise: reimbursement,
    taxablePaise: taxable,
    cgstPaise: cgst,
    sgstPaise: sgst,
    subtotalPaise: subtotal,
    roundOffPaise: roundOff,
    totalPaise: total,

    amountInWords: amountInWords(total),
    placeOfSupply: TAX.placeOfSupply,
    reverseCharge: false,
    notes: [
      'Goods are supplied by the listed store. Dinasari Food Courier acts as a pure agent under Rule 33 of the CGST Rules and recovers their cost without markup.',
      'GST is charged only on delivery and service fees, which are Dinasari Food Courier’s own supply.',
      ...(order.category === 'pharmacy' ? [PHARMACY_DISCLOSURE.en] : []),
    ],
  };
}

/**
 * True when the invoice arithmetic is internally consistent. Worth asserting
 * before writing one — a tax invoice whose lines do not sum to its total is a
 * problem you find out about from an auditor, not from a user.
 */
export function invoiceBalances(inv: Invoice): boolean {
  const lineSum = inv.lines.reduce((s, l) => s + l.totalPaise, 0);
  return lineSum === inv.subtotalPaise && inv.subtotalPaise + inv.roundOffPaise === inv.totalPaise;
}

/** A one-line summary for a list row. */
export function invoiceSummary(inv: Invoice): string {
  return `${inv.number} · ${formatInr(inv.totalPaise)}`;
}
