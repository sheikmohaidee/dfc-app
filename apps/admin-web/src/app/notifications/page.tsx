'use client';

/**
 * DFC Command Center — Notifications & Operational Broadcasts
 * Implements 14 — Notifications
 */

import * as React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CloudRain,
  Flame,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  Volume2,
} from 'lucide-react';

import { AdminShell } from '@/components/admin-shell';

interface BroadcastNotice {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'customers' | 'captains' | 'vendors';
  urgent: boolean;
  timestamp: string;
  deliveredCount: number;
}

const INITIAL_BROADCASTS: BroadcastNotice[] = [
  {
    id: 'bc-1',
    title: 'Monsoon Heavy Rain Warning · Safety Bonus Active',
    message: 'Captains are entitled to a +₹20 safety bonus per delivery. Please ride with caution and headlights ON.',
    audience: 'captains',
    urgent: true,
    timestamp: '2 hours ago',
    deliveredCount: 42,
  },
  {
    id: 'bc-2',
    title: 'Dinner Rush Surge Hour Active',
    message: 'Expected order surge between 7:30 PM and 10:00 PM. High demand in KK Nagar and Anna Nagar.',
    audience: 'all',
    urgent: false,
    timestamp: 'Today, 6:00 PM',
    deliveredCount: 1280,
  },
  {
    id: 'bc-3',
    title: 'Weekly Escrow Payouts Processed',
    message: 'Merchant settlement batch #HDFC-9402 successfully transferred via IMPS/NEFT.',
    audience: 'vendors',
    urgent: false,
    timestamp: 'Yesterday',
    deliveredCount: 38,
  },
];

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = React.useState<BroadcastNotice[]>(INITIAL_BROADCASTS);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<'all' | 'customers' | 'captains' | 'vendors'>('all');
  const [urgent, setUrgent] = React.useState(false);
  const [sentSuccess, setSentSuccess] = React.useState(false);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newNotice: BroadcastNotice = {
      id: `bc-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      audience,
      urgent,
      timestamp: 'Just now',
      deliveredCount: audience === 'captains' ? 42 : audience === 'vendors' ? 38 : 1420,
    };

    setBroadcasts([newNotice, ...broadcasts]);
    setTitle('');
    setMessage('');
    setUrgent(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <AdminShell
      title="Notifications & System Broadcasts"
      subtitle="Send fleet push alerts and view operational advisory logs"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COMPOSE BROADCAST FORM (1 Col) */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#2A2A2E] pb-3">
            <Radio className="size-4 text-[#6A5ACD]" />
            <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">Dispatch Push Broadcast</h2>
          </div>

          <form onSubmit={handleSendBroadcast} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">TARGET AUDIENCE</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] font-semibold text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
              >
                <option value="all">Everyone (All Apps & Roles)</option>
                <option value="captains">Captain Delivery Fleet Only</option>
                <option value="vendors">Store Merchants Only</option>
                <option value="customers">Customers Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">BROADCAST TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monsoon Rain Safety Bonus Active"
                className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">MESSAGE BODY</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Type push notification text..."
                className="rounded-lg border border-[#2A2A2E] bg-[#222327] p-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-[#222327] p-3">
              <input
                type="checkbox"
                id="urgent-check"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="size-4 rounded accent-[#FF7F50]"
              />
              <label htmlFor="urgent-check" className="cursor-pointer text-[12px] font-bold text-[#FF7F50]">
                High-Priority Urgent Siren Push Alert
              </label>
            </div>

            {sentSuccess ? (
              <div className="rounded-lg bg-[#10B981]/15 p-2 text-center text-[12px] font-bold text-[#10B981]">
                ✓ Broadcast dispatched successfully!
              </div>
            ) : null}

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#6A5ACD] py-2.5 text-[13px] font-bold text-white shadow-md shadow-[#6A5ACD]/25 hover:bg-[#5b4cb8]"
            >
              <Send className="size-4" />
              <span>Send Broadcast Now</span>
            </button>
          </form>
        </div>

        {/* BROADCAST AUDIT LOG (2 Cols) */}
        <div className="flex flex-col rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#FF7F50]" />
              <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">Broadcast History & Audit Log</h2>
            </div>
            <span className="text-[11px] text-[#A1A1AA]">{broadcasts.length} past notices</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="flex items-start justify-between rounded-xl border border-[#2A2A2E] bg-[#222327] p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      b.urgent ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#6A5ACD]/20 text-[#A78BFA]'
                    }`}
                  >
                    {b.urgent ? <AlertTriangle className="size-4" /> : <Bell className="size-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-extrabold text-[#F4F4F5]">{b.title}</h4>
                      {b.urgent ? (
                        <span className="rounded bg-[#EF4444]/20 px-1.5 text-[9px] font-extrabold text-[#EF4444]">
                          URGENT
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-[12px] leading-relaxed text-[#A1A1AA]">{b.message}</p>

                    <div className="mt-2 flex items-center gap-3 text-[10.5px] text-[#71717A]">
                      <span>Sent: {b.timestamp}</span>
                      <span>·</span>
                      <span className="capitalize">Target: {b.audience}</span>
                      <span>·</span>
                      <span className="text-[#10B981] font-semibold">{b.deliveredCount} recipients</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
