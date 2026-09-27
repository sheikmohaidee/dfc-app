'use client';

/**
 * DFC Command Center — Customer CRM Directory
 * Implements 07 — Customers
 */

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Phone,
  Search,
  ShoppingBag,
  Star,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import { formatInr, localityById, type Order } from '@dfc/core';
import { AdminShell } from '@/components/admin-shell';
import { mockStore } from '@/lib/mock-store';

interface CustomerProfile {
  uid: string;
  name: string;
  phone: string;
  localityId: string;
  address: string;
  ordersCount: number;
  totalSpentPaise: number;
  lastOrderTime: number;
  isVip?: boolean;
}

export default function CustomersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerProfile | null>(null);

  React.useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setOrders(mockStore.getOrders());
    });
    setOrders(mockStore.getOrders());
    return unsub;
  }, []);

  // Compute distinct customers from orders
  const customers = React.useMemo<CustomerProfile[]>(() => {
    const map = new Map<string, CustomerProfile>();

    for (const o of orders) {
      const uid = o.customerUid || `guest-${o.customerPhone}`;
      const existing = map.get(uid);
      const spent = o.pricing?.totalPaise || 0;

      if (!existing) {
        map.set(uid, {
          uid,
          name: o.customerName || 'Customer',
          phone: o.customerPhone || '—',
          localityId: o.localityId || 'kk-nagar',
          address: o.addressLine || 'Madurai',
          ordersCount: 1,
          totalSpentPaise: spent,
          lastOrderTime: o.createdAt,
          isVip: spent > 100000,
        });
      } else {
        existing.ordersCount += 1;
        existing.totalSpentPaise += spent;
        if (o.createdAt > existing.lastOrderTime) {
          existing.lastOrderTime = o.createdAt;
          existing.address = o.addressLine || existing.address;
        }
        if (existing.totalSpentPaise > 100000) {
          existing.isVip = true;
        }
      }
    }

    return Array.from(map.values());
  }, [orders]);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      return (
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (localityById(c.localityId)?.name || '').toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [customers, search]);

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpentPaise, 0);

  return (
    <AdminShell
      title="Customer CRM Directory"
      subtitle={`${customers.length} registered customer accounts in Madurai`}
    >
      <div className="flex flex-col gap-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">TOTAL CUSTOMERS</span>
              <Users className="size-4 text-[#6A5ACD]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {customers.length}
            </div>
            <div className="mt-1 text-[11px] text-[#10B981]">100% Mobile Phone Verified</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">LIFETIME SPEND</span>
              <Wallet className="size-4 text-[#FF7F50]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {formatInr(totalSpentAll)}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Across all DFC service categories</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">AVG ORDERS PER CUSTOMER</span>
              <ShoppingBag className="size-4 text-[#38BDF8]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {customers.length > 0 ? (orders.length / customers.length).toFixed(1) : '0'} drops
            </div>
            <div className="mt-1 text-[11px] text-[#10B981]">High retention repeat customers</div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#2A2A2E] bg-[#18191B] p-4 shadow-lg">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone number or locality..."
              className="h-9 w-full rounded-lg border border-[#2A2A2E] bg-[#222327] pl-9 pr-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
            />
          </div>
        </div>

        {/* CUSTOMERS TABLE */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-xl">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Primary Locality</th>
                  <th className="px-4 py-3">Total Orders</th>
                  <th className="px-4 py-3">Lifetime Spend</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#71717A]">
                      No customers match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const drop = localityById(cust.localityId);
                    const timeAgoStr = new Date(cust.lastOrderTime).toLocaleDateString('en-IN');

                    return (
                      <tr key={cust.uid} className="transition hover:bg-[#222327]/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-full bg-[#222327] font-bold text-[#F4F4F5]">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-[#F4F4F5]">
                                <span>{cust.name}</span>
                                {cust.isVip ? (
                                  <span className="rounded bg-[#F59E0B]/20 px-1 text-[9px] font-bold text-[#F59E0B]">
                                    VIP
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-[#71717A]">{cust.address}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-medium text-[#A1A1AA]">
                          {cust.phone}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-[#F4F4F5]">
                            {drop?.name ?? 'Madurai Hub'}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-semibold text-[#F4F4F5]">
                          {cust.ordersCount} orders
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-[#10B981]">
                          {formatInr(cust.totalSpentPaise)}
                        </td>

                        <td className="px-4 py-3 text-[#A1A1AA]">
                          {timeAgoStr}
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-bold text-[#34D399]">
                            ACTIVE
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="rounded-md border border-[#2A2A2E] bg-[#222327] px-2.5 py-1 text-[11px] font-bold text-[#F4F4F5] hover:bg-[#2A2A2E]"
                          >
                            Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CUSTOMER PROFILE MODAL */}
      {selectedCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#2A2A2E] bg-[#18191B] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <div className="flex items-center gap-2.5">
                <User className="size-5 text-[#6A5ACD]" />
                <h3 className="text-[16px] font-extrabold text-[#F4F4F5]">Customer Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-[#71717A] hover:text-[#F4F4F5]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[#222327] p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#18191B] text-[16px] font-bold text-[#F4F4F5]">
                {selectedCustomer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#F4F4F5]">{selectedCustomer.name}</div>
                <div className="text-[12px] text-[#A1A1AA]">{selectedCustomer.phone}</div>
                <div className="text-[11px] text-[#71717A]">{selectedCustomer.address}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-lg bg-[#222327] p-3">
                <div className="text-[#71717A]">Orders Completed</div>
                <div className="text-[18px] font-extrabold text-[#F4F4F5]">{selectedCustomer.ordersCount}</div>
              </div>
              <div className="rounded-lg bg-[#222327] p-3">
                <div className="text-[#71717A]">Total GMV Spend</div>
                <div className="text-[18px] font-extrabold text-[#10B981]">
                  {formatInr(selectedCustomer.totalSpentPaise)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#2A2A2E] pt-3">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-[#222327] px-4 py-2 text-[12px] font-bold text-[#F4F4F5]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
