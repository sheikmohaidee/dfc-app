'use client';

/**
 * The comfortable Kanban card, and the dense row.
 *
 * The comfortable card puts the customer's raw upload next to the AI's reading
 * of it, so a reviewer can check the model without opening anything — that
 * side-by-side is the whole point of the column.
 */

import * as React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { getDownloadURL, ref } from 'firebase/storage';

import {
  CATEGORY_CODE,
  flaggedItems,
  formatInr,
  localityById,
  UNPRICED,
  type Category,
  type Order,
} from '@dfc/core';

import { Badge, Card } from '@/components/ui/primitives';
import { storage } from '@/lib/firebase';
import { ago, cn, initials } from '@/lib/utils';

const TONE: Record<Category, 'pharmacy' | 'grocery' | 'food' | 'concierge'> = {
  pharmacy: 'pharmacy',
  grocery: 'grocery',
  food: 'food',
  concierge: 'concierge',
};

const DOT: Record<Category, string> = {
  pharmacy: 'bg-pharmacy',
  grocery: 'bg-grocery',
  food: 'bg-food',
  concierge: 'bg-concierge',
};

// ---------------------------------------------------------------------------
// Source thumbnail
// ---------------------------------------------------------------------------

/** A drawn stand-in for a prescription, shown until the upload URL resolves. */
function PaperPlaceholder() {
  return (
    <svg viewBox="0 0 240 320" className="size-full" preserveAspectRatio="xMidYMid slice">
      <rect width="240" height="320" fill="#FBF8F1" />
      <rect width="240" height="52" fill="#F1EADB" />
      <rect x="16" y="16" width="96" height="8" rx="4" fill="#C6BBA5" />
      <text x="16" y="94" fontFamily="Georgia,serif" fontSize="32" fontStyle="italic" fill="#8C3B2E">
        Rx
      </text>
      <g stroke="#3F3B35" strokeWidth="3.4" strokeLinecap="round" fill="none" opacity=".85">
        <path d="M56 84 q12 -10 22 0 t19 -3 q10 8 22 -2" />
        <path d="M56 122 q17 -11 28 -1 t24 -4" />
        <path d="M56 160 q11 -9 20 1 t18 -3 q14 10 28 -2" />
        <path d="M56 198 q15 -10 25 0 t20 -4" />
        <path d="M56 236 q12 -8 21 2 t24 -4" />
      </g>
    </svg>
  );
}

function VoiceTile({ seed }: { seed: number }) {
  // Deterministic bars so a card does not reshuffle on every render.
  const bars = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => 10 + ((seed * (i + 3)) % 30)),
    [seed],
  );
  return (
    <div className="flex size-full items-center justify-center gap-[2.5px] bg-foreground">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{ height: h }}
          className={cn('w-[2.5px] rounded-full', i % 3 === 0 ? 'bg-white/50' : 'bg-white')}
        />
      ))}
    </div>
  );
}

