'use client';

/**
 * Sponsored Ads Auction & Campaign Desk.
 *
 * Algorithmic Cost-Per-Click (CPC) second-price auction manager allowing
 * merchants to bid for top placements across Madurai food & grocery feeds.
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Pause, Play, Sparkles, TrendingUp } from 'lucide-react';
import { formatInr, toPaise, type AdCampaign } from '@dfc/core';
import { Badge, Button, Input } from '@/components/ui/primitives';
import { mockStore } from '@/lib/mock-store';

export default function AdsPage() {
  const [campaigns, setCampaigns] = React.useState<AdCampaign[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newBidRupees, setNewBidRupees] = React.useState<string>('');

  React.useEffect(() => {
    const update = () => setCampaigns(mockStore.getAdCampaigns());
    update();
    return mockStore.subscribe(update);
  }, []);

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spentTodayPaise, 0);
  const totalClicks = campaigns.reduce(
    (sum, c) => sum + Math.round(c.spentTodayPaise / Math.max(100, c.bidPerClickPaise)),
    0,
  );

  const handleSaveBid = (c: AdCampaign) => {
    const rupees = parseFloat(newBidRupees);
    if (!isNaN(rupees) && rupees >= 1) {
      mockStore.updateAdCampaignBid(c.id, toPaise(rupees));
    }
    setEditingId(null);
    setNewBidRupees('');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card/85 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            Board
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h1 className="text-[14px] font-semibold">Sponsored Ads & CPC Auction Desk</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* KPI Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Today's Ad Revenue
            </span>
            <span className="text-2xl font-bold font-mono">{formatInr(totalSpent)}</span>
            <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="size-3" /> +18.4% vs last week
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Total Sponsored Clicks
            </span>
            <span className="text-2xl font-bold font-mono">{totalClicks}</span>
            <span className="text-[11.5px] text-muted-foreground">Second-Price Resolved</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              Active Auction Campaigns
            </span>
            <span className="text-2xl font-bold font-mono">
              {campaigns.filter((c) => c.status === 'active').length} / {campaigns.length}
            </span>
            <span className="text-[11.5px] text-primary">High-Margin Partner Stream</span>
          </div>
        </div>

        {/* Campaign Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-surface/50">
            <div>
              <h2 className="text-[13.5px] font-semibold">Merchant CPC Campaigns</h2>
              <p className="text-[11.5px] text-muted-foreground">
                Rank = Max Bid × Quality Score (CTR + Store Rating). Second-price rule applied at checkout.
              </p>
            </div>
          </div>

          <div className="divide-y">
            {campaigns.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold">{c.storeName}</span>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-[10.5px]">
                        {c.status.toUpperCase()}
                      </Badge>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        QS {c.qualityScore}/10
                      </span>
                    </div>
                    <span className="text-[12.5px] font-medium text-foreground">{c.headline}</span>
                    <span className="text-[11.5px] text-muted-foreground">{c.tagline}</span>
                  </div>

                  {/* Pricing & Bid Adjustment */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Bid</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            placeholder="₹"
                            value={newBidRupees}
                            onChange={(e) => setNewBidRupees(e.target.value)}
                            className="w-20 font-mono text-[12px]"
                          />
                          <Button size="sm" onClick={() => handleSaveBid(c)}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold font-mono">{formatInr(c.bidPerClickPaise)}/click</span>
                          <button
                            onClick={() => {
                              setEditingId(c.id);
                              setNewBidRupees((c.bidPerClickPaise / 100).toString());
                            }}
                            className="text-[11px] text-primary hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">CTR</span>
                      <span className="text-[13px] font-semibold font-mono">{(c.historicalCtr * 100).toFixed(1)}%</span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Spent Today</span>
                      <span className="text-[13px] font-semibold font-mono">
                        {formatInr(c.spentTodayPaise)} / {formatInr(c.dailyBudgetPaise)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={c.status === 'active' ? 'outline' : 'default'}
                      onClick={() => mockStore.toggleAdCampaign(c.id)}
                    >
                      {c.status === 'active' ? (
                        <>
                          <Pause className="size-3.5 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 mr-1" /> Resume
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
