'use client';

/**
 * The order side sheet — where an admin actually does the work.
 *
 * It adapts to the order: a pharmacy order gets an item table with per-line
 * pricing and a VERIFY block; a concierge errand gets stop-by-stop
 * availability and a manual delivery fee. The footer action is always the one
 * legal next move.
 */

import * as React from 'react';
import { Check, Phone, Play, Truck, X } from 'lucide-react';

import {
  COPY,
  CONFIDENCE_THRESHOLD,
  STATUS_LABEL,
  formatInr,
  isFullyPriced,
  localityById,
  nextStatuses,
  routeKm,
  suggestDeliveryPaise,
  UNPRICED,
  type Order,
  type OrderStatus,
  type Rider,
} from '@dfc/core';

import {
  Badge,
  Button,
  Input,
  Kbd,
  RupeeInput,
  Separator,
  Switch,
} from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourceThumb } from '@/components/board/order-card';
import { cn, ago, initials } from '@/lib/utils';
import {
  dispatchToRider,
  moveOrder,
  sendPriceToCustomer,
  setDeliveryFee,
  setItemPrice,
  subscribePaymentFor,
  toggleItem,
  updateStop,
} from '@/lib/orders';
import { PaymentPanel } from './payment-panel';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">{children}</span>
  );
}

// ---------------------------------------------------------------------------

function Waveform({ seed }: { seed: number }) {
  const bars = React.useMemo(
    () => Array.from({ length: 17 }, (_, i) => 6 + ((seed * (i + 5) * 7) % 21)),
    [seed],
  );
  return (
    <div className="flex h-[26px] flex-1 items-center gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{ height: h }}
          className={cn('w-[3px] rounded-full', i % 3 === 0 ? 'bg-white/40' : 'bg-white/85')}
        />
      ))}
    </div>
  );
}

