'use client';

/**
 * DFC Command Center — Platform Rules & Operational Settings
 * Implements 16 — Admin Settings
 */

import * as React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  CloudRain,
  Flame,
  Globe,
  Lock,
  Moon,
  Power,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import { type PlatformConfig } from '@dfc/core';
import { AdminShell } from '@/components/admin-shell';
import { mockStore } from '@/lib/mock-store';
import { useAuth } from '@/lib/auth';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = React.useState<PlatformConfig>(() => mockStore.getPlatformConfig());
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  React.useEffect(() => {
    const unsub = mockStore.subscribe(() => {
      setConfig(mockStore.getPlatformConfig());
    });
    return unsub;
  }, []);

  const handleToggleSleep = () => {
    mockStore.toggleSleepMode();
  };

  const handleToggleRain = () => {
    mockStore.toggleRainSurge(!config.rainSurge.active);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mockStore.updatePlatformConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <AdminShell
      title="Platform Operations & Dispatch Rules"
      subtitle="Configure citywide delivery thresholds, night curfew, monsoon weather bonuses and tax rules"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* EMERGENCY OVERRIDES SECTION */}
        <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#2A2A2E] pb-3">
            <ShieldAlert className="size-4 text-[#EF4444]" />
            <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">Live Citywide Overrides</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Monsoon Weather Surge */}
            <div className="flex items-center justify-between rounded-xl border border-[#2A2A2E] bg-[#222327] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#38BDF8]/20 text-[#38BDF8]">
                  <CloudRain className="size-5" />
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-[#F4F4F5]">
                    Monsoon Rain Surge & Safety Bonus
                  </div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    Applies 1.25x delivery multiplier + ₹20 captain bonus
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleRain}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${
                  config.rainSurge?.active
                    ? 'bg-[#38BDF8] text-black shadow-md'
                    : 'bg-[#18191B] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                {config.rainSurge?.active ? 'ACTIVE ON' : 'DISABLED'}
              </button>
            </div>

            {/* Night Curfew */}
            <div className="flex items-center justify-between rounded-xl border border-[#2A2A2E] bg-[#222327] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#F59E0B]/20 text-[#F59E0B]">
                  <Moon className="size-5" />
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-[#F4F4F5]">
                    Night Dispatch Rest Mode (Curfew)
                  </div>
                  <div className="text-[11px] text-[#A1A1AA]">
                    Pauses checkout until 6:00 AM breakfast runs
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleSleep}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${
                  config.status === 'sleep'
                    ? 'bg-[#F59E0B] text-black shadow-md'
                    : 'bg-[#18191B] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                {config.status === 'sleep' ? 'CURFEW ON' : 'LIVE ONLINE'}
              </button>
            </div>
          </div>
        </div>

        {/* DISPATCH AUTOMATION RULES */}
        <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#2A2A2E] pb-3">
            <Zap className="size-4 text-[#6A5ACD]" />
            <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">Algorithm & Automation Thresholds</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">
                MAX BATCHING RADIUS (METERS)
              </label>
              <input
                type="number"
                value={config.automations?.maxBatchDistanceMeters || 1500}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    automations: {
                      ...config.automations,
                      maxBatchDistanceMeters: Number(e.target.value),
                    },
                  })
                }
                className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] text-[#F4F4F5] outline-none focus:border-[#6A5ACD]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">
                FOOD RESCUE DISCOUNT RATE (%)
              </label>
              <input
                type="number"
                value={60}
                disabled
                className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] text-[#A1A1AA] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#A1A1AA]">
                CAPTAIN DAILY CANCELLATION LIMIT
              </label>
              <input
                type="number"
                value={2}
                disabled
                className="h-9 rounded-lg border border-[#2A2A2E] bg-[#222327] px-3 text-[12px] text-[#A1A1AA] outline-none"
              />
            </div>
          </div>
        </div>

        {/* GST & INVOICE RULES */}
        <div className="rounded-xl border border-[#2A2A2E] bg-[#18191B] p-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#2A2A2E] pb-3">
            <ShieldCheck className="size-4 text-[#10B981]" />
            <h2 className="text-[15px] font-extrabold text-[#F4F4F5]">GST Tax & SAC Compliance</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[#222327] p-3 text-[12px]">
              <span className="font-bold text-[#F4F4F5]">Restaurant Goods (Pure Agent)</span>
              <p className="mt-1 text-[#A1A1AA]">
                Food items are pure-agent reimbursements passed to the merchant. 0% DFC GST on item subtotal.
              </p>
            </div>

            <div className="rounded-lg bg-[#222327] p-3 text-[12px]">
              <span className="font-bold text-[#F4F4F5]">DFC Delivery Fee (SAC 996813)</span>
              <p className="mt-1 text-[#A1A1AA]">
                18% GST (9% CGST + 9% SGST) applicable on DFC courier delivery service fee. Auto-balanced on tax invoices.
              </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center justify-between border-t border-[#2A2A2E] pt-4">
          {savedSuccess ? (
            <span className="text-[12px] font-bold text-[#10B981]">
              ✓ Settings saved and broadcasted to dispatch runtime.
            </span>
          ) : <span />}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-[#6A5ACD] px-6 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-[#6A5ACD]/25 transition hover:bg-[#5b4cb8]"
          >
            <Save className="size-4" />
            <span>Save Operational Rules</span>
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
