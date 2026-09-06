/**
 * Payment operations.
 *
 * The rule that governs this whole file: a client may say "I have paid", and
 * it may never say "the payment is verified". Only an admin or a gateway
 * webhook moves a payment to `paid`, and the Firestore rules enforce that. A
 * customer marking their own order paid is the obvious hole, and it is the one
 * people actually exploit.
 */

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { Alert, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getFunctions, httpsCallable } from 'firebase/functions';

import {
  COL,
  SEED_ORDERS,
  buildInvoice,
  withStatus,
  buildUpiUrl,
  changeFor,
  financialYear,
  invoiceCounter,
  isUpiConfigured,
  newPayment,
  upiUrlFor,
  withPaymentState,
  type Invoice,
  type Order,
  type Payment,
  type PaymentMethod,
  type UpiApp,
  orderPaymentStatus,
} from '@dfc/core';

import { app, db, isConfigured } from './firebase';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function subscribePayment(
  orderId: string,
  onData: (p: Payment | null) => void,
): Unsubscribe {
  if (!isConfigured) {
    onData(null);
    return () => {};
  }
  const q = query(
    collection(db(), COL.payments),
    where('orderId', '==', orderId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (s) => onData(s.empty ? null : ({ ...(s.docs[0]!.data() as Payment), id: s.docs[0]!.id })),
    () => onData(null),
  );
}

export function subscribeInvoice(
  orderId: string,
  onData: (inv: Invoice | null) => void,
): Unsubscribe {
  if (!isConfigured) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db(), COL.invoices, orderId),
    (s) => onData(s.exists() ? (s.data() as Invoice) : null),
    () => onData(null),
  );
}

async function readOrder(orderId: string): Promise<Order> {
  if (!isConfigured) {
    const seed = SEED_ORDERS.find((o) => o.id === orderId);
    if (seed) return seed;
  }
  const snap = await getDoc(doc(db(), COL.orders, orderId));
  if (!snap.exists()) throw new Error('That order no longer exists.');
  return { ...(snap.data() as Order), id: snap.id };
}

// ---------------------------------------------------------------------------
// Starting a payment
// ---------------------------------------------------------------------------

/**
 * Creates the payment record. Idempotent per (order, method): tapping "Pay"
 * twice must not produce two references a human then has to reconcile.
 */
export async function startPayment(
  order: Order,
  method: PaymentMethod,
): Promise<Payment> {
  const id = `${order.id}_${method}`;
  const payment = newPayment({
    id,
    orderId: order.id,
    orderCode: order.code,
    customerUid: order.customerUid,
    method,
    amountPaise: order.pricing.totalPaise,
  });

  if (!isConfigured) {
    return payment;
  }

  const ref = doc(db(), COL.payments, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return { ...(existing.data() as Payment), id };

  await setDoc(ref, payment);
  return payment;
}

export class UpiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpiUnavailableError';
  }
}

/**
 * Opens a UPI app with the amount and reference pre-filled.
 *
 * Android resolves `upi://` to a system chooser, so the generic link is the
 * better experience there. iOS has no chooser, so we try the specific app's
 * scheme and fall back.
 *
 * Returns nothing useful on purpose — whatever the UPI app reports back cannot
 * be trusted, so the caller's next step is always "ask the customer to
 * confirm", never "mark it paid".
 */
export async function openUpiApp(payment: Payment, app: UpiApp): Promise<void> {
  if (!isUpiConfigured()) {
    throw new UpiUnavailableError(
      'UPI is not set up yet — the payee VPA is still a placeholder in packages/core/src/payment.ts.',
    );
  }

  const base = buildUpiUrl({
    amountPaise: payment.amountPaise,
    reference: payment.reference,
    orderCode: payment.orderCode,
  });

  const url = Platform.OS === 'ios' ? upiUrlFor(app, base) : base;

  const can = await Linking.canOpenURL(url).catch(() => false);
  if (!can) {
    // On iOS a missing app is a hard no; on Android the chooser handles it.
    if (Platform.OS === 'ios' && app.iosScheme) {
      const fallback = await Linking.canOpenURL(base).catch(() => false);
      if (fallback) {
        await Linking.openURL(base);
        return;
      }
    }
    throw new UpiUnavailableError(
      `${app.name} is not installed. Try another UPI app, or pay cash on delivery.`,
    );
  }

  await Linking.openURL(url);
}

