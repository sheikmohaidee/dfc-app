/**
 * Push registration.
 *
 * The client's only job here is to hand its token to Firestore and describe
 * its Android channels. Every decision about *what* to send and how urgently
 * lives server-side (firebase/functions/src/notifications.ts) — a client that
 * decided its own notification policy would drift from the order state within
 * a week.
 *
 * Channels are declared here because Android requires them to exist before a
 * notification naming one arrives; a message referencing an unknown channel is
 * silently downgraded, which is how a vendor misses an order and nobody can
 * work out why.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { arrayUnion, arrayRemove, doc, setDoc, updateDoc } from 'firebase/firestore';

import { COL, type Role } from '@dfc/core';
import { db } from './firebase';

/** Must match CHANNEL in firebase/functions/src/notifications.ts. */
export const CHANNELS = {
  vendorOrders: 'dfc-vendor-orders',
  riderTasks: 'dfc-rider-tasks',
  customerUpdates: 'dfc-customer-updates',
} as const;

/**
 * A delivered notification should show even with the app open — a vendor
 * looking at yesterday's orders still needs to see a new one land.
 */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}


async function declareChannels(role: Role): Promise<void> {
  if (Platform.OS !== 'android') return;

  // An unanswered order costs a sale, so the vendor channel is the only one
  // that gets MAX importance and its own sound.
  if (role === 'vendor') {
    await Notifications.setNotificationChannelAsync(CHANNELS.vendorOrders, {
      name: 'New orders',
      description: 'A customer order is waiting for you to accept it',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 400, 200, 400],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  if (role === 'rider') {
    await Notifications.setNotificationChannelAsync(CHANNELS.riderTasks, {
      name: 'Delivery tasks',
      description: 'A delivery has been assigned to you',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 300, 150, 300],
      enableVibrate: true,
    });
  }

  await Notifications.setNotificationChannelAsync(CHANNELS.customerUpdates, {
    name: 'Order updates',
    description: 'Confirmations, dispatch and arrival',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export interface PushRegistration {
  token: string | null;
  /** Why there is no token, when there is no token. */
  reason?: 'simulator' | 'denied' | 'no-project-id' | 'error';
}

/**
 * Registers this device and stores the token on the user profile.
 *
 * Tokens are an array, not a field: one person legitimately has a phone and a
 * tablet, and overwriting would silently stop notifying the other one.
 */
export async function registerForPush(uid: string, role: Role): Promise<PushRegistration> {
  // Web and simulator have no APNs/FCM registration to give. Not an error.
  if (Platform.OS === 'web' || !Device.isDevice) return { token: null, reason: 'simulator' };

  try {

    await declareChannels(role);

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
      status = asked.status;
    }

    if (status !== 'granted') return { token: null, reason: 'denied' };

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      // Expo's push service needs the EAS project id. Until `eas init` has
      // run there is nothing to register against.
      return { token: null, reason: 'no-project-id' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await setDoc(
      doc(db(), COL.users, uid),
      { pushTokens: arrayUnion(token), updatedAt: Date.now() },
      { merge: true },
    );

    return { token };
  } catch {
    return { token: null, reason: 'error' };
  }
}

/** On sign-out, so the next person on this device is not notified about someone else's orders. */
export async function unregisterPush(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db(), COL.users, uid), {
    pushTokens: arrayRemove(token),
    updatedAt: Date.now(),
  }).catch(() => {
    /* signed out already, or offline — the server prunes dead tokens anyway */
  });
}

/**
 * Routes a tapped notification to the screen it is about.
 *
 * Returns an unsubscribe. Handles both the cold-start case (the app was
 * launched by the tap) and the warm case.
 */
export function onNotificationTap(navigate: (path: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};

  const route = (data: Record<string, unknown> | undefined) => {

    const orderId = typeof data?.orderId === 'string' ? data.orderId : null;
    const kind = typeof data?.kind === 'string' ? data.kind : '';
    if (!orderId) return;

    switch (kind) {
      case 'vendor_accept':
        navigate(`/(vendor)/order/${orderId}`);
        break;
      case 'rider_task':
        navigate(`/(rider)/task/${orderId}`);
        break;
      default:
        navigate(`/(customer)/order/${orderId}`);
    }
  };

  // Cold start: the notification that launched the app.
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) route(response.notification.request.content.data);
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    route(response.notification.request.content.data);
  });

  return () => sub.remove();
}
