/**
 * DFC Stitch Premium Card Components
 *
 * Reusable, elevated card surfaces for every content type.
 * All cards share consistent depth, border treatment, press feedback,
 * and the Stitch dark floating aesthetic.
 */

import * as React from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Clock } from 'lucide-react-native';

import { DFCPressable } from './animated';
import { GlowBadge } from './index';

// ── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  className = '',
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center justify-between px-4 ${className}`}>
      <View className="flex-1">
        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 16,
            fontWeight: '700',
            color: '#E5E1E4',
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 11,
              fontWeight: '500',
              color: '#928F9E',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#C8BFFF',
              letterSpacing: 0.1,
            }}
          >
            {actionLabel}
          </Text>
          <ChevronRight size={14} color="#C8BFFF" strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_TONES = {
  active: { bg: 'rgba(106, 90, 205, 0.2)', border: 'rgba(200, 191, 255, 0.3)', text: '#C8BFFF' },
  success: { bg: 'rgba(10, 106, 50, 0.2)', border: 'rgba(110, 231, 183, 0.3)', text: '#6EE7B7' },
  warning: { bg: 'rgba(217, 119, 6, 0.2)', border: 'rgba(253, 230, 138, 0.3)', text: '#FCD34D' },
  error: { bg: 'rgba(147, 0, 10, 0.2)', border: 'rgba(255, 180, 171, 0.3)', text: '#FFB4AB' },
  neutral: { bg: '#2A2A2C', border: '#353437', text: '#C9C4D5' },
  live: { bg: 'rgba(10, 106, 50, 0.25)', border: 'rgba(110, 231, 183, 0.35)', text: '#6EE7B7' },
} as const;

export function StatusBadge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: keyof typeof STATUS_TONES;
  icon?: React.ReactNode;
}) {
  const t = STATUS_TONES[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon}
      <Text style={{ fontSize: 10, fontWeight: '800', color: t.text, letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

// ── ServiceCard ──────────────────────────────────────────────────────────────

export interface ServiceCardProps {
  title: string;
  titleTa?: string;
  subtitle?: string;
  eta?: string;
  badge?: string;
  badgeTone?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'verify';
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  imageUrl?: string;
  onPress: () => void;
}

export function ServiceCard({
  title,
  titleTa,
  subtitle,
  eta,
  badge,
  badgeTone = 'primary',
  icon,
  iconBg,
  iconBorder,
  imageUrl,
  onPress,
}: ServiceCardProps) {
  return (
    <DFCPressable
      onPress={onPress}
      scaleTo={0.975}
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      {/* Optional hero image strip */}
      {imageUrl ? (
        <View style={{ height: 80, position: 'relative' }}>
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(28, 27, 29, 0.95)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }}
          />
        </View>
      ) : null}

      <View style={{ padding: 16 }}>
        {/* Header row: Icon + Title + Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: iconBg,
                borderColor: iconBorder,
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: -0.2,
                }}
              >
                {title}
              </Text>
              {titleTa ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'HindMadurai',
                    fontSize: 12,
                    color: '#928F9E',
                    marginTop: 1,
                  }}
                >
                  {titleTa}
                </Text>
              ) : null}
            </View>
          </View>
          {badge ? <GlowBadge label={badge} tone={badgeTone} /> : null}
        </View>

        {/* Subtitle */}
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12,
              fontWeight: '400',
              color: '#928F9E',
              lineHeight: 17,
              marginBottom: 12,
            }}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* Footer: ETA + Action */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#353437',
          }}
        >
          {eta ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color="#928F9E" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#C9C4D5' }}>
                {eta}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#C8BFFF' }}>
              Open Service
            </Text>
            <ChevronRight size={14} color="#C8BFFF" strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </DFCPressable>
  );
}

// ── ImageCard ────────────────────────────────────────────────────────────────

export function ImageCard({
  imageUrl,
  title,
  subtitle,
  badge,
  badgeTone,
  height = 140,
  onPress,
  children,
  style,
}: {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'verify';
  height?: number;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const Wrapper = onPress ? DFCPressable : View;
  const wrapperProps = onPress ? { onPress, scaleTo: 0.975 } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      style={[
        {
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#1C1B1D',
          borderColor: '#2A2A2C',
          borderWidth: 1,
          shadowColor: '#000000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={{ height, position: 'relative' }}>
        <Image
          source={{ uri: imageUrl }}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(28, 27, 29, 0.9)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.5 }}
        />
        {/* Overlay content at bottom */}
        <View style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
          {badge ? (
            <View style={{ marginBottom: 6 }}>
              <GlowBadge label={badge} tone={badgeTone || 'primary'} />
            </View>
          ) : null}
          {title ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 16,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: -0.3,
              }}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </Wrapper>
  );
}

// ── PromoBanner ──────────────────────────────────────────────────────────────

export function PromoBanner({
  title,
  subtitle,
  badge,
  badgeTone,
  icon,
  bgGradient,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'verify';
  icon?: React.ReactNode;
  bgGradient?: [string, string];
  onPress?: () => void;
}) {
  return (
    <DFCPressable
      onPress={onPress}
      scaleTo={0.98}
      haptic={!!onPress}
      disabled={!onPress}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: 'rgba(200, 191, 255, 0.2)',
        borderWidth: 1,
        shadowColor: '#6A5ACD',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      }}
    >
      <LinearGradient
        colors={bgGradient || ['rgba(106, 90, 205, 0.15)', 'rgba(28, 27, 29, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#C8BFFF',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {title}
            </Text>
          </View>
          {badge ? <GlowBadge label={badge} tone={badgeTone || 'primary'} /> : null}
        </View>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 15,
            fontWeight: '700',
            color: '#E5E1E4',
            marginBottom: 4,
          }}
        >
          {subtitle}
        </Text>
      </LinearGradient>
    </DFCPressable>
  );
}

// ── MiniServiceCard (for home grid) ──────────────────────────────────────────

export function MiniServiceCard({
  title,
  titleTa,
  icon,
  iconBg,
  iconBorder,
  badge,
  badgeColor,
  onPress,
}: {
  title: string;
  titleTa?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}) {
  return (
    <DFCPressable
      onPress={onPress}
      scaleTo={0.94}
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        width: '48%' as any,
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            borderColor: iconBorder,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        {badge ? (
          <View
            style={{
              backgroundColor: badgeColor ? `${badgeColor}20` : 'rgba(106, 90, 205, 0.15)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 8, fontWeight: '800', color: badgeColor || '#C8BFFF', letterSpacing: 0.3 }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: 'PlusJakartaSans',
          fontSize: 13,
          fontWeight: '700',
          color: '#E5E1E4',
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      {titleTa ? (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'HindMadurai',
            fontSize: 10.5,
            color: '#928F9E',
            marginTop: 1,
          }}
        >
          {titleTa}
        </Text>
      ) : null}
    </DFCPressable>
  );
}

// ── RestaurantCard ───────────────────────────────────────────────────────────

const RESTAURANT_IMAGE_MAP: Record<string, string> = {
  'rest-1': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80', // Amma Mess Biryani
  'rest-2': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', // Konar Mess Kari Dosa
  'rest-3': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', // Murugan Idli Shop
  'rest-4': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=600&auto=format&fit=crop&q=80', // Famous Jigarthanda
  'rest-5': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80', // Sree Sabarees
  'rest-6': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', // Modern Restaurant
};
const DEFAULT_RESTAURANT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';

export interface RestaurantCardData {
  id: string;
  name: string;
  nameTa?: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  cuisines: string[];
  featuredDish: string;
  avgPrepMinutes: number;
  distanceKm: number;
  deliveryFeePaise: number;
  isPureVeg: boolean;
  priceForTwoPaise: number;
}

export function RestaurantCard({
  restaurant,
  onPress,
  onBookmark,
  isBookmarked = false,
  formatPrice,
}: {
  restaurant: RestaurantCardData;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  formatPrice: (paise: number) => string;
}) {
  const r = restaurant;
  const { Bookmark, Star, Sparkles, MapPin } = require('lucide-react-native');
  const heroImageUri = r.imageUrl || RESTAURANT_IMAGE_MAP[r.id] || DEFAULT_RESTAURANT_IMAGE;

  return (
    <DFCPressable
      onPress={onPress}
      scaleTo={0.975}
      style={{
        backgroundColor: '#1C1B1D',
        borderColor: '#2A2A2C',
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      {/* Hero Image */}
      <View style={{ height: 150, position: 'relative' }}>
        <Image
          source={{ uri: heroImageUri }}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
          transition={200}
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.5)']}
          style={{ position: 'absolute', inset: 0 } as any}
        />

        {/* Top tags */}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <StatusBadge
            label={r.isPureVeg ? 'PURE VEG' : 'MADURAI SPECIAL'}
            tone={r.isPureVeg ? 'success' : 'warning'}
          />
          {onBookmark ? (
            <Pressable
              onPress={(e: any) => {
                e.stopPropagation?.();
                onBookmark();
              }}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(28, 27, 29, 0.8)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bookmark
                size={15}
                color={isBookmarked ? '#C8BFFF' : '#FFFFFF'}
                fill={isBookmarked ? '#C8BFFF' : 'transparent'}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Featured dish pill */}
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            backgroundColor: 'rgba(20, 19, 21, 0.85)',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Sparkles size={11} color="#C8BFFF" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
            Must Try: {r.featuredDish}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 16,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: -0.2,
              }}
            >
              {r.name}
            </Text>
            {r.nameTa ? (
              <Text
                numberOfLines={1}
                style={{ fontFamily: 'HindMadurai', fontSize: 12, color: '#928F9E', marginTop: 1 }}
              >
                {r.nameTa}
              </Text>
            ) : null}
          </View>

          {/* Rating pill */}
          <View
            style={{
              backgroundColor: 'rgba(142, 44, 1, 0.25)',
              borderColor: 'rgba(255, 181, 156, 0.3)',
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Star size={11} color="#FFB59C" fill="#FFB59C" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFB59C' }}>
              {r.rating}
            </Text>
            <Text style={{ fontSize: 10, color: '#928F9E' }}>({r.reviewCount})</Text>
          </View>
        </View>

        <Text numberOfLines={1} style={{ fontSize: 12, color: '#928F9E', marginBottom: 12 }}>
          {r.cuisines.join(' · ')} · {formatPrice(r.priceForTwoPaise)} for two
        </Text>

        {/* Delivery metrics footer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#353437',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color="#928F9E" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#C9C4D5' }}>
                {r.avgPrepMinutes + 10} mins
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="#928F9E" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#C9C4D5' }}>
                {r.distanceKm.toFixed(1)} km
              </Text>
            </View>
          </View>

          <StatusBadge
            label={r.deliveryFeePaise === 0 ? 'FREE DELIVERY' : `${formatPrice(r.deliveryFeePaise)} delivery`}
            tone="success"
          />
        </View>
      </View>
    </DFCPressable>
  );
}
