'use client';

/**
 * Catalogue and stock.
 *
 * The point of this screen is that pricing stops being guesswork. Once a
 * product has a real price and a real count, the model's estimate gets
 * replaced automatically and "not available" arrives before the rider does,
 * not after.
 *
 * Editing is inline and immediate — a shopkeeper on the phone reading counts
 * out loud should not have to open a modal per row.
 */

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Minus, Plus, Search, TriangleAlert } from 'lucide-react';

import {
  CATEGORY_CODE,
  SEED_STORES,
  discountPercent,
  formatInr,
  stockState,
  STOCK_LABEL,
  type Category,
  type Product,
  type StockState,
} from '@dfc/core';

import { Badge, Button, Card, Input, RupeeInput, Skeleton, Switch } from '@/components/ui/primitives';
import { adjustStock, patchProduct, subscribeProducts } from '@/lib/catalogue';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STOCK_TONE: Record<StockState, 'destructive' | 'verify' | 'grocery'> = {
  out: 'destructive',
  low: 'verify',
  ok: 'grocery',
};

const TONE_BY_CATEGORY: Record<Category, 'pharmacy' | 'grocery' | 'food' | 'concierge'> = {
  pharmacy: 'pharmacy',
  grocery: 'grocery',
  food: 'food',
  concierge: 'concierge',
};

