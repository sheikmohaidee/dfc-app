/**
 * Language preference.
 *
 * Three settings, not two. "Both" is the default and the one the design was
 * drawn for — Tamil under English at 0.78×. But a Tamil-first customer in
 * Villapuram should be able to make Tamil the primary line, and an
 * English-only user should be able to stop the app looking bilingual. All
 * three are real choices people make.
 *
 * The preference is device-local (AsyncStorage). It is not account data —
 * someone's phone language should not follow them onto a shared device.
 */

import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Bi } from '@dfc/core';

export type LangMode = 'en' | 'ta' | 'both';

const KEY = 'dfc.lang';

interface LanguageValue {
  mode: LangMode;
  setMode: (m: LangMode) => void;
  /** Ready once the stored preference has loaded. */
  ready: boolean;
  /** The primary line for a bilingual string. */
  primary: (b: Bi) => string;
  /** The secondary line, or null when this mode shows only one. */
  secondary: (b: Bi) => string | null;
  /** True while the layout should reserve room for a second line. */
  bilingual: boolean;
}

const Ctx = React.createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<LangMode>('both');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved === 'en' || saved === 'ta' || saved === 'both') setModeState(saved);
      } catch {
        /* first run, or storage unavailable — the default stands */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = React.useCallback((m: LangMode) => {
    setModeState(m);
    void AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const value = React.useMemo<LanguageValue>(
    () => ({
      mode,
      setMode,
      ready,
      bilingual: mode === 'both',
      primary: (b) => (mode === 'ta' ? b.ta : b.en),
      secondary: (b) => (mode === 'both' ? b.ta : null),
    }),
    [mode, setMode, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LanguageValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}
