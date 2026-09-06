/**
 * Firestore layout, in one place.
 *
 *   users/{uid}
 *   stores/{storeId}
 *   products/{productId}                      catalogue + stock levels
 *   promotions/{promotionId}                  in-app ads and coupons
 *   payments/{paymentId}                      one per payment attempt
 *   invoices/{orderId}                        the issued tax invoice
 *   riders/{uid}
 *   orders/{orderId}
 *   orders/{orderId}/messages/{messageId}     the customer's chat thread
 *   counters/orderCode                        monotonic short codes
 *
 * Flat, on purpose. Every surface subscribes to `orders` with a different
 * where-clause, so keeping orders at the root means one index set serves all
 * four apps.
 */

export const COL = {
  users: 'users',
  stores: 'stores',
  riders: 'riders',
  orders: 'orders',
  products: 'products',
  promotions: 'promotions',
  payments: 'payments',
  invoices: 'invoices',
  counters: 'counters',
  config: 'config',
} as const;

export const SUB = {
  messages: 'messages',
} as const;

export const userDoc = (uid: string) => `${COL.users}/${uid}`;
export const storeDoc = (id: string) => `${COL.stores}/${id}`;
export const riderDoc = (uid: string) => `${COL.riders}/${uid}`;
export const orderDoc = (id: string) => `${COL.orders}/${id}`;
export const productDoc = (id: string) => `${COL.products}/${id}`;
export const promotionDoc = (id: string) => `${COL.promotions}/${id}`;
export const paymentDoc = (id: string) => `${COL.payments}/${id}`;
export const invoiceDoc = (id: string) => `${COL.invoices}/${id}`;
export const messagesCol = (orderId: string) => `${COL.orders}/${orderId}/${SUB.messages}`;
export const messageDoc = (orderId: string, msgId: string) =>
  `${messagesCol(orderId)}/${msgId}`;

/** The doc holding the incrementing human-readable order code. */
export const ORDER_CODE_COUNTER = `${COL.counters}/orderCode`;

/**
 * Invoice sequence, one counter per financial year. GST requires an unbroken
 * sequence within a year, so the year is part of the document id rather than
 * one counter reset by hand every April.
 */
export const invoiceCounter = (financialYear: string) =>
  `${COL.counters}/invoice-${financialYear}`;

/** Platform operations configuration (operating hours, sleep mode, rain surge, automations). */
export const platformConfigDoc = `${COL.config}/platform`;

// ---------------------------------------------------------------------------
// Cloud Storage
// ---------------------------------------------------------------------------

/**
 * Uploads are namespaced by uid so Storage rules can allow a write only under
 * the caller's own prefix.
 *
 *   uploads/{uid}/{yyyy-mm}/{id}.jpg
 */
export function uploadPath(uid: string, id: string, ext: string): string {
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `uploads/${uid}/${month}/${id}.${ext}`;
}

/** Proof-of-delivery photo, written by a rider, read by admin + customer. */
export function podPath(orderId: string, id: string): string {
  return `pod/${orderId}/${id}.jpg`;
}
