/**
 * The flat stand-in for the 3D hero.
 *
 * Same silhouette, same lighting direction, drawn in SVG with gradients. It
 * runs in Expo Go and on any device where the GL context fails, and it is good
 * enough that nobody would call it a fallback if they had not seen the other
 * one. That is the bar: degrade to *different*, never to *broken*.
 */

import * as React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { HeroTone } from './hero-3d';

const TONE: Record<HeroTone, { top: string; left: string; right: string; tape: string; glow: string }> = {
  brand: { top: '#3F3F46', left: '#18181B', right: '#27272A', tape: '#FAFAFA', glow: '#2563EB' },
  pharmacy: { top: '#2E4FA8', left: '#1E3A8A', right: '#24429A', tape: '#DBEAFE', glow: '#2563EB' },
  grocery: { top: '#1D6B3F', left: '#14532D', right: '#186036', tape: '#BBF7D0', glow: '#16A34A' },
};

export function GlossyParcelFallback({
  tone = 'brand',
  height = 220,
}: {
  tone?: HeroTone;
  height?: number;
}) {
  const c = TONE[tone];
  const y = useSharedValue(0);

  React.useEffect(() => {
    // The same slow bob as the 3D scene, so the two read as one design.
    y.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [y]);

  const float = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 + y.value * 12 }],
  }));

  return (
    <View style={{ height }} className="items-center justify-center" pointerEvents="none">
      <Animated.View style={float}>
        <Svg width={height * 0.92} height={height * 0.92} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="top" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.top} />
              <Stop offset="1" stopColor={c.left} />
            </LinearGradient>
            <LinearGradient id="left" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.left} />
              <Stop offset="1" stopColor={c.left} stopOpacity="0.82" />
            </LinearGradient>
            <LinearGradient id="right" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.right} />
              <Stop offset="1" stopColor={c.left} />
            </LinearGradient>
            <RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={c.glow} stopOpacity="0.34" />
              <Stop offset="1" stopColor={c.glow} stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
              <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Rim glow behind the box */}
          <Rect x="10" y="10" width="180" height="180" fill="url(#glow)" />

          {/* Contact shadow */}
          <Ellipse cx="100" cy="171" rx="46" ry="9" fill={c.left} opacity="0.16" />

          {/* Isometric box */}
          <G>
            <Path d="M100 34 L156 66 L100 98 L44 66 Z" fill="url(#top)" />
            <Path d="M44 66 L100 98 L100 162 L44 130 Z" fill="url(#left)" />
            <Path d="M156 66 L100 98 L100 162 L156 130 Z" fill="url(#right)" />

            {/* Tape */}
            <Path d="M100 34 L116 43 L60 75 L44 66 Z" fill={c.tape} opacity="0.9" />
            <Path d="M72 82 L88 91 L88 155 L72 146 Z" fill={c.tape} opacity="0.55" />
            <Path d="M128 82 L112 91 L112 155 L128 146 Z" fill={c.tape} opacity="0.4" />

            {/* Specular sheen across the top face */}
            <Path d="M100 34 L156 66 L100 98 L44 66 Z" fill="url(#sheen)" />

            {/* Edge light */}
            <Path
              d="M100 34 L156 66 L100 98 L44 66 Z"
              stroke={c.glow}
              strokeWidth="1.1"
              strokeOpacity="0.5"
              fill="none"
            />
            <Path
              d="M100 98 L100 162"
              stroke={c.glow}
              strokeWidth="1.1"
              strokeOpacity="0.32"
              fill="none"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
