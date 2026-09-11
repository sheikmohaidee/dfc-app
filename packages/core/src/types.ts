/**
 * Domain types for DFC.
 *
 * These are the shapes that travel between the four surfaces (customer app,
 * vendor app, rider app, admin web) through Firestore. Nothing here imports
 * Firebase — the model stays portable and testable.
 */

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export type Role = 'customer' | 'vendor' | 'rider' | 'admin';

export interface Locality {
  /** Stable slug used in queries: 'kk-nagar' */
  id: string;
  /** 'K.K. Nagar' */
  name: string;
  /** 'கே.கே. நகர்' */
  nameTa: string;
  pincode: string;
}

export interface UserProfile {
  uid: string;
  role: Role;
  name: string;
  phone: string;
  /** Locality id, resolved at sign-in from device location. */
  localityId: string | null;
  /** Free-text address line the customer typed once and reuses. */
  addressLine?: string;
  /** Vendor only — the store this account operates. */
  storeId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RiderCancellationRecord {
  orderId: string;
  orderCode: number | string;
  reason: string;
  explanation?: string;
  timestamp: number;
}

export interface Rider {
  uid: string;
  name: string;
  phone: string;
  isOnline: boolean;
  status?: 'ONLINE' | 'OFFLINE' | 'BUSY';
  offlineReason?: string;
  cancellationCount?: number;
  maxFreeCancellations?: number;
  vehicle?: string;
  rating?: number;
  /** At most one live task at a time in v1. */
  activeOrderId: string | null;
  /** Coarse last-known position, updated while a task is live. */
  lastSeen?: { lat: number; lng: number; at: number };
  /** Daily cancellation count (max 2 per day before forced offline). */
  cancellationsToday?: number;
  /** Limit of allowed cancellations per day (default: 2). */
  maxDailyCancellations?: number;
  /** True when forced offline due to exceeding the cancellation limit. */
  isOfflineDueToCancellations?: boolean;
  /** Explanations/history of cancelled orders. */
  cancellationHistory?: RiderCancellationRecord[];
  /** Last explanation provided to admin after exceeding cancellation limit. */
  explanationGiven?: string;
}

export interface Captain {
  id: string;
  name: string;
  phone: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  offlineReason?: string;
  cancellationCount: number;
  maxFreeCancellations: number;
  vehicle: string;
  rating: number;
  activeOrderId: string | null;
}

export interface OrderCancellation {
  id: string;
  captainId: string;
  captainName: string;
  orderId: string;
  orderCode: number | string;
  reason: string;
  explanation?: string;
  createdAt: number;
  adminReviewStatus: 'pending' | 'reviewed' | 'penalized' | 'waived';
  reviewedAt?: number;
  reviewedBy?: string;
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export type Category =
  | 'food'
  | 'grocery'
  | 'print'
  | 'concierge'
  | 'pickup_drop'
  | 'buy_deliver'
  /** @deprecated Pharmacy removed by client requirement. Kept in union for legacy migration safety. */
  | 'pharmacy';

export const ACTIVE_CATEGORIES: Category[] = [
  'food' as Category,
  'grocery' as Category,
  'print' as Category,
  'concierge' as Category,
  'pickup_drop' as Category,
  'buy_deliver' as Category,
];

export interface Store {
  id: string;
  name: string;
  nameTa: string;
  category: Category;
  localityId: string;
  /** uid of the vendor account that operates this store. */
  ownerUid: string | null;
  phone: string;
  isOpen: boolean;
  /** Minutes, used for the customer-facing ETA estimate. */
  avgPrepMinutes: number;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * The full lifecycle. Every transition is validated by `canTransition` in
 * ./status.ts — nothing writes `status` directly without going through it.
 */
export type OrderStatus =
  | 'incoming' //          AI parsed it; nobody has looked yet
  | 'admin_review' //      an admin is pricing / checking stock
  | 'awaiting_payment' //  price sent to the customer
  | 'paid' //              money in, waiting for the store to accept
  | 'vendor_accepted' //   store said yes
  | 'packing' //           store is assembling it
  | 'ready_for_pickup' //  waiting on a rider at the counter
  | 'dispatched' //        rider assigned, heading to the store
  | 'picked_up' //         rider has the goods
  | 'out_for_delivery' //  rider is en route to the customer
  | 'delivered' //         done
  | 'cancelled' //         customer or admin pulled it
  | 'rejected'; //         store or admin refused it

/** The four columns on the admin board. */
export type BoardColumn = 'incoming' | 'review' | 'payment' | 'dispatched';

export type PaymentMode = 'prepaid' | 'cod';

export type PaymentStatus = 'unpaid' | 'link_sent' | 'paid' | 'collected' | 'refunded';

/** How the customer told us what they wanted. */
export type InputKind = 'photo' | 'voice' | 'text';

export interface OrderSource {
  kind: InputKind;
  /** Cloud Storage path of the photo or the voice note, if any. */
  storagePath?: string;
  /** Voice: what the model heard. Text: what they typed. */
  transcript?: string;
  /** Photo: MIME type we handed to the model. */
  mimeType?: string;
}

export type GateInstructionTag =
  | 'no_bell'
  | 'leave_with_guard'
  | 'pet_inside'
  | 'call_before';

export interface DeliveryInstructions {
  tags: GateInstructionTag[];
  audioMemoUrl?: string;
  audioDurationSeconds?: number;
  textNote?: string;
}

export interface AiTrace {
  model: string;
  /** Milliseconds from request to parsed JSON. */
  latencyMs: number;
  /** Raw model output, kept verbatim so a human can audit a bad parse. */
  raw: string;
  /** Lowest per-item confidence in the batch — drives the VERIFY chip. */
  minConfidence: number;
  parsedAt: number;
}

export interface OrderItem {
  id: string;
  name: string;
  /** Optional Tamil name, when the model or the catalogue supplies one. */
  nameTa?: string;
  /** 'strip of 15', '1 kg', '2 muzham' — free text, shown under the name. */
  unit: string;
  quantity: number;
  /**
   * Paise. Money is integer-only end to end; `formatInr` renders it.
   * `null` means nobody has priced it yet.
   */
  unitPricePaise: number | null;
  /** 0..1 from the model. Below CONFIDENCE_THRESHOLD it needs a human. */
  confidence: number;
  /** Customer unticked it, or the store had none. */
  included: boolean;
  /** Store said no; the admin swapped it for something else. */
  substitutedFor?: string;
  note?: string;

