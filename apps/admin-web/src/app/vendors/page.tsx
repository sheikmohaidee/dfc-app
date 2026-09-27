'use client';

/**
 * DFC Command Center — Vendors & Store Partners Directory
 * Implements 08 — Vendors / Stores
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  PauseCircle,
  Percent,
  Phone,
  Power,
  Search,
  ShoppingBag,
  Star,
  Store,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';

import {
  SEED_STORES,
  localityById,
  type Category,
  type Store as StoreType,
} from '@dfc/core';

import { AdminShell } from '@/components/admin-shell';
import { mockStore } from '@/lib/mock-store';
import { cn } from '@/lib/utils';

export default function VendorsPage() {
  const [stores, setStores] = React.useState<StoreType[]>(() =>
    SEED_STORES.filter((s) => s.category !== 'pharmacy').map((s) => ({
      ...s,
      isOpen: true,
      ownerUid: 'vendor-1',
    })),
  );
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const filteredStores = React.useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (localityById(s.localityId)?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [stores, search, categoryFilter]);

  const toggleStoreStatus = (storeId: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, isOpen: !s.isOpen } : s)),
    );
  };

  const onlineCount = stores.filter((s) => s.isOpen).length;

  return (
    <AdminShell
      title="Vendors & Partner Stores"
      subtitle={`${stores.length} merchant partners across Madurai`}
    >
      <div className="flex flex-col gap-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">TOTAL PARTNER STORES</span>
              <Store className="size-4 text-[#6A5ACD]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {stores.length}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Restaurants, Bakers & Groceries</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">LIVE ACCEPTING ORDERS</span>
              <Zap className="size-4 text-[#10B981]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#10B981]">
              {onlineCount} <span className="text-sm font-normal text-[#71717A]">/ {stores.length}</span>
            </div>
            <div className="mt-1 text-[11px] text-[#34D399]">Kitchen floors online</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">DFC PLATFORM COMMISSION</span>
              <Percent className="size-4 text-[#FF7F50]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              12.5% <span className="text-sm font-normal text-[#71717A]">avg</span>
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Weekly settlement on Mondays</div>
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
              placeholder="Search store name, locality..."
              className="h-9 w-full rounded-lg border border-[#2A2A2E] bg-[#222327] pl-9 pr-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Store Types</option>
            <option value="food">Restaurants & Cloud Kitchens</option>
            <option value="grocery">Provisions & Supermarkets</option>
            <option value="print">Xerox & Print Hubs</option>
          </select>
        </div>

        {/* VENDORS TABLE */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-xl">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                <tr>
                  <th className="px-4 py-3">Store Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Locality</th>
                  <th className="px-4 py-3">FSSAI / Reg</th>
                  <th className="px-4 py-3">Avg Prep Time</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Floor Status</th>
                  <th className="px-4 py-3 text-right">Floor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E]">
                {filteredStores.map((st) => {
                  const drop = localityById(st.localityId);
                  return (
                    <tr key={st.id} className="transition hover:bg-[#222327]/60">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-[#222327] text-[#6A5ACD]">
                            <Store className="size-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#F4F4F5]">{st.name}</div>
                            <div className="text-[11px] text-[#A1A1AA]">{st.phone || '+91 98401 23456'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded bg-[#222327] px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                          {st.category.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-[#F4F4F5]">
                        {drop?.name ?? 'Madurai Hub'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#A1A1AA]">
                        #12421999000142
                      </td>

                      <td className="px-4 py-3.5 text-[#F4F4F5]">
                        15 mins
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#10B981]">
                        12.5%
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            st.isOpen
                              ? 'bg-[#10B981]/20 text-[#34D399]'
                              : 'bg-[#EF4444]/20 text-[#F87171]'
                          }`}
                        >
                          {st.isOpen ? 'LIVE OPEN' : 'PAUSED'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStoreStatus(st.id)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-[11px] font-bold transition',
                            st.isOpen
                              ? 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                              : 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20',
                          )}
                        >
                          {st.isOpen ? 'Pause Taking Orders' : 'Resume Accepting'}
                        </button>
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
