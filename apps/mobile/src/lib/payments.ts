/**
 * Payment operations.
 *
 * Supports seamless Demo Mode via local mock repository without Firebase dependency,
 * while preserving future Firebase Firestore subscriptions, Razorpay link generation & rules.
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
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getFunctions, httpsCallable } from 'firebase/functions';

import {
  COL,
  buildInvoice,
  withStatus,
  buildUpiUrl,
  changeFor,
  formatInr,
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

import { app, db } from './firebase';
import { DEMO_MODE } from '@/demo/config';
import { demoStorage } from '@/demo/storage';
import { mockPaymentRepository } from '@/demo/repositories/payment.repository';

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function subscribePayment(
  orderId: string,
  onData: (p: Payment | null) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    const order = demoStorage.getOrderById(orderId);
    if (!order) {
      onData(null);
      return () => {};
    }
    const isPaid = order.status !== 'incoming' && order.status !== 'admin_review' && order.status !== 'awaiting_payment';
    const p: Payment = {
      id: `pay-demo-${order.id}`,
      orderId: order.id,
      orderCode: order.code,
      customerUid: order.customerUid,
      amountPaise: order.pricing.totalPaise,
      receivedPaise: isPaid ? order.pricing.totalPaise : 0,
      method: order.paymentMode === 'cod' ? 'cash' : 'upi_intent',
      state: isPaid ? 'paid' : 'unpaid',
      reference: `UPI-MAD-${order.code}`,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
    onData(p);
    return demoStorage.subscribe(() => {
      const o = demoStorage.getOrderById(orderId);
      if (!o) onData(null);
      else {
        const isP = o.status !== 'incoming' && o.status !== 'admin_review' && o.status !== 'awaiting_payment';
        onData({
          ...p,
          amountPaise: o.pricing.totalPaise,
          receivedPaise: isP ? o.pricing.totalPaise : 0,
          state: isP ? 'paid' : 'unpaid',
        });
      }
    });
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
  if (DEMO_MODE) {
    const order = demoStorage.getOrderById(orderId);
    if (!order) {
      onData(null);
      return () => {};
    }
    const inv = buildInvoice({ order, sequence: 1042 });
    onData(inv);
    return () => {};
  }

  return onSnapshot(
    doc(db(), COL.invoices, orderId),
    (s) => onData(s.exists() ? (s.data() as Invoice) : null),
    () => onData(null),
  );
}

export async function issueInvoice(orderId: string): Promise<Invoice> {
  const order = await readOrder(orderId);
  const inv = buildInvoice({ order, sequence: 1042 });
  if (!DEMO_MODE) {
    await setDoc(doc(db(), COL.invoices, orderId), inv);
  }
  return inv;
}

export function invoiceAsText(inv: Invoice): string {
  const lines = inv.lines.map((l) => `${l.description}: ${formatInr(l.totalPaise)}`).join('\n');
  return `TAX INVOICE #${inv.number}\nDFC Express\n\n${lines}\n\nTotal: ${formatInr(inv.totalPaise)}`;
}

export async function settleCash(
  held: Payment[] | string[],
  actorUid?: string,
): Promise<void> {
  if (DEMO_MODE) return;
  const paymentIds = held.map((p) => (typeof p === 'string' ? p : p.id));
  for (const pid of paymentIds) {
    await updateDoc(doc(db(), COL.payments, pid), {
      state: 'settled',
      settledAt: Date.now(),
      ...(actorUid ? { settledWith: actorUid } : {}),
    });
  }
}

async function readOrder(orderId: string): Promise<Order> {
  if (DEMO_MODE) {
    const o = demoStorage.getOrderById(orderId);
    if (!o) throw new Error('That order no longer exists.');
    return o;
  }
  const snap = await getDoc(doc(db(), COL.orders, orderId));
  if (!snap.exists()) throw new Error('That order no longer exists.');
  return { ...(snap.data() as Order), id: snap.id };
}

// ---------------------------------------------------------------------------
// Starting a payment
// ---------------------------------------------------------------------------

export async function startPayment(
  order: Order,
  method: PaymentMethod,
): Promise<Payment> {
  if (DEMO_MODE) {
    return mockPaymentRepository.simulatePayment(order, method);
  }

  const id = `${order.id}_${method}`;
  const ref = doc(db(), COL.payments, id);

  const existing = await getDoc(ref);
  if (existing.exists()) return { ...(existing.data() as Payment), id };

  const payment = newPayment({
    id,
    orderId: order.id,
    orderCode: order.code,
    customerUid: order.customerUid,
    method,
    amountPaise: order.pricing.totalPaise,
  });

  await setDoc(ref, payment);
  return payment;
}

export class UpiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpiUnavailableError';
  }
}

export async function openUpiApp(payment: Payment, app: UpiApp): Promise<void> {
  if (DEMO_MODE) {
    await new Promise((res) => setTimeout(res, 800));
    return;
  }

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

export async function claimUpiPaid(payment: Payment, utr?: string): Promise<void> {
  if (DEMO_MODE) {
    const o = demoStorage.getOrderById(payment.orderId);
    if (o) {
      await demoStorage.saveOrder({
        ...o,
        status: 'vendor_accepted',
        updatedAt: Date.now(),
      });
    }
    return;
  }

  await updateDoc(doc(db(), COL.payments, payment.id), {
    ...withPaymentState(payment, 'awaiting_confirmation', {
      ...(utr ? { utr: utr.trim() } : {}),
    }),
  });
  await updateDoc(doc(db(), COL.orders, payment.orderId), {
    paymentStatus: orderPaymentStatus('awaiting_confirmation'),
    updatedAt: Date.now(),
  });
}

export async function chooseCashOnDelivery(order: Order, uid: string): Promise<Payment> {
  if (DEMO_MODE) {
    return mockPaymentRepository.simulatePayment(order, 'cash');
  }

  const payment = await startPayment(order, 'cash');

  if (order.status === 'awaiting_payment') {
    await updateDoc(doc(db(), COL.orders, order.id), {
      ...withStatus(order, 'paid', 'customer', uid, 'Cash on delivery agreed'),
      paymentStatus: orderPaymentStatus('unpaid'),
    });
  }

  return payment;
}

export class GatewayUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayUnavailableError';
  }
}

export async function payWithGateway(orderId: string): Promise<void> {
  if (DEMO_MODE) {
    const order = demoStorage.getOrderById(orderId);
    if (order) {
      await mockPaymentRepository.simulatePayment(order, 'gateway');
    }
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

  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'close',
    toolbarColor: '#FFFFFF',
    controlsColor: '#18181B',
  });
}

export async function collectCash(
  payment: Payment,
  riderUid: string,
  tenderedPaise: number,
): Promise<void> {
  const change = changeFor(payment.amountPaise, tenderedPaise);

  if (DEMO_MODE) {
    const o = demoStorage.getOrderById(payment.orderId);
    if (o) {
      await demoStorage.saveOrder({
        ...o,
        status: 'delivered',
        updatedAt: Date.now(),
      });
    }
    return;
  }

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

export function subscribeHeldCash(
  riderUid: string,
  onData: (payments: Payment[]) => void,
): Unsubscribe {
  if (DEMO_MODE) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db(), COL.payments),
    where('heldByUid', '==', riderUid),
    where('state', '==', 'collected'),
    orderBy('confirmedAt', 'desc'),
  );
  return onSnapshot(q, (s) =>
    onData(s.docs.map((d) => ({ ...(d.data() as Payment), id: d.id }))),
  );
}

export async function markPaid(
  orderId: string,
  paymentId: string,
  actorUid: string,
  role: 'admin' | 'vendor',
): Promise<void> {
  if (DEMO_MODE) {
    const o = demoStorage.getOrderById(orderId);
    if (o) {
      await demoStorage.saveOrder({
        ...o,
        status: 'paid',
        updatedAt: Date.now(),
      });
    }
    return;
  }

  const pref = doc(db(), COL.payments, paymentId);
  const oref = doc(db(), COL.orders, orderId);

  await runTransaction(db(), async (tx) => {
    const psnap = await tx.get(pref);
    if (!psnap.exists()) throw new Error('Payment not found.');
    const payment = { ...(psnap.data() as Payment), id: psnap.id };

    const osnap = await tx.get(oref);
    if (!osnap.exists()) throw new Error('Order not found.');
    const order = { ...(osnap.data() as Order), id: osnap.id };

    tx.update(
      pref,
      withPaymentState(payment, 'paid', {
        confirmedBy: actorUid,
        confirmedAt: Date.now(),
      }),
    );

    const advanced = withStatus(order, 'paid', role, actorUid, `Payment verified by ${role}`);
    tx.update(oref, {
      ...advanced,
      paymentStatus: orderPaymentStatus('paid'),
      updatedAt: Date.now(),
    });
  });
}
