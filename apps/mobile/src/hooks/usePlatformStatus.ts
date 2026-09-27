/**
 * Platform Status & Operating Hours Hook.
 *
 * Provides real-time information about whether DFC is online, in sleep mode,
 * or in emergency rain pause. Automatically calculates off-hour status and
 * morning reopening countdown.
 */

import * as React from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import {
  DEFAULT_PLATFORM_CONFIG,
  getEffectivePlatformStatus,
  platformConfigDoc,
  type EffectivePlatformState,
  type PlatformConfig,
  type RainSurgeConfig,
} from '@dfc/core';

import { db, isConfigured } from '@/lib/firebase';

export interface UsePlatformStatusResult extends EffectivePlatformState {
  config: PlatformConfig;
  rainSurge: RainSurgeConfig;
  refresh: () => void;
}

export function usePlatformStatus(): UsePlatformStatusResult {
  const [config, setConfig] = React.useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);
  const [effective, setEffective] = React.useState<EffectivePlatformState>(() =>
    getEffectivePlatformStatus(DEFAULT_PLATFORM_CONFIG),
  );

  const evaluate = React.useCallback((cfg: PlatformConfig) => {
    setEffective(getEffectivePlatformStatus(cfg));
  }, []);

  React.useEffect(() => {
    if (!isConfigured) {
      evaluate(config);
      const timer = setInterval(() => evaluate(config), 60_000);
      return () => clearInterval(timer);
    }

    const ref = doc(db(), platformConfigDoc);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as PlatformConfig;
          setConfig(remoteData);
          evaluate(remoteData);
        } else {
          evaluate(DEFAULT_PLATFORM_CONFIG);
        }
      },
      () => {
        // Fallback to local evaluation on permission / offline error
        evaluate(config);
      },
    );

    return () => unsub();
  }, [evaluate, config]);

  return {
    ...effective,
    config,
    rainSurge: config.rainSurge,
    refresh: () => evaluate(config),
  };
}