/**
 * The customer says they paid. This is a *claim*, not a confirmation — it puts
 * the payment in front of a human with the reference to match against.
 */
export async function claimUpiPaid(payment: Payment, utr?: string): Promise<void> {
  if (!isConfigured) {
    return;
  }
  await updateDoc(doc(db(), COL.payments, payment.id), {
    ...withPaymentState(payment, 'awaiting_confirmation', {
      ...(utr ? { utr: utr.trim() } : {}),
    }),
  });
  // The order does NOT advance here. A claim is not a payment, and the store
  // must not start packing against money nobody has seen.
  await updateDoc(doc(db(), COL.orders, payment.orderId), {
    paymentStatus: orderPaymentStatus('awaiting_confirmation'),
    updatedAt: Date.now(),
  });
}

/**
 * The customer chose cash.
 *
 * This advances the order, which looks surprising next to `claimUpiPaid`
 * above until you notice the difference: with cash there is nothing to verify.
 * Nothing is owed until the rider is at the door, so choosing cash *is* the
 * customer completing their side, and the store can start packing.
 *
 * Leaving it in `awaiting_payment` — as it was — meant the vendor's query
 * (which starts at `paid`) never saw it, and every grocery order in the
 * product silently stalled behind a manual admin click.
 */
export async function chooseCashOnDelivery(order: Order, uid: string): Promise<Payment> {
  const payment = await startPayment(order, 'cash');

  if (!isConfigured) {
    return payment;
  }

  if (order.status === 'awaiting_payment') {
    await updateDoc(doc(db(), COL.orders, order.id), {
      ...withStatus(order, 'paid', 'customer', uid, 'Cash on delivery agreed'),
      paymentStatus: orderPaymentStatus('unpaid'),
    });
  }

  return payment;
}

// ---------------------------------------------------------------------------
// Gateway (Razorpay)
// ---------------------------------------------------------------------------

export class GatewayUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayUnavailableError';
  }
}

/**
 * Opens Razorpay's hosted checkout.
 *
 * A hosted link rather than the native SDK: the SDK means a native module, a
 * config plugin, and a build that no longer runs in Expo Go — a lot of
 * fragility for a screen the customer sees for twenty seconds. The link
 * supports UPI, cards, net banking and wallets, and fires the same webhook.
 *
 * Nothing here believes the browser. `openAuthSessionAsync` resolves when the
 * sheet closes, which tells us the customer *finished interacting* — not that
 * money moved. Only the webhook decides that, so the caller's next state is
 * always "checking", never "paid".
 */
export async function payWithGateway(orderId: string): Promise<void> {
  if (!isConfigured) {
    Alert.alert(
      'Demo Checkout',
      'Online gateway is in demo mode. Choose UPI or Cash on Delivery to test order fulfilment end-to-end.',
    );
    return;
  }

  const call = httpsCallable<{ orderId: string }, { url: string; amountPaise: number }>(
    getFunctions(app(), 'asia-south1'),
    'createPaymentLink',
  );

  let url: string;
  try {
    const res = await call({ orderId });
    url = res.data.url;
  } catch (e) {
    const msg = (e as { message?: string }).message ?? '';
    throw new GatewayUnavailableError(
      msg.includes('not-found') || msg.includes('internal')
        ? 'Card and net-banking payment is not switched on yet. UPI or cash both work.'
        : msg || 'Could not reach the payment provider.',
    );
  }

  // An in-app browser rather than leaving the app: the customer comes straight
  // back to the order screen when they are done.
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'close',
    toolbarColor: '#FFFFFF',
    controlsColor: '#18181B',
  });
}

// ---------------------------------------------------------------------------
// Cash, at the door
// ---------------------------------------------------------------------------

/**
 * The rider took cash. Records what was tendered so the change is on record
 * and the shift-end reconciliation has something to check against.
 */
