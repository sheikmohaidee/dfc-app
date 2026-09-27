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
  TextInput,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Search, Mic, SlidersHorizontal } from 'lucide-react-native';

import { formatInr, tokens, type Category } from '@dfc/core';

export * from './buttons';
export * from './vendor-nav';

const TAMIL_SCALE = tokens.TAMIL_SCALE;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 16, stiffness: 240, mass: 0.5 } as const;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function T({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#E5E1E4' }, style]}
      className={`text-on-surface ${className}`}
      {...props}
    />
  );
}

/** Monospace, tabular — every figure in the product. */
export function Num({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#E5E1E4' }, style]}
      className={`font-mono text-on-surface ${className}`}
      {...props}
    />
  );
}

export function Ta({ className = '', style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      style={[{ color: '#928F9E' }, style]}
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
  tone = 'text-on-surface',
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
        style={{ fontSize: size, fontWeight: weight, letterSpacing: -size * 0.012, color: '#E5E1E4' }}
        className={tone}
      >
        {en}
      </Text>
      <Text
        style={{ fontSize: Math.round(size * TAMIL_SCALE * 10) / 10, marginTop: 1, color: '#928F9E' }}
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
      style={[{ backgroundColor: '#0E0E10' }, style]}
      className={`flex-1 bg-surface-container-lowest ${className}`}
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
      bg: '#6A5ACD',
      text: '#FFFFFF',
      border: 'transparent',
      shadow: '#4532A6',
    },
    secondary: {
      bg: '#2A2A2C',
      text: '#C8BFFF',
      border: '#353437',
      shadow: 'transparent',
    },
    outline: {
      bg: '#1C1B1D',
      text: '#E5E1E4',
      border: '#353437',
      shadow: 'transparent',
    },
    ghost: {
      bg: 'transparent',
      text: '#C8BFFF',
      border: 'transparent',
      shadow: 'transparent',
    },
    destructive: {
      bg: '#93000A',
      text: '#FFDAD6',
      border: 'transparent',
      shadow: '#690005',
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
          backgroundColor: off ? '#353437' : currentVariant.bg,
          borderColor: currentVariant.border,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1.5 : 0,
        },
        !off && variant === 'primary' && {
          shadowColor: currentVariant.shadow,
          shadowOpacity: 0.35,
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
          <ActivityIndicator size="small" color={variant === 'outline' || variant === 'secondary' ? '#C8BFFF' : '#FFFFFF'} />
        ) : (
          <>
            {left}
            <View className="items-center">
              <Text
                style={{
                  fontSize: fontSizes[size],
                  fontWeight: size === 'rider' ? '700' : '600',
                  color: off ? '#928F9E' : currentVariant.text,
                  letterSpacing: -0.2,
                }}
              >
                {label}
              </Text>
              {labelTa ? (
                <Text
                  style={{
                    fontSize: fontSizes[size] * 0.76,
                    color: off ? '#928F9E' : variant === 'primary' || variant === 'destructive' || variant === 'success' ? 'rgba(255,255,255,0.75)' : '#928F9E',
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
          backgroundColor: '#1C1B1D',
          borderColor: '#2A2A2C',
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
      className={`rounded-xl border border-border bg-surface-container-low ${className}`}
      {...props}
    />
  );
}

export function Divider({ className = '', style }: { className?: string; style?: ViewProps['style'] }) {
  return <View style={[{ height: 1, backgroundColor: '#353437' }, style]} className={`h-px bg-surface-container-highest ${className}`} />;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type Tone = Category | 'verify' | 'destructive' | 'neutral' | 'success';

const TONE: Record<Tone, { bg: string; border: string; text: string }> = {
  pharmacy: { bg: '#1E293B', border: '#334155', text: '#93C5FD' },
  grocery: { bg: '#064E3B', border: '#065F46', text: '#6EE7B7' },
  food: { bg: '#431407', border: '#7C2D12', text: '#FDBA74' },
  concierge: { bg: '#2D128F', border: '#6A5ACD', text: '#C8BFFF' },
  print: { bg: '#2E1065', border: '#581C87', text: '#D8B4FE' },
  pickup_drop: { bg: '#4C0519', border: '#881337', text: '#FDA4AF' },
  buy_deliver: { bg: '#164E63', border: '#155E75', text: '#67E8F9' },
  verify: { bg: '#451A03', border: '#78350F', text: '#FCD34D' },
  destructive: { bg: '#450A0A', border: '#7F1D1D', text: '#FFB4AB' },
  success: { bg: '#064E3B', border: '#065F46', text: '#6EE7B7' },
  neutral: { bg: '#2A2A2C', border: '#353437', text: '#C9C4D5' },
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
          color: unpriced ? '#FFB59C' : muted ? '#928F9E' : '#E5E1E4',
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
        backgroundColor: checked ? '#6A5ACD' : '#1C1B1D',
        borderColor: checked ? '#6A5ACD' : '#474553',
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
      style={{ borderColor: '#353437', borderWidth: 1, backgroundColor: '#1C1B1D', borderRadius: 8 }}
      className="h-[32px] flex-row items-center overflow-hidden"
    >
      <Pressable onPress={() => step(-1)} hitSlop={8} className="h-full w-8 items-center justify-center">
        <Text style={{ fontSize: 16, color: '#C9C4D5', fontWeight: '600' }}>−</Text>
      </Pressable>
      <View style={{ borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#353437' }} className="h-full w-8 items-center justify-center">
        <Num style={{ fontSize: 13, fontWeight: '700', color: '#E5E1E4' }}>{value}</Num>
      </View>
      <Pressable onPress={() => step(1)} hitSlop={8} className="h-full w-8 items-center justify-center">
        <Text style={{ fontSize: 16, color: '#C8BFFF', fontWeight: '700' }}>+</Text>
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
        backgroundColor: active ? '#6A5ACD' : '#1C1B1D',
        borderColor: active ? '#6A5ACD' : '#353437',
        borderWidth: 1.5,
      }}
      className="h-9 justify-center rounded-full px-3.5 shadow-2xs"
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: active ? '700' : '500',
          color: active ? '#FFFFFF' : '#C9C4D5',
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
      <T style={{ fontSize: 16, fontWeight: '700', color: '#E5E1E4' }}>{title}</T>
      {subtitle ? (
        <T style={{ color: '#928F9E', textAlign: 'center', fontSize: 13, lineHeight: 19 }}>{subtitle}</T>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#C8BFFF" size="large" />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View
      style={{ backgroundColor: '#450A0A', borderColor: '#7F1D1D', borderWidth: 1, borderRadius: 10 }}
      className="px-3.5 py-3"
    >
      <T style={{ fontSize: 12.5, color: '#FFB4AB', lineHeight: 18, fontWeight: '500' }}>{message}</T>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stitch New Primitives
// ---------------------------------------------------------------------------

export function FloatingCard({
  children,
  className = '',
  style,
  onPress,
  glow = false,
  ...props
}: ViewProps & { className?: string; onPress?: () => void; glow?: boolean }) {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      style={[
        {
          backgroundColor: '#1C1B1D',
          borderColor: glow ? 'rgba(200, 191, 255, 0.25)' : '#2A2A2C',
          borderWidth: 1,
          borderRadius: 20,
          shadowColor: glow ? '#6A5ACD' : '#000000',
          shadowOpacity: glow ? 0.35 : 0.2,
          shadowRadius: glow ? 12 : 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: glow ? 5 : 2,
        },
        style,
      ]}
      className={`rounded-2xl border bg-surface-container-low ${className}`}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
}

export function GlowBadge({
  label,
  icon,
  tone = 'primary',
}: {
  label: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'verify';
}) {
  const styles = {
    primary: { bg: 'rgba(106, 90, 205, 0.16)', border: 'rgba(200, 191, 255, 0.3)', text: '#C8BFFF' },
    secondary: { bg: 'rgba(142, 44, 1, 0.2)', border: 'rgba(255, 181, 156, 0.3)', text: '#FFB59C' },
    tertiary: { bg: 'rgba(0, 115, 156, 0.2)', border: 'rgba(123, 208, 255, 0.3)', text: '#7BD0FF' },
    success: { bg: 'rgba(10, 106, 50, 0.2)', border: 'rgba(167, 243, 208, 0.3)', text: '#6EE7B7' },
    verify: { bg: 'rgba(217, 119, 6, 0.2)', border: 'rgba(253, 230, 138, 0.3)', text: '#FCD34D' },
  };
  const s = styles[tone] || styles.primary;
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1,
        borderRadius: 9999,
      }}
      className="flex-row items-center gap-1 px-2.5 py-1"
    >
      {icon}
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.text, letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}

export function SpatialSearchBar({
  value,
  onChangeText,
  placeholder = 'Search dishes, groceries, errands...',
  onPressMic,
  onPressFilter,
  onPress,
  editable = true,
  autoFocus = false,
  className = '',
}: {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  onPressMic?: () => void;
  onPressFilter?: () => void;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={editable && !onPress}
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 9999,
        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
      }}
      className={`h-12 flex-row items-center px-4 ${className}`}
    >
      <Search size={18} color="#928F9E" />
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#928F9E"
          autoFocus={autoFocus}
          style={{
            flex: 1,
            marginLeft: 10,
            color: '#E5E1E4',
            fontSize: 14,
            fontWeight: '500',
          }}
        />
      ) : (
        <Text style={{ flex: 1, marginLeft: 10, color: '#928F9E', fontSize: 14, fontWeight: '500' }}>
          {placeholder}
        </Text>
      )}
      {onPressMic ? (
        <Pressable onPress={onPressMic} hitSlop={8} className="p-1">
          <Mic size={18} color="#C8BFFF" />
        </Pressable>
      ) : null}
      {onPressFilter ? (
        <Pressable onPress={onPressFilter} hitSlop={8} className="ml-1 p-1">
          <SlidersHorizontal size={18} color="#928F9E" />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

