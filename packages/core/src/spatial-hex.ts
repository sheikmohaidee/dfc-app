/**
 * Hexagonal Geospatial Grid (H3-style) & Dynamic Surge Pricing Engine.
 *
 * Discretizes Madurai into discrete hexagonal cells, computes live demand-to-supply
 * ratios in each cell, and calculates dynamic surge multipliers and visual glow levels.
 */

import { LOCALITIES } from './madurai';
import type { Order, Rider } from './types';

export interface SpatialHexCell {
  hexId: string;
  localityId: string;
  name: string;
  center: { lat: number; lng: number };
  activeOrderDemand: number;
  availableRiderSupply: number;
  demandSupplyRatio: number;
  surgeMultiplier: number; // e.g. 1.0 (No surge), 1.3 (+30%), 1.8 (+80%), 2.2 (+120%)
  glowLevel: 'normal' | 'moderate_demand' | 'high_surge' | 'critical_surge';
  surgeFeePaise: number; // Extra ₹ added to delivery fee
}

/**
 * Computes dynamic surge status and hexagonal heat density across Madurai.
 */
export function computeSpatialHexSurge(
  orders: Order[],
  riders: Rider[],
): Record<string, SpatialHexCell> {
  const result: Record<string, SpatialHexCell> = {};

  // Count open demand per locality
  const demandByLocality: Record<string, number> = {};
  for (const o of orders) {
    if (o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected') {
      demandByLocality[o.localityId] = (demandByLocality[o.localityId] ?? 0) + 1;
    }
  }

  // Count online available supply
  const onlineRiders = riders.filter((r) => r.isOnline && !r.isOfflineDueToCancellations);
  const totalSupply = onlineRiders.length;
  // Assume distributed riders across key zones
  const baseSupplyPerHex = Math.max(1, Math.floor(totalSupply / LOCALITIES.length));

  for (const loc of LOCALITIES) {
    const hexId = `hex_${loc.id}`;
    const demand = demandByLocality[loc.id] ?? 0;
    const supply = baseSupplyPerHex;
    const ratio = Number((demand / supply).toFixed(2));

    let surgeMultiplier = 1.0;
    let glowLevel: SpatialHexCell['glowLevel'] = 'normal';
    let surgeFeePaise = 0;

    if (ratio >= 3.0 || demand >= 6) {
      surgeMultiplier = 2.0;
      glowLevel = 'critical_surge';
      surgeFeePaise = 3000; // +₹30
    } else if (ratio >= 2.0 || demand >= 4) {
      surgeMultiplier = 1.5;
      glowLevel = 'high_surge';
      surgeFeePaise = 1500; // +₹15
    } else if (ratio >= 1.3 || demand >= 2) {
      surgeMultiplier = 1.2;
      glowLevel = 'moderate_demand';
      surgeFeePaise = 1000; // +₹10
    }

    result[hexId] = {
      hexId,
      localityId: loc.id,
      name: loc.name,
      center: { lat: loc.lat, lng: loc.lng },
      activeOrderDemand: demand,
      availableRiderSupply: supply,
      demandSupplyRatio: ratio,
      surgeMultiplier,
      glowLevel,
      surgeFeePaise,
    };
  }

  return result;
}