function StockStepper({ product }: { product: Product }) {
  const [local, setLocal] = React.useState(product.stockQty);
  React.useEffect(() => setLocal(product.stockQty), [product.stockQty]);

  return (
    <div className="flex h-8 items-center overflow-hidden rounded-md border">
      <button
        onClick={() => {
          setLocal((v) => Math.max(0, v - 1));
          void adjustStock(product.id, -1, product.stockQty);
        }}
        className="grid h-full w-7 place-items-center transition-colors hover:bg-muted"
        aria-label="Decrease stock"
      >
        <Minus className="size-3 text-muted-foreground" strokeWidth={2.4} />
      </button>
      <input
        value={local}
        onChange={(e) => setLocal(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
        onBlur={() => void patchProduct(product.id, { stockQty: local })}
        className="tnum h-full w-12 border-x bg-transparent text-center text-xs font-semibold outline-none focus:bg-muted"
        inputMode="numeric"
      />
      <button
        onClick={() => {
          setLocal((v) => v + 1);
          void adjustStock(product.id, 1, product.stockQty);
        }}
        className="grid h-full w-7 place-items-center transition-colors hover:bg-muted"
        aria-label="Increase stock"
      >
        <Plus className="size-3 text-muted-foreground" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function Row({ product }: { product: Product }) {
  const state = stockState(product);
  const off = discountPercent(product);
  const store = SEED_STORES.find((s) => s.id === product.storeId);

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_92px_112px_112px_128px_84px] items-center gap-3 border-b px-4 py-2.5 transition-colors hover:bg-surface',
        !product.isActive && 'opacity-45',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Badge tone={TONE_BY_CATEGORY[product.category]}>
          {CATEGORY_CODE[product.category]}
        </Badge>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium tracking-tight">{product.name}</span>
          <span className="tnum truncate text-[10.5px] text-placeholder">
            {product.unit} · {store?.name ?? product.storeId}
            {product.prescriptionOnly ? ' · Rx only' : ''}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <Badge tone={STOCK_TONE[state] === 'grocery' ? 'grocery' : STOCK_TONE[state]}>
          {state === 'ok' ? 'IN STOCK' : state === 'low' ? 'LOW' : 'OUT'}
        </Badge>
      </div>

      <div className="flex justify-center">
        <StockStepper product={product} />
      </div>

      <RupeeInput
        valuePaise={product.mrpPaise}
        onChangePaise={(p) => void patchProduct(product.id, { mrpPaise: p ?? 0 })}
        className="h-8"
      />

      <div className="flex items-center gap-2">
        <RupeeInput
          valuePaise={product.sellPaise}
          onChangePaise={(p) => void patchProduct(product.id, { sellPaise: p ?? 0 })}
          className="h-8 flex-1"
        />
        {off > 0 ? (
          <span className="tnum shrink-0 text-[10.5px] font-semibold text-grocery-fg">
            −{off}%
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={product.isActive}
          onCheckedChange={(v) => void patchProduct(product.id, { isActive: v })}
        />
      </div>
    </div>
  );
}

export default function CataloguePage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [only, setOnly] = React.useState<'all' | StockState>('all');

  React.useEffect(() => {
    return subscribeProducts(
      (p) => {
        setProducts(p);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, []);

  const visible = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((p) => {
      if (only !== 'all' && stockState(p) !== only) return false;
      if (!needle) return true;
      return p.name.toLowerCase().includes(needle) || p.unit.toLowerCase().includes(needle);
    });
  }, [products, search, only]);

  const outCount = products.filter((p) => stockState(p) === 'out').length;
  const lowCount = products.filter((p) => stockState(p) === 'low').length;
  const stockValue = products.reduce((s, p) => s + p.sellPaise * p.stockQty, 0);

  if (authLoading || !user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] font-medium text-body-strong transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Board
        </Link>
        <div className="flex flex-col leading-none">
          <span className="text-[13.5px] font-semibold tracking-tight">Catalogue &amp; stock</span>
          <span className="ta mt-0.5 text-[10px] text-placeholder">பொருட்கள் & கையிருப்பு</span>
        </div>
        <div className="flex-1" />
        <div className="relative w-full max-w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-placeholder" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-[34px] pl-9"
          />
        </div>
      </div>

      {/* Stock health */}
      <div className="flex shrink-0 gap-3 border-b px-5 py-3">
        {[
          { label: 'PRODUCTS', value: String(products.length), tone: '' },
          { label: 'OUT OF STOCK', value: String(outCount), tone: outCount ? 'text-destructive' : '' },
          { label: 'RUNNING LOW', value: String(lowCount), tone: lowCount ? 'text-verify' : '' },
          { label: 'STOCK VALUE', value: formatInr(stockValue), tone: '' },
        ].map((s) => (
          <Card key={s.label} className="flex-1 px-4 py-2.5">
            <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">
              {s.label}
            </span>
            <div className={cn('tnum mt-1 text-lg font-semibold tracking-tight', s.tone)}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-5">
        {(['all', 'out', 'low', 'ok'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setOnly(k)}
            className={cn(
              'h-7 rounded-md px-3 text-[12.5px] transition-colors',
              only === k
                ? 'bg-primary font-medium text-primary-foreground'
                : 'border text-body-strong hover:bg-muted',
            )}
          >
            {k === 'all' ? 'All' : STOCK_LABEL[k].en}
          </button>
        ))}
        <div className="flex-1" />
        {outCount > 0 ? (
          <span className="flex items-center gap-1.5 text-[12px] text-destructive-fg">
            <TriangleAlert className="size-3.5" />
            {outCount} product{outCount === 1 ? '' : 's'} cannot be ordered right now
          </span>
        ) : null}
      </div>

      {/* Table */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_92px_112px_112px_128px_84px] gap-3 border-b bg-surface px-4 py-2">
          {['PRODUCT', 'STATE', 'ON HAND', 'MRP', 'SELL PRICE', 'ACTIVE'].map((h, i) => (
            <span
              key={h}
              className={cn(
                'text-[10px] font-bold tracking-[0.1em] text-placeholder',
                i > 0 && i < 5 && 'text-center',
                i === 5 && 'text-right',
              )}
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="m-4 flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-tint p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="text-[12.5px] leading-relaxed text-destructive-fg">
              {error}
              <div className="mt-1 text-muted-foreground">
                If this is a permissions error, deploy the updated Firestore rules:{' '}
                <code className="tnum rounded bg-background px-1">
                  npm run deploy:rules -w @dfc/firebase
                </code>
              </div>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="grid h-48 place-items-center gap-3 text-center">
            <div>
              <p className="text-[14px] font-medium">No products yet</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Seed the catalogue with{' '}
                <code className="tnum rounded bg-muted px-1">npm run seed -w @dfc/firebase</code>,
                or add one by hand.
              </p>
            </div>
          </div>
        ) : (
          visible.map((p) => <Row key={p.id} product={p} />)
        )}
      </div>

      <div className="flex h-[30px] shrink-0 items-center gap-4 border-t bg-surface px-5">
        <span className="tnum text-[10.5px] text-placeholder">
          {visible.length} of {products.length} products · edits save as you type
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" disabled>
          Import CSV
        </Button>
      </div>
    </main>
  );
}
