/**
 * Centralized DFC Brand Buttons — Stitch Design System
 * Primary: #7A1F3D (DFC Burgundy)
 * Deep: #5E1730
 * Soft: #FDF2F5
 * Border: #E5E7EB
 */

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_SPRING = { damping: 16, stiffness: 240, mass: 0.5 } as const;

export interface DFCButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  labelTa?: string;
  loading?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'rider';
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
}

// ---------------------------------------------------------------------------
// 1. DFC Primary Button (Burgundy #7A1F3D + White Text)
// ---------------------------------------------------------------------------

export function DFCPrimaryButton({
  label,
  labelTa,
  loading,
  left,
  right,
  size = 'md',
  className = '',
  style,
  textStyle,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: DFCButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const off = disabled || loading;

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
        !off && {
          backgroundColor: '#7A1F3D',
          shadowColor: '#5E1730',
          shadowOpacity: 0.28,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        off && { backgroundColor: '#D1D5DB' },
        style,
      ]}
      className={`overflow-hidden justify-center items-center ${heights[size]} ${className}`}
      {...rest}
    >
      {!off ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : null}

      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            {left}
            <View className="items-center">
              <Text
                style={[
                  {
                    fontSize: fontSizes[size],
                    fontWeight: size === 'rider' ? '700' : '600',
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  },
                  textStyle,
                ]}
              >
                {label}
              </Text>
              {labelTa ? (
                <Text
                  style={{
                    fontSize: fontSizes[size] * 0.76,
                    color: 'rgba(255,255,255,0.75)',
                    marginTop: 1,
                  }}
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
// 2. DFC Secondary Button (Soft #FDF2F5 Tint + #7A1F3D Text)
// ---------------------------------------------------------------------------

export function DFCSecondaryButton({
  label,
  labelTa,
  loading,
  left,
  right,
  size = 'md',
  className = '',
  style,
  textStyle,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: DFCButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const off = disabled || loading;

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

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPressIn={() => {
        scale.value = withSpring(0.96, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={[
        animated,
        {
          backgroundColor: off ? '#F3F4F6' : '#FDF2F5',
          borderColor: off ? '#E5E7EB' : '#FCE7F3',
          borderWidth: 1.5,
        },
        style,
      ]}
      className={`justify-center items-center ${heights[size]} ${className}`}
      {...rest}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color="#7A1F3D" />
        ) : (
          <>
            {left}
            <View className="items-center">
              <Text
                style={[
                  {
                    fontSize: fontSizes[size],
                    fontWeight: '600',
                    color: off ? '#9CA3AF' : '#7A1F3D',
                    letterSpacing: -0.2,
                  },
                  textStyle,
                ]}
              >
                {label}
              </Text>
              {labelTa ? (
                <Text
                  style={{
                    fontSize: fontSizes[size] * 0.76,
                    color: off ? '#9CA3AF' : '#9E2A50',
                    marginTop: 1,
                  }}
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
// 3. DFC Ghost Button (Transparent + Burgundy / Body Text)
// ---------------------------------------------------------------------------

export function DFCGhostButton({
  label,
  labelTa,
  loading,
  left,
  right,
  size = 'md',
  className = '',
  style,
  textStyle,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: DFCButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const off = disabled || loading;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={off}
      onPressIn={() => {
        scale.value = withSpring(0.96, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={[animated, style]}
      className={`justify-center items-center px-3 py-2 bg-transparent ${className}`}
      {...rest}
    >
      <View className="flex-row items-center justify-center gap-1.5">
        {loading ? (
          <ActivityIndicator size="small" color="#7A1F3D" />
        ) : (
          <>
            {left}
            <Text
              style={[
                {
                  fontSize: size === 'sm' ? 13 : 14.5,
                  fontWeight: '600',
                  color: off ? '#9CA3AF' : '#7A1F3D',
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {right}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// 4. DFC Icon Button (44px Minimum Touch Target)
// ---------------------------------------------------------------------------

export interface DFCIconButtonProps extends PressableProps {
  icon: React.ReactNode;
  size?: number; // visual box size, minimum touch size is always 44
  variant?: 'surface' | 'tint' | 'primary' | 'ghost';
  className?: string;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

export function DFCIconButton({
  icon,
  size = 40,
  variant = 'surface',
  className = '',
  style,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: DFCIconButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgStyles = {
    surface: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 },
    tint: { backgroundColor: '#FDF2F5', borderColor: '#FCE7F3', borderWidth: 1 },
    primary: { backgroundColor: '#7A1F3D', borderColor: '#5E1730', borderWidth: 1 },
    ghost: { backgroundColor: 'transparent' },
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={Math.max(0, (44 - size) / 2)}
      onPressIn={() => {
        scale.value = withSpring(0.92, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={[
        animated,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        bgStyles[variant],
        style,
      ]}
      className={className}
      {...rest}
    >
      {icon}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// 5. DFC Danger Button
// ---------------------------------------------------------------------------

export function DFCDangerButton({
  label,
  labelTa,
  loading,
  left,
  right,
  size = 'md',
  className = '',
  style,
  textStyle,
  disabled,
  haptic = true,
  onPress,
  ...rest
}: DFCButtonProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const off = disabled || loading;

  const heights = {
    sm: 'h-11 px-4 rounded-[10px]',
    md: 'h-12 px-5 rounded-[12px]',
    lg: 'h-[52px] px-6 rounded-[14px]',
    rider: 'h-[70px] px-6 rounded-[16px]',
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPressIn={() => {
        scale.value = withSpring(0.96, PRESS_SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={(e) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
      }}
      style={[
        animated,
        {
          backgroundColor: off ? '#FCA5A5' : '#DC2626',
          shadowColor: '#DC2626',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        },
        style,
      ]}
      className={`justify-center items-center ${heights[size]} ${className}`}
      {...rest}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            {left}
            <Text
              style={[
                {
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#FFFFFF',
                  letterSpacing: -0.2,
                },
                textStyle,
              ]}
            >
              {label}
            </Text>
            {right}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}
