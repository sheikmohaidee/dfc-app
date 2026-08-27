/**
 * Runtime validation.
 *
 * The important one is `AiExtractionSchema`. A language model returns a string;
 * everything downstream — the template card, the Kanban ticket, the vendor's
 * packing list — assumes a shape. This file is where the string becomes a shape
 * or fails loudly, and it is the only place that is allowed to trust the model.
 */

import { z } from 'zod';

export const CategorySchema = z.enum(['pharmacy', 'grocery', 'food', 'concierge']);

export const RoleSchema = z.enum(['customer', 'vendor', 'rider', 'admin']);

export const OrderStatusSchema = z.enum([
  'incoming',
  'admin_review',
  'awaiting_payment',
  'paid',
  'vendor_accepted',
  'packing',
  'ready_for_pickup',
  'dispatched',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
]);

// ---------------------------------------------------------------------------
// The AI contract
// ---------------------------------------------------------------------------

/**
 * Below this, an item gets a VERIFY chip in the customer app and becomes a
 * human's job in the admin's review column. Tuned against handwritten Tamil
 * prescriptions, where 0.6 is roughly "legible".
 */
export const CONFIDENCE_THRESHOLD = 0.6;

export const AiItemSchema = z.object({
  /** Exactly as written / spoken, normalised to a dispensable name. */
  name: z.string().min(1).max(120),
  /** Tamil rendering when the input was Tamil; omitted otherwise. */
  nameTa: z.string().max(120).optional(),
  /** 'strip of 15', '1 kg', '100 ml', '2 muzham'. */
  unit: z.string().max(60).default(''),
  quantity: z.number().int().min(1).max(99).default(1),
  /**
   * Rupees, not paise — the model is bad at large integers, so it quotes
   * rupees and `normaliseExtraction` converts. Null when it cannot guess.
   */
  estimatedPriceRupees: z.number().min(0).max(100000).nullable().default(null),
  confidence: z.number().min(0).max(1),
  /** Why the model is unsure — shown to the pharmacist verbatim. */
  note: z.string().max(200).optional(),
  /**
   * The literal text on the paper, before the model expanded it.
   *
   * A prescription says "Pan-40" and `name` becomes "Pantoprazole 40mg". That
   * expansion is usually right and occasionally badly wrong, and the customer
   * cannot check it against a name they never saw. Keeping the raw reading
   * lets the review card show both, which is the difference between "trust
   * us" and "here is what we read".
   *
   * Omitted when the model did not expand anything.
   */
  readAs: z.string().max(120).optional(),
});

export const AiStopSchema = z.object({
  storeName: z.string().min(1).max(120),
  locality: z.string().max(80).default(''),
  what: z.string().min(1).max(200),
});

export const AiExtractionSchema = z.object({
  category: CategorySchema,
  /** Store the model recognised from a letterhead or the customer's words. */
  storeHint: z.string().max(120).nullable().default(null),
  items: z.array(AiItemSchema).max(40).default([]),
  /** Concierge only — an errand is stops, not items. */
  stops: z.array(AiStopSchema).max(6).default([]),
  /** What the model heard, for voice input. */
  transcript: z.string().max(2000).optional(),
  /** One line the customer sees above the card. */
  summary: z.string().max(240).default(''),
  /** True when the input was unreadable and a human should call the customer. */
  needsHuman: z.boolean().default(false),
});

export type AiExtraction = z.infer<typeof AiExtractionSchema>;
export type AiItem = z.infer<typeof AiItemSchema>;

/**
 * The JSON Schema handed to Gemini as `responseSchema`, so the model is
 * constrained at generation time rather than corrected afterwards. Kept
 * hand-written (not generated from zod) because the API accepts only a subset
 * of JSON Schema — no `$ref`, no `oneOf`, no `additionalProperties`.
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['pharmacy', 'grocery', 'food', 'concierge'] },
    storeHint: { type: 'string', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nameTa: { type: 'string' },
          unit: { type: 'string' },
          quantity: { type: 'integer' },
          estimatedPriceRupees: { type: 'number', nullable: true },
          confidence: { type: 'number' },
          note: { type: 'string' },
          readAs: { type: 'string' },
        },
        required: ['name', 'unit', 'quantity', 'confidence'],
      },
    },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          storeName: { type: 'string' },
          locality: { type: 'string' },
          what: { type: 'string' },
        },
        required: ['storeName', 'what'],
      },
    },
    transcript: { type: 'string' },
    summary: { type: 'string' },
    needsHuman: { type: 'boolean' },
  },
  required: ['category', 'items', 'stops', 'summary', 'needsHuman'],
} as const;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export class AiParseError extends Error {
  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
    this.name = 'AiParseError';
  }
}

/**
 * Models sometimes wrap JSON in a ```json fence even when asked not to, and
 * occasionally prepend a sentence. Strip both, then parse.
 */
export function parseAiJson(raw: string): AiExtraction {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // Fall back to the outermost {...} if the model chattered around it.
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

  let json: unknown;
  try {
    json = JSON.parse(candidate);
  } catch (err) {
    throw new AiParseError(`Model did not return JSON: ${(err as Error).message}`, raw);
  }

  const result = AiExtractionSchema.safeParse(json);
  if (!result.success) {
    throw new AiParseError(`Model JSON failed validation: ${result.error.message}`, raw);
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Extraction -> domain
// ---------------------------------------------------------------------------

import { toPaise } from './money';
import type { ConciergeStop, OrderItem } from './types';

const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

/** Turns validated model output into the OrderItems the whole app renders. */
export function toOrderItems(extraction: AiExtraction): OrderItem[] {
  return extraction.items.map((it) => ({
    id: rid('itm'),
    name: it.name,
    ...(it.nameTa ? { nameTa: it.nameTa } : {}),
    unit: it.unit,
    quantity: it.quantity,
    unitPricePaise: it.estimatedPriceRupees === null ? null : toPaise(it.estimatedPriceRupees),
    confidence: it.confidence,
    // Anything the model is unsure of starts unticked: the customer opts in,
    // rather than paying for a guess by default.
    included: it.confidence >= CONFIDENCE_THRESHOLD,
    ...(it.note ? { note: it.note } : {}),
    // Only carried when the model actually expanded something. Storing the
    // raw text on every line would just repeat the name back.
    ...(it.readAs && it.readAs.trim() && it.readAs.trim() !== it.name
      ? { readAs: it.readAs.trim() }
      : {}),
  }));
}

export function toConciergeStops(extraction: AiExtraction): ConciergeStop[] {
  return extraction.stops.map((s) => ({
    id: rid('stop'),
    storeName: s.storeName,
    localityId: s.locality,
    what: s.what,
    available: null,
    costPaise: null,
  }));
}

export function minConfidence(items: OrderItem[]): number {
  if (items.length === 0) return 1;
  return items.reduce((lo, i) => Math.min(lo, i.confidence), 1);
}

export function needsVerification(item: OrderItem): boolean {
  return item.confidence < CONFIDENCE_THRESHOLD;
}