function OriginalRequest({ order }: { order: Order }) {
  if (order.source.kind === 'text') {
    return (
      <div className="flex flex-col gap-2">
        <Label>{COPY.originalRequest.en}</Label>
        <p className="rounded-lg border bg-surface p-3 text-[13px] leading-relaxed text-body-strong">
          {order.source.transcript || '—'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Label>{COPY.originalRequest.en}</Label>
      {order.source.kind === 'voice' ? (
        <div className="flex items-center gap-3 rounded-lg bg-foreground px-3.5 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background">
            <Play className="size-3.5 fill-foreground text-foreground" />
          </span>
          <Waveform seed={order.code} />
          <span className="tnum shrink-0 text-[11.5px] text-placeholder">0:11</span>
        </div>
      ) : (
        <SourceThumb order={order} className="h-40 w-full" />
      )}
      {order.source.transcript ? (
        <p className="text-[12.5px] italic leading-relaxed text-icon">
          “{order.source.transcript}”
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ItemRows({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label>ITEMS</Label>
        <span className="tnum ml-auto text-[10.5px] text-placeholder">
          {order.items.filter((i) => i.included).length} of {order.items.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border">
        {order.items.map((item, i) => {
          const flagged = item.confidence < CONFIDENCE_THRESHOLD;
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5',
                i > 0 && 'border-t',
                flagged && 'bg-verify-tint',
              )}
            >
              <button
                onClick={() => void toggleItem(order.id, item.id)}
                className={cn(
                  'grid size-[18px] shrink-0 place-items-center rounded border transition-colors',
                  item.included
                    ? 'border-primary bg-primary'
                    : 'border-disabled bg-background hover:border-icon',
                )}
                aria-label={item.included ? 'Exclude item' : 'Include item'}
              >
                {item.included ? (
                  <Check className="size-3 text-primary-foreground" strokeWidth={3.4} />
                ) : null}
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    'truncate text-[13px] font-medium tracking-tight',
                    !item.included && 'text-placeholder line-through',
                    flagged && item.included && 'text-verify-fg',
                  )}
                >
                  {item.name}
                </span>
                <span className="flex items-center gap-1.5">
                  {flagged ? <Badge tone="verify">VERIFY</Badge> : null}
                  {/* Provenance. A line the customer typed does not need the
                      same scrutiny as one the model guessed — they have the
                      prescription in front of them — but the admin still has
                      to know which is which before quoting a price on it. */}
                  {item.addedByCustomer ? <Badge tone="verify">ADDED</Badge> : null}
                  {item.editedByCustomer ? <Badge tone="verify">EDITED</Badge> : null}
                  <span className="tnum truncate text-[10.5px] text-placeholder">
                    {item.unit}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    {item.readAs ? ` · paper: ${item.readAs}` : ''}
                    {item.note ? ` · ${item.note}` : ''}
                  </span>
                </span>
              </div>

              <RupeeInput
                valuePaise={item.unitPricePaise}
                onChangePaise={(p) => void setItemPrice(order.id, item.id, p)}
                className="h-8 w-[104px] shrink-0"
              />
            </div>
          );
        })}
        {order.items.length === 0 ? (
          <div className="grid h-16 place-items-center text-[12px] text-placeholder">
            No items parsed — call the customer.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StopRows({ order }: { order: Order }) {
  const stops = order.stops ?? [];
  if (stops.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Label>{COPY.stopsAvailability.en}</Label>
        <span className="ta text-[10.5px] text-placeholder">{COPY.stopsAvailability.ta}</span>
      </div>

      {stops.map((stop, i) => (
        <div key={stop.id} className="flex flex-col gap-2.5 rounded-lg border p-3">
          <div className="flex items-start gap-2.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10.5px] font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[13.5px] font-semibold tracking-tight">
                {stop.storeName}
              </span>
              <span className="truncate text-[11.5px] text-muted-foreground">{stop.what}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 shrink-0 overflow-hidden rounded-md border">
              <button
                onClick={() => void updateStop(order.id, stop.id, { available: true })}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 text-xs transition-colors',
                  stop.available === true
                    ? 'bg-grocery font-semibold text-white'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {stop.available === true ? <Check className="size-3" strokeWidth={3.2} /> : null}
                {COPY.available.en}
              </button>
              <button
                onClick={() =>
                  void updateStop(order.id, stop.id, { available: false, costPaise: null })
                }
                className={cn(
                  'border-l px-2.5 text-xs transition-colors',
                  stop.available === false
                    ? 'bg-destructive font-semibold text-white'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {COPY.notAvailable.en}
              </button>
            </div>

            <RupeeInput
              valuePaise={stop.costPaise}
              onChangePaise={(p) => void updateStop(order.id, stop.id, { costPaise: p })}
              disabled={stop.available !== true}
              className="h-8 flex-1"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function DeliveryFee({ order }: { order: Order }) {
  const stops = Math.max(1, order.stops?.length ?? 1);
  const km = order.storeId
    ? routeKm(
        // fall back to the customer locality if the store is unknown
        order.storeId ? (localityById(order.localityId)?.id ?? order.localityId) : order.localityId,
        order.localityId,
      )
    : 3;
  const suggested = suggestDeliveryPaise(km, stops);
  const quick = [suggested - 2000, suggested, suggested + 2000].filter((p) => p > 0);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Label>{COPY.deliveryFee.en}</Label>
        <span className="ta text-[10.5px] text-placeholder">{COPY.deliveryFee.ta}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <RupeeInput
          valuePaise={order.pricing.deliveryPaise}
          onChangePaise={(p) => void setDeliveryFee(order.id, p ?? 0)}
          className="w-[150px]"
          autoFocus
        />
        {quick.map((p) => (
          <button
            key={p}
            onClick={() => void setDeliveryFee(order.id, p)}
            className="tnum h-8 rounded-md border px-2.5 text-xs text-body-strong transition-colors hover:bg-muted"
          >
            {formatInr(p)}
          </button>
        ))}
      </div>
      <span className="text-[11px] text-placeholder">
        {stops} stop{stops === 1 ? '' : 's'} · {km} km · suggested {formatInr(suggested)}
      </span>
    </div>
  );
}

function Totals({ order }: { order: Order }) {
  const rows: [string, string, number][] = [
    [COPY.items.en, COPY.items.ta, order.pricing.itemsPaise],
    [COPY.delivery.en, COPY.delivery.ta, order.pricing.deliveryPaise],
  ];
  if (order.pricing.servicePaise > 0) {
    rows.push([COPY.serviceFee.en, COPY.serviceFee.ta, order.pricing.servicePaise]);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-surface px-3.5 py-3">
      {rows.map(([en, , v]) => (
        <div key={en} className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{en}</span>
          <span className="tnum text-xs text-body-strong">{formatInr(v)}</span>
        </div>
      ))}
      <div className="mt-0.5 flex items-center justify-between border-t pt-[7px]">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{COPY.total.en}</span>
          <span className="ta text-[10.5px] text-placeholder">{COPY.total.ta}</span>
        </span>
        <span className="tnum text-xl font-semibold tracking-tight">
          {order.pricing.totalPaise > 0 ? formatInr(order.pricing.totalPaise) : UNPRICED}
        </span>
      </div>
    </div>
  );
}

function RiderPicker({
  order,
  riders,
  adminUid,
}: {
  order: Order;
  riders: Rider[];
  adminUid: string;
}) {
  const free = riders.filter((r) => r.isOnline && (!r.activeOrderId || r.activeOrderId === order.id));
  return (
    <div className="flex flex-col gap-2">
      <Label>{COPY.assignRider.en.toUpperCase()}</Label>
      <div className="flex flex-col gap-1.5">
        {free.length === 0 ? (
          <span className="text-[12px] text-placeholder">No rider is online right now.</span>
        ) : null}
        {free.map((r) => {
          const mine = order.riderUid === r.uid;
          return (
            <button
              key={r.uid}
              onClick={() => void dispatchToRider(order.id, r, adminUid)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                mine ? 'border-ring bg-muted' : 'hover:bg-muted',
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-muted text-[10px] font-semibold text-icon">
                {initials(r.name)}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-[13px] font-medium">{r.name}</span>
                <span className="tnum text-[10.5px] text-placeholder">{r.phone}</span>
              </span>
              {mine ? <Check className="size-4 text-grocery" strokeWidth={3} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function OrderSheet({
  order,
  riders,
  adminUid,
  onClose,
}: {
  order: Order | null;
  riders: Rider[];
  adminUid: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [payment, setPayment] = React.useState<import('@dfc/core').Payment | null>(null);

  // Narrowed to the id on purpose. Depending on the whole `order` object would
  // tear down and rebuild this listener on every Firestore update to the
  // document — including the ones this listener itself causes — so the id is
  // hoisted out to make that dependency honest rather than suppressed.
  const orderId = order?.id ?? null;

  React.useEffect(() => {
    if (!orderId) {
      setPayment(null);
      return;
    }
    return subscribePaymentFor(orderId, setPayment);
  }, [orderId]);

  const priced = order ? isFullyPriced(order.items, order.stops ?? []) : false;
  const moves = order ? nextStatuses(order.status, 'admin') : [];
  const isConcierge = order?.category === 'concierge';

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      // A rejected transition is a real signal, not noise — surface it.
      console.error(e);
      window.alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** The one action that matters at this status. */
  function primaryAction(o: Order): { label: string; run: () => Promise<void>; disabled?: boolean } {
    switch (o.status) {
      case 'incoming':
        return {
          label: 'Start review',
          run: () => moveOrder(o.id, 'admin_review', adminUid),
        };
      case 'admin_review':
        return {
          label: `Send ${o.pricing.totalPaise > 0 ? formatInr(o.pricing.totalPaise) : 'price'} to customer`,
          run: () => sendPriceToCustomer(o.id, adminUid),
          disabled: !priced || o.pricing.totalPaise === 0,
        };
      case 'awaiting_payment':
        return {
          label: o.paymentMode === 'cod' ? 'Confirm COD order' : 'Mark as paid',
          run: () => moveOrder(o.id, 'paid', adminUid, 'Marked by admin'),
        };
      case 'ready_for_pickup':
        return {
          label: 'Dispatch to rider',
          run: () => moveOrder(o.id, 'dispatched', adminUid),
          disabled: !o.riderUid,
        };
      default: {
        const to = moves.find((m) => m !== 'cancelled' && m !== 'rejected');
        return to
          ? { label: `Move to ${STATUS_LABEL[to].en}`, run: () => moveOrder(o.id, to, adminUid) }
          : { label: 'No action available', run: async () => {}, disabled: true };
      }
    }
  }

  // ⌘⏎ fires the primary action — the whole flow is one hand on the keyboard.
  React.useEffect(() => {
    if (!order) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const a = primaryAction(order!);
        if (!a.disabled && !busy) void run(a.run);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, busy, priced]);

  if (!order) return null;
  const action = primaryAction(order);
  const locality = localityById(order.localityId);

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent width={480}>
        <SheetHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-lg border',
                isConcierge
                  ? 'border-concierge-border bg-concierge-tint'
                  : 'border-border bg-muted',
              )}
            >
              <Truck
                className={cn('size-4', isConcierge ? 'text-concierge' : 'text-icon')}
                strokeWidth={2}
              />
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <SheetTitle asChild>
                <span className="flex items-center gap-2.5">
                  <span className="text-[16.5px] font-semibold tracking-tight">
                    {isConcierge ? COPY.adhocConcierge.en : `${order.category} order`}
                  </span>
                  <span className="ta text-xs text-placeholder">
                    {isConcierge ? COPY.adhocConcierge.ta : ''}
                  </span>
                </span>
              </SheetTitle>
              <span className="tnum text-[11.5px] text-muted-foreground">
                #{order.code} · {order.customerName} · {locality?.name ?? order.localityId} ·{' '}
                {ago(order.createdAt)} ago
              </span>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge tone={order.category as 'pharmacy'}>{order.category.toUpperCase()}</Badge>
            <Badge tone={order.paymentMode === 'prepaid' ? 'pharmacy' : 'grocery'}>
              {order.paymentMode === 'prepaid' ? 'PREPAID' : 'COD'}
            </Badge>
            <Badge tone="neutral">{STATUS_LABEL[order.status].en.toUpperCase()}</Badge>
          </div>

          <OriginalRequest order={order} />
          <Separator />

          {isConcierge ? <StopRows order={order} /> : <ItemRows order={order} />}
          <Separator />

          <DeliveryFee order={order} />
          <Totals order={order} />

          <Separator />
          <PaymentPanel order={order} payment={payment} adminUid={adminUid} />

          {order.status === 'ready_for_pickup' || order.riderUid ? (
            <>
              <Separator />
              <RiderPicker order={order} riders={riders} adminUid={adminUid} />
            </>
          ) : null}

          <Separator />
          <div className="flex flex-col gap-2">
            <Label>TIMELINE</Label>
            <div className="flex flex-col gap-1.5">
              {order.timeline
                .slice()
                .reverse()
                .map((e, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="size-1.5 shrink-0 rounded-full bg-border" />
                    <span className="flex-1 text-[11.5px] text-body-strong">
                      {STATUS_LABEL[e.status].en}
                    </span>
                    <span className="tnum text-[10.5px] text-placeholder">
                      {ago(e.at)} ago · {e.by === 'system' ? 'system' : 'staff'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            size="lg"
            className="w-full gap-2.5"
            disabled={action.disabled || busy}
            onClick={() => void run(action.run)}
          >
            {action.label}
            <Kbd>⌘⏎</Kbd>
          </Button>
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <a href={`tel:${order.customerPhone}`}>
                <Phone className="size-3.5" />
                Call {order.customerName.split(' ')[0]}
              </a>
            </Button>
            <Button
              variant="destructiveGhost"
              className="w-[120px] gap-1.5"
              disabled={busy || !nextStatuses(order.status, 'admin').includes('cancelled')}
              onClick={() => void run(() => moveOrder(order.id, 'cancelled', adminUid))}
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export type { OrderStatus };
void Input;
void Switch;
