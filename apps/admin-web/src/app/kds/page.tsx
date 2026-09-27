'use client';

/**
 * Merchant Kitchen Display System (KDS) & Tablet Mode.
 *
 * Full-screen landscape UI with large-touch targets, Kanban prep workflow,
 * elapsed order timers, and a 1-tap dish 86 (out-of-stock) desk.
 */

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  Search,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';

import {
  formatInr,
  getKdsStage,
  type KdsStage,
  type Order,
  type OrderStatus,
  type Product,
} from '@dfc/core';
import { Button, Input } from '@/components/ui/primitives';
import { mockStore } from '@/lib/mock-store';
import { cn } from '@/lib/utils';

export default function KdsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = React.useState<string>('all');
  const [eightySixModalOpen, setEightySixModalOpen] = React.useState(false);
  const [dishSearch, setDishSearch] = React.useState('');
  const [soundActive, setSoundActive] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      setOrders(mockStore.getOrders());
      setProducts(mockStore.getProducts());
    };
    update();
    return mockStore.subscribe(update);
  }, []);

  React.useEffect(() => {
    const updateTime = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      );
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (selectedStore === 'all') return orders;
    return orders.filter((o) => o.storeId === selectedStore);
  }, [orders, selectedStore]);

  // Group by KDS stage
  const kdsGroups = React.useMemo(() => {
    const map: Record<KdsStage, Order[]> = {
      new: [],
      preparing: [],
      ready: [],
      dispatched: [],
    };
    for (const order of filteredOrders) {
      const stage = getKdsStage(order.status);
      if (stage) {
        map[stage].push(order);
      }
    }
    return map;
  }, [filteredOrders]);

  const handleBumpStatus = (order: Order, nextStatus: OrderStatus) => {
    mockStore.moveOrder(order.id, nextStatus, 'vendor', 'kitchen-kds', 'Updated on Kitchen Tablet');
  };

  const handleToggleProductStock = (productId: string, currentActive: boolean) => {
    mockStore.toggleProductStock(productId, !currentActive);
  };

  const filteredProducts = React.useMemo(() => {
    if (!dishSearch.trim()) return products;
    const q = dishSearch.toLowerCase().trim();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nameTa && p.nameTa.includes(q)),
    );
  }, [products, dishSearch]);

  const outOfStockCount = React.useMemo(() => products.filter((p) => !p.isActive).length, [products]);

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden">
      {/* High-Contrast KDS Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Dispatch Board</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30">
              <UtensilsCrossed className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">DFC Kitchen KDS</h1>
                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-black text-orange-400 uppercase tracking-wider">
                  Tablet Mode
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">High-Contrast Touch Dispatch System</p>
            </div>
          </div>
        </div>

        {/* Store Filter Pills */}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          {[
            { id: 'all', name: 'All Kitchens' },
            { id: 'murugan-idli-shop', name: 'Murugan Idli' },
            { id: 'simmakkal-konar-mess', name: 'Konar Mess' },
            { id: 'famous-jigarthanda', name: 'Jigarthanda' },
          ].map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                selectedStore === store.id
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white',
              )}
            >
              {store.name}
            </button>
          ))}
        </div>

        {/* Quick KDS Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEightySixModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <XCircle className="size-4" />
            <span>86 Dish (1-Tap Stockout)</span>
            {outOfStockCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-red-600 text-[10px] text-white">
                {outOfStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSoundActive(!soundActive)}
            className="grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Toggle kitchen alarm chime"
          >
            {soundActive ? <Bell className="size-4 text-emerald-400" /> : <BellOff className="size-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="grid size-9 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Toggle full screen landscape mount"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-bold text-emerald-400">
            <Clock className="size-3.5" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Kanban Tablet Workflow Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* Column 1: New Orders */}
        <div className="flex flex-col rounded-2xl border border-blue-500/30 bg-blue-950/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-blue-500/20 bg-blue-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                1. New Orders ({kdsGroups.new.length})
              </span>
            </div>
            <span className="text-[11px] font-tamil text-blue-400">புதிய ஆர்டர்கள்</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {kdsGroups.new.length === 0 ? (
              <div className="grid h-48 place-items-center text-center text-xs text-zinc-500">
                No new incoming tickets
              </div>
            ) : (
              kdsGroups.new.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-blue-500/40 bg-zinc-900/90 p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xl font-black text-white">#{order.code}</span>
                      <p className="text-xs font-semibold text-zinc-400">{order.customerName}</p>
                    </div>
                    <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-mono font-bold text-blue-400">
                      {formatInr(order.pricing.itemsPaise)}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="rounded-lg bg-zinc-950/80 p-2.5 space-y-1.5 border border-zinc-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white">
                          <strong className="text-amber-400">{item.quantity}×</strong> {item.name}
                        </span>
                        <span className="text-[11px] text-zinc-500">{item.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special Gate / Voice Note Instructions */}
                  {order.instructions && (
                    <div className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                      ⚠️ Note: {order.instructions.textNote || order.instructions.tags.join(', ')}
                    </div>
                  )}

                  <Button
                    size="lg"
                    onClick={() => handleBumpStatus(order, 'packing')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 text-sm shadow-lg shadow-blue-600/30"
                  >
                    Accept &amp; Start Preparing 🍳
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="flex flex-col rounded-2xl border border-amber-500/30 bg-amber-950/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                2. Preparing ({kdsGroups.preparing.length})
              </span>
            </div>
            <span className="text-[11px] font-tamil text-amber-400">சமையல் நடக்கிறது</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {kdsGroups.preparing.length === 0 ? (
              <div className="grid h-48 place-items-center text-center text-xs text-zinc-500">
                All food cooked &amp; ready
              </div>
            ) : (
              kdsGroups.preparing.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-amber-500/40 bg-zinc-900/90 p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xl font-black text-white">#{order.code}</span>
                      <p className="text-xs font-semibold text-zinc-400">{order.customerName}</p>
                    </div>
                    <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-mono font-bold text-amber-400">
                      Cooking
                    </span>
                  </div>

                  <div className="rounded-lg bg-zinc-950/80 p-2.5 space-y-1.5 border border-zinc-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white">
                          <strong className="text-amber-400">{item.quantity}×</strong> {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handleBumpStatus(order, 'ready_for_pickup')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-12 text-sm shadow-lg shadow-amber-600/30"
                  >
                    Pack &amp; Mark Ready for Pickup 📦
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready for Pickup */}
        <div className="flex flex-col rounded-2xl border border-emerald-500/30 bg-emerald-950/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                3. Ready for Pickup ({kdsGroups.ready.length})
              </span>
            </div>
            <span className="text-[11px] font-tamil text-emerald-400">தயார் நிலையில்</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {kdsGroups.ready.length === 0 ? (
              <div className="grid h-48 place-items-center text-center text-xs text-zinc-500">
                No orders waiting on counter
              </div>
            ) : (
              kdsGroups.ready.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-emerald-500/40 bg-zinc-900/90 p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xl font-black text-white">#{order.code}</span>
                      <p className="text-xs font-semibold text-zinc-400">{order.customerName}</p>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400">
                      ON COUNTER
                    </span>
                  </div>

                  <div className="rounded-lg bg-zinc-950/80 p-2.5 space-y-1 border border-zinc-800 text-xs text-zinc-300">
                    <p>Captain: <strong>{order.riderName || 'Arriving at counter'}</strong></p>
                    <p className="font-mono text-zinc-400 text-[11px]">OTP: {order.deliveryOtp}</p>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handleBumpStatus(order, 'picked_up')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm shadow-lg shadow-emerald-600/30"
                  >
                    Handed Over to Captain 🛵
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Dispatched / In Transit */}
        <div className="flex flex-col rounded-2xl border border-purple-500/30 bg-purple-950/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-purple-500/20 bg-purple-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-purple-500" />
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                4. Dispatched ({kdsGroups.dispatched.length})
              </span>
            </div>
            <span className="text-[11px] font-tamil text-purple-400">டெலிவரி புறப்பட்டது</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {kdsGroups.dispatched.length === 0 ? (
              <div className="grid h-48 place-items-center text-center text-xs text-zinc-500">
                No active deliveries en route
              </div>
            ) : (
              kdsGroups.dispatched.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-purple-500/40 bg-zinc-900/90 p-4 shadow-lg space-y-2 opacity-80"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-lg font-bold text-white">#{order.code}</span>
                      <p className="text-xs text-zinc-400">{order.customerName}</p>
                    </div>
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-300">
                      En Route
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Captain: <strong>{order.riderName}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Destination: {order.addressLine}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 1-Tap Out-of-Stock (86 Dish) Modal */}
      {eightySixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">1-Tap Dish 86 (Rush Hour Stockout)</h2>
                <p className="text-xs text-zinc-400">
                  Tap any dish to immediately disable it on customer apps when running out
                </p>
              </div>
              <button
                onClick={() => setEightySixModalOpen(false)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Search dish (e.g. Parotta, Dosa, Jigarthanda)..."
                className="h-11 pl-9 border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3 transition-colors',
                    prod.isActive
                      ? 'border-zinc-800 bg-zinc-950/60'
                      : 'border-red-500/40 bg-red-500/10',
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-bold', !prod.isActive && 'line-through text-zinc-400')}>
                        {prod.name}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">{formatInr(prod.sellPaise)}</span>
                    </div>
                    {prod.nameTa && <p className="text-xs text-zinc-400 font-tamil">{prod.nameTa}</p>}
                  </div>

                  <button
                    onClick={() => handleToggleProductStock(prod.id, prod.isActive)}
                    className={cn(
                      'rounded-xl px-4 py-2 text-xs font-bold transition-all shadow',
                      prod.isActive
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
                    )}
                  >
                    {prod.isActive ? '86 THIS DISH' : 'RESTORE IN STOCK'}
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex justify-end">
              <Button onClick={() => setEightySixModalOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
