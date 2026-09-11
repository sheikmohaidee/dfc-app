/**
 * The mobile UI kit — DFC Stitch Design System.
 *
 * Centralized theme colors:
 * Primary: #7A1F3D (DFC Burgundy)
 * Deep: #5E1730
 * Soft: #FDF2F5
 * Background: #F7F8F9
 * Surface: #FFFFFF
 * Border: #E5E7EB
 * Text: #111827
 */

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { formatInr, tokens, type Category } from '@dfc/core';

export * from './buttons';

const TAMIL_SCALE = tokens.TAMIL_SCALE;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 16, stiffness: 240, mass: 0.5 } as const;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function T({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#111827' }, style]}
      className={`text-foreground ${className}`}
      {...props}
    />
  );
}

/** Monospace, tabular — every figure in the product. */
export function Num({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#111827' }, style]}
      className={`font-mono text-foreground ${className}`}
      {...props}
    />
  );
}

export function Ta({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#9CA3AF' }, style]}
      className={`font-tamil text-placeholder ${className}`}
      {...props}
    />
  );
}

/** The bilingual pairing rule, as a component. */
export function BiText({
  en,
  ta,
  size = 14,
  weight = '600',
  className = '',
  tone = 'text-foreground',
  taTone = 'text-placeholder',
}: {
  en: string;
  ta: string;
  size?: number;
  weight?: '400' | '500' | '600' | '700';
  className?: string;
  tone?: string;
  taTone?: string;
}) {
  return (
    <View className={className}>
      <Text
        style={{ fontSize: size, fontWeight: weight, letterSpacing: -size * 0.012, color: '#111827' }}
        className={tone}
      >
        {en}
      </Text>
      <Text
        style={{ fontSize: Math.round(size * TAMIL_SCALE * 10) / 10, marginTop: 1, color: '#9CA3AF' }}
        className={`font-tamil ${taTone}`}
      >
        {ta}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function Screen({
  children,
  className = '',
  style,
  edges = ['top', 'bottom'],
}: {
  children: React.ReactNode;
  className?: string;
  style?: ViewProps['style'];
  edges?: Edge[];
}) {
  return (
    <SafeAreaView
      edges={edges}
      style={[{ backgroundColor: '#F7F8F9' }, style]}
      className={`flex-1 bg-background ${className}`}
    >
      {children}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'rider';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  labelTa?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  haptic?: boolean;
}

export function Button({
  label,
  labelTa,
  variant = 'primary',
  size = 'md',
  loading,
  left,
  right,
  className = '',
  style,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: ButtonProps) {
  const off = disabled || loading;
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const heights = {
    sm: 'h-11 px-4 rounded-[10px]',
    md: 'h-12 px-5 rounded-[12px]',
    lg: 'h-[52px] px-6 rounded-[14px]',
    rider: 'h-[70px] px-6 rounded-[16px]',
  };

  const fontSizes = {
    sm: 13.5,
    md: 15,
    lg: 16,
    rider: 18.5,
  };

  const variantStyles = {
    primary: {
      bg: '#7A1F3D',
      text: '#FFFFFF',
      border: 'transparent',
      shadow: '#5E1730',
    },
    secondary: {
      bg: '#FDF2F5',
      text: '#7A1F3D',
      border: '#FCE7F3',
      shadow: 'transparent',
    },
    outline: {
      bg: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB',
      shadow: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      text: '#7A1F3D',
      border: 'transparent',
      shadow: 'transparent',
    },
    destructive: {
      bg: '#DC2626',
      text: '#FFFFFF',
      border: 'transparent',
      shadow: '#DC2626',
    },
    success: {
      bg: '#0A6A32',
      text: '#FFFFFF',
      border: 'transparent',
      shadow: '#0A6A32',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPressIn={() => {
        scale.value = withSpring(size === 'rider' ? 0.975 : 0.96, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={(e) => {
        if (haptic) {
          void Haptics.impactAsync(
            size === 'rider'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light,
          );
        }
        onPress?.(e);
      }}
      style={[
        animated,
        {
          backgroundColor: off ? '#D1D5DB' : currentVariant.bg,
          borderColor: currentVariant.border,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1.5 : 0,
        },
        !off && variant === 'primary' && {
          shadowColor: currentVariant.shadow,
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        style as any,
      ]}
      className={`overflow-hidden justify-center items-center ${heights[size]} ${className}`}
      {...rest}
    >
      {variant === 'primary' && !off ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : null}

      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'outline' || variant === 'secondary' ? '#7A1F3D' : '#FFFFFF'} />
        ) : (
          <>
            {left}
            <View className="items-center">
              <Text
                style={{
                  fontSize: fontSizes[size],
                  fontWeight: size === 'rider' ? '700' : '600',
                  color: off ? '#9CA3AF' : currentVariant.text,
                  letterSpacing: -0.2,
                }}
              >
                {label}
              </Text>
              {labelTa ? (
                <Text
                  style={{
                    fontSize: fontSizes[size] * 0.76,
                    color: off ? '#9CA3AF' : variant === 'primary' || variant === 'destructive' || variant === 'success' ? 'rgba(255,255,255,0.75)' : '#9CA3AF',
                    marginTop: 1,
                  }}
                  className="font-tamil"
                >
                  {labelTa}
                </Text>
              ) : null}
            </View>
            {right}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ className = '', style, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
          borderWidth: 1,
          borderRadius: 14,
          shadowColor: '#000000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
        style,
      ]}
      className={`rounded-card border border-border bg-surface ${className}`}
      {...props}
    />
  );
}

export function Divider({ className = '', style }: { className?: string; style?: ViewProps['style'] }) {
  return <View style={[{ height: 1, backgroundColor: '#E5E7EB' }, style]} className={`h-px bg-border ${className}`} />;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type Tone = Category | 'verify' | 'destructive' | 'neutral' | 'success';

const TONE: Record<Tone, { bg: string; border: string; text: string }> = {
  pharmacy: { bg: '#EFF6FF', border: '#DBEAFE', text: '#1D4ED8' },
  grocery: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  food: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  concierge: { bg: '#FDF2F5', border: '#FCE7F3', text: '#7A1F3D' },
  print: { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
  pickup_drop: { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' },
  buy_deliver: { bg: '#ECFEFF', border: '#A5F3FC', text: '#0E7490' },
  verify: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
  destructive: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
  success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  neutral: { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONE[tone] || TONE.neutral;
  return (
    <View
      style={{ backgroundColor: t.bg, borderColor: t.border, borderWidth: 1, borderRadius: 6 }}
      className="px-2 py-0.5"
    >
      <Text
        style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.3, color: t.text }}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export function Money({
  paise,
  size = 14,
  className = '',
  muted,
  style,
}: {
  paise: number | null;
  size?: number;
  className?: string;
  muted?: boolean;
  style?: TextProps['style'];
}) {
  const unpriced = paise === null || paise === 0;
  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: '600',
          letterSpacing: -size * 0.02,
          color: unpriced ? '#D97706' : muted ? '#9CA3AF' : '#111827',
        },
        style,
      ]}
      className={`font-mono ${className}`}
    >
      {unpriced ? '₹ —' : formatInr(paise)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export function Checkbox({
  checked,
  onToggle,
  size = 20,
}: {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        void Haptics.selectionAsync();
        onToggle();
      }}
      hitSlop={12}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        backgroundColor: checked ? '#7A1F3D' : '#FFFFFF',
        borderColor: checked ? '#7A1F3D' : '#D1D5DB',
        borderWidth: 1.5,
      }}
      className="items-center justify-center"
    >
      {checked ? (
        <Text style={{ fontSize: size * 0.65, lineHeight: size * 0.8, color: '#FFFFFF', fontWeight: 'bold' }}>
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const step = (d: number) => {
    const next = Math.max(min, Math.min(max, value + d));
    if (next === value) return;
    void Haptics.selectionAsync();
    onChange(next);
  };
  return (
    <View
      style={{ borderColor: '#E5E7EB', borderWidth: 1, backgroundColor: '#FFFFFF', borderRadius: 8 }}
      className="h-[32px] flex-row items-center overflow-hidden"
    >
      <Pressable onPress={() => step(-1)} hitSlop={8} className="h-full w-8 items-center justify-center">
        <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600' }}>−</Text>
      </Pressable>
      <View style={{ borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' }} className="h-full w-8 items-center justify-center">
        <Num style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{value}</Num>
      </View>
      <Pressable onPress={() => step(1)} hitSlop={8} className="h-full w-8 items-center justify-center">
        <Text style={{ fontSize: 16, color: '#7A1F3D', fontWeight: '700' }}>+</Text>
      </Pressable>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? '#7A1F3D' : '#FFFFFF',
        borderColor: active ? '#7A1F3D' : '#E5E7EB',
        borderWidth: 1.5,
      }}
      className="h-9 justify-center rounded-full px-3.5 shadow-2xs"
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: active ? '700' : '500',
          color: active ? '#FFFFFF' : '#374151',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-1.5 px-8">
      <T style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{title}</T>
      {subtitle ? (
        <T style={{ color: '#6B7280', textAlign: 'center', fontSize: 13, lineHeight: 19 }}>{subtitle}</T>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#7A1F3D" size="large" />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View
      style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 10 }}
      className="px-3.5 py-3"
    >
      <T style={{ fontSize: 12.5, color: '#DC2626', lineHeight: 18, fontWeight: '500' }}>{message}</T>
    </View>
  );
}
