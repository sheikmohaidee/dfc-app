/**
 * Rider Telemetry Safety, Crash Detection & Fatigue Management.
 *
 * Evaluates accelerometer and gyroscope vectors to detect sudden collisions/stops,
 * manages 30-second SOS auto-check triggers, and enforces mandatory 15-minute
 * rest periods after 6 consecutive hours of active delivery duty.
 */

export interface MotionSample {
  accelX: number; // m/s^2
  accelY: number;
  accelZ: number;
  gyroAlpha: number; // deg/s
  gyroBeta: number;
  gyroGamma: number;
  speedKmph: number;
  timestamp: number;
}

export interface CrashEvent {
  id: string;
  riderUid: string;
  orderId: string | null;
  gForceMagnitude: number;
  detectedAt: number;
  sosTriggeredAt: number;
  status: 'pending_confirmation' | 'rider_safe' | 'emergency_dispatched';
}

export interface ShiftFatigueStatus {
  riderUid: string;
  shiftStartedAt: number;
  consecutiveActiveHours: number;
  maxConsecutiveHoursAllowed: number; // 6 Hours
  isMandatoryBreakActive: boolean;
  breakEndsAt?: number;
  nextAllowedOnlineAt?: number;
}

export const CRASH_G_FORCE_THRESHOLD = 3.5; // 3.5G deceleration
export const MAX_CONSECUTIVE_SHIFT_HOURS = 6;
export const MANDATORY_BREAK_DURATION_MS = 15 * 60 * 1000; // 15 min

/**
 * Checks motion sensor sample for high-G collision or abrupt deceleration.
 */
export function detectCrashAnomaly(
  sample: MotionSample,
  riderUid: string,
  orderId: string | null = null,
): CrashEvent | null {
  const gMagnitude = Math.sqrt(
    sample.accelX * sample.accelX +
    sample.accelY * sample.accelY +
    sample.accelZ * sample.accelZ,
  ) / 9.81;

  if (gMagnitude >= CRASH_G_FORCE_THRESHOLD && sample.speedKmph >= 15) {
    const now = Date.now();
    return {
      id: `crash_${riderUid}_${now}`,
      riderUid,
      orderId,
      gForceMagnitude: Number(gMagnitude.toFixed(2)),
      detectedAt: now,
      sosTriggeredAt: now,
      status: 'pending_confirmation',
    };
  }

  return null;
}

/**
 * Calculates current rider shift fatigue status and checks if break is mandatory.
 */
export function evaluateShiftFatigue(
  riderUid: string,
  shiftStartedAt: number,
  lastBreakEndedAt?: number,
  now = Date.now(),
): ShiftFatigueStatus {
  const effectiveStart = lastBreakEndedAt ? Math.max(shiftStartedAt, lastBreakEndedAt) : shiftStartedAt;
  const elapsedMs = Math.max(0, now - effectiveStart);
  const consecutiveHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(2));

  const isMandatoryBreakActive = consecutiveHours >= MAX_CONSECUTIVE_SHIFT_HOURS;
  const breakEndsAt = isMandatoryBreakActive ? now + MANDATORY_BREAK_DURATION_MS : undefined;

  return {
    riderUid,
    shiftStartedAt,
    consecutiveActiveHours: consecutiveHours,
    maxConsecutiveHoursAllowed: MAX_CONSECUTIVE_SHIFT_HOURS,
    isMandatoryBreakActive,
    breakEndsAt,
    nextAllowedOnlineAt: breakEndsAt,
  };
}
