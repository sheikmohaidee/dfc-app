/**
 * Stitch Header Component — DFC Dark Floating Theme
 * Shared header supporting location pill, notification bell with unread dot,
 * transactional back navigation, and customizable actions.
 */

import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, ChevronDown, MapPin, Search, ShoppingBag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCartsSummary } from '@/providers/cart';

export interface StitchHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotifications?: boolean;
  showCart?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
  onLocationPress?: () => void;
  rightAction?: React.ReactNode;
}

export function StitchHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  showNotifications = true,
  showCart = false,
  showSearch = false,
  onSearchPress,
  onLocationPress,
  rightAction,
}: StitchHeaderProps) {
  const router = useRouter();
  const { itemCount } = useCartsSummary();

  const handleBack = () => {
    void Haptics.selectionAsync();
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(customer)/chat');
    }
  };

  return (
    <View
      style={{
        height: 60,
        backgroundColor: '#0E0E10',
        borderBottomWidth: 1,
        borderBottomColor: '#201F21',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
      }}
    >
      {showBack ? (
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#1C1B1D',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={19} color="#E5E1E4" strokeWidth={2.2} />
          </Pressable>
          {title ? (
            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: -0.2,
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 11,
                    fontWeight: '500',
                    color: '#928F9E',
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={onLocationPress || (() => router.push('/(customer)/account/addresses'))}
          hitSlop={8}
          className="flex-row items-center gap-2.5 flex-1 mr-2"
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#1C1B1D',
              borderWidth: 1,
              borderColor: '#353437',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={16} color="#C8BFFF" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
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
                {title ?? 'Anna Nagar'}
              </Text>
              <ChevronDown size={14} color="#C8BFFF" strokeWidth={2.5} />
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '500',
                color: '#928F9E',
              }}
            >
              Madurai · 15-25 min delivery
            </Text>
          </View>
        </Pressable>
      )}

      <View className="flex-row items-center gap-2">
        {rightAction}

        {showSearch ? (
          <Pressable
            onPress={onSearchPress || (() => router.push('/(customer)/search'))}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search size={17} color="#E5E1E4" strokeWidth={2} />
          </Pressable>
        ) : null}

        {showCart ? (
          <Pressable
            onPress={() => router.push('/(customer)/cart')}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={17} color="#E5E1E4" strokeWidth={2} />
            {itemCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#6A5ACD',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {showNotifications && !showBack ? (
          <Pressable
            onPress={() => router.push('/(customer)/account/notifications')}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={17} color="#E5E1E4" strokeWidth={2} />
            <View
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: '#FFB59C',
              }}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
