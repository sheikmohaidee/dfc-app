'use client';

/**
 * DFC Command Center — Orders Overview
 * Desktop Table View & Interactive Kanban Board
 * Implements:
 * - 02 — Orders Overview
 * - 04 — Order Details
 * - 05 — Manual Captain Assignment
 * - 06 — Reassign Captain
 */

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Kanban,
  Layers,
  MapPin,
  MoreVertical,
  Navigation,
  Phone,
  Plus,
  Radio,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Table as TableIcon,
  Timer,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react';

import {
  ACTIVE_CATEGORIES,
  COLUMN_STATUSES,
  STATUS_LABEL,
  columnOf,
  formatInr,
  localityById,
  storeById,
  type BoardColumn,
  type Category,
  type Order,
  type OrderStatus,
  type Rider,
} from '@dfc/core';

import { AdminShell } from '@/components/admin-shell';
import { Board } from '@/components/board/board';
import { OrderSheet } from '@/components/sheets/order-sheet';
import { subscribeBoard, subscribeRiders, dispatchToRider } from '@/lib/orders';
import { mockStore } from '@/lib/mock-store';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function OrdersOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [viewMode, setViewMode] = React.useState<'table' | 'kanban'>('table');

  // Filters
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [paymentFilter, setPaymentFilter] = React.useState<string>('all');

  // Selected Order for side sheet
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  // Manual Assignment Modal
  const [assignModalOrder, setAssignModalOrder] = React.useState<Order | null>(null);
  const [selectedRiderUid, setSelectedRiderUid] = React.useState<string>('');
  const [reassignReason, setReassignReason] = React.useState<string>('Rider requested reassignment');

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

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search.trim() ||
        o.code.toString().includes(search) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(search)) ||
        (o.storeName && o.storeName.toLowerCase().includes(search.toLowerCase())) ||
        (o.riderName && o.riderName.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'all' || o.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'
          ? ['incoming', 'placed', 'vendor_accepted', 'packing', 'ready_for_pickup', 'dispatched', 'picked_up', 'out_for_delivery'].includes(o.status)
          : o.status === statusFilter);

      const matchesPayment =
        paymentFilter === 'all' || o.paymentMode === paymentFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesPayment;
    });
  }, [orders, search, categoryFilter, statusFilter, paymentFilter]);

  const byColumn = React.useMemo(() => {
    const map: Record<BoardColumn, Order[]> = {
      incoming: [],
      review: [],
      payment: [],
      dispatched: [],
    };
    for (const o of filteredOrders) {
      const col = columnOf(o.status);
      if (col && map[col]) {
        map[col].push(o);
      }
    }
    return map;
  }, [filteredOrders]);

  const handleAssignRider = (order: Order, rider: Rider) => {
    void dispatchToRider(order.id, rider, user?.uid || 'admin-1');
    setAssignModalOrder(null);
  };

  return (
    <AdminShell
      title="Orders Operations Center"
      subtitle={`${filteredOrders.length} orders matching filters`}
      headerActions={
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[#2A2A2E] bg-[#222327] p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-bold transition',
                viewMode === 'table'
                  ? 'bg-[#6A5ACD] text-white'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F5]',
              )}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-bold transition',
                viewMode === 'kanban'
                  ? 'bg-[#6A5ACD] text-white'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F5]',
              )}
            >
              <Kanban className="size-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* FILTER & SEARCH TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2A2A2E] bg-[#18191B] p-4 shadow-lg">
          {/* Search Bar */}
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (#1045), customer, store, rider..."
              className="h-9 w-full rounded-lg border border-[#2A2A2E] bg-[#222327] pl-9 pr-3 text-[12px] text-[#F4F4F5] placeholder-[#71717A] outline-none transition focus:border-[#6A5ACD]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F4F4F5]"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Categories</option>
            <option value="food">Food Delivery</option>
            <option value="grocery">Grocery & Essentials</option>
            <option value="concierge">Concierge Errand</option>
            <option value="print">Print & Xerox</option>
            <option value="pickup_drop">Pickup & Drop</option>
            <option value="buy_deliver">Buy & Deliver</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Statuses</option>
            <option value="active">All Active Orders</option>
            <option value="incoming">Incoming / Pending</option>
            <option value="vendor_accepted">Merchant Accepted</option>
            <option value="packing">Packing / KDS</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="dispatched">Dispatched to Captain</option>
            <option value="picked_up">Picked Up by Captain</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Payments</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="prepaid">Online Prepaid (UPI)</option>
          </select>
        </div>

        {/* VIEW 1: DESKTOP TABLE VIEW */}
        {viewMode === 'table' ? (
          <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-xl">
            <div className="scroll-slim overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Merchant / Store</th>
                    <th className="px-4 py-3">Drop Locality</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Captain</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2E]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-[#71717A]">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const store = storeById(ord.storeId);
                      const drop = localityById(ord.localityId);
                      const timeStr = new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const isUnassigned = !ord.riderUid;

                      return (
                        <tr
                          key={ord.id}
                          className="transition hover:bg-[#222327]/60"
                        >
                          {/* Code */}
                          <td className="px-4 py-3 font-mono font-extrabold text-[#F4F4F5]">
                            #{ord.code}
                          </td>

                          {/* Time */}
                          <td className="px-4 py-3 text-[#A1A1AA]">
                            {timeStr}
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3">
                            <div className="font-bold text-[#F4F4F5]">{ord.customerName}</div>
                            <div className="text-[11px] text-[#71717A]">{ord.customerPhone}</div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <span className="rounded bg-[#222327] px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                              {ord.category.toUpperCase()}
                            </span>
                          </td>

                          {/* Store */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#F4F4F5]">
                              {store?.name ?? ord.storeName ?? 'Direct Store'}
                            </div>
                            <div className="text-[11px] text-[#71717A]">
                              {localityById(store?.localityId)?.name ?? 'Madurai'}
                            </div>
                          </td>

                          {/* Locality */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#F4F4F5]">{drop?.name ?? 'Madurai'}</div>
                            <div className="max-w-[160px] truncate text-[11px] text-[#71717A]">
                              {ord.addressLine}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3 font-mono font-bold text-[#F4F4F5]">
                            {formatInr(ord.pricing?.totalPaise || 0)}
                          </td>

                          {/* Payment */}
                          <td className="px-4 py-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                ord.paymentMode === 'cod'
                                  ? 'bg-[#EF4444]/15 text-[#F87171]'
                                  : 'bg-[#10B981]/15 text-[#34D399]'
                              }`}
                            >
                              {ord.paymentMode === 'cod' ? 'COD' : 'PREPAID'}
                            </span>
                          </td>

                          {/* Captain */}
                          <td className="px-4 py-3">
                            {ord.riderName ? (
                              <div className="flex items-center gap-1.5">
                                <Bike className="size-3 text-[#10B981]" />
                                <span className="font-bold text-[#10B981]">{ord.riderName}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAssignModalOrder(ord)}
                                className="rounded bg-[#FF7F50]/20 px-2 py-0.5 text-[10.5px] font-extrabold text-[#FF7F50] hover:bg-[#FF7F50]/30"
                              >
                                + Assign Captain
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
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

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ord.riderUid ? (
                                <button
                                  type="button"
                                  onClick={() => setAssignModalOrder(ord)}
                                  title="Reassign Captain"
                                  className="rounded border border-[#2A2A2E] bg-[#222327] px-2 py-1 text-[11px] font-bold text-[#A1A1AA] hover:text-[#F4F4F5]"
                                >
                                  Reassign
                                </button>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => setSelectedOrderId(ord.id)}
                                className="rounded bg-[#6A5ACD] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#5b4cb8]"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW 2: KANBAN BOARD VIEW */
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-4 shadow-xl">
            <Board
              byColumn={byColumn}
              density="comfortable"
              loading={false}
              onOpen={(orderId) => setSelectedOrderId(orderId)}
              onMove={(order, toColumn) => {
                const targetStatus = COLUMN_STATUSES[toColumn][0];
                if (targetStatus) {
                  mockStore.moveOrder(order.id, targetStatus, 'admin', user?.uid || 'admin-1');
                }
              }}
            />
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

      {/* MANUAL CAPTAIN ASSIGNMENT / REASSIGNMENT MODAL */}
      {assignModalOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <div className="flex items-center gap-2">
                <Bike className="size-5 text-[#6A5ACD]" />
                <h3 className="text-[15px] font-extrabold text-[#F4F4F5]">
                  {assignModalOrder.riderUid ? 'Reassign Delivery Captain' : 'Manual Captain Assignment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="text-[#71717A] hover:text-[#F4F4F5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-lg bg-[#222327] p-3 text-[12px]">
              <div className="font-bold text-[#F4F4F5]">
                Order #{assignModalOrder.code} · {assignModalOrder.storeName || 'Store'}
              </div>
              <div className="text-[#A1A1AA]">
                Drop: {localityById(assignModalOrder.localityId)?.name ?? 'Madurai'}
              </div>
              {assignModalOrder.riderName ? (
                <div className="mt-1 text-[11px] text-[#F59E0B]">
                  Currently assigned to: <span className="font-bold">{assignModalOrder.riderName}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#71717A]">
                SELECT AVAILABLE CAPTAIN
              </span>

              <div className="scroll-slim flex max-h-56 flex-col gap-1.5 overflow-y-auto">
                {riders.map((r) => {
                  const isCurrent = r.uid === assignModalOrder.riderUid;
                  return (
                    <button
                      key={r.uid}
                      type="button"
                      onClick={() => handleAssignRider(assignModalOrder, r)}
                      disabled={isCurrent}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-2.5 text-left text-[12px] transition',
                        isCurrent
                          ? 'border-[#2A2A2E] bg-[#222327]/40 opacity-50'
                          : 'border-[#2A2A2E] bg-[#222327] hover:border-[#6A5ACD] hover:bg-[#2A2A2E]',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex size-8 items-center justify-center rounded-full bg-[#18191B] font-bold text-[#F4F4F5]">
                          {r.name.substring(0, 2).toUpperCase()}
                          <span
                            className={`absolute bottom-0 right-0 size-2 rounded-full ${
                              r.isOnline ? 'bg-[#10B981]' : 'bg-[#71717A]'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#F4F4F5]">{r.name}</div>
                          <div className="text-[10.5px] text-[#A1A1AA]">{r.phone}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`text-[10px] font-extrabold ${
                            r.activeOrderId ? 'text-[#FF7F50]' : r.isOnline ? 'text-[#10B981]' : 'text-[#71717A]'
                          }`}
                        >
                          {r.activeOrderId ? '1 Active Drop' : r.isOnline ? 'Available' : 'Offline'}
                        </span>
                        <span className="text-[10px] font-bold text-[#6A5ACD]">
                          {isCurrent ? 'Current' : 'Assign →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#2A2A2E] pt-3">
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="rounded-lg border border-[#2A2A2E] bg-[#222327] px-4 py-2 text-[12px] font-bold text-[#F4F4F5]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
