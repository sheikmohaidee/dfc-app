/**
 * DFC Stitch Animation Primitives
 *
 * Subtle, fast, premium micro-interactions.
 * All animations use the same spring personality for visual cohesion.
 *
 * ─── Rules ───
 * 1. Every animation < 300ms perceived duration
 * 2. Spring physics, never linear easing
 * 3. Haptic feedback on meaningful state changes
 * 4. No layout thrashing — only transform + opacity
 */

import * as React from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  interpolate,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Shared Spring Config ─────────────────────────────────────────────────────
export const SPRING_PRESS = { damping: 16, stiffness: 260, mass: 0.45 } as const;
export const SPRING_BOUNCE = { damping: 12, stiffness: 200, mass: 0.6 } as const;
export const SPRING_GENTLE = { damping: 18, stiffness: 180, mass: 0.55 } as const;

// ── Reanimated Layout Animations ─────────────────────────────────────────────
export const ENTER_FADE = FadeIn.duration(220);
export const ENTER_UP = FadeInUp.duration(260).springify().damping(18);
export const ENTER_DOWN = FadeInDown.duration(260).springify().damping(18);
export const EXIT_FADE = FadeOut.duration(160);
export const ENTER_SHEET = SlideInDown.duration(300).springify().damping(20);

/** Staggered FadeInDown for list items. */
export function staggeredEntry(index: number, baseDelay = 40) {
  return FadeInDown.delay(index * baseDelay)
    .duration(240)
    .springify()
    .damping(18)
    .stiffness(180);
}

// ── AnimatedPressable ────────────────────────────────────────────────────────

export interface DFCPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Scale target on press. Default 0.97 for cards, use 0.94 for small buttons. */
  scaleTo?: number;
  /** Haptic feedback on press. */
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

/**
 * Premium press interaction — spring scale + optional haptic.
 * Wrap any card or button for instant premium feel.
 */
export function DFCPressable({
  children,
  className,
  style,
  scaleTo = 0.97,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: DFCPressableProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animated, style]}
      className={className}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING_PRESS);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING_PRESS);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(hapticStyle);
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

// ── AnimatedScreen ───────────────────────────────────────────────────────────

/**
 * Screen entrance: fade in + subtle upward translate.
 * Wrap the scrollable content of any screen.
 */
export function AnimatedScreen({
  children,
  className = '',
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(320).springify().damping(20)}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

// ── CartBounce ───────────────────────────────────────────────────────────────

/**
 * Bounce animation for add-to-cart / quantity change.
 * Returns { style, bounce } — call bounce() on add/remove.
 */
export function useCartBounce() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bounce = React.useCallback(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300, mass: 0.4 }),
      withSpring(1, SPRING_BOUNCE),
    );
  }, [scale]);

  return { style, bounce };
}

// ── AnimatedCounter ──────────────────────────────────────────────────────────

/**
 * Smooth number transition for quantity displays.
 * Returns animated style that rolls the number up/down.
 */
export function useCounterSlide(value: number) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 60 }),
      withTiming(1, { duration: 100 }),
    );
    translateY.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 0 }),
      withSpring(0, SPRING_PRESS),
    );
  }, [value, translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return style;
}

// ── SuccessPulse ─────────────────────────────────────────────────────────────

/**
 * Green check pulse for order success / item confirmed.
 */
export function SuccessPulse({
  size = 48,
  color = '#6EE7B7',
}: {
  size?: number;
  color?: string;
}) {
  const scale = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200, mass: 0.5 });
    ringScale.value = withDelay(
      100,
      withTiming(2, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    ringOpacity.value = withDelay(
      100,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
  }, [scale, ringScale, ringOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          ringStyle,
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          iconStyle,
          {
            width: size * 0.65,
            height: size * 0.65,
            borderRadius: (size * 0.65) / 2,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <View
          style={{
            width: size * 0.22,
            height: size * 0.12,
            borderLeftWidth: 2.5,
            borderBottomWidth: 2.5,
            borderColor: '#0E0E10',
            transform: [{ rotate: '-45deg' }, { translateY: -1 }],
          }}
        />
      </Animated.View>
    </View>
  );
}

// ── ShimmerBlock ──────────────────────────────────────────────────────────────

/**
 * Skeleton loading placeholder with shimmer sweep.
 * Use for cards, images, text lines.
 */
export function ShimmerBlock({
  width,
  height,
  borderRadius = 10,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const x = useSharedValue(0);

  React.useEffect(() => {
    x.value = withDelay(
      Math.random() * 300,
      withTiming(1, { duration: 0 }),
    );
    // Restart the animation loop
    const startLoop = () => {
      x.value = 0;
      x.value = withTiming(1, { duration: 1200, easing: Easing.linear });
    };
    startLoop();
    const interval = setInterval(startLoop, 1300);
    return () => clearInterval(interval);
  }, [x]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [0, 1], [-200, 200]) }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#2A2A2C',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[sweep, { width: 120, height: '100%' }]}>
        <LinearGradient
          colors={['transparent', 'rgba(200, 191, 255, 0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ── Card Skeleton ────────────────────────────────────────────────────────────

/** Full card loading skeleton with image + text lines. */
export function CardSkeleton({ hasImage = true }: { hasImage?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {hasImage ? <ShimmerBlock width="100%" height={140} borderRadius={0} /> : null}
      <View style={{ padding: 14, gap: 8 }}>
        <ShimmerBlock width="70%" height={14} />
        <ShimmerBlock width="40%" height={10} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <ShimmerBlock width={60} height={10} />
          <ShimmerBlock width={60} height={10} />
        </View>
      </View>
    </View>
  );
}

/** Row skeleton for list items. */
export function ListItemSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}
    >
      <ShimmerBlock width={44} height={44} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBlock width="60%" height={13} />
        <ShimmerBlock width="35%" height={10} />
      </View>
      <ShimmerBlock width={50} height={24} borderRadius={8} />
    </View>
  );
}
