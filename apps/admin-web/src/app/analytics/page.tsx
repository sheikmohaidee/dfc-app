'use client';

/**
 * DFC Command Center — Reports & Analytics Hub
 * Implements 15 — Reports / Analytics
 */

import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  LineChart,
  MapPin,
  PieChart,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';

import { formatInr, type Order } from '@dfc/core';
import { AdminShell } from '@/components/admin-shell';
import { mockStore } from '@/lib/mock-store';

export default function AnalyticsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);

  React.useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setOrders(mockStore.getOrders());
    });
    setOrders(mockStore.getOrders());
    return unsub;
  }, []);

  const totalGmv = orders.reduce((s, o) => s + (o.pricing?.totalPaise || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <AdminShell
      title="Reports & Analytics Hub"
      subtitle="Madurai delivery performance, SLA times, category shares and revenue intelligence"
      headerActions={
        <button
          type="button"
          onClick={() => alert('Exporting DFC Madurai Daily Operational Report (CSV)...')}
          className="flex items-center gap-1.5 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 py-1.5 text-[12px] font-bold text-[#F4F4F5] hover:bg-[#2A2A2E]"
        >
          <Download className="size-3.5" />
          <span>Export Daily CSV</span>
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* TOP LEVEL HEALTH METRICS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <span className="text-[11px] font-bold text-[#A1A1AA]">AVG FULFILMENT TIME</span>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">23.4 mins</div>
            <div className="mt-1 text-[11px] text-[#10B981]">SLA target: &lt;30 mins</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <span className="text-[11px] font-bold text-[#A1A1AA]">ORDER ON-TIME RATE</span>
            <div className="mt-2 text-[26px] font-extrabold text-[#10B981]">98.4%</div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Across all active zones</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <span className="text-[11px] font-bold text-[#A1A1AA]">CANCELLATION RATE</span>
            <div className="mt-2 text-[26px] font-extrabold text-[#38BDF8]">0.8%</div>
            <div className="mt-1 text-[11px] text-[#10B981]">Below industry benchmark 2.5%</div>
          </div>

          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <span className="text-[11px] font-bold text-[#A1A1AA]">AVERAGE ORDER VALUE (AOV)</span>
            <div className="mt-2 text-[26px] font-extrabold text-[#F4F4F5]">
              {orders.length > 0 ? formatInr(Math.round(totalGmv / orders.length)) : '₹0'}
            </div>
            <div className="mt-1 text-[11px] text-[#A1A1AA]">Per fulfilled basket</div>
          </div>
        </div>

        {/* TWO COLUMN ANALYTICS BREAKDOWN */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Category GMV Distribution */}
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[14px] font-extrabold text-[#F4F4F5]">Category Revenue Contribution</h3>
              <PieChart className="size-4 text-[#6A5ACD]" />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {[
                { name: 'Food / Restaurants', share: '56%', amount: totalGmv * 0.56, color: '#FF7F50' },
                { name: 'Grocery & Provisions', share: '24%', amount: totalGmv * 0.24, color: '#10B981' },
                { name: 'Concierge Errands', share: '12%', amount: totalGmv * 0.12, color: '#8B5CF6' },
                { name: 'Print & Xerox', share: '8%', amount: totalGmv * 0.08, color: '#38BDF8' },
              ].map((c) => (
                <div key={c.name} className="flex flex-col gap-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#F4F4F5]">{c.name}</span>
                    <span className="font-mono text-[#A1A1AA]">
                      {formatInr(Math.round(c.amount))} ({c.share})
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#222327]">
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: c.color, width: c.share }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery SLA Funnel Breakdown */}
          <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
              <h3 className="text-[14px] font-extrabold text-[#F4F4F5]">Stage-by-Stage Fulfillment SLA</h3>
              <Clock className="size-4 text-[#FF7F50]" />
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg bg-[#222327] p-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#6A5ACD]/20 text-[10px] font-bold text-[#A78BFA]">
                    1
                  </span>
                  <div>
                    <div className="font-bold text-[#F4F4F5]">Triage & Store Acceptance</div>
                    <div className="text-[11px] text-[#A1A1AA]">Time to accept ticket</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#10B981]">1.2 mins</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#222327] p-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#F59E0B]/20 text-[10px] font-bold text-[#F59E0B]">
                    2
                  </span>
                  <div>
                    <div className="font-bold text-[#F4F4F5]">Kitchen Prep & Packaging</div>
                    <div className="text-[11px] text-[#A1A1AA]">KDS cooking time</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#F59E0B]">13.8 mins</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#222327] p-3 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#38BDF8]/20 text-[10px] font-bold text-[#38BDF8]">
                    3
                  </span>
                  <div>
                    <div className="font-bold text-[#F4F4F5]">Captain Transit to Drop</div>
                    <div className="text-[11px] text-[#A1A1AA]">On-road travel time</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#38BDF8]">8.4 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
