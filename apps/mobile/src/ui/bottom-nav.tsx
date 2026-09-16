/**
 * DFC Stitch Bottom Navigation Bar
 * Tabs: Home, Orders, Track, Profile
 */

import * as React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Compass, ShoppingBag, Navigation, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NavItem {
  id: 'home' | 'orders' | 'track' | 'profile';
  label: string;
  route: string;
  icon: (active: boolean) => React.ReactNode;
}

export function DFCBottomNav({ activeTab }: { activeTab?: 'home' | 'orders' | 'track' | 'profile' }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const currentTab =
    activeTab ||
    (pathname.includes('/orders')
      ? 'orders'
      : pathname.includes('/order/')
      ? 'track'
      : pathname.includes('/account')
      ? 'profile'
      : 'home');

  const tabs: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      route: '/(customer)/chat',
      icon: (active) => <Compass size={20} color={active ? '#FFFFFF' : '#554245'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'orders',
      label: 'Orders',
      route: '/(customer)/orders',
      icon: (active) => <ShoppingBag size={20} color={active ? '#FFFFFF' : '#554245'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'track',
      label: 'Track',
      route: '/(customer)/order/ord-demo-live-1047',
      icon: (active) => <Navigation size={20} color={active ? '#FFFFFF' : '#554245'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/(customer)/account',
      icon: (active) => <User size={20} color={active ? '#FFFFFF' : '#554245'} strokeWidth={active ? 2.5 : 2} />,
    },
  ];

  // Dynamic bottom padding to clear Android 3-button navigation, gesture bar, or iPhone home bar
  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 14);

  return (
    <View
      style={{
        backgroundColor: '#F9F9FF',
        borderTopColor: '#DAC0C4',
        borderTopWidth: 1,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -3 },
        elevation: 12,
        paddingBottom: safeBottomPadding,
        paddingTop: 8,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        zIndex: 50,
      }}
      className="flex-row items-center justify-around px-2"
    >
      {tabs.map((tab) => {
        const active = currentTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              void Haptics.selectionAsync();
              if (pathname !== tab.route) {
                router.push(tab.route as any);
              }
            }}
            style={{
              paddingVertical: active ? 6 : 4,
              paddingHorizontal: active ? 16 : 10,
              borderRadius: active ? 9999 : 10,
              backgroundColor: active ? '#7A1F3D' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: active ? 74 : 64,
            }}
          >
            {tab.icon(active ? true : false)}
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 11,
                fontWeight: active ? '800' : '600',
                color: active ? '#FFFFFF' : '#554245',
                marginTop: 2,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
