/**
 * Reading a rider's live position.
 *
 * Separate from lib/orders.ts because the subscription lifetime is different:
 * a customer watches a rider only while a delivery is actually moving, and
 * detaches the moment it lands.
 */

import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { COL, type Rider } from '@dfc/core';
import { db } from './firebase';

export interface LatLng {
  lat: number;
  lng: number;
}

/** Streams `riders/{uid}.lastSeen`. Emits null until the first fix arrives. */
export function subscribeRiderPosition(
  riderUid: string,
  onData: (pos: LatLng | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db(), COL.riders, riderUid),
    (snap) => {
      const seen = (snap.data() as Rider | undefined)?.lastSeen;
      // A fix older than two minutes is stale — better to show no dot than a
      // dot that has not moved because the app was backgrounded.
      if (!seen || Date.now() - seen.at > 120_000) {
        onData(null);
        return;
      }
      onData({ lat: seen.lat, lng: seen.lng });
    },
    () => onData(null),
  );
}

export function subscribeRider(
  riderUid: string,
  onData: (rider: Rider | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db(), COL.riders, riderUid), (snap) =>
    onData(snap.exists() ? (snap.data() as Rider) : null),
  );
}