export async function collectCash(
  payment: Payment,
  riderUid: string,
  tenderedPaise: number,
): Promise<void> {
  const change = changeFor(payment.amountPaise, tenderedPaise);

  await updateDoc(doc(db(), COL.payments, payment.id), {
    ...withPaymentState(payment, 'collected', {
      receivedPaise: payment.amountPaise,
      tenderedPaise,
      changePaise: change,
      heldByUid: riderUid,
      confirmedBy: riderUid,
      confirmedAt: Date.now(),
    }),
  });

  await updateDoc(doc(db(), COL.orders, payment.orderId), {
    paymentStatus: orderPaymentStatus('collected'),
    updatedAt: Date.now(),
  });
}

/** Everything a rider is holding, for the shift-end hand-in. */
export function subscribeHeldCash(
  riderUid: string,
  onData: (payments: Payment[]) => void,
): Unsubscribe {
  const q = query(
    collection(db(), COL.payments),
    where('heldByUid', '==', riderUid),
    where('state', '==', 'collected'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (s) => onData(s.docs.map((d) => ({ ...(d.data() as Payment), id: d.id }))),
    () => onData([]),
  );
}

/**
 * The rider hands the day's cash in.
 *
 * `collected` means the money is in a rider's pocket; `settled` means it has
 * reached DFC. Without this step the two are indistinguishable, and the
 * question "how much cash is out on the road right now?" has no answer.
 *
 * Batched: a shift is one hand-in, not fifteen.
 */
export async function settleCash(payments: Payment[], riderUid: string): Promise<number> {
  let total = 0;
  for (const p of payments) {
    if (p.state !== 'collected' || p.heldByUid !== riderUid) continue;
    await updateDoc(doc(db(), COL.payments, p.id), {
      ...withPaymentState(p, 'settled', { confirmedBy: riderUid, confirmedAt: Date.now() }),
    });
    total += p.receivedPaise;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Invoicing
// ---------------------------------------------------------------------------

/**
 * Issues the tax invoice.
 *
 * The sequence number comes from a per-financial-year counter inside a
 * transaction, because GST requires the series to be unbroken — a gap is a
 * compliance problem, and two invoices sharing a number is worse. Writing the
 * invoice and bumping the counter in one transaction is what makes that hold
 * when two devices finish an order at the same moment.
 */
export async function issueInvoice(orderId: string): Promise<Invoice> {
  const order = await readOrder(orderId);
  const invoiceRef = doc(db(), COL.invoices, orderId);

  const fy = financialYear();
  const counterRef = doc(db(), invoiceCounter(fy));

  return runTransaction(db(), async (tx) => {
    const existing = await tx.get(invoiceRef);
    if (existing.exists()) return existing.data() as Invoice;

    const counter = await tx.get(counterRef);
    const next = (counter.exists() ? ((counter.data().value as number) ?? 0) : 0) + 1;

    const invoice = buildInvoice({ order, sequence: next });

    tx.set(counterRef, { value: next, financialYear: fy }, { merge: true });
    tx.set(invoiceRef, invoice);
    return invoice;
  });
}

/** Plain text, for WhatsApp or SMS — the share format people actually use. */
export function invoiceAsText(inv: Invoice): string {
  const rupees = (p: number) => `Rs.${(p / 100).toFixed(2)}`;
  const lines = inv.lines
    .map((l) => `  ${l.description} x${l.quantity}  ${rupees(l.totalPaise)}`)
    .join('\n');

  return [
    `${inv.supplier.name}`,
    `TAX INVOICE  ${inv.number}`,
    `Order #${inv.orderCode} · ${new Date(inv.issuedAt).toLocaleDateString('en-IN')}`,
    '',
    lines,
    '',
    `Goods (reimbursement)  ${rupees(inv.reimbursementPaise)}`,
    `Services (taxable)     ${rupees(inv.taxablePaise)}`,
    `CGST 9%                ${rupees(inv.cgstPaise)}`,
    `SGST 9%                ${rupees(inv.sgstPaise)}`,
    inv.roundOffPaise !== 0 ? `Round off              ${rupees(inv.roundOffPaise)}` : '',
    `TOTAL                  ${rupees(inv.totalPaise)}`,
    '',
    inv.amountInWords,
    `GSTIN ${inv.supplier.gstin} · Place of supply ${inv.placeOfSupply}`,
  ]
    .filter(Boolean)
    .join('\n');
}
