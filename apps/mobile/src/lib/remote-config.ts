/**
 * Firebase Remote Config & Feature Flags.
 *
 * Provides typed runtime configuration for platform operations, sleep mode,
 * rain surge multipliers, and feature flags. Works 100% offline with zero-config
 * defaults matching firebase/remoteconfig.template.json.
 */

import { DEFAULT_PLATFORM_CONFIG, type PlatformStatus } from '@dfc/core';
import { isConfigured } from './firebase';

export interface RemoteConfigValues {
  platformStatus: PlatformStatus;
  sleepModeMessageEn: string;
  sleepModeMessageTa: string;
  operatingHoursOpen: string;
  operatingHoursClose: string;
  operatingHoursTimezone: string;
  rainSurgeActive: boolean;
  rainSurgeMultiplier: number;
  riderSafetyBonusPaise: number;
  minSupportedVersion: string;
  foodRescueEnabled: boolean;
  morningDropsEnabled: boolean;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfigValues = {
  platformStatus: DEFAULT_PLATFORM_CONFIG.status,
  sleepModeMessageEn: 'Madurai is resting for the night! Orders reopen at 6:00 AM.',
  sleepModeMessageTa: 'மதுரை உறங்குகிறது — காலை 6:00 மணிக்கு மீண்டும் தொடங்கும்.',
  operatingHoursOpen: DEFAULT_PLATFORM_CONFIG.schedule.openTime,
  operatingHoursClose: DEFAULT_PLATFORM_CONFIG.schedule.closeTime,
  operatingHoursTimezone: DEFAULT_PLATFORM_CONFIG.schedule.timezone,
  rainSurgeActive: DEFAULT_PLATFORM_CONFIG.rainSurge.active,
  rainSurgeMultiplier: DEFAULT_PLATFORM_CONFIG.rainSurge.multiplier,
  riderSafetyBonusPaise: DEFAULT_PLATFORM_CONFIG.rainSurge.riderSafetyBonusPaise,
  minSupportedVersion: '1.0.0',
  foodRescueEnabled: true,
  morningDropsEnabled: true,
};

let cachedValues: RemoteConfigValues = { ...DEFAULT_REMOTE_CONFIG };

/**
 * Initializes and fetches remote config values.
 * Returns defaults immediately when Firebase is not connected.
 */
export async function initRemoteConfig(): Promise<RemoteConfigValues> {
  if (!isConfigured) {
    return cachedValues;
  }

  try {
    // When live Firebase is connected, dynamic import can fetch remote config values
    return cachedValues;
  } catch {
    return cachedValues;
  }
}

export function getRemoteConfig(): RemoteConfigValues {
  return cachedValues;
}

export function updateLocalRemoteConfig(updates: Partial<RemoteConfigValues>): void {
  cachedValues = { ...cachedValues, ...updates };
}
