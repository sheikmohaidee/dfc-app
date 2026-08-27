/**
 * The flat status scene.
 *
 * Same four phases, same colours, same reading — drawn with SVG and Reanimated
 * so it works with no GL context. The parcel still travels on "moving" and
 * still stops on "delivered", because that motion is the information, not the
 * decoration.
 */

import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { StatusPhase } from './status-3d';

const COLOR: Record<StatusPhase, { top: string; side: string; tape: string; glow: string }> = {
  confirmed: { top: '#52525B', side: '#3F3F46', tape: '#A1A1AA', glow: '#71717A' },
  packing: { top: '#2E4FA8', side: '#1E3A8A', tape: '#DBEAFE', glow: '#2563EB' },
  moving: { top: '#3F3F46', side: '#18181B', tape: '#FAFAFA', glow: '#2563EB' },
  delivered: { top: '#1D6B3F', side: '#14532D', tape: '#BBF7D0', glow: '#16A34A' },
};

export function StatusFallback({
  phase,
  height = 190,
}: {
  phase: StatusPhase;
  height?: number;
}) {
  const c = COLOR[phase];
  const t = useSharedValue(0);

  React.useEffect(() => {
    if (phase === 'delivered') {
      t.value = withTiming(0, { duration: 260 });
      return;
    }
    const duration = phase === 'moving' ? 3200 : phase === 'packing' ? 1400 : 2800;
    t.value = withRepeat(
      withTiming(1, { duration, easing: phase === 'moving' ? Easing.linear : Easing.inOut(Easing.sin) }),
      -1,
      phase !== 'moving',
    );
  }, [phase, t]);

  const parcel = useAnimatedStyle(() => {
    if (phase === 'delivered') return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    if (phase === 'moving') {
      return {
        transform: [
          { translateX: interpolate(t.value, [0, 1], [-62, 62]) },
          { translateY: -Math.sin(t.value * Math.PI) * 16 },
        ],
      };
    }
    return {
      transform: [{ translateX: 0 }, { translateY: interpolate(t.value, [0, 1], [-4, 4]) }],
    };
  });

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${t.value * 360}deg` }],
    opacity: phase === 'delivered' ? 0.6 : 0.35,
  }));

  const size = height * 0.9;

  return (
    <View style={{ height }} className="items-center justify-center" pointerEvents="none">
      {/* Pad + ring */}
      <View className="absolute" style={{ bottom: height * 0.16 }}>
        <Animated.View style={ring}>
          <Svg width={size * 0.78} height={size * 0.26} viewBox="0 0 140 46">
            <Defs>
              <RadialGradient id="pad" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={c.glow} stopOpacity="0.2" />
                <Stop offset="1" stopColor={c.glow} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="70" cy="23" r="22" fill="url(#pad)" />
            <Path
              d={
                phase === 'delivered'
                  ? 'M 70 5 A 18 18 0 1 1 69.9 5'
                  : 'M 70 5 A 18 18 0 1 1 52.5 27'
              }
              stroke={c.glow}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Parcel */}
      <Animated.View style={parcel}>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 120 120">
          <Defs>
            <LinearGradient id="ptop" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.top} />
              <Stop offset="1" stopColor={c.side} />
            </LinearGradient>
            <LinearGradient id="psheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <G>
            <Path d="M60 20 L96 41 L60 62 L24 41 Z" fill="url(#ptop)" />
            <Path d="M24 41 L60 62 L60 102 L24 81 Z" fill={c.side} />
            <Path d="M96 41 L60 62 L60 102 L96 81 Z" fill={c.side} opacity="0.88" />
            <Path d="M60 20 L70 26 L34 47 L24 41 Z" fill={c.tape} opacity="0.9" />
            <Path d="M44 52 L54 58 L54 98 L44 92 Z" fill={c.tape} opacity="0.5" />
            <Path d="M60 20 L96 41 L60 62 L24 41 Z" fill="url(#psheen)" />
            <Path
              d="M60 20 L96 41 L60 62 L24 41 Z"
              stroke={c.glow}
              strokeWidth="1"
              strokeOpacity="0.55"
              fill="none"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
