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

  if (!configured) {
    return (
      <main className="grid min-h-dvh place-items-center p-8">
        <div className="max-w-md space-y-3 rounded-xl border p-6">
          <h1 className="text-lg font-semibold tracking-tight">Firebase is not configured</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Copy <code className="tnum rounded bg-muted px-1">.env.example</code> to{' '}
            <code className="tnum rounded bg-muted px-1">.env.local</code> in{' '}
            <code className="tnum rounded bg-muted px-1">apps/admin-web</code> and fill in the{' '}
            <code className="tnum rounded bg-muted px-1">NEXT_PUBLIC_FIREBASE_*</code> values from
            the Firebase console, then restart the dev server.
          </p>
        </div>
      </main>
    );
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
