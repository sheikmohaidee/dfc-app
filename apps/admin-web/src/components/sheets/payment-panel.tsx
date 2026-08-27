'use client';

/**
 * Payment reconciliation, inside the order sheet.
 *
 * This is where the honest gap in UPI intent links gets closed by a person: a
 * customer has said "I paid", and an admin matches the reference against the
 * bank before the order moves. It is two clicks, and it is the only thing
 * standing between DFC and dispatching goods against money that never arrived.
 *
 * When a gateway is wired up, its webhook writes `paid` directly and this
 * panel becomes read-only for those orders — the manual path stays for cash
 * and for UPI transfers made outside the app, which will never stop happening.
 */

import * as React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { AlertTriangle, Banknote, Check, Copy, Smartphone, X } from 'lucide-react';

import {
  COL,
  PAYMENT_STATE_LABEL,
  formatInr,
  orderPaymentStatus,
  withPaymentState,
  type Order,
  type Payment,
} from '@dfc/core';

import { Badge, Button } from '@/components/ui/primitives';
import { db } from '@/lib/firebase';
import { ago, cn } from '@/lib/utils';

const TONE = {
  unpaid: 'neutral',
  awaiting_customer: 'verify',
  awaiting_confirmation: 'verify',
  paid: 'grocery',
  collected: 'grocery',
  settled: 'grocery',
  failed: 'destructive',
  refund_pending: 'verify',
  refunded: 'neutral',
} as const;

export function PaymentPanel({
  order,
  payment,
  adminUid,
}: {
  order: Order;
  payment: Payment | null;
  adminUid: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function move(to: Payment['state'], patch: Partial<Payment> = {}) {
    if (!payment) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db(), COL.payments, payment.id), {
        ...withPaymentState(payment, to, {
          ...patch,
          confirmedBy: adminUid,
          confirmedAt: Date.now(),
        }),
      });
      // Keep the order's denormalised flag in step for the board. The two
      // vocabularies differ, so the projection lives in core rather than
      // being re-derived (wrongly) here.
      await updateDoc(doc(db(), COL.orders, order.id), {
        paymentStatus: orderPaymentStatus(to),
        updatedAt: Date.now(),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!payment) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">PAYMENT</span>
        <div className="rounded-lg border bg-surface px-3.5 py-3 text-[12.5px] text-muted-foreground">
          The customer has not chosen a payment method yet.
        </div>
      </div>
    );
  }

  const claimed = payment.state === 'awaiting_confirmation';
  const settled = ['paid', 'collected', 'settled'].includes(payment.state);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">PAYMENT</span>
        <Badge tone={TONE[payment.state]}>
          {PAYMENT_STATE_LABEL[payment.state].en.toUpperCase()}
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5 rounded-lg border p-3.5">
        <div className="flex items-center gap-2.5">
          {payment.method === 'cash' ? (
            <Banknote className="size-4 text-grocery" strokeWidth={2} />
          ) : (
            <Smartphone className="size-4 text-pharmacy" strokeWidth={2} />
          )}
          <span className="flex-1 text-[13px] font-medium capitalize">
            {payment.method === 'upi_intent' ? 'UPI transfer' : payment.method}
          </span>
          <span className="tnum text-[15px] font-semibold tracking-tight">
            {formatInr(payment.amountPaise)}
          </span>
        </div>

        {/* The reference is what an admin actually greps the bank statement for. */}
        <div className="flex items-center gap-2 rounded-md bg-surface px-2.5 py-2">
          <span className="text-[11px] text-muted-foreground">Reference</span>
          <span className="tnum flex-1 text-[12.5px] font-semibold">{payment.reference}</span>
          <button
            onClick={() => void navigator.clipboard?.writeText(payment.reference)}
            className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted"
            title="Copy reference"
          >
            <Copy className="size-3.5" />
          </button>
        </div>

        {payment.utr ? (
          <div className="flex items-center gap-2 rounded-md bg-surface px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground">Customer&apos;s UTR</span>
            <span className="tnum flex-1 text-[12.5px] font-semibold">{payment.utr}</span>
          </div>
        ) : null}

        {payment.method === 'cash' && payment.tenderedPaise ? (
          <div className="tnum flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>Tendered {formatInr(payment.tenderedPaise)}</span>
            <span>Change {formatInr(payment.changePaise ?? 0)}</span>
          </div>
        ) : null}

        {settled ? (
          <div className="flex items-center gap-2 text-[11.5px] text-grocery-fg">
            <Check className="size-3.5" strokeWidth={3} />
            <span>
              Confirmed {payment.confirmedAt ? `${ago(payment.confirmedAt)} ago` : ''}
              {payment.confirmedBy === 'webhook' ? ' by the gateway' : ' by staff'}
            </span>
          </div>
        ) : null}
      </div>

      {/* The human step. */}
      {claimed ? (
        <div className="flex flex-col gap-2.5 rounded-lg border border-verify-border bg-verify-tint p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-verify" strokeWidth={2} />
            <p className="text-[12.5px] leading-relaxed text-verify-fg">
              The customer says they have paid. A UPI intent link cannot prove that, so check{' '}
              <strong>{payment.reference}</strong>
              {payment.utr ? (
                <>
                  {' '}
                  or UTR <strong className="tnum">{payment.utr}</strong>
                </>
              ) : null}{' '}
              against the bank before this order moves.
            </p>
          </div>

          <div className="flex gap-2.5">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              disabled={busy}
              onClick={() => void move('paid', { receivedPaise: payment.amountPaise })}
            >
              <Check className="size-3.5" strokeWidth={3} />
              Money received
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              disabled={busy}
              onClick={() => void move('failed', { failureReason: 'Not found in bank statement' })}
            >
              <X className="size-3.5" />
              Not found
            </Button>
          </div>
        </div>
      ) : null}

      {/* Refunds are only ever available on money we actually hold. */}
      {settled ? (
        <Button
          variant="destructiveGhost"
          size="sm"
          className={cn('self-start')}
          disabled={busy}
          onClick={() => void move('refund_pending')}
        >
          Start a refund
        </Button>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive-border bg-destructive-tint px-3 py-2 text-[12px] text-destructive-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
