'use client';

/**
 * Live ops. The 3D city sits behind a thin stats rail — meant to be left on a
 * wall display, with H3 Surge Heatmap insights and rider telemetry.
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Flame, Radio } from 'lucide-react';

import { BOARD_COLUMNS, COLUMN_LABEL, formatInr, type Order } from '@dfc/core';
import { useAuth } from '@/lib/auth';
import { useBoard } from '@/hooks/useBoard';
import { Button, Skeleton } from '@/components/ui/primitives';
import { SurgeHexOverlay } from '@/components/live/surge-hex-overlay';
import { mockStore } from '@/lib/mock-store';

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
  const [showSurge, setShowSurge] = React.useState(false);
  const [showTelemetry, setShowTelemetry] = React.useState(false);
  const [hexSurgeMap, setHexSurgeMap] = React.useState(() => mockStore.getHexSurgeMap());

  React.useEffect(() => {
    const update = () => setHexSurgeMap(mockStore.getHexSurgeMap());
    update();
    return mockStore.subscribe(update);
  }, []);

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
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border bg-card/85 px-3 py-2 text-[12.5px] font-medium backdrop-blur transition-colors hover:bg-card"
          >
            <ArrowLeft className="size-3.5" />
            Board
          </Link>
          <Button
            size="sm"
            variant={showSurge ? 'default' : 'outline'}
            onClick={() => setShowSurge(!showSurge)}
            className="bg-card/85 backdrop-blur gap-1.5"
          >
            <Flame className="size-3.5 text-orange-500" />
            {showSurge ? 'Hide Surge Radar' : 'H3 Surge Heatmap'}
          </Button>
          <Button
            size="sm"
            variant={showTelemetry ? 'default' : 'outline'}
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="bg-card/85 backdrop-blur gap-1.5"
          >
            <Radio className="size-3.5 text-emerald-500" />
            {showTelemetry ? 'Hide Telemetry' : 'Captain Telemetry'}
          </Button>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Stat label="OPEN ORDERS" value={String(board.liveCount)} sub="across all stages" />
          <Stat label="ON THE ROAD" value={String(riding)} sub={`${online} riders online`} />
          <Stat label="VALUE IN FLIGHT" value={formatInr(gmv)} sub="unsettled" />
        </div>
      </div>

      {showTelemetry && (
        <div className="pointer-events-auto absolute top-20 left-5 z-20 w-80 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live Captain Vectors</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400">42ms GPS</span>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">A. Dhanush (Captain 1)</span>
                <span className="text-[10px] font-mono text-emerald-400">24 km/h · 45° NE</span>
              </div>
              <p className="text-[11px] text-zinc-400">Heading to 82, North Veli St · Order #1044</p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
                <span>Battery: 88%</span>
                <span>·</span>
                <span>Crash Anomaly: 0.0G (Normal)</span>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">M. Karthik (Captain 2)</span>
                <span className="text-[10px] font-mono text-amber-400">0 km/h · Stationary</span>
              </div>
              <p className="text-[11px] text-zinc-400">At Simmakkal Konar Mess · Order #1043</p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
                <span>Battery: 94%</span>
                <span>·</span>
                <span>Indoor Waypoint: Gate 2</span>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2.5 space-y-1 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">S. Vijay (Captain 3)</span>
                <span className="text-[10px] font-mono text-red-400">Offline (Audit)</span>
              </div>
              <p className="text-[11px] text-zinc-500">3 Strikes Reached · Review Pending</p>
            </div>
          </div>
        </div>
      )}

      {showSurge && (
        <div className="pointer-events-auto absolute top-20 right-5 z-20 max-w-2xl w-full">
          <SurgeHexOverlay surgeMap={hexSurgeMap} />
        </div>
      )}

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
            Pillar height = open orders in locality · H3 hex surge active · real-time dead reckoning
          </span>
        </div>
      </div>
    </main>
  );
}