  /** EAN-13 or barcode scanned during packing for zero-error fulfillment verification. */
  ean?: string;
  /** Batch number captured during barcode scanning (pharmacy/FSSAI compliance). */
  batchNumber?: string;
  /** Expiry date string (MM/YY or YYYY-MM) captured during fulfillment. */
  expiryDate?: string;
  /** Verified by barcode scanner. */
  barcodeVerified?: boolean;

  /**
   * The customer corrected what OCR read on this line.
   *
   * Recorded rather than inferred, because it changes who is responsible for
   * the wording: a pharmacist reading the order can see which lines came out
   * of the photograph and which a human retyped.
   */
  editedByCustomer?: boolean;

  /** The customer added this line; it was never in the photo. */
  addedByCustomer?: boolean;

  /**
   * What the photo literally said, when the model expanded an abbreviation.
   * "Pan-40" for a line now named "Pantoprazole 40mg". Shown in the review
   * card so a customer can check the expansion against the paper in their
   * hand, rather than being asked to trust it.
   */
  readAs?: string;
}

export interface ConciergeStop {
  id: string;
  storeName: string;
  localityId: string;
  what: string;
  /** Admin confirms this by phone before pricing. */
  available: boolean | null;
  costPaise: number | null;
}

export interface Pricing {
  itemsPaise: number;
  deliveryPaise: number;
  /** Concierge only — the fee for running the errand itself. */
  servicePaise: number;
  /**
   * Written by `redeemPromotion` when an offer is applied. Already subtracted
   * from `totalPaise`, so never subtract it a second time when rendering.
   */
  discountPaise?: number;
  totalPaise: number;
  /** Who last touched the numbers. */
  pricedBy?: string;
  pricedAt?: number;
}

export interface TimelineEvent {
  status: OrderStatus;
  at: number;
  /** uid, or 'system' for automated transitions. */
  by: string;
  note?: string;
  delayMinutes?: number;
}

export interface Order {
  id: string;
  /** Short human handle shown everywhere: 1042. */
  code: number;

  customerUid: string;
  customerName: string;
  customerPhone: string;
  localityId: string;
  addressLine: string;

  category: Category;
  status: OrderStatus;

  items: OrderItem[];
  /** Concierge orders only. */
  stops?: ConciergeStop[];

  storeId: string | null;
  storeName: string | null;

  riderUid: string | null;
  riderName: string | null;

  /** Client Requirement: Manual Captain Assignment & Status */
  captainUid?: string | null;
  captainName?: string | null;
  captainPhone?: string | null;
  assignmentStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED';
  assignmentHistory?: Array<{
    captainId: string;
    captainName: string;
    assignedAt: number;
    assignedBy?: string;
    status: string;
  }>;

  /** Client Requirement: Preparation and Delivery Timing */
  acceptedAt?: number;
  preparationStartedAt?: number;
  preparationCompletedAt?: number;
  preparationDurationMinutes?: number;
  captainAssignedAt?: number;
  pickedUpAt?: number;
  deliveryStartedAt?: number;
  deliveredAt?: number;
  deliveryDurationMinutes?: number;
  totalOrderDurationMinutes?: number;

  // --- Timing & Delays from Reference ---
  prepStartedAt?: number;
  prepCompletedAt?: number;
  actualPrepMinutes?: number;
  dispatchedAt?: number;
  actualDeliveryMinutes?: number;
  delayMinutes?: number;
  delayReason?: string;
  delayReportedAt?: number;

  // --- Cancellation Auditing ---
  cancellationReason?: string;
  cancelledByRole?: Role;
  cancelledByUid?: string;

  pricing: Pricing;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;

  /**
   * The offer already on this basket. Present means the discount has been
   * taken — it is the idempotency key that stops a retried redemption from
   * discounting the same order twice.
   */
  appliedPromotionId?: string;

  source: OrderSource;
  ai: AiTrace | null;

  /** Six-digit code the rider asks for at the door. */
  deliveryOtp: string;

  /** Final 100m gate instructions and optional 15s voice memo. */
  instructions?: DeliveryInstructions;
  /** 100% rider tip in paise. */
  riderTipPaise?: number;

  timeline: TimelineEvent[];
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Chat thread (the customer app's whole UI)
// ---------------------------------------------------------------------------

export type MessageAuthor = 'user' | 'bot';

/**
 * A message is either plain text or a *generative UI card*: the model answers
 * a photo with a structured card, never a paragraph.
 */
export type MessageBody =
  | { kind: 'text'; text: string; textTa?: string }
  | { kind: 'attachment'; storagePath: string; mimeType: string; label: string }
  | { kind: 'voice'; storagePath: string; durationMs: number; transcript?: string }
  | { kind: 'status'; text: string; tone: 'ok' | 'working' | 'warn' }
  | { kind: 'order_card'; orderId: string; variant: 'template' | 'checklist' };

export interface Message {
  id: string;
  threadId: string;
  author: MessageAuthor;
  body: MessageBody;
  createdAt: number;
}
