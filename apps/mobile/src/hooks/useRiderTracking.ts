/**
 * Live rider position.
 *
 * While a task is live the rider's phone writes a coarse fix to
 * `riders/{uid}.lastSeen`; the customer's tracking screen and the admin's
 * live-ops map both read it. Nothing else subscribes, and nothing is stored
 * once the task ends.
 *
 * Deliberately frugal: 25 metres or 10 seconds, whichever comes first. A
 * delivery rider's battery is a work tool, and a 1-second GPS stream would
 * flatten it by mid-afternoon while telling nobody anything new.
 */

import * as React from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';

import { COL } from '@dfc/core';
import { db } from '@/lib/firebase';

const DISTANCE_INTERVAL_M = 25;
const TIME_INTERVAL_MS = 10_000;

/**
 * Once a rider has not moved for this long, stop writing. The customer's map
 * does not change and the radio does not need to be awake for it.
 */
const IDLE_AFTER_MS = 90_000;
/** How far counts as "actually moved" rather than GPS jitter while parked. */
const MOVED_M = 20;

function metresBetween(a: RiderPosition, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface RiderPosition {
  lat: number;
  lng: number;
  at: number;
}

export function useRiderTracking(uid: string | null, active: boolean) {
  const [position, setPosition] = React.useState<RiderPosition | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!uid || !active) return;

    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    // Kept in refs-by-closure rather than state: a re-render per fix would
    // defeat the point of throttling in the first place.
    let lastWritten: RiderPosition | null = null;
    let lastMovedAt = Date.now();

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is off — the customer cannot see you moving.');
        return;
      }

      const started = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: DISTANCE_INTERVAL_M,
          timeInterval: TIME_INTERVAL_MS,
        },
        (loc) => {
          if (cancelled) return;
          const now = Date.now();
          const next: RiderPosition = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            at: now,
          };

          // Always update the local view — the rider's own dot should track
          // them even when we are not telling the server about it.
          setPosition(next);

          const moved = lastWritten ? metresBetween(lastWritten, next) : Infinity;
          if (moved >= MOVED_M) lastMovedAt = now;

          // Parked at a signal, or waiting inside a shop: nothing to report.
          const idle = now - lastMovedAt > IDLE_AFTER_MS;
          if (idle && moved < MOVED_M) return;

          // Below the movement threshold and not yet idle — the customer's map
          // would not visibly change, so skip the write.
          if (moved < MOVED_M && lastWritten && now - lastWritten.at < TIME_INTERVAL_MS * 3) {
            return;
          }

          lastWritten = next;
          // Fire and forget: a dropped write just means the next fix wins.
          void updateDoc(doc(db(), COL.riders, uid), { lastSeen: next }).catch(() => {});
        },
      );

      // The permission prompt and the GPS warm-up are both slow enough that a
      // rider can finish the task, or back out of the screen, before this
      // resolves. Cleanup has already run by then and had nothing to cancel,
      // so without this the watcher outlives the screen and holds the radio
      // open for the rest of the shift — the exact battery cost the throttling
      // above exists to avoid.
      if (cancelled) {
        started.remove();
        return;
      }
      sub = started;
    })();

    return () => {
      cancelled = true;
      sub?.remove();
      sub = null;
    };
  }, [uid, active]);

  return { position, error };
}
