'use client';

/**
 * DFC Command Center — Admin Operations Dashboard
 * DFC Dark Floating Design System (#0E0E10, #18191B, #222327, #6A5ACD, #FF7F50)
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bike,
  Boxes,
  CheckCircle2,
  Clock,
  CloudRain,
  CreditCard,
  DollarSign,
  Eye,
  Flame,
  Inbox,
  Layers,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Plus,
  Radio,
  Receipt,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Timer,
  TrendingUp,
  Truck,
  User,
  Users,
  UtensilsCrossed,
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
import { subscribeBoard, subscribeRiders } from '@/lib/orders';
import { mockStore } from '@/lib/mock-store';
import { useAuth } from '@/lib/auth';

export default function AdminDashboardPage() {
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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  // Key metrics
  const totalGmvPaise = orders.reduce((sum, o) => sum + (o.pricing?.totalPaise || 0), 0);
  const activeOrders = orders.filter((o) =>
    ['incoming', 'placed', 'vendor_accepted', 'packing', 'ready_for_pickup', 'dispatched', 'picked_up', 'out_for_delivery'].includes(
      o.status,
    ),
  );
  const incomingOrders = orders.filter((o) => o.status === 'incoming');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const onlineCaptains = riders.filter((r) => r.isOnline);
  const captainsOnDrop = riders.filter((r) => r.activeOrderId);

  return (
    <AdminShell
      title="Admin Operations Dashboard"
      subtitle="Madurai Central Live Logistics & Order Management"
    >
      <div className="flex flex-col gap-6">
        {/* TOP KPI CARDS BENTO */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* GMV Today */}
          <div className="flex flex-col justify-between rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#A1A1AA]">
                GROSS ORDER VALUE
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#6A5ACD]/20 text-[#A78BFA]">
                <Receipt className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[26px] font-extrabold tracking-tight text-[#F4F4F5]">
                {formatInr(totalGmvPaise)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#10B981]">
                <TrendingUp className="size-3.5" />
                <span className="font-semibold">+18.4%</span>
                <span className="text-[#71717A]">vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="flex flex-col justify-between rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#A1A1AA]">
                ACTIVE ORDERS IN TRANSIT
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#FF7F50]/20 text-[#FF7F50]">
                <ShoppingBag className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[26px] font-extrabold tracking-tight text-[#F4F4F5]">
                {activeOrders.length}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[#A1A1AA]">
                <span className="font-bold text-[#FF7F50]">{incomingOrders.length} pending</span>
                <span>·</span>
                <span>{activeOrders.length - incomingOrders.length} fulfilling</span>
              </div>
            </div>
          </div>

          {/* Captain Fleet */}
          <div className="flex flex-col justify-between rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#A1A1AA]">
                CAPTAINS ONLINE
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#10B981]/20 text-[#10B981]">
                <Bike className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[26px] font-extrabold tracking-tight text-[#F4F4F5]">
                {onlineCaptains.length} <span className="text-sm font-normal text-[#71717A]">/ {riders.length}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#34D399]">
                <Zap className="size-3.5" />
                <span className="font-semibold">{captainsOnDrop.length} on active deliveries</span>
              </div>
            </div>
          </div>

          {/* Delivery SLA */}
          <div className="flex flex-col justify-between rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#A1A1AA]">
                AVG DELIVERY TIME
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#38BDF8]/20 text-[#38BDF8]">
                <Clock className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[26px] font-extrabold tracking-tight text-[#F4F4F5]">
                23.8 <span className="text-sm font-normal text-[#71717A]">mins</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#10B981]">
                <CheckCircle2 className="size-3.5" />
                <span className="font-semibold">98.2% on-time rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* URGENT INCOMING QUEUE BANNER */}
        {incomingOrders.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[#FF7F50]/40 bg-[#FF7F50]/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-2.5 rounded-full bg-[#FF7F50]" />
                <span className="text-[13px] font-extrabold tracking-tight text-[#FF7F50]">
                  {incomingOrders.length} NEW UNASSIGNED ORDER{incomingOrders.length > 1 ? 'S' : ''} AWAITING DISPATCH
                </span>
              </div>

              <Link
                href="/incoming"
                className="flex items-center gap-1 text-[12px] font-bold text-[#FF7F50] hover:underline"
              >
                <span>Open Incoming Triage Desk</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {incomingOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-[#2A2A2E] bg-[#18191B] p-3 transition hover:border-[#FF7F50]"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#F4F4F5]">
                      #{ord.code} · {ord.storeName || 'Merchant'}
                    </span>
                    <span className="text-[11px] text-[#A1A1AA]">
                      {localityById(ord.localityId)?.name ?? 'Madurai'} · {ord.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-extrabold text-[#F4F4F5]">
                      {formatInr(ord.pricing?.totalPaise || 0)}
                    </span>
                    <span className="rounded bg-[#FF7F50]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#FF7F50]">
                      TRIAGE NOW
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* OPERATIONS PIPELINE OVERVIEW */}
        <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">Live Order Lifecycle Pipeline</h2>
              <p className="text-[11.5px] text-[#A1A1AA]">Current distribution of ongoing orders across Madurai</p>
            </div>

            <Link
              href="/orders"
              className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[12px] font-semibold text-[#F4F4F5] hover:bg-[#2A2A2E]"
            >
              <span>View All Orders Table</span>
              <ArrowRight className="size-3.5 text-[#6A5ACD]" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Incoming', status: 'incoming', color: '#FF7F50' },
              { label: 'Merchant Prep', status: 'vendor_accepted', color: '#F59E0B' },
              { label: 'Packing', status: 'packing', color: '#A78BFA' },
              { label: 'Ready for Pickup', status: 'ready_for_pickup', color: '#38BDF8' },
              { label: 'Out for Delivery', status: 'out_for_delivery', color: '#6A5ACD' },
              { label: 'Delivered Today', status: 'delivered', color: '#10B981' },
            ].map((col) => {
              const count = orders.filter((o) => o.status === col.status).length;
              return (
                <div
                  key={col.label}
                  className="flex flex-col rounded-lg border border-[#2A2A2E] bg-[#222327] p-3"
                >
                  <span className="text-[11px] font-bold text-[#A1A1AA]">{col.label}</span>
                  <span
                    className="mt-1 text-[22px] font-extrabold"
                    style={{ color: col.color }}
                  >
                    {count}
                  </span>
                  <div
                    className="mt-2 h-1.5 w-full rounded-full bg-[#18191B]"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: col.color,
                        width: `${Math.min(100, Math.max(8, (count / Math.max(1, orders.length)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN LOWER SECTION: RECENT ORDERS TABLE & FLEET STATUS */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* RECENT ORDERS TABLE (2 Cols) */}
          <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-lg lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-[#6A5ACD]" />
                <h3 className="text-[14px] font-extrabold text-[#F4F4F5]">Recent Dispatch Tickets</h3>
              </div>

              <Link
                href="/orders"
                className="text-[12px] font-bold text-[#6A5ACD] hover:underline"
              >
                View Full Table
              </Link>
            </div>

            <div className="scroll-slim flex-1 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Store / Locality</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Captain</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2E]">
                  {orders.slice(0, 8).map((ord) => {
                    const store = storeById(ord.storeId);
                    const drop = localityById(ord.localityId);
                    return (
                      <tr
                        key={ord.id}
                        className="transition hover:bg-[#222327]/60"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#F4F4F5]">
                          #{ord.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#F4F4F5]">{ord.customerName}</div>
                          <div className="text-[10.5px] text-[#A1A1AA]">{ord.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[#F4F4F5]">{store?.name ?? ord.storeName ?? 'Store'}</div>
                          <div className="text-[10.5px] text-[#71717A]">{drop?.name ?? 'Madurai'}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#F4F4F5]">
                          {formatInr(ord.pricing?.totalPaise || 0)}
                        </td>
                        <td className="px-4 py-3 text-[#A1A1AA]">
                          {ord.riderName ? (
                            <span className="font-medium text-[#10B981]">{ord.riderName}</span>
                          ) : (
                            <span className="rounded bg-[#222327] px-2 py-0.5 text-[10px] text-[#71717A]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor:
                                ord.status === 'delivered'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : ord.status === 'incoming'
                                  ? 'rgba(255, 127, 80, 0.2)'
                                  : 'rgba(106, 90, 205, 0.2)',
                              color:
                                ord.status === 'delivered'
                                  ? '#34D399'
                                  : ord.status === 'incoming'
                                  ? '#FF7F50'
                                  : '#A78BFA',
                            }}
                          >
                            {STATUS_LABEL[ord.status]?.en || ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(ord.id)}
                            className="rounded-md border border-[#2A2A2E] bg-[#222327] px-2.5 py-1 text-[11px] font-bold text-[#F4F4F5] hover:bg-[#2A2A2E]"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FLEET TELEMETRY & HOTSPOTS (1 Col) */}
          <div className="flex flex-col gap-6">
            {/* Captain Availability */}
            <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
                <div className="flex items-center gap-2">
                  <Bike className="size-4 text-[#10B981]" />
                  <h3 className="text-[14px] font-extrabold text-[#F4F4F5]">Captain Fleet Availability</h3>
                </div>

                <Link
                  href="/captains"
                  className="text-[11px] font-bold text-[#6A5ACD] hover:underline"
                >
                  Manage
                </Link>
              </div>

              <div className="mt-3 flex flex-col divide-y divide-[#2A2A2E]">
                {riders.slice(0, 5).map((r) => (
                  <div key={r.uid} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex size-8 items-center justify-center rounded-full bg-[#222327] text-[11px] font-bold text-[#F4F4F5]">
                        {r.name.substring(0, 2).toUpperCase()}
                        <span
                          className={`absolute bottom-0 right-0 size-2 rounded-full border border-[#18191B] ${
                            r.isOnline ? 'bg-[#10B981]' : 'bg-[#71717A]'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#F4F4F5]">{r.name}</span>
                        <span className="text-[10px] text-[#A1A1AA]">{r.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[10px] font-extrabold ${
                          r.activeOrderId ? 'text-[#FF7F50]' : r.isOnline ? 'text-[#10B981]' : 'text-[#71717A]'
                        }`}
                      >
                        {r.activeOrderId ? 'DELIVERING' : r.isOnline ? 'AVAILABLE' : 'OFFLINE'}
                      </span>
                      {r.cancellationsToday ? (
                        <span className="text-[9px] text-[#EF4444] font-semibold">
                          {r.cancellationsToday}/2 strikes
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Madurai Locality Demand */}
            <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#FF7F50]" />
                  <h3 className="text-[14px] font-extrabold text-[#F4F4F5]">Madurai Hub Activity</h3>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  { name: 'KK Nagar', orders: 18, share: '32%' },
                  { name: 'Anna Nagar', orders: 14, share: '25%' },
                  { name: 'Simmakkal', orders: 11, share: '19%' },
                  { name: 'Goripalayam', orders: 8, share: '14%' },
                  { name: 'Mattuthavani', orders: 6, share: '10%' },
                ].map((loc) => (
                  <div key={loc.name} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#F4F4F5]">{loc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A1A1AA]">{loc.orders} orders</span>
                      <span className="rounded bg-[#222327] px-1.5 py-0.5 text-[10px] font-bold text-[#6A5ACD]">
                        {loc.share}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
