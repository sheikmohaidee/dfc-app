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
  print: 'pharmacy',
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
        'grid grid-cols-[minmax(0,1fr)_92px_112px_112px_128px_84px_44px] items-center gap-3 border-b px-4 py-2.5 transition-colors hover:bg-surface',
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
          <span className="text-[13.5px] font-semibold tracking-tight">Catalogue &amp; Menu</span>
          <span className="ta mt-0.5 text-[10px] text-placeholder">பொருட்கள் &amp; மெனு மேலாண்மை</span>
        </div>
        <div className="flex-1" />
        <div className="relative w-full max-w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-placeholder" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="h-[34px] pl-9"
          />
        </div>
        <Button size="sm" onClick={() => setAddModalOpen(true)} className="gap-1.5">
          <Plus className="size-3.5" strokeWidth={2.4} />
          Add Item
        </Button>
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
            {outCount} product{outCount === 1 ? '' : 's'} unavailable right now
          </span>
        ) : null}
      </div>

      {/* Table */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_92px_112px_112px_128px_84px_44px] gap-3 border-b bg-surface px-4 py-2">
          {['PRODUCT', 'STATE', 'ON HAND', 'MRP', 'SELL PRICE', 'ACTIVE', ''].map((h, i) => (
            <span
              key={i}
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
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="grid h-48 place-items-center gap-3 text-center">
            <div>
              <p className="text-[14px] font-medium">No items found</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Click <strong>+ Add Item</strong> above to create a new menu item.
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

      <div className="flex h-[30px] shrink-0 items-center gap-4 border-t bg-surface px-5">
        <span className="tnum text-[10.5px] text-placeholder">
          {visible.length} of {products.length} menu items · toggle switches update availability instantly
        </span>
      </div>

      <AddProductDialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdded={() => {}}
      />
    </main>
  );
}
