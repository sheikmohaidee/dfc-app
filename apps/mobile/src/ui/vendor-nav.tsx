/**
 * Vendor Floating Bottom Navigation Bar
 * Stitch Dark Floating Theme (#0E0E10 / #1C1B1D elevated pill)
 * 5 Tabs: Overview, Live Orders, History, Menu / Stock, Earnings
 */

import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  LayoutDashboard,
  Flame,
  Receipt,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type VendorTabId = 'overview' | 'live' | 'history' | 'menu' | 'earnings';

export interface VendorNavItem {
  id: VendorTabId;
  label: string;
  route: string;
  badge?: number;
  icon: (active: boolean) => React.ReactNode;
}

export function VendorStitchNav({ activeTab }: { activeTab?: VendorTabId }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const currentTab: VendorTabId =
    activeTab ||
    (pathname.includes('/kds')
      ? 'live'
      : pathname.includes('/history')
      ? 'history'
      : pathname.includes('/menu')
      ? 'menu'
      : pathname.includes('/payouts')
      ? 'earnings'
      : 'overview');

  const tabs: VendorNavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      route: '/(vendor)/inbox',
      icon: (active) => (
        <LayoutDashboard
          size={18}
          color={active ? '#C8BFFF' : '#928F9E'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'live',
      label: 'Live Orders',
      route: '/(vendor)/kds',
      badge: 3,
      icon: (active) => (
        <Flame
          size={18}
          color={active ? '#FFB59C' : '#928F9E'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'history',
      label: 'History',
      route: '/(vendor)/history',
      icon: (active) => (
        <Receipt
          size={18}
          color={active ? '#C8BFFF' : '#928F9E'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'menu',
      label: 'Menu/Stock',
      route: '/(vendor)/menu',
      icon: (active) => (
        <UtensilsCrossed
          size={18}
          color={active ? '#C8BFFF' : '#928F9E'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'earnings',
      label: 'Earnings',
      route: '/(vendor)/payouts',
      icon: (active) => (
        <Wallet
          size={18}
          color={active ? '#7BD0FF' : '#928F9E'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
  ];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 12),
        left: 16,
        right: 16,
        zIndex: 50,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: 'rgba(28, 27, 29, 0.96)',
          borderRadius: 9999,
          padding: 6,
          borderWidth: 1,
          borderColor: '#2A2A2C',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.8,
          shadowRadius: 32,
          elevation: 16,
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => {
                void Haptics.selectionAsync();
                if (!isActive) {
                  router.replace(tab.route as never);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: 9999,
                backgroundColor: isActive ? '#2A2A2C' : 'transparent',
                position: 'relative',
              }}
            >
              <View style={{ position: 'relative' }}>
                {tab.icon(isActive)}
                {tab.badge ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -10,
                      backgroundColor: '#FFB59C',
                      borderRadius: 9999,
                      minWidth: 15,
                      height: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: '#380C00',
                        fontSize: 9,
                        fontFamily: 'PlusJakartaSans_800ExtraBold',
                        fontWeight: '800',
                      }}
                    >
                      {tab.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontFamily: isActive
                    ? 'PlusJakartaSans_700Bold'
                    : 'PlusJakartaSans_500Medium',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#F0EBFF' : '#928F9E',
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
