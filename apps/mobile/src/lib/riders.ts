/**
 * Reading a rider's live position and profile.
 *
 * Separate from lib/orders.ts because the subscription lifetime is different:
 * a customer watches a rider only while a delivery is actually moving, and
 * detaches the moment it lands.
 */

import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';

import { COL, type Rider } from '@dfc/core';
import { db, isConfigured } from './firebase';
import { DEMO_MODE } from '@/demo/config';

export interface LatLng {
  lat: number;
  lng: number;
}

/** Streams `riders/{uid}.lastSeen`. Emits null until the first fix arrives. */
export function subscribeRiderPosition(
  riderUid: string,
  onData: (pos: LatLng | null) => void,
): Unsubscribe {
  if (DEMO_MODE || !isConfigured) {
    onData({ lat: 9.9252, lng: 78.1198 });
    return () => {};
  }

  return onSnapshot(
    doc(db(), COL.riders, riderUid),
    (snap) => {
      const seen = (snap.data() as Rider | undefined)?.lastSeen;
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
  if (DEMO_MODE || !isConfigured) {
    onData({
      uid: riderUid,
      name: 'Captain Dhanush',
      phone: '+919876500004',
      isOnline: true,
      activeOrderId: null,
      vehicle: 'TVS Jupiter • TN 59 AZ 1234',
      rating: 4.9,
    });
    return () => {};
  }

  return onSnapshot(doc(db(), COL.riders, riderUid), (snap) =>
    onData(snap.exists() ? ({ ...(snap.data() as Rider), uid: snap.id }) : null),
  );
}
