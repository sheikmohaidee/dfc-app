/**
 * The building blocks every settings screen is made of — Stitch Dark Floating Theme.
 * Grouped rows on an elevated dark field with Plus Jakarta Sans typography.
 */

import * as React from 'react';
import { Pressable, ScrollView, Switch as RNSwitch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import type { Bi } from '@dfc/core';
import { useLang } from '@/providers/language';
import { Screen } from './index';

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
    <View
      style={{
        height: 60,
        backgroundColor: '#0E0E10',
        borderBottomWidth: 1,
        borderBottomColor: '#201F21',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            if (router.canGoBack()) router.back();
            else router.replace('/(customer)/account');
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#1C1B1D',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={19} color="#E5E1E4" strokeWidth={2.2} />
        </Pressable>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 17,
              fontWeight: '700',
              color: '#E5E1E4',
              letterSpacing: -0.2,
            }}
          >
            {title}
          </Text>
          {titleTa && bilingual ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '500',
                color: '#928F9E',
              }}
            >
              {titleTa}
            </Text>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function SettingsScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0E0E10' }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 48,
        gap: 20,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
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
    <View style={{ gap: 8 }}>
      {label ? (
        <Text
          style={{
            paddingHorizontal: 4,
            fontFamily: 'PlusJakartaSans',
            fontSize: 11,
            fontWeight: '700',
            color: '#C8BFFF',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#26262B',
          backgroundColor: '#18181B',
          overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={{ marginLeft: 52, height: 1, backgroundColor: '#26262B' }} /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text
          style={{
            paddingHorizontal: 4,
            fontFamily: 'PlusJakartaSans',
            fontSize: 11,
            color: '#928F9E',
            lineHeight: 16,
          }}
        >
          {footer}
        </Text>
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
      onPress={() => {
        if (onPress) {
          void Haptics.selectionAsync();
          onPress();
        }
      }}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {icon ? <View style={{ width: 24, alignItems: 'center' }}>{icon}</View> : null}

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 14,
            fontWeight: '600',
            color: danger ? '#F87171' : '#E5E1E4',
          }}
        >
          {primary(bi)}
        </Text>
        {sub ? (
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 11,
              color: '#928F9E',
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        ) : null}
        {hint ? (
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 11,
              color: '#928F9E',
              marginTop: 2,
              lineHeight: 16,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 13,
            color: '#C8BFFF',
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && chevron && !right ? (
        <ChevronRight size={16} color="#6E6B77" strokeWidth={2} />
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
          onValueChange={(v) => {
            void Haptics.selectionAsync();
            onChange(v);
          }}
          trackColor={{ false: '#26252E', true: '#6A5ACD' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#26252E"
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
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? '#6A5ACD' : '#35343A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? (
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#6A5ACD' }} />
          ) : null}
        </View>
      }
    />
  );
}

/** Wraps a whole settings screen: header + dark scrolling field. */
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
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <SettingsHeader title={title} titleTa={titleTa} />
      <SettingsScroll>{children}</SettingsScroll>
    </Screen>
  );
}
