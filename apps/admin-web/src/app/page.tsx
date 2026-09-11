'use client';

/**
 * The board. This is the whole admin product — everything else is a sheet
 * over the top of it.
 */

import * as React from 'react';

import { COLUMN_STATUSES, type BoardColumn, type Order } from '@dfc/core';

import { Board } from '@/components/board/board';
import { FilterBar, StatusBar, TopBar } from '@/components/board/top-bar';
import { OrderSheet } from '@/components/sheets/order-sheet';
import { useAuth } from '@/lib/auth';
import { moveOrder } from '@/lib/orders';
import { useBoard, useDensity, type CategoryFilter } from '@/hooks/useBoard';
import { SignIn } from './sign-in';

function CancellationReview({ riders }: { riders: import('@dfc/core').Rider[] }) {
  const needsReview = riders.filter(r => (r.cancellationCount || 0) > 0);
  if (needsReview.length === 0) return null;

  return (
    <div className="border-b bg-surface px-5 py-4">
      <h3 className="text-[13px] font-semibold mb-2.5 tracking-tight text-body-strong">CAPTAIN CANCELLATION REVIEW</h3>
      <div className="flex flex-col gap-2">
        {needsReview.map(r => (
          <div key={r.uid} className="flex items-center gap-4 bg-background border rounded-lg px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 min-w-[150px]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full border bg-muted text-[10px] font-semibold text-icon">
                {r.name.substring(0, 2).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium">{r.name}</span>
            </div>
            
            <span className="text-[12px] font-medium text-destructive w-32">{r.cancellationCount} cancellations</span>
            
            <span className="w-24">
              <span className={r.isOnline || r.status === 'ONLINE' ? "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] leading-none text-grocery-fg bg-grocery-tint border-grocery-border" : "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] leading-none text-muted-foreground bg-muted border-border"}>
                {r.status || (r.isOnline ? 'ONLINE' : 'OFFLINE')}
              </span>
            </span>
            
            <span className="text-[10px] font-bold tracking-wider text-verify-fg bg-verify-tint border border-verify-border px-1.5 py-0.5 rounded-sm mr-auto">
              REVIEW: PENDING
            </span>
            
            {(!r.isOnline || r.status === 'OFFLINE') && (
              <button className="text-[12px] font-semibold text-primary hover:underline px-3 py-1 rounded-md hover:bg-primary/5 transition-colors">
                Reinstate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const { user, role, loading: authLoading, configured, signOut } = useAuth();
  const [filter, setFilter] = React.useState<CategoryFilter>('all');
  const [search, setSearch] = React.useState('');
  const [density, setDensity] = useDensity();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

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
      await moveOrder(order.id, target, user!.uid, 'Moved on the board');
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
      />
      <FilterBar
        filter={filter}
        onFilter={setFilter}
        density={density}
        onDensity={setDensity}
        onManualOrder={() => setToast('Manual order entry opens from the customer record.')}
      />

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

      <CancellationReview riders={board.riders} />

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

      {toast ? (
        <div className="animate-dfc-in fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-foreground px-4 py-2.5 text-[13px] text-background shadow-float">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
