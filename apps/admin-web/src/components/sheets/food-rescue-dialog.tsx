'use client';

/**
 * Food Rescue Radar & Canceled Order Bidding Dialog.
 *
 * Broadcasts freshly cooked food from canceled orders at a 50%–70% discount
 * with a 15-minute countdown clock to eliminate food waste and recoup kitchen revenue.
 */

import * as React from 'react';
import { Clock, Flame, HeartHandshake, Store, Zap } from 'lucide-react';
import { formatInr, getRescueRemainingMs, type FoodRescueListing } from '@dfc/core';
import { Badge, Button } from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mockStore } from '@/lib/mock-store';
import { cn } from '@/lib/utils';

interface FoodRescueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FoodRescueDialog({ open, onOpenChange }: FoodRescueDialogProps) {
  const [listings, setListings] = React.useState<FoodRescueListing[]>([]);
  const [now, setNow] = React.useState(Date.now());
  const [claimingId, setClaimingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => {
      setListings(mockStore.getFoodRescueListings());
      setNow(Date.now());
    };
    update();
    const unsub = mockStore.subscribe(update);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleClaim = (listing: FoodRescueListing) => {
    setClaimingId(listing.id);
    try {
      mockStore.claimFoodRescue(listing.id, 'cust-rescue-buyer', 'Nearby Customer (Rescue)');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setClaimingId(null), 600);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width={540}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="size-4" />
            </div>
            <div>
              <SheetTitle>Food Rescue Radar</SheetTitle>
              <p className="text-[12px] text-muted-foreground">
                Freshly prepared canceled meals broadcasted at 50%–70% OFF (15-min window)
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {listings.length === 0 ? (
            <div className="grid h-64 place-items-center text-center">
              <div className="flex max-w-xs flex-col items-center gap-2">
                <HeartHandshake className="size-10 text-muted-foreground/50" />
                <p className="text-[13.5px] font-medium">No Food Rescue Deals Active</p>
                <p className="text-[12px] text-muted-foreground">
                  When an order is canceled post-cooking, it immediately appears here for flash broadcast.
                </p>
              </div>
            </div>
          ) : (
            listings.map((item) => {
              const remMs = getRescueRemainingMs(item, now);
              const mins = Math.floor(remMs / 60000);
              const secs = Math.floor((remMs % 60000) / 1000);
              const isExpired = remMs <= 0 && item.status === 'active';

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border p-4 transition-all',
                    item.status === 'claimed'
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isExpired
                      ? 'border-border/40 bg-muted/30 opacity-60'
                      : 'border-orange-500/40 bg-orange-500/5 shadow-sm',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Store className="size-3.5 text-muted-foreground" />
                        <span className="text-[13px] font-semibold">{item.storeName}</span>
                        <span className="text-[11px] text-muted-foreground">({item.localityId})</span>
                      </div>
                      <span className="text-[11.5px] text-muted-foreground">
                        Original Order #{item.originalOrderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.status === 'claimed' ? 'default' : isExpired ? 'secondary' : 'destructive'}
                        className="font-mono text-[11px]"
                      >
                        {item.discountPercentage}% OFF
                      </Badge>
                      {item.status === 'active' && !isExpired && (
                        <div className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                          <Clock className="size-3" />
                          <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="rounded-lg border bg-surface p-2.5 text-[12px]">
                    <div className="space-y-1">
                      {item.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-muted-foreground">
                          <span>{i.quantity} × {i.name}</span>
                          <span className="font-mono">{formatInr((i.unitPricePaise ?? 5000) * i.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Claim Footer */}
                  <div className="flex items-center justify-between border-t pt-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">{formatInr(item.rescuePricePaise)}</span>
                      <span className="text-[12px] text-muted-foreground line-through">
                        {formatInr(item.originalSubtotalPaise)}
                      </span>
                    </div>

                    {item.status === 'active' && !isExpired ? (
                      <Button
                        size="sm"
                        disabled={claimingId === item.id}
                        onClick={() => handleClaim(item)}
                        className="bg-orange-500 text-white hover:bg-orange-600"
                      >
                        <Zap className="size-3.5 mr-1" />
                        {claimingId === item.id ? 'Claiming...' : 'Simulate Instant Rescue Claim'}
                      </Button>
                    ) : item.status === 'claimed' ? (
                      <span className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Rescued by {item.claimedByName}
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-medium text-muted-foreground">
                        Deal Expired (15m elapsed)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Radar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
