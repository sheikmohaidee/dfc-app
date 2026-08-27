/**
 * Language.
 *
 * Three real choices. "Both" is the default the design was drawn for, but a
 * Tamil-first customer should be able to promote Tamil to the primary line,
 * and an English-only user should be able to stop the app looking bilingual.
 * The preview updates live so the choice is obvious before it is made.
 */

import * as React from 'react';
import { View } from 'react-native';

import { COPY } from '@dfc/core';

import { useLang, type LangMode } from '@/providers/language';
import { Card, T, Ta } from '@/ui';
import { ChoiceRow, Group, SettingsScreen } from '@/ui/settings';

const OPTIONS: { mode: LangMode; label: string; native: string; hint: string }[] = [
  { mode: 'both', label: 'English + Tamil', native: 'ஆங்கிலம் + தமிழ்', hint: 'Tamil shown under English' },
  { mode: 'en', label: 'English', native: 'English only', hint: 'No second line' },
  { mode: 'ta', label: 'Tamil', native: 'தமிழ் மட்டும்', hint: 'Tamil as the main line' },
];

export default function LanguageSettings() {
  const { mode, setMode } = useLang();

  return (
    <SettingsScreen title={COPY.language.en} titleTa={COPY.language.ta}>
      <Group
        label="Display language"
        footer="Applies to labels and buttons across the app. Item names come from the store and stay as the store writes them."
      >
        {OPTIONS.map((o) => (
          <ChoiceRow
            key={o.mode}
            label={{ en: o.label, ta: o.native }}
            hint={o.hint}
            selected={mode === o.mode}
            onPress={() => setMode(o.mode)}
          />
        ))}
      </Group>

      {/* Live preview of the choice, using a real button from the app. */}
      <View className="gap-2">
        <T className="px-1 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">PREVIEW</T>
        <Card className="p-4">
          <View className="h-[52px] items-center justify-center rounded-control bg-primary">
            <T className="text-[15.5px] font-semibold text-primary-foreground">
              {mode === 'ta' ? COPY.confirmAndPay.ta : `${COPY.confirmAndPay.en} ₹243`}
            </T>
            {mode === 'both' ? (
              <Ta className="text-[11px] text-white/60">{COPY.confirmAndPay.ta}</Ta>
            ) : null}
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <View>
              <T className="text-[13px] font-semibold">
                {mode === 'ta' ? COPY.total.ta : COPY.total.en}
              </T>
              {mode === 'both' ? <Ta className="text-[10px]">{COPY.total.ta}</Ta> : null}
            </View>
            <T className="font-mono text-[17px] font-semibold tracking-tight">₹243</T>
          </View>
        </Card>
      </View>
    </SettingsScreen>
  );
}
