'use client';

/**
 * Hexagonal Geospatial Grid (H3) Surge & Demand Heatmap Overlay.
 *
 * Displays live demand-to-supply density across Madurai zones with dynamic surge
 * multipliers (1.0x to 2.5x) and glowing visual heat indicators.
 */

import * as React from 'react';
import { Activity, Flame, Users } from 'lucide-react';
import { formatInr, type SpatialHexCell } from '@dfc/core';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

interface SurgeHexOverlayProps {
  surgeMap: Record<string, SpatialHexCell>;
  onSelectHex?: (hex: SpatialHexCell) => void;
}

export function SurgeHexOverlay({ surgeMap, onSelectHex }: SurgeHexOverlayProps) {
  const cells = Object.values(surgeMap);
  const surgeActiveCount = cells.filter((c) => c.surgeMultiplier > 1.0).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card/90 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Flame className="size-4 text-orange-500" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight">H3 Spatial Surge Radar</h3>
            <p className="text-[11px] text-muted-foreground">Real-time demand vs rider density by hex cell</p>
          </div>
        </div>
        <Badge
          variant={surgeActiveCount > 0 ? 'destructive' : 'outline'}
          className="text-[10.5px]"
        >
          {surgeActiveCount > 0 ? `${surgeActiveCount} Surge Zones Active` : 'Normal City Load'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
        {cells.map((cell) => {
          const isSurging = cell.surgeMultiplier > 1.0;
          return (
            <div
              key={cell.hexId}
              onClick={() => onSelectHex?.(cell)}
              className={cn(
                'cursor-pointer rounded-lg border p-3 transition-all hover:scale-[1.02]',
                cell.glowLevel === 'critical_surge' && 'border-red-500/60 bg-red-500/10 shadow-md shadow-red-500/10',
                cell.glowLevel === 'high_surge' && 'border-orange-500/50 bg-orange-500/10',
                cell.glowLevel === 'moderate_demand' && 'border-amber-500/40 bg-amber-500/5',
                cell.glowLevel === 'normal' && 'border-border/60 bg-surface/50',
              )}
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-[12px] font-semibold">{cell.name}</span>
                {isSurging ? (
                  <span className="flex items-center gap-0.5 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cell.surgeMultiplier}x
                  </span>
                ) : (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground">
                    1.0x Base
                  </span>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="size-3 text-primary" />
                  <span>Orders: </span>
                  <strong className="font-semibold text-foreground">{cell.activeOrderDemand}</strong>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3 text-emerald-500" />
                  <span>Riders: </span>
                  <strong className="font-semibold text-foreground">{cell.availableRiderSupply}</strong>
                </div>
              </div>

              {isSurging && (
                <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[10.5px]">
                  <span className="text-muted-foreground">Surge Fee:</span>
                  <span className="font-semibold text-orange-500">+{formatInr(cell.surgeFeePaise)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
