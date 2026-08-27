/**
 * Madurai reference data.
 *
 * Localities and seed stores. Coordinates are approximate city-block centres,
 * good enough for a delivery-fee estimate and a schematic route; they are not
 * survey data.
 */

import type { Category, Locality } from './types';

/** A locality with coordinates. `Locality` alone is the addressing shape. */
export interface LocalityGeo extends Locality {
  lat: number;
  lng: number;
}

export const LOCALITIES: LocalityGeo[] = [
  { id: 'kk-nagar', name: 'K.K. Nagar', nameTa: 'கே.கே. நகர்', pincode: '625020', lat: 9.9095, lng: 78.0985 },
  { id: 'anna-nagar', name: 'Anna Nagar', nameTa: 'அண்ணா நகர்', pincode: '625020', lat: 9.9312, lng: 78.1256 },
  { id: 'villapuram', name: 'Villapuram', nameTa: 'விளாபுரம்', pincode: '625012', lat: 9.8874, lng: 78.1042 },
  { id: 'simmakkal', name: 'Simmakkal', nameTa: 'சிம்மக்கல்', pincode: '625001', lat: 9.9214, lng: 78.1187 },
  { id: 'goripalayam', name: 'Goripalayam', nameTa: 'கோரிப்பாளையம்', pincode: '625002', lat: 9.9296, lng: 78.1240 },
  { id: 'thirunagar', name: 'Thirunagar', nameTa: 'திருநகர்', pincode: '625006', lat: 9.8698, lng: 78.0640 },
  { id: 'tallakulam', name: 'Tallakulam', nameTa: 'தல்லாகுளம்', pincode: '625002', lat: 9.9380, lng: 78.1330 },
  { id: 'mattuthavani', name: 'Mattuthavani', nameTa: 'மாட்டுத்தாவணி', pincode: '625007', lat: 9.9482, lng: 78.1553 },
];

export const MADURAI_LOCALITY_NAMES = LOCALITIES.map((l) => l.name);

export const localityById = (id: string | null | undefined) =>
  LOCALITIES.find((l) => l.id === id) ?? null;

/** Nearest known locality to a GPS fix — used by the sign-in auto-detect. */
export function nearestLocality(lat: number, lng: number): Locality {
  let best = LOCALITIES[0]!;
  let bestD = Number.POSITIVE_INFINITY;
  for (const l of LOCALITIES) {
    const d = haversineKm(lat, lng, l.lat, l.lng);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Straight-line distance padded for Madurai's street grid. */
export function routeKm(fromLocalityId: string, toLocalityId: string): number {
  const a = LOCALITIES.find((l) => l.id === fromLocalityId);
  const b = LOCALITIES.find((l) => l.id === toLocalityId);
  if (!a || !b) return 3;
  return Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng) * 1.35 * 10) / 10;
}

// ---------------------------------------------------------------------------
// Seed stores
// ---------------------------------------------------------------------------

export interface SeedStore {
  id: string;
  name: string;
  nameTa: string;
  category: Category;
  localityId: string;
  phone: string;
  avgPrepMinutes: number;
}

export const SEED_STORES: SeedStore[] = [
  { id: 'meenakshi-medicals', name: 'Meenakshi Medicals', nameTa: 'மீனாட்சி மெடிக்கல்ஸ்', category: 'pharmacy', localityId: 'anna-nagar', phone: '+914522531001', avgPrepMinutes: 6 },
  { id: 'vilakkuthoon-pharma', name: 'Vilakkuthoon Pharma', nameTa: 'விளக்குத்தூண் பார்மா', category: 'pharmacy', localityId: 'simmakkal', phone: '+914522531002', avgPrepMinutes: 8 },
  { id: 'amma-mini-mart', name: 'Amma Mini Mart', nameTa: 'அம்மா மினி மார்ட்', category: 'grocery', localityId: 'kk-nagar', phone: '+914522531003', avgPrepMinutes: 12 },
  { id: 'sri-balaji-stores', name: 'Sri Balaji Stores', nameTa: 'ஸ்ரீ பாலாஜி ஸ்டோர்ஸ்', category: 'grocery', localityId: 'thirunagar', phone: '+914522531004', avgPrepMinutes: 14 },
  { id: 'muniyandi-vilas', name: 'Muniyandi Vilas', nameTa: 'முனியாண்டி விலாஸ்', category: 'food', localityId: 'villapuram', phone: '+914522531005', avgPrepMinutes: 18 },
  { id: 'konar-kadai', name: 'Konar Kadai', nameTa: 'கோனார் கடை', category: 'food', localityId: 'goripalayam', phone: '+914522531006', avgPrepMinutes: 15 },
  { id: 'simmakkal-flowers', name: 'Simmakkal Flower Market', nameTa: 'சிம்மக்கல் பூ மார்க்கெட்', category: 'grocery', localityId: 'simmakkal', phone: '+914522531007', avgPrepMinutes: 10 },
];

export const storeById = (id: string | null | undefined) =>
  SEED_STORES.find((s) => s.id === id) ?? null;

/**
 * Which store should serve this order. v1 is deliberately dumb: same category,
 * nearest locality. Swap for a real availability index when the catalogue lands.
 */
export function suggestStore(
  category: Category,
  customerLocalityId: string,
  hint?: string | null,
): SeedStore | null {
  if (hint) {
    const needle = hint.toLowerCase();
    const named = SEED_STORES.find(
      (s) => needle.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(needle),
    );
    if (named) return named;
  }
  const candidates = SEED_STORES.filter((s) => s.category === category);
  if (candidates.length === 0) return null;
  return candidates
    .map((s) => ({ s, d: routeKm(s.localityId, customerLocalityId) }))
    .sort((a, b) => a.d - b.d)[0]!.s;
}