export function SourceThumb({ order, className }: { order: Order; className?: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  const path = order.source.storagePath;

  React.useEffect(() => {
    if (!path || order.source.kind !== 'photo') return;
    let alive = true;
    getDownloadURL(ref(storage(), path))
      .then((u) => alive && setUrl(u))
      .catch(() => {
        /* rules may deny it, or the emulator has no object — keep the drawing */
      });
    return () => {
      alive = false;
    };
  }, [path, order.source.kind]);

  return (
    <div className={cn('shrink-0 overflow-hidden rounded-md border', className)}>
      {order.source.kind === 'photo' ? (
        url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Customer upload" className="size-full object-cover" />
        ) : (
          <PaperPlaceholder />
        )
      ) : (
        <VoiceTile seed={order.code} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comfortable card
// ---------------------------------------------------------------------------

/**
 * `updatedAt` moves on every meaningful change, so it stands in for a deep
 * compare of items, pricing and timeline. Cheaper than the alternative and
 * wrong only if a write forgets to bump it — which the core helpers never do.
 */
function sameOrder(
  a: { order: Order; selected?: boolean; dragging?: boolean },
  b: { order: Order; selected?: boolean; dragging?: boolean },
): boolean {
  return (
    a.order.id === b.order.id &&
    a.order.updatedAt === b.order.updatedAt &&
    a.order.status === b.order.status &&
    a.selected === b.selected &&
    a.dragging === b.dragging
  );
}

function extractedLines(order: Order): string[] {
  if (order.category === 'concierge' && order.stops?.length) {
    return order.stops.slice(0, 3).map((s) => `${s.storeName} — ${s.what}`);
  }
  return order.items.slice(0, 3).map((i) => `${i.name} ×${i.quantity}`);
}

/**
 * Memoised on the fields that actually change. One Firestore write re-delivers
 * the whole snapshot, so without this every card in every column re-renders
 * each time a single rider taps a button.
 */
export const OrderCard = React.memo(function OrderCard({
  order,
  onOpen,
  dragging,
}: {
  order: Order;
  onOpen: (id: string) => void;
  dragging?: boolean;
}) {
  const flagged = flaggedItems(order);
  const locality = localityById(order.localityId);
  const priced = order.pricing.totalPaise > 0;
  const isConcierge = order.category === 'concierge';

  return (
    <Card
      onClick={() => onOpen(order.id)}
      className={cn(
        'animate-dfc-in cursor-pointer p-[11px] transition-shadow hover:border-disabled hover:shadow-float',
        isConcierge && 'border-concierge-border ring-[3px] ring-concierge/[0.06]',
        dragging && 'opacity-40',
      )}
    >
      <div className="mb-2.5 flex items-center gap-[7px]">
        <span className="tnum text-xs font-semibold">#{order.code}</span>
        <Badge tone={TONE[order.category]}>{order.category.toUpperCase()}</Badge>
        <span className="flex-1" />
        <span className="tnum text-[10.5px] text-placeholder">{ago(order.createdAt)}</span>
      </div>

      <div className="flex gap-2.5">
        <SourceThumb order={order} className="h-[70px] w-14" />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          {extractedLines(order).map((line, i) => (
            <span key={i} className="tnum truncate text-[10.5px] leading-[1.55] text-body-strong">
              {line}
            </span>
          ))}
          {flagged.length > 0 ? (
            <span className="tnum text-[10.5px] text-verify">
              +{flagged.length} low confidence
            </span>
          ) : order.items.length > 3 ? (
            <span className="tnum text-[10.5px] text-placeholder">
              +{order.items.length - 3} more
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={cn('tnum text-[12.5px] font-semibold', !priced && 'text-verify')}>
            {priced ? formatInr(order.pricing.totalPaise) : UNPRICED}
          </span>
          {order.paymentMode === 'cod' && priced ? (
            <span className="text-[9.5px] font-semibold tracking-wide text-grocery-fg">COD</span>
          ) : null}
        </div>
      </div>

      {order.riderUid ? (
        <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5">
          <span className="grid size-[22px] place-items-center rounded-full border bg-muted text-[9px] font-semibold text-icon">
            {initials(order.riderName ?? '')}
          </span>
          <span className="flex-1 truncate text-[11px] text-muted-foreground">
            {order.riderName}
          </span>
          <span className="tnum text-[10.5px] text-placeholder">{order.storeName}</span>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-1.5 border-t pt-2.5">
          <MapPin className="size-3 text-placeholder" strokeWidth={2} />
          <span className="truncate text-[11px] text-muted-foreground">
            {order.customerName} · {locality?.name ?? order.localityId}
          </span>
          {flagged.length > 0 ? (
            <AlertTriangle className="ml-auto size-3 shrink-0 text-verify" strokeWidth={2} />
          ) : null}
        </div>
      )}
    </Card>
  );
}, sameOrder);

// ---------------------------------------------------------------------------
// Dense row
// ---------------------------------------------------------------------------

export const DenseRow = React.memo(function DenseRow({
  order,
  onOpen,
  selected,
}: {
  order: Order;
  onOpen: (id: string) => void;
  selected?: boolean;
}) {
  const locality = localityById(order.localityId);
  const priced = order.pricing.totalPaise > 0;

  return (
    <div
      onClick={() => onOpen(order.id)}
      className={cn(
        'flex h-[30px] cursor-default items-center gap-1.5 border-b px-3 hover:bg-surface',
        selected && 'bg-muted shadow-[inset_2px_0_0_var(--primary)]',
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', DOT[order.category])} />
      <span className="tnum w-[34px] shrink-0 text-[10.5px] font-semibold">{order.code}</span>
      <Badge tone={TONE[order.category]} className="shrink-0 text-[8.5px]">
        {CATEGORY_CODE[order.category]}
      </Badge>
      <span className="flex-1 truncate text-[11px] text-body-strong">
        {order.riderName
          ? `${order.riderName} → ${locality?.name ?? order.localityId}`
          : (order.storeName ?? `${order.customerName} · ${locality?.name ?? order.localityId}`)}
      </span>
      <span
        className={cn(
          'tnum w-11 shrink-0 text-right text-[10.5px] font-semibold',
          !priced && 'text-verify',
        )}
      >
        {priced ? formatInr(order.pricing.totalPaise) : '—'}
      </span>
      <span className="tnum w-[26px] shrink-0 text-right text-[9.5px] text-placeholder">
        {ago(order.createdAt)}
      </span>
    </div>
  );
}, sameOrder);
