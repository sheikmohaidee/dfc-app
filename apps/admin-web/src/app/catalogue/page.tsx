'use client';

/**
 * Catalogue and stock.
 *
 * Menu management for Admin: add new products, delete products, and toggle item
 * availability ON/OFF in real time.
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Minus,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import {
  ACTIVE_CATEGORIES,
  CATEGORY_CODE,
  SEED_STORES,
  discountPercent,
  formatInr,
  stockState,
  STOCK_LABEL,
  toPaise,
  type Category,
  type Product,
  type StockState,
} from '@dfc/core';

import { Badge, Button, Card, Input, RupeeInput, Skeleton, Switch } from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { addProduct, adjustStock, deleteProduct, patchProduct, subscribeProducts } from '@/lib/catalogue';
import { AdminShell } from '@/components/admin-shell';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const STOCK_TONE: Record<StockState, 'destructive' | 'verify' | 'grocery'> = {
  out: 'destructive',
  low: 'verify',
  ok: 'grocery',
};

const TONE_BY_CATEGORY: Partial<Record<Category, 'grocery' | 'food' | 'concierge'>> = {
  grocery: 'grocery',
  food: 'food',
  concierge: 'concierge',
  print: 'concierge',
  pickup_drop: 'food',
  buy_deliver: 'grocery',
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

function Row({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  const state = stockState(product);
  const off = discountPercent(product);
  const store = SEED_STORES.find((s) => s.id === product.storeId);

  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_100px_130px_110px_130px_90px_50px] items-center gap-3 border-b border-white/5 px-5 py-3 transition-colors hover:bg-white/[0.02]',
        !product.isActive && 'opacity-40',
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

      <div className="flex justify-end">
        <button
          onClick={() => onDelete(product.id)}
          title="Delete product"
          className="grid size-7 place-items-center rounded text-placeholder transition-colors hover:bg-destructive-tint hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddProductDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [storeId, setStoreId] = React.useState('amma-mini-mart');
  const [name, setName] = React.useState('');
  const [nameTa, setNameTa] = React.useState('');
  const [category, setCategory] = React.useState<Category>('grocery');
  const [unit, setUnit] = React.useState('1 kg');
  const [mrp, setMrp] = React.useState<number | null>(toPaise(100));
  const [sell, setSell] = React.useState<number | null>(toPaise(90));
  const [qty, setQty] = React.useState('25');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const activeStores = SEED_STORES.filter((s) => s.category !== 'pharmacy');

  async function submit() {
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addProduct({
        storeId,
        name: name.trim(),
        nameTa: nameTa.trim() || undefined,
        category,
        unit: unit.trim() || 'each',
        mrpPaise: mrp ?? toPaise(50),
        sellPaise: sell ?? toPaise(45),
        stockQty: Number(qty) || 10,
        lowStockAt: 5,
        isActive: true,
      });
      onClose();
      onAdded();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent width={460}>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PackagePlus className="size-4" strokeWidth={2.4} />
            </span>
            <div className="flex flex-col">
              <SheetTitle className="text-base font-semibold tracking-tight">Add Menu Item</SheetTitle>
              <span className="ta text-[11px] text-placeholder">புதிய பொருள் சேர்க்க</span>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-3.5">
          {error ? (
            <div className="rounded border border-destructive-border bg-destructive-tint p-2.5 text-xs text-destructive-fg">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-body-strong">Fulfilling Store</span>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus:border-ring"
            >
              {activeStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category}) · {s.localityId}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-body-strong">Product Name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sambar Rice / Ponni Boiled Rice"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-body-strong">Tamil Name (Optional)</span>
            <Input
              value={nameTa}
              onChange={(e) => setNameTa(e.target.value)}
              placeholder="e.g. சாம்பார் சாதம்"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-strong">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none"
              >
                {ACTIVE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-strong">Unit / Measure</span>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="1 kg, plate, piece, 500 ml"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-strong">MRP (₹)</span>
              <RupeeInput valuePaise={mrp} onChangePaise={setMrp} className="h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-strong">Sell Price (₹)</span>
              <RupeeInput valuePaise={sell} onChangePaise={setSell} className="h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-body-strong">Initial Stock</span>
              <Input
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="20"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <div className="flex w-full gap-2.5">
            <Button variant="outline" size="default" onClick={onClose} disabled={busy} className="flex-1">
              Cancel
            </Button>
            <Button size="default" onClick={() => void submit()} disabled={busy} className="flex-1 gap-1">
              <Check className="size-4" />
              {busy ? 'Saving…' : 'Save Item'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function CataloguePage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [only, setOnly] = React.useState<'all' | StockState>('all');
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  React.useEffect(() => {
    return subscribeProducts(
      (p) => {
        // Exclude pharmacy items from active catalogue
        setProducts(p.filter((prod) => prod.category !== 'pharmacy'));
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
      return (
        p.name.toLowerCase().includes(needle) ||
        p.unit.toLowerCase().includes(needle) ||
        (p.nameTa ?? '').toLowerCase().includes(needle)
      );
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
    <AdminShell
      title="Products & Catalogue"
      subtitle="பொருட்கள் & மெனு மேலாண்மை · Direct inventory, stock control & real-time pricing"
    >
      <div className="space-y-6">
        {/* Top Action bar & Stock health */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'TOTAL PRODUCTS', value: String(products.length), tone: 'text-white' },
            { label: 'OUT OF STOCK', value: String(outCount), tone: outCount ? 'text-rose-400 font-bold' : 'text-slate-400' },
            { label: 'RUNNING LOW', value: String(lowCount), tone: lowCount ? 'text-amber-400 font-bold' : 'text-slate-400' },
            { label: 'STOCK VALUE', value: formatInr(stockValue), tone: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#18191B] border border-white/5 rounded-2xl p-4 shadow-xl">
              <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400">
                {s.label}
              </span>
              <div className={cn('tnum mt-1 text-2xl font-bold tracking-tight', s.tone)}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters and search toolbar */}
        <div className="bg-[#18191B] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['all', 'out', 'low', 'ok'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setOnly(k)}
                className={cn(
                  'h-8 rounded-xl px-3.5 text-xs font-medium transition-all',
                  only === k
                    ? 'bg-[#6A5ACD] text-white shadow-lg shadow-[#6A5ACD]/25'
                    : 'bg-[#222327] text-slate-400 hover:text-white hover:bg-white/10',
                )}
              >
                {k === 'all' ? 'All Items' : STOCK_LABEL[k].en}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items by name, store..."
                className="w-full h-9 rounded-xl bg-[#222327] border border-white/5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6A5ACD]"
              />
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#6A5ACD] hover:bg-[#5848b8] text-white text-xs font-semibold shadow-lg shadow-[#6A5ACD]/25 transition-all"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              Add Product
            </button>
          </div>
        </div>

        {outCount > 0 ? (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-2.5 text-xs">
            <TriangleAlert className="size-4 shrink-0 text-rose-400" />
            <span><strong>{outCount} item{outCount === 1 ? '' : 's'}</strong> are currently marked out of stock and unavailable in the customer app.</span>
          </div>
        ) : null}

        {/* Product Table Card */}
        <div className="bg-[#18191B] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_100px_130px_110px_130px_90px_50px] gap-3 border-b border-white/5 bg-[#222327]/80 backdrop-blur px-5 py-3">
            {['PRODUCT & STORE', 'STATUS', 'ON HAND', 'MRP', 'SELL PRICE', 'ACTIVE', ''].map((h, i) => (
              <span
                key={i}
                className={cn(
                  'text-[10px] font-bold tracking-[0.1em] text-slate-400',
                  i > 0 && i < 5 && 'text-center',
                  i === 5 && 'text-right',
                )}
              >
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-[#222327]" />
                ))}
              </div>
            ) : error ? (
              <div className="m-5 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                <div className="text-xs leading-relaxed">{error}</div>
              </div>
            ) : visible.length === 0 ? (
              <div className="grid h-48 place-items-center gap-3 text-center p-8">
                <div>
                  <p className="text-sm font-semibold text-white">No products found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Click <strong>+ Add Product</strong> above to create a new catalogue item.
                  </p>
                </div>
              </div>
            ) : (
              visible.map((p) => (
                <Row
                  key={p.id}
                  product={p}
                  onDelete={(id) => void deleteProduct(id)}
                />
              ))
            )}
          </div>

          <div className="flex h-10 items-center justify-between border-t border-white/5 bg-[#141517] px-5 text-[11px] text-slate-500">
            <span>Showing {visible.length} of {products.length} menu items</span>
            <span>Real-time sync enabled · Toggle switches update customer app immediately</span>
          </div>
        </div>
      </div>

      <AddProductDialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={() => {}}
      />
    </AdminShell>
  );
}
