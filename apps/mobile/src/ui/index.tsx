/**
 * The mobile UI kit — the shadcn vocabulary, translated to React Native.
 *
 * Same tokens as the web app, same anatomy, same names. Everything here obeys
 * two rules from the Foundations sheet: 44px minimum touch targets, and Tamil
 * sits under English at 0.78x in placeholder grey.
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

const TAMIL_SCALE = tokens.TAMIL_SCALE;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** One spring for every press in the app, so it all moves with one hand. */
const PRESS_SPRING = { damping: 15, stiffness: 240, mass: 0.5 } as const;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function T({ className = '', ...props }: TextProps & { className?: string }) {
  return <Text className={`text-foreground ${className}`} {...props} />;
}

/** Monospace, tabular — every figure in the product. */
export function Num({ className = '', ...props }: TextProps & { className?: string }) {
  return <Text className={`font-mono text-foreground ${className}`} {...props} />;
}

export function Ta({ className = '', ...props }: TextProps & { className?: string }) {
  return <Text className={`font-tamil text-placeholder ${className}`} {...props} />;
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
        style={{ fontSize: size, fontWeight: weight, letterSpacing: -size * 0.012 }}
        className={tone}
      >
        {en}
      </Text>
      <Text
        style={{ fontSize: Math.round(size * TAMIL_SCALE * 10) / 10, marginTop: 1 }}
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
  edges = ['top', 'bottom'],
}: {
  children: React.ReactNode;
  className?: string;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-background ${className}`}>
      {children}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'rider';

const VARIANT: Record<Variant, { box: string; label: string }> = {
  primary: { box: 'bg-primary', label: 'text-primary-foreground' },
  secondary: { box: 'bg-muted', label: 'text-foreground' },
  outline: { box: 'bg-background border border-border', label: 'text-body-strong' },
  ghost: { box: 'bg-transparent', label: 'text-body-strong' },
  destructive: { box: 'bg-destructive', label: 'text-white' },
  success: { box: 'bg-grocery', label: 'text-white' },
};

const SIZE: Record<Size, { box: string; text: number }> = {
  sm: { box: 'h-11 px-4 rounded-control', text: 13.5 },
  md: { box: 'h-12 px-5 rounded-control', text: 14.5 },
  lg: { box: 'h-[52px] px-5 rounded-control', text: 15.5 },
  // 70px, because it is pressed with a thumb, in sun, on a parked bike.
  rider: { box: 'h-[70px] px-6 rounded-[13px]', text: 19 },
};

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  labelTa?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** Fires a haptic tick on press. On by default for primary actions. */
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
  disabled,
  haptic = true,
  onPress,
  ...rest
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const off = disabled || loading;

  // Spring physics rather than an opacity flash. This is the single change
  // that separates a button that feels native from one that feels like a web
  // page, and it lives here so every screen gets it for free.
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const glossy = variant === 'primary' || variant === 'destructive' || variant === 'success';

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
          // A heavier tick for the rider's 70px buttons — they are pressed
          // through a glove, at arm's length, next to a running engine.
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
        glossy && !off
          ? {
              shadowColor: '#09090B',
              shadowOpacity: 0.22,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            }
          : null,
      ]}
      className={`overflow-hidden ${s.box} ${off ? 'bg-disabled' : v.box} ${className}`}
      {...rest}
    >
      {/* A sheen along the top edge — the whole of "glossy" in one gradient. */}
      {glossy && !off ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.25, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : null}

      <View className="h-full flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'outline' ? '#3F3F46' : '#FAFAFA'} />
        ) : (
          <>
            {left}
            <View className="items-center">
              <Text
                style={{ fontSize: s.text, fontWeight: size === 'rider' ? '700' : '600' }}
                className={off ? 'text-white' : v.label}
              >
                {label}
              </Text>
              {labelTa ? (
                <Text
                  style={{ fontSize: Math.round(s.text * TAMIL_SCALE * 0.85) }}
                  className={`font-tamil ${
                    variant === 'primary' || variant === 'destructive' || variant === 'success'
                      ? 'text-white/60'
                      : 'text-placeholder'
                  }`}
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

export function Card({ className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-card border border-border bg-background ${className}`}
      style={{
        shadowColor: '#09090B',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
      {...props}
    />
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <View className={`h-px bg-border ${className}`} />;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type Tone = Category | 'verify' | 'destructive' | 'neutral';

const TONE: Record<Tone, string> = {
  pharmacy: 'bg-pharmacy-tint border-pharmacy-border',
  grocery: 'bg-grocery-tint border-grocery-border',
  food: 'bg-food-tint border-food-border',
  concierge: 'bg-concierge-tint border-concierge-border',
  verify: 'bg-verify-tint border-verify-border',
  destructive: 'bg-destructive-tint border-destructive-border',
  neutral: 'bg-muted border-border',
};

const TONE_TEXT: Record<Tone, string> = {
  pharmacy: 'text-pharmacy-fg',
  grocery: 'text-grocery-fg',
  food: 'text-food-fg',
  concierge: 'text-concierge-fg',
  verify: 'text-verify-fg',
  destructive: 'text-destructive-fg',
  neutral: 'text-muted-foreground',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={`rounded-chip border px-1.5 py-0.5 ${TONE[tone]}`}>
      <Text
        style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 0.4 }}
        className={TONE_TEXT[tone]}
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
}: {
  paise: number | null;
  size?: number;
  className?: string;
  muted?: boolean;
}) {
  const unpriced = paise === null || paise === 0;
  return (
    <Text
      style={{ fontSize: size, fontWeight: '600', letterSpacing: -size * 0.022 }}
      className={`font-mono ${
        unpriced ? 'text-verify' : muted ? 'text-placeholder' : 'text-foreground'
      } ${className}`}
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
      // Padded to a 44px target without a 44px box.
      hitSlop={12}
      style={{ width: size, height: size, borderRadius: 5 }}
      className={`items-center justify-center border ${
        checked ? 'border-primary bg-primary' : 'border-[1.5px] border-disabled bg-background'
      }`}
    >
      {checked ? (
        <Text style={{ fontSize: size * 0.6, lineHeight: size * 0.75 }} className="text-white">
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
    <View className="h-[30px] flex-row items-center overflow-hidden rounded-segment border border-border bg-background">
      <Pressable onPress={() => step(-1)} hitSlop={8} className="h-full w-7 items-center justify-center">
        <Text className="text-[15px] leading-[16px] text-muted-foreground">−</Text>
      </Pressable>
      <View className="h-full w-[26px] items-center justify-center border-x border-border">
        <Num style={{ fontSize: 12, fontWeight: '500' }}>{value}</Num>
      </View>
      <Pressable onPress={() => step(1)} hitSlop={8} className="h-full w-7 items-center justify-center">
        <Text className="text-[15px] leading-[16px] text-muted-foreground">+</Text>
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
      className={`h-9 justify-center rounded-full border px-3 ${
        active ? 'border-primary bg-primary' : 'border-border bg-background'
      }`}
    >
      <Text
        style={{ fontSize: 11.5, fontWeight: '500' }}
        className={active ? 'text-primary-foreground' : 'text-body-strong'}
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
      <T className="text-[15px] font-semibold tracking-tight">{title}</T>
      {subtitle ? (
        <T className="text-center text-[13px] leading-5 text-muted-foreground">{subtitle}</T>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#18181B" />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View className="rounded-control border border-destructive-border bg-destructive-tint px-3 py-2.5">
      <T className="text-[12.5px] leading-[18px] text-destructive-fg">{message}</T>
    </View>
  );
}
