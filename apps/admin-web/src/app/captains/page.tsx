'use client';

/**
 * DFC Command Center — Captains & Delivery Fleet Management
 * Implements 09 — Captains / Delivery Partners
 */

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Bike,
  CheckCircle2,
  Clock,
  HardHat,
  MapPin,
  Navigation,
  Phone,
  Power,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Truck,
  User,
  Zap,
} from 'lucide-react';

import { formatInr, type Rider } from '@dfc/core';
import { AdminShell } from '@/components/admin-shell';
import { mockStore } from '@/lib/mock-store';

export default function CaptainsPage() {
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  React.useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setRiders(mockStore.getRiders());
    });
    setRiders(mockStore.getRiders());
    return unsub;
  }, []);

  const filteredRiders = React.useMemo(() => {
    return riders.filter((r) => {
      const matchesSearch =
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && r.isOnline) ||
        (statusFilter === 'offline' && !r.isOnline) ||
        (statusFilter === 'locked' && (r.isOfflineDueToCancellations || (r.cancellationsToday || 0) > 2));

      return matchesSearch && matchesStatus;
    });
  }, [riders, search, statusFilter]);

  const handleReinstate = (riderUid: string) => {
    mockStore.reactivateRider(riderUid);
  };

  const onlineCount = riders.filter((r) => r.isOnline).length;
  const lockedCount = riders.filter((r) => r.isOfflineDueToCancellations || (r.cancellationsToday || 0) > 2).length;

  return (
    <AdminShell
      title="Captains & Fleet Management"
      subtitle={`${riders.length} registered delivery partners in Madurai`}
    >
      <div className="flex flex-col gap-6">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">TOTAL FLEET CAPTAINS</span>
              <Bike className="size-4 text-[#6A5ACD]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {riders.length}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Two-wheeler courier fleet</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">ACTIVE ON DUTY (ONLINE)</span>
              <Zap className="size-4 text-[#10B981]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#10B981]">
              {onlineCount} <span className="text-sm font-normal text-[#71717A]">/ {riders.length}</span>
            </div>
            <div className="mt-1 text-[11px] text-[#34D399]">Available for live dispatch</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#A1A1AA]">LOCKED OUT (STRIKES)</span>
              <ShieldAlert className="size-4 text-[#EF4444]" />
            </div>
            <div className="mt-2 text-[26px] font-extrabold text-[#EF4444]">
              {lockedCount}
            </div>
            <div className="mt-1 text-[11px] text-[#FCA5A5]">&gt;2 cancellations limit reached</div>
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
              placeholder="Search captain name or phone..."
              className="h-9 w-full rounded-lg border border-[#2A2A2E] bg-[#222327] pl-9 pr-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
          >
            <option value="all">All Captains</option>
            <option value="online">Online / Available</option>
            <option value="offline">Offline</option>
            <option value="locked">Locked Out (&gt;2 Cancels)</option>
          </select>
        </div>

        {/* FLEET TABLE */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] shadow-xl">
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-[#2A2A2E] bg-[#222327] text-[10.5px] font-bold uppercase tracking-wider text-[#71717A]">
                <tr>
                  <th className="px-4 py-3">Captain Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Duty Status</th>
                  <th className="px-4 py-3">Current Assignment</th>
                  <th className="px-4 py-3">Trips Today</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Daily Cancels</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E]">
                {filteredRiders.map((r) => {
                  const strikes = r.cancellationsToday ?? 0;
                  const isLocked = r.isOfflineDueToCancellations || strikes > 2;

                  return (
                    <tr key={r.uid} className="transition hover:bg-[#222327]/60">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex size-9 items-center justify-center rounded-full bg-[#222327] font-bold text-[#F4F4F5]">
                            {r.name.substring(0, 2).toUpperCase()}
                            <span
                              className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#18191B] ${
                                r.isOnline ? 'bg-[#10B981]' : 'bg-[#71717A]'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#F4F4F5]">{r.name}</div>
                            <div className="text-[11px] text-[#A1A1AA]">Ather 450X · EV Rider</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[#A1A1AA]">
                        {r.phone}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            isLocked
                              ? 'bg-[#EF4444]/20 text-[#EF4444]'
                              : r.activeOrderId
                              ? 'bg-[#FF7F50]/20 text-[#FF7F50]'
                              : r.isOnline
                              ? 'bg-[#10B981]/20 text-[#34D399]'
                              : 'bg-[#71717A]/20 text-[#A1A1AA]'
                          }`}
                        >
                          {isLocked
                            ? 'LOCKED OUT'
                            : r.activeOrderId
                            ? 'ON DELIVERY'
                            : r.isOnline
                            ? 'ONLINE FREE'
                            : 'OFFLINE'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {r.activeOrderId ? (
                          <Link
                            href="/orders"
                            className="font-mono font-bold text-[#FF7F50] hover:underline"
                          >
                            Order #{r.activeOrderId}
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#71717A]">Idle / Scanning</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#F4F4F5]">
                        {(r as { completedTodayCount?: number }).completedTodayCount ?? 4} drops
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-[12px] font-bold text-[#F59E0B]">
                          <Star className="size-3.5 fill-[#F59E0B]" />
                          <span>4.92</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                            strikes > 2
                              ? 'bg-[#EF4444]/20 text-[#EF4444]'
                              : strikes > 0
                              ? 'bg-[#F59E0B]/20 text-[#FCD34D]'
                              : 'bg-[#10B981]/15 text-[#34D399]'
                          }`}
                        >
                          {strikes}/2 used
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={() => handleReinstate(r.uid)}
                            className="rounded-lg bg-[#10B981] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#059669]"
                          >
                            Reinstate
                          </button>
                        ) : (
                          <Link
                            href="/orders"
                            className="rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[11px] font-bold text-[#F4F4F5] hover:bg-[#2A2A2E]"
                          >
                            Dispatch Task
                          </Link>
                        )}
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
