'use client';

/**
 * The board. This is the whole admin product — everything else is a sheet
 * over the top of it.
 */

import * as React from 'react';

import { COLUMN_STATUSES, type BoardColumn, type Order } from '@dfc/core';
import { Bike, Flame, Route, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

import { Board } from '@/components/board/board';
import { FilterBar, StatusBar, TopBar } from '@/components/board/top-bar';
import { BatchingVisualizer } from '@/components/sheets/batching-visualizer';
import { CreateOrderDialog } from '@/components/sheets/create-order-dialog';
import { FoodRescueDialog } from '@/components/sheets/food-rescue-dialog';
import { OrderSheet } from '@/components/sheets/order-sheet';
import { PlatformAutomationsDialog } from '@/components/sheets/platform-automations-dialog';
import { RiderManagementDialog } from '@/components/sheets/rider-management-dialog';
import { useAuth } from '@/lib/auth';
import { moveOrder } from '@/lib/orders';
import { useBoard, useDensity, type CategoryFilter } from '@/hooks/useBoard';
import { SignIn } from './sign-in';

export default function BoardPage() {
  const { user, role, loading: authLoading, configured, signOut } = useAuth();
  const [filter, setFilter] = React.useState<CategoryFilter>('all');
  const [search, setSearch] = React.useState('');
  const [density, setDensity] = useDensity();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = React.useState(false);
  const [ridersModalOpen, setRidersModalOpen] = React.useState(false);
  const [foodRescueOpen, setFoodRescueOpen] = React.useState(false);
  const [batchingOpen, setBatchingOpen] = React.useState(false);
  const [automationsOpen, setAutomationsOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [soundOn, setSoundOn] = React.useState(true);

  const board = useBoard(filter, search);
  const openOrder = React.useMemo(
    () => board.orders.find((o) => o.id === openId) ?? null,
    [board.orders, openId],
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  async function handleMove(order: Order, to: BoardColumn) {
    const target = COLUMN_STATUSES[to][0]!;
    try {
      await moveOrder(order.id, target, user?.uid ?? 'admin-1', 'Moved on the board');
    } catch (e) {
      setToast((e as Error).message);
    }
  }

  if (authLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </main>
    );
  }

  if (!user) return <SignIn />;

  if (role !== 'admin') {
    return (
      <main className="grid min-h-dvh place-items-center p-8">
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="text-lg font-semibold tracking-tight">This board is for staff</h1>
          <p className="text-sm text-muted-foreground">
            Your account is signed in as <strong>{role ?? 'unknown'}</strong>. Ask an
            administrator to grant the admin role.
          </p>
          <button onClick={() => void signOut()} className="text-sm font-medium underline">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        search={search}
        onSearch={setSearch}
        liveCount={board.liveCount}
        userName={user.displayName ?? user.email ?? 'Admin'}
        onSignOut={() => void signOut()}
        onOpenRiders={() => setRidersModalOpen(true)}
        onOpenFoodRescue={() => setFoodRescueOpen(true)}
        onOpenBatching={() => setBatchingOpen(true)}
        onOpenAutomations={() => setAutomationsOpen(true)}
      />
      <FilterBar
        filter={filter}
        onFilter={setFilter}
        density={density}
        onDensity={setDensity}
        onManualOrder={() => setCreateOrderOpen(true)}
        onOpenRiders={() => setRidersModalOpen(true)}
        onOpenFoodRescue={() => setFoodRescueOpen(true)}
        onOpenBatching={() => setBatchingOpen(true)}
      />

      {!configured ? (
        <div className="flex items-center justify-between border-b border-primary/20 bg-primary/5 px-5 py-1.5 text-[12px] text-body-strong">
          <span>
            ⚡ <strong>Standalone Mode:</strong> Operating with in-memory Madurai simulation &amp; real-time reactivity.
          </span>
          <span className="text-[11px] text-muted-foreground">No database required</span>
        </div>
      ) : null}

      {/* Flagship Fleet & Telemetry Mission Control HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-zinc-950/90 px-5 py-2 text-[11.5px] text-zinc-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <Bike className="size-3.5 text-emerald-400" />
            <span className="font-semibold text-white">4 Captains Live</span>
            <span className="text-zinc-500">·</span>
            <span className="text-zinc-400">1 En Route · 0 Incidents</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-orange-400">
            <Flame className="size-3 text-orange-500" />
            <button onClick={() => setFoodRescueOpen(true)} className="font-semibold hover:underline">
              Food Rescue: 1 Flash Deal Live (60% OFF)
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-blue-400">
            <Route className="size-3 text-blue-400" />
            <button onClick={() => setBatchingOpen(true)} className="font-semibold hover:underline">
              TSP Batching: 2 Clusters Ready (+34% Transit Efficiency)
            </button>
          </div>

          <Link
            href="/live"
            className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <TrendingUp className="size-3 text-emerald-400" />
            <span className="font-semibold">H3 Hex Surge: 1.4x Active</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            title="Toggle dispatch audio chimes"
          >
            {soundOn ? <Volume2 className="size-3 text-primary" /> : <VolumeX className="size-3 text-zinc-500" />}
            <span className="hidden sm:inline">{soundOn ? 'Audio Chimes On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {board.error ? (
        <div className="border-b border-destructive-border bg-destructive-tint px-5 py-2 text-[12.5px] text-destructive-fg">
          {board.error}
        </div>
      ) : null}

      {board.truncated ? (
        <div className="border-b border-verify-border bg-verify-tint px-5 py-2 text-[12.5px] text-verify-fg">
          Showing the newest {board.liveCount} open orders from the last 48 hours. Anything older
          that is still open needs chasing outside the board.
        </div>
      ) : null}

      <Board
        byColumn={board.byColumn}
        density={density}
        loading={board.loading}
        onOpen={setOpenId}
        onMove={handleMove}
      />

      <StatusBar total={board.liveCount} medianSeconds={42} breaches={board.counts.payment} />

      <OrderSheet
        order={openOrder}
        riders={board.riders}
        adminUid={user.uid}
        onClose={() => setOpenId(null)}
      />

      <CreateOrderDialog
        open={createOrderOpen}
        adminUid={user.uid}
        onClose={() => setCreateOrderOpen(false)}
        onCreated={(id) => {
          setOpenId(id);
          setToast('Order created and added to the board');
        }}
      />

      <RiderManagementDialog
        open={ridersModalOpen}
        riders={board.riders}
        onClose={() => setRidersModalOpen(false)}
      />

      <FoodRescueDialog
        open={foodRescueOpen}
        onOpenChange={setFoodRescueOpen}
      />

      <BatchingVisualizer
        open={batchingOpen}
        onOpenChange={setBatchingOpen}
      />

      <PlatformAutomationsDialog
        open={automationsOpen}
        onClose={() => setAutomationsOpen(false)}
      />

      {toast ? (
        <div className="animate-dfc-in fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-4 py-2.5 text-[13px] text-background shadow-float">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
