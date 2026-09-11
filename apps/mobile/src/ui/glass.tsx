/**
 * The glossy layer.
 *
 * Depth, glass and spring physics — used on the surfaces where there is no
 * dense data to get in the way: onboarding, sign-in, the cash-collection
 * screen, empty states. Deliberately NOT used on the Kanban board, the packing
 * checklist or the item tables, where a shopkeeper counting strips of tablets
 * needs contrast and hairlines, not depth.
 *
 * Gloss where it earns attention, flat where it earns comprehension.
 */

import * as React from 'react';
import {
  Platform,
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** One spring, used everywhere, so the whole app moves with one personality. */
const SPRING = { damping: 15, stiffness: 220, mass: 0.55 } as const;

// ---------------------------------------------------------------------------
// Press physics
// ---------------------------------------------------------------------------

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** How far it sinks. 0.97 for cards, 0.94 for small controls. */
  to?: number;
  haptic?: boolean;
}

/**
 * A press that responds. The difference between a button that feels expensive
 * and one that feels like a web page is about 90ms of spring.
 */
export function PressableScale({
  children,
  className,
  style,
  to = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[animated, style]}
      className={className}
      onPressIn={(e) => {
        scale.value = withSpring(to, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/**
 * Frosted glass. Android's blur is cheaper and weaker than iOS's, so it gets a
 * slightly more opaque tint to land in the same place visually.
 */
export function GlassCard({
  children,
  className = '',
  intensity = 40,
  tint = 'light',
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}) {
  return (
    <View
      className={`overflow-hidden rounded-generative border border-white/60 ${className}`}
      style={{
        shadowColor: '#09090B',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <BlurView
        intensity={Platform.OS === 'android' ? intensity + 25 : intensity}
        tint={tint}
        style={{ flex: 1 }}
      >
        <View className={tint === 'dark' ? 'bg-black/20' : 'bg-white/55'}>{children}</View>
      </BlurView>
    </View>
  );
}

/**
 * The atmospheric background. Two soft colour pools behind a near-white field
 * — depth without a gradient that screams "AI template".
 */
export function AuroraField({
  children,
  tone = 'brand',
}: {
  children?: React.ReactNode;
  tone?: 'brand' | 'pharmacy' | 'grocery';
}) {
  const pools = {
    brand: ['rgba(37,99,235,0.16)', 'rgba(124,58,237,0.12)'],
    pharmacy: ['rgba(37,99,235,0.20)', 'rgba(59,130,246,0.10)'],
    grocery: ['rgba(22,163,74,0.18)', 'rgba(132,204,22,0.10)'],
  }[tone];

  const drift = useSharedValue(0);
  React.useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);

  const a = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-24, 20]) },
      { translateY: interpolate(drift.value, [0, 1], [-14, 18]) },
    ],
  }));
  const b = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [26, -18]) },
      { translateY: interpolate(drift.value, [0, 1], [16, -20]) },
    ],
  }));

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <Animated.View style={a} className="absolute -left-24 -top-16 size-[340px] rounded-full">
          <LinearGradient
            colors={[pools[0]!, 'transparent']}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </Animated.View>
        <Animated.View style={b} className="absolute -right-28 top-40 size-[300px] rounded-full">
          <LinearGradient
            colors={[pools[1]!, 'transparent']}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </Animated.View>
      </View>
      {children}
    </View>
  );
}

/**
 * A near-black button with a light sheen along the top edge — the one place
 * gloss goes on a primary action.
 */
export function GlossSurface({
  children,
  className = '',
  ...rest
}: ViewProps & { className?: string }) {
  return (
    <View className={`overflow-hidden ${className}`} {...rest}>
      <LinearGradient
        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Shimmer, not a spinner. A skeleton that matches the shape of what is coming
 * makes a 900ms wait feel like 400 — a spinner makes it feel like 1500.
 */
export function Shimmer({ className = '' }: { className?: string }) {
  const x = useSharedValue(0);

  React.useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1250, easing: Easing.linear }), -1, false);
  }, [x]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [0, 1], [-220, 220]) }],
  }));

  return (
    <View className={`overflow-hidden rounded-control bg-muted ${className}`}>
      <Animated.View style={[sweep, { width: 140, height: '100%' }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.85)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

/** Shakes its children once. Used on a wrong OTP — cheaper than an error line. */
export function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const shake = React.useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    x.value = withSequence(
      withTiming(-9, { duration: 55 }),
      withTiming(9, { duration: 55 }),
      withTiming(-6, { duration: 45 }),
      withTiming(6, { duration: 45 }),
      withSpring(0, SPRING),
    );
  }, [x]);

  return { style, shake };
}

/** A dot that breathes — for "listening" and "on the way" states. */
export function PulseDot({ color = '#DC2626', size = 8 }: { color?: string; size?: number }) {
  const s = useSharedValue(1);

  React.useEffect(() => {
    s.value = withRepeat(
      withTiming(1.7, { duration: 1100, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [s]);

  const halo = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: interpolate(s.value, [1, 1.7], [0.45, 0]),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Animated.View
        style={[halo, { width: size, height: size, borderRadius: size, backgroundColor: color }]}
        className="absolute"
      />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

export { SPRING };
