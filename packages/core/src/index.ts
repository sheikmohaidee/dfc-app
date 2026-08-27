/**
 * @dfc/core — the model every DFC surface shares.
 *
 *   types    domain shapes that travel through Firestore
 *   schema   zod validation + the Gemini JSON contract
 *   prompt   the system prompt and generation config
 *   status   the order state machine and board mapping
 *   order    pure constructors and mutations over an Order
 *   catalogue products, stock levels, promotions and in-app ads
 *   legal    privacy / terms / refunds / deletion, shared by app and web
 *   payment  cash / UPI / gateway, the payment state machine
 *   invoice  GST-correct tax invoices (pure-agent split, CGST+SGST)
 *   money    paise arithmetic and INR formatting
 *   madurai  localities, seed stores, distance
 *   i18n     bilingual copy
 *   tokens   design tokens (also exported as @dfc/core/tokens)
 *   paths    Firestore and Storage layout
 */

export * from './types';
export * from './schema';
export * from './prompt';
export * from './status';
export * from './order';
export * from './catalogue';
export * from './legal';
export * from './payment';
export * from './invoice';
export * from './money';
export * from './madurai';
export * from './i18n';
export * from './paths';

export * as tokens from './tokens';
