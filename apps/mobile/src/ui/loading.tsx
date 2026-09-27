/**
 * DFC Stitch Loading Skeletons
 *
 * Silky pulse & shimmer skeleton loaders for cards, lists, products, and detail pages.
 */

import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewProps['style'];
}) {
  const opacity = useSharedValue(0.35);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#2A2A2C',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton({ height = 180 }: { height?: number }) {
  return (
    <View
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <SkeletonBox width="100%" height={height - 80} borderRadius={14} style={{ marginBottom: 14 }} />
      <SkeletonBox width="60%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox width="40%" height={12} borderRadius={6} />
    </View>
  );
}

export function ProductSkeleton() {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <SkeletonBox width="100%" height={110} borderRadius={12} style={{ marginBottom: 10 }} />
      <SkeletonBox width="80%" height={14} borderRadius={5} style={{ marginBottom: 6 }} />
      <SkeletonBox width="50%" height={12} borderRadius={5} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width="40%" height={16} borderRadius={5} />
        <SkeletonBox width={32} height={32} borderRadius={10} />
      </View>
    </View>
  );
}

export function RestaurantSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <SkeletonBox width="100%" height={150} borderRadius={0} />
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <SkeletonBox width="55%" height={18} borderRadius={6} />
          <SkeletonBox width={45} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width="75%" height={13} borderRadius={5} style={{ marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2A2A2C' }}>
          <SkeletonBox width="30%" height={14} borderRadius={5} />
          <SkeletonBox width="25%" height={14} borderRadius={5} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}
