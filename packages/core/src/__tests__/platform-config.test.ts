import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_PLATFORM_CONFIG,
  computeRainAdjustedPricing,
  getEffectivePlatformStatus,
  isWithinOperatingSchedule,
  type OperatingSchedule,
  type PlatformConfig,
  type RainSurgeConfig,
} from '../platform-config';

describe('platform-config & operating hours', () => {
  it('correctly determines whether current time is within schedule', () => {
    const daytimeSchedule: OperatingSchedule = {
      enabled: true,
      openTime: '06:00',
      closeTime: '23:30',
      timezone: 'Asia/Kolkata',
      allowMorningPreOrders: true,
    };

    // 10:00 AM IST on Sep 6 2026 -> 04:30 UTC
    const inHoursDate = new Date('2026-09-06T04:30:00Z');
    assert.equal(isWithinOperatingSchedule(daytimeSchedule, inHoursDate), true);

    // 01:00 AM IST on Sep 6 2026 -> 19:30 UTC on Sep 5 2026
    const lateNightDate = new Date('2026-09-05T19:30:00Z');
    assert.equal(isWithinOperatingSchedule(daytimeSchedule, lateNightDate), false);
  });

  it('handles midnight crossing operating schedules', () => {
    const nightShiftSchedule: OperatingSchedule = {
      enabled: true,
      openTime: '18:00',
      closeTime: '03:00',
      timezone: 'Asia/Kolkata',
      allowMorningPreOrders: false,
    };

    // 01:00 AM IST -> within 18:00 to 03:00
    const inHoursNight = new Date('2026-09-05T19:30:00Z');
    assert.equal(isWithinOperatingSchedule(nightShiftSchedule, inHoursNight), true);

    // 10:00 AM IST -> outside
    const offHours = new Date('2026-09-06T04:30:00Z');
    assert.equal(isWithinOperatingSchedule(nightShiftSchedule, offHours), false);
  });

  it('computes effective platform status taking manual overrides into account', () => {
    const config: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      manualOverride: true,
      status: 'sleep',
    };

    const status = getEffectivePlatformStatus(config);
    assert.equal(status.status, 'sleep');
    assert.equal(status.isOpen, false);
    assert.equal(status.allowMorningPreOrders, true);
    assert.ok(status.title.en.includes('Resting'));
    assert.ok(status.title.ta.includes('மதுரை'));
  });

  it('supports emergency weather/monsoon pause override', () => {
    const config: PlatformConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      manualOverride: true,
      status: 'emergency_pause',
      customMessageEn: 'Heavy Vaigai flood warning. Deliveries paused.',
    };

    const status = getEffectivePlatformStatus(config);
    assert.equal(status.status, 'emergency_pause');
    assert.equal(status.isOpen, false);
    assert.equal(status.allowMorningPreOrders, false);
    assert.ok(status.message.en.includes('Vaigai'));
  });

  it('computes rain-adjusted pricing with safety bonus for riders', () => {
    const baseDelivery = 4000; // ₹40
    const rainConfig: RainSurgeConfig = {
      active: true,
      multiplier: 1.3, // 30% surge -> ₹52
      riderSafetyBonusPaise: 2500, // ₹25
      reasonEn: 'Monsoon Rain Guard',
      reasonTa: 'மழைக்கால கூடுதல் கட்டணம்',
    };

    const result = computeRainAdjustedPricing(baseDelivery, rainConfig);
    assert.equal(result.surgeActive, true);
    assert.equal(result.customerDeliveryPaise, 5200);
    assert.equal(result.riderBonusPaise, 2500);

    const inactiveResult = computeRainAdjustedPricing(baseDelivery, {
      ...rainConfig,
      active: false,
    });
    assert.equal(inactiveResult.surgeActive, false);
    assert.equal(inactiveResult.customerDeliveryPaise, 4000);
    assert.equal(inactiveResult.riderBonusPaise, 0);
  });
});
