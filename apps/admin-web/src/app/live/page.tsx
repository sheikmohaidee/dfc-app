'use client';

/**
 * Live ops. The 3D city sits behind a thin stats rail — meant to be left on a
 * wall display, so nothing here needs a mouse.
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { BOARD_COLUMNS, COLUMN_LABEL, formatInr, type Order } from '@dfc/core';
import { useAuth } from '@/lib/auth';
import { useBoard } from '@/hooks/useBoard';
import { Skeleton } from '@/components/ui/primitives';

// three.js has no business in the server bundle.
const LiveMap3D = dynamic(
  () => import('@/components/live/live-map').then((m) => m.LiveMap3D),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  },
);

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card/80 px-4 py-3 backdrop-blur">
      <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">{label}</span>
      <span className="tnum text-2xl font-semibold tracking-tight">{value}</span>
      {sub ? <span className="text-[11px] text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

export default function LivePage() {
  const { user, loading } = useAuth();
  const board = useBoard('all', '');

  const gmv = React.useMemo(
    () => board.orders.reduce((s: number, o: Order) => s + o.pricing.totalPaise, 0),
    [board.orders],
  );
  const riding = board.orders.filter((o) => o.riderUid).length;
  const online = board.riders.filter((r) => r.isOnline).length;

  if (loading || !user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </main>
    );
  }

  return (
    <main className="relative h-dvh overflow-hidden">
      <div className="absolute inset-0">
        <LiveMap3D orders={board.orders} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 rounded-lg border bg-card/85 px-3 py-2 text-[12.5px] font-medium backdrop-blur transition-colors hover:bg-card"
        >
          <ArrowLeft className="size-3.5" />
          Board
        </Link>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Stat label="OPEN ORDERS" value={String(board.liveCount)} sub="across all stages" />
          <Stat label="ON THE ROAD" value={String(riding)} sub={`${online} riders online`} />
          <Stat label="VALUE IN FLIGHT" value={formatInr(gmv)} sub="unsettled" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="flex gap-2.5">
          {BOARD_COLUMNS.map((c) => (
            <div
              key={c}
              className="flex flex-col gap-0.5 rounded-lg border bg-card/85 px-3 py-2 backdrop-blur"
            >
              <span className="tnum text-[15px] font-semibold tracking-tight">
                {board.counts[c]}
              </span>
              <span className="text-[10px] text-muted-foreground">{COLUMN_LABEL[c].en}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card/85 px-3 py-2 backdrop-blur">
          <span className="text-[10.5px] leading-relaxed text-muted-foreground">
            Pillar height = open orders in that locality · amber glow = waiting over 20 min ·
            travelling dots = riders in transit
          </span>
        </div>
      </div>
    </main>
  );
}
