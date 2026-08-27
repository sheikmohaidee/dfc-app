'use client';

import * as React from 'react';
import {
  BOARD_COLUMNS,
  COLUMN_STATUSES,
  columnOf,
  type BoardColumn,
  type Category,
  type Order,
  type Rider,
  type Store,
} from '@dfc/core';
import { subscribeBoard, subscribeRiders, subscribeStores } from '@/lib/orders';

export type Density = 'comfortable' | 'dense';
export type CategoryFilter = Category | 'all';

export interface BoardState {
  orders: Order[];
  byColumn: Record<BoardColumn, Order[]>;
  riders: Rider[];
  stores: Store[];
  loading: boolean;
  error: string | null;
  counts: Record<BoardColumn, number>;
  liveCount: number;
  /** The 48h / 300-order window filled up; older open orders are not shown. */
  truncated: boolean;
}

/**
 * One Firestore listener feeds the whole board; filtering and grouping happen
 * in memory. At Madurai volume (low thousands of open orders at the extreme)
 * this is far cheaper than four filtered queries that re-run on every write.
 */
export function useBoard(filter: CategoryFilter, search: string): BoardState {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [stores, setStores] = React.useState<Store[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [truncated, setTruncated] = React.useState(false);

  React.useEffect(() => {
    const un = subscribeBoard(
      (next, wasTruncated) => {
        setOrders(next);
        setTruncated(wasTruncated);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return un;
  }, []);

  React.useEffect(() => subscribeRiders(setRiders), []);
  React.useEffect(() => subscribeStores(setStores), []);

  const visible = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.category !== filter) return false;
      if (!needle) return true;
      return (
        String(o.code).includes(needle) ||
        o.customerName.toLowerCase().includes(needle) ||
        o.customerPhone.includes(needle) ||
        (o.storeName ?? '').toLowerCase().includes(needle) ||
        o.items.some((i) => i.name.toLowerCase().includes(needle))
      );
    });
  }, [orders, filter, search]);

  const byColumn = React.useMemo(() => {
    const empty = { incoming: [], review: [], payment: [], dispatched: [] } as Record<
      BoardColumn,
      Order[]
    >;
    for (const o of visible) {
      const col = columnOf(o.status);
      if (col) empty[col].push(o);
    }
    // Oldest first inside a column: the thing that has waited longest is the
    // thing that should be handled next.
    for (const col of BOARD_COLUMNS) empty[col].sort((a, b) => a.createdAt - b.createdAt);
    return empty;
  }, [visible]);

  const counts = React.useMemo(
    () =>
      BOARD_COLUMNS.reduce(
        (acc, c) => {
          acc[c] = byColumn[c].length;
          return acc;
        },
        {} as Record<BoardColumn, number>,
      ),
    [byColumn],
  );

  return {
    orders: visible,
    byColumn,
    riders,
    stores,
    loading,
    error,
    counts,
    liveCount: orders.length,
    truncated,
  };
}

/** The statuses an admin can drop a card into, per column. */
export const DROP_TARGET: Record<BoardColumn, Order['status']> = {
  incoming: 'incoming',
  review: 'admin_review',
  payment: 'awaiting_payment',
  dispatched: COLUMN_STATUSES.dispatched[0]!,
};

/** Persisted density preference. */
export function useDensity(): [Density, (d: Density) => void] {
  const [density, setDensity] = React.useState<Density>('comfortable');

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem('dfc.density');
      if (saved === 'dense' || saved === 'comfortable') setDensity(saved);
    } catch {
      /* private window — stay with the default */
    }
  }, []);

  const set = React.useCallback((d: Density) => {
    setDensity(d);
    try {
      window.localStorage.setItem('dfc.density', d);
    } catch {
      /* ignore */
    }
  }, []);

  return [density, set];
}
