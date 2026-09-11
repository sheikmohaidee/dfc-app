'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  CloudRain,
  Moon,
  RotateCcw,
  Sliders,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';

import type { PlatformConfig, PlatformStatus } from '@dfc/core';
import { mockStore } from '@/lib/mock-store';
import { Button, Input } from '@/components/ui/primitives';

export function PlatformAutomationsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [config, setConfig] = React.useState<PlatformConfig>(() => mockStore.getPlatformConfig());
  const [broadcastTitle, setBroadcastTitle] = React.useState('Good morning Madurai! 🌅');
  const [broadcastBody, setBroadcastBody] = React.useState(
    'Hot Idli, Pongal & Kumbakonam degree filter coffee orders are now open!',
  );
  const [broadcastSent, setBroadcastSent] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'mode' | 'automations' | 'broadcast'>('mode');

  React.useEffect(() => {
    return mockStore.subscribe(() => {
      setConfig(mockStore.getPlatformConfig());
    });
  }, []);

  if (!open) return null;

  const handleStatusChange = (status: PlatformStatus) => {
    mockStore.updatePlatformConfig({
      status,
      manualOverride: true,
    });
  };

  const handleResetSchedule = () => {
    mockStore.updatePlatformConfig({
      manualOverride: false,
      status: 'online',
    });
  };

  const handleToggleRainSurge = () => {
    mockStore.toggleRainSurge();
  };

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sliders className="size-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                Platform Operations &amp; Automations
              </h2>
              <p className="text-xs text-muted-foreground">
                Madurai sleep mode, operating schedule, and automated dispatch guards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-5 bg-background">
          {[
            { id: 'mode' as const, label: 'Operating Mode & Sleep', icon: Moon },
            { id: 'automations' as const, label: 'Admin Automations', icon: Zap },
            { id: 'broadcast' as const, label: 'Push Broadcast', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'mode' && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Operational State
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {/* Online */}
                  <button
                    onClick={() => handleStatusChange('online')}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      config.status === 'online'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-border hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="size-4 text-emerald-500" />
                      <span className="text-xs font-bold">Online</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                      Accepting live orders &amp; on-demand dispatches.
                    </p>
                  </button>

                  {/* Sleep Mode */}
                  <button
                    onClick={() => handleStatusChange('sleep')}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      config.status === 'sleep'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'border-border hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="size-4 text-amber-500" />
                      <span className="text-xs font-bold">Sleep Mode</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                      Night rest. Allows morning breakfast pre-orders.
                    </p>
                  </button>

                  {/* Emergency Rain Pause */}
                  <button
                    onClick={() => handleStatusChange('emergency_pause')}
                    className={`flex flex-col items-start p-3.5 rounded-lg border text-left transition-all ${
                      config.status === 'emergency_pause'
                        ? 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-300 ring-2 ring-red-500/20'
                        : 'border-border hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-red-500" />
                      <span className="text-xs font-bold">Rain Pause</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                      Emergency halt due to severe weather/flooding.
                    </p>
                  </button>
                </div>
              </div>

              {/* Status Banner Preview */}
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Madurai Operating Hours</span>
                  </div>
                  {config.manualOverride ? (
                    <button
                      onClick={handleResetSchedule}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <RotateCcw className="size-3" />
                      Reset to Auto Schedule
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Auto Schedule Active
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Opening Time</span>
                    <p className="font-semibold text-foreground text-sm mt-0.5">06:00 AM IST</p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-2.5">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Night Closing Time</span>
                    <p className="font-semibold text-foreground text-sm mt-0.5">11:30 PM IST</p>
                  </div>
                </div>

                <div className="mt-3 text-[11.5px] text-muted-foreground">
                  {config.status === 'sleep' ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      🌙 Customers currently see: &ldquo;Madurai is resting for the night! Orders reopen at 6:00 AM.&rdquo; Breakfast pre-orders are enabled.
                    </span>
                  ) : config.status === 'emergency_pause' ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Customers currently see: &ldquo;Deliveries temporarily paused due to severe rains in Madurai.&rdquo;
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      🟢 Platform is live and accepting all orders across Madurai.
                    </span>
                  )}
                </div>
              </div>

              {/* Rain Surge Weather Control */}
              <div className="rounded-lg border border-border p-3.5 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <CloudRain className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Monsoon Rain Guard &amp; Surge</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Applies 1.25x delivery multiplier and gives +₹20 safety bonus directly to riders.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={config.rainSurge.active ? 'default' : 'outline'}
                  onClick={handleToggleRainSurge}
                  className={config.rainSurge.active ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {config.rainSurge.active ? 'Active (Surge On)' : 'Turn On Surge'}
                </Button>
              </div>
            </>
          )}

          {activeTab === 'automations' && (
            <div className="space-y-3">
              {[
                {
                  key: 'autoBatchingEnabled',
                  title: 'Spatial Route Auto-Batching',
                  desc: 'Automatically combine multiple orders destined for nearby customers (< 1.8 km) to maximize rider earnings and efficiency.',
                  active: config.automations.autoBatchingEnabled,
                },
                {
                  key: 'autoDispatchEnabled',
                  title: 'Proximity Auto-Dispatch',
                  desc: 'Automatically assign ready orders to the highest-rated idle rider in the store’s hex zone without manual intervention.',
                  active: config.automations.autoDispatchEnabled,
                },
                {
                  key: 'autoEscalationMinutes',
                  title: 'Kitchen Delay Auto-Escalation',
                  desc: 'Flag orders and chime admin alarm if kitchen preparation exceeds 20 minutes without an acknowledged delay notice.',
                  active: true,
                },
                {
                  key: 'stockAuto86Enabled',
                  title: 'Zero-Stock Auto-86',
                  desc: 'Instantly deactivates menu items across customer search when linked BOM recipe ingredients are depleted.',
                  active: config.automations.stockAuto86Enabled,
                },
                {
                  key: 'autoSleepScheduleEnabled',
                  title: 'Automatic Night Curfew Trigger',
                  desc: 'Automatically transitions platform to sleep mode at 11:30 PM and reopens at 6:00 AM without admin action.',
                  active: config.automations.autoSleepScheduleEnabled,
                },
              ].map((auto) => (
                <div
                  key={auto.key}
                  className="flex items-start justify-between rounded-lg border border-border p-3.5 bg-background"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">{auto.title}</h4>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        AUTONOMOUS
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                      {auto.desc}
                    </p>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Broadcast instant push alerts to all active customers and riders in Madurai (simulated locally, ready for FCM).
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Notification Title</label>
                <Input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Good morning Madurai!"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Message Body</label>
                <textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Notification message..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {broadcastSent ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4" /> Broadcast sent to all active devices!
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Delivered via Firebase Cloud Messaging channel.
                  </span>
                )}
                <Button size="sm" onClick={handleSendBroadcast}>
                  <Bell className="size-3.5 mr-1" />
                  Send Broadcast
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 bg-muted/20">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
