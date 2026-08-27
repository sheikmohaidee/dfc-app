/**
 * Push notifications — the delivery half.
 *
 * Three audiences, three completely different urgencies, and treating them the
 * same is how an app gets muted:
 *
 *   Vendor   an unanswered order costs a sale and gets reassigned. High
 *            priority, its own alarm sound, and an Android notification
 *            channel the user cannot silence by accident.
 *   Rider    a task assignment is time-critical but not an emergency. High
 *            priority, default sound, vibration.
 *   Customer milestones only. Confirmed, picked up, at the door. Normal
 *            priority — nobody needs a chime because a shop opened a box.
 *
 * Everything fans out from one Firestore trigger on the order document,
 * because the order *is* the state. A separate "send notification" path would
 * drift from it within a month.
 *
 * The *decision* — who hears what — lives in fanout.ts as a pure function, so
 * it can be tested without FCM. This file only resolves audiences to tokens,
 * builds the FCM payload, and prunes registrations the device has thrown away.
 */

import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Message } from 'firebase-admin/messaging';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

import { COL, type Order } from '@dfc/core';

import {
  CHANNEL,
  deadTokens,
  planArrival,
  planFanOut,
  type Audience,
  type PlannedPush,
  type SendOutcome,
} from './fanout';

const REGION = 'asia-south1';

interface Target {
  uid: string;
  tokens: string[];
}

/** The slice of FCM this file needs. Injectable so tests never send a push. */
export interface Sender {
  sendEach(messages: Message[]): Promise<{ responses: SendOutcome[] }>;
}

async function tokensFor(db: Firestore, uid: string | null | undefined): Promise<Target | null> {
  if (!uid) return null;
  const snap = await db.doc(`${COL.users}/${uid}`).get();
  if (!snap.exists) return null;
  const tokens = (snap.data()?.pushTokens as string[] | undefined) ?? [];
  return tokens.length ? { uid, tokens } : null;
}

/** Which uid owns the store on an order. */
async function vendorUidFor(db: Firestore, storeId: string | null): Promise<string | null> {
  if (!storeId) return null;
  const snap = await db.doc(`${COL.stores}/${storeId}`).get();
  return (snap.data()?.ownerUid as string | undefined) ?? null;
}

/** Turns an audience into the set of devices to ring. */
export async function resolveAudience(db: Firestore, audience: Audience): Promise<Target[]> {
  switch (audience.kind) {
    case 'admins': {
      const admins = await db.collection(COL.users).where('role', '==', 'admin').get();
      const targets = await Promise.all(admins.docs.map((d) => tokensFor(db, d.id)));
      return targets.filter((t): t is Target => t !== null);
    }
    case 'vendor': {
      const uid = await vendorUidFor(db, audience.storeId);
      const t = await tokensFor(db, uid);
      return t ? [t] : [];
    }
    case 'rider':
    case 'customer': {
      const t = await tokensFor(db, audience.uid);
      return t ? [t] : [];
    }
  }
}

/** Builds the platform payloads. Android and iOS express urgency differently. */
export function toMessages(target: Target, p: PlannedPush): Message[] {
  return target.tokens.map((token) => ({
    token,
    notification: p.notification,
    data: { ...p.data },
    android: {
      priority: p.urgent ? ('high' as const) : ('normal' as const),
      notification: {
        channelId: p.channel,
        sound: p.sound ?? 'default',
        ...(p.urgent ? { visibility: 'public' as const } : {}),
      },
    },
    apns: {
      headers: { 'apns-priority': p.urgent ? '10' : '5' },
      payload: {
        aps: {
          sound: p.sound ? `${p.sound}.caf` : 'default',
          ...(p.urgent ? { 'interruption-level': 'time-sensitive' } : {}),
        },
      },
    },
  }));
}

/**
 * Sends one planned push and prunes tokens the device has invalidated.
 *
 * Without the prune, a reinstalled app leaves a dead token behind forever and
 * every send reports a failure that nobody reads.
 */
export async function deliver(
  db: Firestore,
  sender: Sender,
  target: Target,
  p: PlannedPush,
): Promise<void> {
  const res = await sender.sendEach(toMessages(target, p));

  const dead = deadTokens(target.tokens, res.responses);
  for (const r of res.responses) {
    if (!r.success && !dead.length) logger.warn('push failed', { uid: target.uid, code: r.errorCode });
  }

  if (dead.length) {
    const keep = target.tokens.filter((t) => !dead.includes(t));
    await db.doc(`${COL.users}/${target.uid}`).set({ pushTokens: keep }, { merge: true });
  }
}

/** Resolves and delivers a whole plan. */
export async function runPlan(db: Firestore, sender: Sender, plan: PlannedPush[]): Promise<void> {
  for (const p of plan) {
    const targets = await resolveAudience(db, p.audience);
    await Promise.all(targets.map((t) => deliver(db, sender, t, p)));
  }
}

// ---------------------------------------------------------------------------

export const onOrderChanged = onDocumentWritten(
  { region: REGION, document: `${COL.orders}/{orderId}` },
  async (event) => {
    const before = event.data?.before.data() as Order | undefined;
    const after = event.data?.after.data() as Order | undefined;

    const plan = planFanOut(before, after, event.params.orderId);
    if (plan.length) await runPlan(getFirestore(), getMessaging(), plan);
  },
);

export const onRiderArrived = onDocumentWritten(
  { region: REGION, document: `${COL.orders}/{orderId}` },
  async (event) => {
    const before = event.data?.before.data() as Order | undefined;
    const after = event.data?.after.data() as Order | undefined;

    const plan = planArrival(before, after, event.params.orderId);
    if (plan.length) await runPlan(getFirestore(), getMessaging(), plan);
  },
);

export { CHANNEL };
