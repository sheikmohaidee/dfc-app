/**
 * @dfc/core — the model every DFC surface shares.
 *
 *   types          domain shapes that travel through Firestore
 *   schema         zod validation + the Gemini JSON contract
 *   prompt         the system prompt and generation config
 *   status         the order state machine and board mapping
 *   order          pure constructors and mutations over an Order
 *   catalogue      products, stock levels, promotions and in-app ads
 *   legal          privacy / terms / refunds / deletion, shared by app and web
 *   payment        cash / UPI / gateway, the payment state machine
 *   invoice        GST-correct tax invoices (pure-agent split, CGST+SGST)
 *   money          paise arithmetic and INR formatting
 *   madurai        localities, seed stores, distance
 *   i18n           bilingual copy
 *   tokens         design tokens (also exported as @dfc/core/tokens)
 *   paths          Firestore and Storage layout
 *   telemetry      dead reckoning, smoothing, and indoor wayfinding
 *   food-rescue    canceled order flash bidding and 15m countdown radar
 *   group-order    collaborative carts, room PINs, and split billing
 *   predictive     temporal affinity models and 1-tap cart auto-build
 *   batching       multi-order TSP route clustering and cold-delay mitigation
 *   spatial-hex    H3-style hex grid surge pricing and live demand heatmaps
 *   safety         gyro crash anomaly detection and shift fatigue breaks
 *   kitchen-sync   WhatsApp KOT message payloads and live kitchen IP stream
 *   ingredient-bom ingredient bill-of-materials and cascade stock toggles
 *   ads-auction    second-price CPC sponsored ads auction ranker
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
export * from './seed-data';

// Advanced Tier-1 Modules
export * from './telemetry';
export * from './food-rescue';
export * from './group-order';
export * from './predictive';
export * from './batching';
export * from './spatial-hex';
export * from './safety';
export * from './kitchen-sync';
export * from './ingredient-bom';
export * from './ads-auction';
export * from './subscriptions';
export * from './transliteration';

export * as tokens from './tokens';
