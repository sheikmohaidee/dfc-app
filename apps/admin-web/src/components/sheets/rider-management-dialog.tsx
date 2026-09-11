'use client';

/**
 * Rider Management & Cancellation Audit Dialog.
 *
 * Lets admins review rider statuses, daily cancellation counts, cancellation reasons & explanations,
 * and reactivate captains whose accounts were automatically set offline due to exceeding the limit.
 */

import * as React from 'react';
import { Bike, RotateCcw, ShieldAlert } from 'lucide-react';

import type { Rider } from '@dfc/core';
import { Badge, Button } from '@/components/ui/primitives';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { reactivateRiderAccount } from '@/lib/orders';
import { ago, cn, initials } from '@/lib/utils';

export function RiderManagementDialog({
  open,
  riders,
  onClose,
}: {
  open: boolean;
  riders: Rider[];
  onClose: () => void;
}) {
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);
  const [busyUid, setBusyUid] = React.useState<string | null>(null);

  const activeRider = React.useMemo(() => {
    return riders.find((r) => r.uid === selectedUid) ?? riders[0] ?? null;
  }, [riders, selectedUid]);

  async function handleReactivate(uid: string) {
    setBusyUid(uid);
    try {
      await reactivateRiderAccount(uid);
    } finally {
      setBusyUid(null);
    }
  }

  if (!open) return null;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent width={580}>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bike className="size-4" strokeWidth={2.4} />
            </span>
            <div className="flex flex-col">
              <SheetTitle className="text-base font-semibold tracking-tight">
                Captains &amp; Rider Audits
              </SheetTitle>
              <span className="ta text-[11px] text-placeholder">ரைடர் & கேன்சலேஷன் மேலாண்மை</span>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4">
          {/* Top Summary Badges */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1 rounded-lg border bg-surface p-3">
              <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">TOTAL RIDERS</span>
              <span className="text-lg font-bold">{riders.length}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border bg-grocery-tint border-grocery-border p-3">
              <span className="text-[10px] font-bold tracking-[0.1em] text-grocery-fg">ONLINE</span>
              <span className="text-lg font-bold text-grocery-fg">
                {riders.filter((r) => r.isOnline).length}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border bg-destructive-tint border-destructive-border p-3">
              <span className="text-[10px] font-bold tracking-[0.1em] text-destructive-fg">OFFLINE / LOCKED</span>
              <span className="text-lg font-bold text-destructive-fg">
                {riders.filter((r) => !r.isOnline).length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
              ACTIVE RIDERS
            </span>

            <div className="flex flex-col gap-2">
              {riders.map((r) => {
                const strikes = r.cancellationsToday ?? 0;
                const isLocked = r.isOfflineDueToCancellations || strikes > 2;
                const isSelected = activeRider?.uid === r.uid;

                return (
                  <div
                    key={r.uid}
                    onClick={() => setSelectedUid(r.uid)}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors',
                      isSelected ? 'border-primary bg-surface shadow-subtle' : 'hover:bg-surface/60',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted text-xs font-semibold text-icon">
                        {initials(r.name)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tracking-tight">{r.name}</span>
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              r.isOnline ? 'bg-grocery' : 'bg-muted-foreground',
                            )}
                          />
                        </div>
                        <span className="tnum text-[11px] text-muted-foreground">{r.phone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <Badge tone="destructive">LIMIT EXCEEDED</Badge>
                        ) : strikes > 0 ? (
                          <Badge tone="verify">{strikes}/2 CANCELS</Badge>
                        ) : (
                          <Badge tone="grocery">0/2 CANCELS</Badge>
                        )}
                        {r.activeOrderId ? (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                            BUSY
                          </span>
                        ) : (
                          <span className="rounded bg-grocery-tint px-1.5 py-0.5 text-[10px] font-bold text-grocery-fg">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lockout banner & action */}
                    {isLocked ? (
                      <div className="mt-1 flex flex-col gap-2 rounded-md border border-destructive-border bg-destructive-tint p-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-destructive-fg">
                          <ShieldAlert className="size-4" />
                          <span>Exceeded daily limit ({strikes} cancels). Automatically set to Offline.</span>
                        </div>
                        {r.explanationGiven ? (
                          <p className="text-[11.5px] italic text-destructive-fg">
                            “{r.explanationGiven}”
                          </p>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="self-start gap-1.5"
                          disabled={busyUid === r.uid}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleReactivate(r.uid);
                          }}
                        >
                          <RotateCcw className="size-3.5" />
                          {busyUid === r.uid ? 'Reactivating…' : 'Reactivate Captain & Reset Strikes'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Cancellation History */}
          {activeRider ? (
            <div className="flex flex-col gap-2.5 rounded-lg border p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold tracking-[0.1em] text-placeholder">
                  CANCELLATION AUDIT · {activeRider.name.toUpperCase()}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Today: {activeRider.cancellationsToday ?? 0} of 2 allowed
                </span>
              </div>

              {(!activeRider.cancellationHistory || activeRider.cancellationHistory.length === 0) ? (
                <div className="grid h-16 place-items-center text-xs text-muted-foreground">
                  No cancellations recorded for this captain.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeRider.cancellationHistory.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1 rounded border bg-surface p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Order #{item.orderCode} · <span className="text-destructive font-bold">{item.reason}</span>
                        </span>
                        <span className="tnum text-[10.5px] text-placeholder">{ago(item.timestamp)} ago</span>
                      </div>
                      {item.explanation ? (
                        <p className="italic text-muted-foreground">
                          Explanation: “{item.explanation}”
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" size="default" onClick={onClose} className="w-full">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
