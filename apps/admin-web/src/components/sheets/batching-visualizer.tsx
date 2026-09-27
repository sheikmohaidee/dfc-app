'use client';

/**
 * Smart Multi-Order Batching & TSP Route Visualizer Dialog.
 *
 * Clusters orders from the same kitchen/zone placed in tight time windows
 * and calculates the optimal Traveling Salesman pick-drop path for one rider.
 */

import * as React from 'react';
import { Bike, Layers, Route, Store, Zap } from 'lucide-react';
import { type BatchCandidate, type Rider } from '@dfc/core';
import { Badge, Button } from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mockStore } from '@/lib/mock-store';

interface BatchingVisualizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchingVisualizer({ open, onOpenChange }: BatchingVisualizerProps) {
  const [batches, setBatches] = React.useState<BatchCandidate[]>([]);
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [dispatchingId, setDispatchingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => {
      setBatches(mockStore.getBatchOpportunities());
      setRiders(mockStore.getRiders().filter((r) => r.isOnline && !r.isOfflineDueToCancellations));
    };
    update();
    return mockStore.subscribe(update);
  }, []);

  const handleDispatchBatch = (batch: BatchCandidate) => {
    const availableRider = riders.find((r) => !r.activeOrderId) ?? riders[0];
    if (!availableRider) return;

    setDispatchingId(batch.batchId);
    try {
      for (const order of batch.orders) {
        mockStore.dispatchToRider(order.id, availableRider, 'admin-batcher');
      }
    } finally {
      setTimeout(() => setDispatchingId(null), 500);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent width={540}>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" />
            </div>
            <div>
              <SheetTitle>Smart Route Batching Engine</SheetTitle>
              <p className="text-[12px] text-muted-foreground">
                Optimal Multi-Order TSP sequence (same kitchen · proximate drops · &lt; 20m guarantee)
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {batches.length === 0 ? (
            <div className="grid h-64 place-items-center text-center">
              <div className="flex max-w-xs flex-col items-center gap-2">
                <Route className="size-10 text-muted-foreground/50" />
                <p className="text-[13.5px] font-medium">No Batching Clusters Right Now</p>
                <p className="text-[12px] text-muted-foreground">
                  The optimizer clusters orders when multiple requests originate from the same store to adjacent localities.
                </p>
              </div>
            </div>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.batchId}
                className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-primary" />
                    <div>
                      <h4 className="text-[13px] font-semibold">{batch.storeName}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {batch.orders.length} orders batched · {batch.totalKm} km combined route
                      </p>
                    </div>
                  </div>

                  <Badge variant="default" className="bg-emerald-600 font-mono text-[10.5px]">
                    +{batch.efficiencyGainPercent}% Time Saved
                  </Badge>
                </div>

                {/* Optimal Stop Sequence */}
                <div className="rounded-lg border bg-surface p-3 text-[12px]">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Optimal TSP Stop Sequence
                  </span>
                  <div className="mt-2 space-y-2">
                    {batch.optimalStopSequence.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="grid size-5 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                          <span className="font-medium">
                            {stop.kind === 'pickup' ? `Pickup @ ${batch.storeName}` : `Drop to ${stop.customerName} (${stop.localityId})`}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            +{stop.estimatedMinutesFromStart}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch Button */}
                <div className="flex items-center justify-between border-t pt-2.5">
                  <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <Bike className="size-3.5 text-primary" />
                    <span>Est. Transit: <strong>{batch.estimatedTransitMinutes} mins</strong></span>
                  </div>

                  <Button
                    size="sm"
                    disabled={dispatchingId === batch.batchId || riders.length === 0}
                    onClick={() => handleDispatchBatch(batch)}
                  >
                    <Zap className="size-3.5 mr-1" />
                    {dispatchingId === batch.batchId ? 'Dispatching Batch...' : 'Assign & Dispatch Batch'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Visualizer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
