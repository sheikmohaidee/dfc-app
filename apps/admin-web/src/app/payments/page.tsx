'use client';

/**
 * DFC Command Center — Payments, Escrow & COD Ledger
 * Implements 13 — Payments
 */

import * as React from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  IndianRupee,
  Receipt,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { formatInr, storeById, type Order } from '@dfc/core';
import { AdminShell } from '@/components/admin-shell';
import { subscribeBoard } from '@/lib/orders';
import { mockStore } from '@/lib/mock-store';

export default function PaymentsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [search, setSearch] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<'all' | 'cod' | 'prepaid'>('all');

  React.useEffect(() => {
    return subscribeBoard((realOrders) => {
      setOrders(realOrders);
    });
  }, []);

  const totalGmv = orders.reduce((s, o) => s + (o.pricing?.totalPaise || 0), 0);
  const codOrders = orders.filter((o) => o.paymentMode === 'cod');
  const prepaidOrders = orders.filter((o) => o.paymentMode === 'prepaid');

  const totalCodPaise = codOrders.reduce((s, o) => s + (o.pricing?.totalPaise || 0), 0);
  const totalPrepaidPaise = prepaidOrders.reduce((s, o) => s + (o.pricing?.totalPaise || 0), 0);
  const platformCommissionPaise = Math.round(totalGmv * 0.125);
  const captainPayoutsPaise = orders.reduce((s, o) => s + (o.pricing?.deliveryPaise || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search.trim() ||
      o.code.toString().includes(search) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === 'all' || o.paymentMode === filterMode;
    return matchesSearch && matchesMode;
  });

  return (
    <AdminShell
      title="Payments & Escrow Settlement"
      subtitle="Financial reconciliation, COD cash in hand and merchant escrow"
    >
      <div className="flex flex-col gap-6">
        {/* FINANCIAL SUMMARY BENTO */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">TOTAL GMV SETTLED</span>
              <Wallet className="size-4 text-[#6A5ACD]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {formatInr(totalGmv)}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Gross Transaction Volume</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">COD CASH COLLECTED</span>
              <Banknote className="size-4 text-[#F59E0B]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F59E0B]">
              {formatInr(totalCodPaise)}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">{codOrders.length} cash deliveries</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">ONLINE PREPAID (UPI)</span>
              <CreditCard className="size-4 text-[#10B981]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#10B981]">
              {formatInr(totalPrepaidPaise)}
            </div>
            <div className="mt-1 text-[11px] text-[#34D399]">Direct Razorpay / UPI Escrow</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">DFC PLATFORM NET REVENUE</span>
              <Receipt className="size-4 text-[#38BDF8]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#38BDF8]">
              {formatInr(platformCommissionPaise)}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">12.5% merchant commission</div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2A2A2E] bg-[#18191B] p-4 shadow-lg">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order code (#1045) or customer..."
              className="h-9 w-full rounded-lg border border-[#2A2A2E] bg-[#222327] pl-9 pr-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
            />
          </div>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Payment Methods</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="prepaid">Prepaid Online</option>
          </select>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-xl">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                <tr>
                  <th className="px-4 py-3">Order Code</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Items Total</th>
                  <th className="px-4 py-3">Delivery Fee</th>
                  <th className="px-4 py-3">Total Billed</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E]">
                {filteredOrders.map((ord) => {
                  const store = storeById(ord.storeId);
                  return (
                    <tr key={ord.id} className="transition hover:bg-[#222327]/60">
                      <td className="px-4 py-3 font-mono font-bold text-[#F4F4F5]">
                        #{ord.code}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#F4F4F5]">{ord.customerName}</div>
                        <div className="text-[11px] text-[#71717A]">{ord.customerPhone}</div>
                      </td>

                      <td className="px-4 py-3 font-medium text-[#F4F4F5]">
                        {store?.name ?? ord.storeName ?? 'Direct Store'}
                      </td>

                      <td className="px-4 py-3 font-mono text-[#A1A1AA]">
                        {formatInr(ord.pricing?.itemsPaise || 0)}
                      </td>

                      <td className="px-4 py-3 font-mono text-[#38BDF8]">
                        +{formatInr(ord.pricing?.deliveryPaise || 0)}
                      </td>

                      <td className="px-4 py-3 font-mono font-extrabold text-[#F4F4F5]">
                        {formatInr(ord.pricing?.totalPaise || 0)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${
                            ord.paymentMode === 'cod'
                              ? 'bg-[#EF4444]/15 text-[#F87171]'
                              : 'bg-[#10B981]/15 text-[#34D399]'
                          }`}
                        >
                          {ord.paymentMode === 'cod' ? 'COD' : 'ONLINE'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                          RECONCILED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
