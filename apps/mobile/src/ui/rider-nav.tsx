/**
 * Captain / Rider Floating Bottom Navigation Bar
 * Stitch Dark Floating Theme (#0E0E10 / #18191B elevated pill)
 * Tabs: Deliveries / Tasks, Earnings, Settings / Profile
 */

import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  Navigation,
  Wallet,
  UserCheck,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RiderTabId = 'tasks' | 'earnings' | 'settings';

export interface RiderNavItem {
  id: RiderTabId;
  label: string;
  route: string;
  badge?: number;
  icon: (active: boolean) => React.ReactNode;
}

export function RiderStitchNav({
  activeTab,
  activeCount = 0,
}: {
  activeTab?: RiderTabId;
  activeCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const currentTab: RiderTabId =
    activeTab ||
    (pathname.includes('/earnings')
      ? 'earnings'
      : pathname.includes('/settings')
      ? 'settings'
      : 'tasks');

  const tabs: RiderNavItem[] = [
    {
      id: 'tasks',
      label: 'Deliveries',
      route: '/(rider)/queue',
      badge: activeCount > 0 ? activeCount : undefined,
      icon: (active) => (
        <Navigation
          size={19}
          color={active ? '#FF7F50' : '#8E8D92'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'earnings',
      label: 'Earnings',
      route: '/(rider)/earnings',
      icon: (active) => (
        <Wallet
          size={19}
          color={active ? '#6A5ACD' : '#8E8D92'}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
    {
      id: 'settings',
      label: 'Captain Hub',
      route: '/(rider)/settings',
      icon: (active) => (
        <ShieldCheck
          size={19}
          color={active ? '#10B981' : '#8E8D92'}
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
        left: 20,
        right: 20,
        zIndex: 50,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: 'rgba(24, 25, 27, 0.96)',
          borderRadius: 9999,
          padding: 6,
          borderWidth: 1,
          borderColor: '#2A2A2E',
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
                paddingHorizontal: 8,
                borderRadius: 9999,
                backgroundColor: isActive ? '#222327' : 'transparent',
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
                      backgroundColor: '#FF7F50',
                      borderRadius: 9999,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
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
                  fontSize: 11,
                  marginTop: 3,
                  fontFamily: isActive
                    ? 'PlusJakartaSans_700Bold'
                    : 'PlusJakartaSans_500Medium',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#F4F4F5' : '#8E8D92',
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
