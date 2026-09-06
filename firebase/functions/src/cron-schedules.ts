/**
 * Scheduled Cloud Functions — Night Sleep, Morning Open & Kitchen Escalation.
 *
 * Runs on Cloud Scheduler (free tier) in asia-south1 with Asia/Kolkata timezone.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

import { COL, platformConfigDoc, type Order, type PlatformConfig } from '@dfc/core';

const REGION = 'asia-south1';
const TIMEZONE = 'Asia/Kolkata';

/**
 * 11:30 PM IST every night:
 * Automatically transitions platform to 'sleep' mode if schedule is enabled.
 */
export const autoNightSleepSchedule = onSchedule(
  {
    schedule: '30 23 * * *',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const configRef = db.doc(platformConfigDoc);
    const snap = await configRef.get();

    if (!snap.exists) {
      logger.info('Platform config doc does not exist yet. Skipping night sleep schedule.');
      return;
    }

    const config = snap.data() as PlatformConfig;
    if (config.automations?.autoSleepScheduleEnabled && !config.manualOverride) {
      logger.info('Auto-triggering Night Sleep Mode for Madurai at 11:30 PM.');
      await configRef.update({
        status: 'sleep',
        updatedAt: Date.now(),
        updatedBy: 'system-auto-sleep-cron',
      });
    } else {
      logger.info('Night sleep skipped: manualOverride or autoSleepScheduleEnabled is false.');
    }
  },
);

/**
 * 06:00 AM IST every morning:
 * Automatically transitions platform back to 'online' mode.
 */
export const autoMorningOpenSchedule = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const configRef = db.doc(platformConfigDoc);
    const snap = await configRef.get();

    if (!snap.exists) {
      logger.info('Platform config doc does not exist yet. Skipping morning reopen schedule.');
      return;
    }

    const config = snap.data() as PlatformConfig;
    if (config.status === 'sleep' && !config.manualOverride) {
      logger.info('Auto-reopening DFC Madurai operations at 6:00 AM.');
      await configRef.update({
        status: 'online',
        updatedAt: Date.now(),
        updatedBy: 'system-auto-morning-cron',
      });
    }
  },
);

/**
 * Runs every 5 minutes:
 * Checks for orders lingering in preparation > 20 minutes without a delay report,
 * flagging them for dispatcher attention.
 */
export const autoKitchenEscalation = onSchedule(
  {
    schedule: '*/5 * * * *',
    timeZone: TIMEZONE,
    region: REGION,
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const thresholdMs = 20 * 60 * 1000; // 20 mins

    const overdueSnaps = await db
      .collection(COL.orders)
      .where('status', 'in', ['vendor_accepted', 'packing'])
      .get();

    let escalatedCount = 0;
    for (const doc of overdueSnaps.docs) {
      const order = doc.data() as Order;
      // If already has a reported delay or handled recently, skip
      if (order.delayMinutes && order.delayMinutes > 0) continue;

      const durationMs = now - (order.updatedAt || order.createdAt);
      if (durationMs > thresholdMs) {
        logger.warn(
          `Escalating order #${order.code} (${order.id}): kitchen prep took ${Math.round(durationMs / 60000)}m`,
        );
        escalatedCount++;
        await doc.ref.update({
          kitchenEscalated: true,
          updatedAt: Date.now(),
        });
      }
    }

    logger.info(`autoKitchenEscalation completed. Escalated: ${escalatedCount} orders.`);
  },
);
