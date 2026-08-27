/**
 * DFC Cloud Functions — everything a client must not be trusted with.
 *
 * Region is asia-south1 (Mumbai): closest to Madurai, and it keeps order data
 * in-country, which the DPDP Act disclosure in the privacy policy depends on.
 *
 * Secrets are set once, per project:
 *
 *   firebase functions:secrets:set RAZORPAY_KEY_ID
 *   firebase functions:secrets:set RAZORPAY_KEY_SECRET
 *   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
 *
 * Then point Razorpay's webhook at the deployed razorpayWebhook URL and
 * subscribe it to payment.captured, payment.failed and refund.processed.
 */

import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { createGatewayOrder, createPaymentLink, razorpayWebhook } from './payments';
export { onOrderChanged, onRiderArrived } from './notifications';
export { setUserRole, redeemPromotion, trackPromotion, repriceOnCreate } from './admin';
