'use client';

/**
 * DFC Command Center — Incoming Orders Triage Desk
 * High-velocity unassigned tickets with live countdown timers and 1-click Captain dispatch
 * Implements 03 — Incoming Orders
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  MapPin,
  Mic,
  Navigation,
  Phone,
  Radio,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  Timer,
  Truck,
  User,
  Volume2,
  X,
  Zap,
} from 'lucide-react';

import {
  STATUS_LABEL,
  formatInr,
  localityById,
  storeById,
  type Order,
  type Rider,
} from '@dfc/core';

import { AdminShell } from '@/components/admin-shell';
import { OrderSheet } from '@/components/sheets/order-sheet';
import { subscribeBoard, subscribeRiders, dispatchToRider, moveOrder } from '@/lib/orders';
import { mockStore } from '@/lib/mock-store';
import { useAuth } from '@/lib/auth';

export default function IncomingOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsubOrders = subscribeBoard((realOrders) => {
      setOrders(realOrders);
    });
    const unsubRiders = subscribeRiders((realRiders) => {
      setRiders(realRiders);
    });
    return () => {
      unsubOrders();
      unsubRiders();
    };
  }, []);

  const incomingOrders = orders.filter(
    (o) => o.status === 'incoming' || o.status === 'admin_review' || o.status === 'awaiting_payment' || o.status === 'paid',
  );

  const availableRiders = riders.filter((r) => r.isOnline && !r.activeOrderId);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  const handleInstantDispatch = (orderId: string, rider: Rider) => {
    void dispatchToRider(orderId, rider, user?.uid || 'admin-1');
  };

  const handleReject = (orderId: string) => {
    void moveOrder(orderId, 'cancelled', user?.uid || 'admin-1', 'Cancelled at triage');
  };

  return (
    <AdminShell
      title="Incoming Orders Triage Desk"
      subtitle={`${incomingOrders.length} tickets pending store acceptance & Captain assignment`}
    >
      <div className="flex flex-col gap-6">
        {/* TOP LIVE BANNER */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#FF7F50]/40 bg-[#FF7F50]/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/30">
              <Inbox className="size-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">
                Real-Time Dispatch Pipeline
              </h2>
              <p className="text-[12px] text-[#A1A1AA]">
                Orders must be accepted and routed to Captains within 90 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#10B981]/20 px-3 py-1 text-[11px] font-bold text-[#10B981]">
              {availableRiders.length} Available Captains in Radius
            </span>
          </div>
        </div>

        {/* INCOMING TICKETS GRID */}
        {incomingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#2A2A2E] bg-[#18191B] py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#222327] text-[#71717A]">
              <CheckCircle2 className="size-7 text-[#10B981]" />
            </div>
            <h3 className="text-[16px] font-extrabold text-[#F4F4F5]">
              All Orders Triaged & Dispatched
            </h3>
            <p className="max-w-md text-[12.5px] text-[#A1A1AA]">
              No unassigned or pending tickets in the queue. All live deliveries are currently handled by merchants and fleet captains.
            </p>
            <Link
              href="/orders"
              className="mt-2 rounded-lg bg-[#6A5ACD] px-4 py-2 text-[12px] font-bold text-white shadow-md hover:bg-[#5b4cb8]"
            >
              View Active Orders Table
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {incomingOrders.map((ord) => {
              const store = storeById(ord.storeId);
              const drop = localityById(ord.localityId);

              return (
                <div
                  key={ord.id}
                  className="flex flex-col justify-between rounded-xl border border-[#FF7F50]/50 bg-[#18191B] p-5 shadow-xl transition hover:border-[#FF7F50]"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[16px] font-extrabold text-[#F4F4F5]">
                          #{ord.code}
                        </span>
                        <span className="rounded bg-[#FF7F50]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#FF7F50]">
                          {ord.category.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B]">
                        <Clock className="size-3.5" />
                        <span>SLA: 64s</span>
                      </div>
                    </div>

                    {/* Customer & Merchant */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <User className="mt-0.5 size-4 shrink-0 text-[#71717A]" />
                        <div>
                          <div className="text-[13px] font-bold text-[#F4F4F5]">
                            {ord.customerName}
                          </div>
                          <div className="text-[11px] text-[#A1A1AA]">
                            {ord.customerPhone} · {drop?.name ?? 'Madurai'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Store className="mt-0.5 size-4 shrink-0 text-[#71717A]" />
                        <div>
                          <div className="text-[13px] font-semibold text-[#F4F4F5]">
                            {store?.name ?? ord.storeName ?? 'Partner Merchant'}
                          </div>
                          <div className="text-[11px] text-[#71717A]">
                            {localityById(store?.localityId)?.name ?? 'Madurai'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="rounded-lg bg-[#222327] p-2.5 text-[11.5px]">
                      <div className="font-bold text-[#A1A1AA]">ORDER ITEMS ({ord.items.length})</div>
                      <div className="mt-1 flex flex-col gap-1">
                        {ord.items.slice(0, 3).map((it) => (
                          <div key={it.id} className="flex justify-between text-[#F4F4F5]">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-mono text-[#A1A1AA]">
                              {formatInr(it.unitPricePaise ? it.unitPricePaise * it.quantity : 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source Transcript if Voice */}
                    {ord.source?.kind === 'voice' && ord.source.transcript ? (
                      <div className="flex items-start gap-2 rounded-lg bg-[#6A5ACD]/15 p-2.5 text-[11px] text-[#A78BFA]">
                        <Mic className="mt-0.5 size-3.5 shrink-0 text-[#6A5ACD]" />
                        <span className="line-clamp-2 italic">“{ord.source.transcript}”</span>
                      </div>
                    ) : null}

                    {/* Total & Payment */}
                    <div className="flex items-center justify-between border-t border-[#2A2A2E] pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#71717A]">PAYMENT:</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            ord.paymentMode === 'cod'
                              ? 'bg-[#EF4444]/15 text-[#F87171]'
                              : 'bg-[#10B981]/15 text-[#34D399]'
                          }`}
                        >
                          {ord.paymentMode === 'cod' ? 'CASH ON DELIVERY' : 'ONLINE PREPAID'}
                        </span>
                      </div>

                      <div className="font-mono text-[16px] font-extrabold text-[#F4F4F5]">
                        {formatInr(ord.pricing?.totalPaise || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Instant Dispatch Picker */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-[#2A2A2E] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-[#71717A]">
                        DISPATCH TO NEAREST CAPTAIN:
                      </span>
                    </div>

                    {availableRiders.length > 0 ? (
                      <div className="flex gap-2">
                        {availableRiders.slice(0, 2).map((r) => (
                          <button
                            key={r.uid}
                            type="button"
                            onClick={() => handleInstantDispatch(ord.id, r)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/15 py-2 text-[11px] font-bold text-[#34D399] transition hover:bg-[#10B981]/25"
                          >
                            <Bike className="size-3.5" />
                            <span className="truncate">{r.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#F59E0B]">
                        No free captains idle. Assign manually or wait for drop completion.
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(ord.id)}
                        className="flex-1 rounded-lg bg-[#6A5ACD] py-2 text-center text-[12px] font-bold text-white hover:bg-[#5b4cb8]"
                      >
                        Inspect Full Ticket
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(ord.id)}
                        className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-[12px] font-bold text-[#EF4444] hover:bg-[#EF4444]/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ORDER DETAILS SIDE DRAWER */}
      <OrderSheet
        order={selectedOrder}
        adminUid={user?.uid || 'admin-1'}
        onClose={() => setSelectedOrderId(null)}
        riders={riders}
      />
    </AdminShell>
  );
}
