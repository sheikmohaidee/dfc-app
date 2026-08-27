/**
 * The building blocks every settings screen is made of.
 *
 * Grouped rows on a grey field — the pattern people already know from every
 * app on their phone. Novelty here would cost comprehension and buy nothing.
 */

import * as React from 'react';
import { Pressable, ScrollView, Switch as RNSwitch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

import type { Bi } from '@dfc/core';
import { useLang } from '@/providers/language';
import { Screen, T, Ta } from './index';

// ---------------------------------------------------------------------------

export function SettingsHeader({
  title,
  titleTa,
  right,
}: {
  title: string;
  titleTa?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const { bilingual } = useLang();

  return (
    <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="-ml-2 size-9 items-center justify-center"
      >
        <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
      </Pressable>
      <View className="flex-1">
        <T className="text-[17px] font-semibold tracking-[-0.3px]">{title}</T>
        {titleTa && bilingual ? <Ta className="mt-0.5 text-[11.5px]">{titleTa}</Ta> : null}
      </View>
      {right}
    </View>
  );
}

export function SettingsScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="gap-6 px-4 py-5 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Group({
  label,
  children,
  footer,
}: {
  label?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View className="gap-2">
      {label ? (
        <T className="px-1 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
          {label.toUpperCase()}
        </T>
      ) : null}
      <View className="overflow-hidden rounded-card border border-border bg-background">
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View className="ml-[52px] h-px bg-muted" /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <T className="px-1 text-[11.5px] leading-[17px] text-placeholder">{footer}</T>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface RowProps {
  icon?: React.ReactNode;
  label: Bi | string;
  /** Right-hand text, e.g. the current value. */
  value?: string;
  hint?: string;
  onPress?: () => void;
  /** Renders in destructive red. */
  danger?: boolean;
  right?: React.ReactNode;
  chevron?: boolean;
}

const asBi = (l: Bi | string): Bi => (typeof l === 'string' ? { en: l, ta: '' } : l);

export function Row({
  icon,
  label,
  value,
  hint,
  onPress,
  danger,
  right,
  chevron = true,
}: RowProps) {
  const { primary, secondary } = useLang();
  const bi = asBi(label);
  const sub = bi.ta ? secondary(bi) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      // 56px keeps every row above the 44px floor with room for a hint line.
      className="min-h-[56px] flex-row items-center gap-3 px-4 py-3 active:bg-muted"
    >
      {icon ? <View className="w-6 items-center">{icon}</View> : null}

      <View className="flex-1">
        <T
          className={`text-[15px] ${danger ? 'font-medium text-destructive' : 'text-foreground'}`}
        >
          {primary(bi)}
        </T>
        {sub ? <Ta className="mt-0.5 text-[11.5px]">{sub}</Ta> : null}
        {hint ? (
          <T className="mt-1 text-[12px] leading-[17px] text-muted-foreground">{hint}</T>
        ) : null}
      </View>

      {value ? <T className="text-[13.5px] text-muted-foreground">{value}</T> : null}
      {right}
      {onPress && chevron && !right ? (
        <ChevronRight size={17} color="#A1A1AA" strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

export function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon?: React.ReactNode;
  label: Bi | string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row
      icon={icon}
      label={label}
      hint={hint}
      chevron={false}
      right={
        <RNSwitch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#E4E4E7', true: '#16A34A' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E4E4E7"
        />
      }
    />
  );
}

/** A radio row — used by the language picker. */
export function ChoiceRow({
  label,
  hint,
  selected,
  onPress,
}: {
  label: Bi | string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Row
      label={label}
      hint={hint}
      onPress={onPress}
      chevron={false}
      right={
        <View
          className={`size-[22px] items-center justify-center rounded-full border-2 ${
            selected ? 'border-primary' : 'border-disabled'
          }`}
        >
          {selected ? <View className="size-[11px] rounded-full bg-primary" /> : null}
        </View>
      }
    />
  );
}

/** Wraps a whole settings screen: header + grey scrolling field. */
export function SettingsScreen({
  title,
  titleTa,
  children,
}: {
  title: string;
  titleTa?: string;
  children: React.ReactNode;
}) {
  return (
    <Screen>
      <SettingsHeader title={title} titleTa={titleTa} />
      <SettingsScroll>{children}</SettingsScroll>
    </Screen>
  );
}
