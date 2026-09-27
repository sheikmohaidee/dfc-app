/**
 * Stitch Floating Bottom Navigation Bar
 * 5 Tabs: Home, Services, List, Orders, Profile
 * Floating pill design with elevated dark container and haptic feedback.
 */

import * as React from 'react';
import { View, Text, Pressable, Platform, Keyboard } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, LayoutGrid, ListChecks, ShoppingBag, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type StitchTabId = 'home' | 'services' | 'list' | 'orders' | 'profile';

export interface StitchNavItem {
  id: StitchTabId;
  label: string;
  route: string;
  icon: (active: boolean) => React.ReactNode;
}

export function StitchNav({ activeTab }: { activeTab?: StitchTabId }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const currentTab: StitchTabId =
    activeTab ||
    (pathname.includes('/services')
      ? 'services'
      : pathname.includes('/shopping-list')
      ? 'list'
      : pathname.includes('/orders') || pathname.includes('/order/')
      ? 'orders'
      : pathname.includes('/account')
      ? 'profile'
      : 'home');

  const tabs: StitchNavItem[] = [
    {
      id: 'home',
      label: 'Home',
      route: '/(customer)/chat',
      icon: (active) => <Home size={19} color={active ? '#FFFFFF' : '#928F9E'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'services',
      label: 'Services',
      route: '/(customer)/services',
      icon: (active) => <LayoutGrid size={19} color={active ? '#FFFFFF' : '#928F9E'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'list',
      label: 'List',
      route: '/(customer)/shopping-list',
      icon: (active) => <ListChecks size={19} color={active ? '#FFFFFF' : '#928F9E'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'orders',
      label: 'Orders',
      route: '/(customer)/orders',
      icon: (active) => <ShoppingBag size={19} color={active ? '#FFFFFF' : '#928F9E'} strokeWidth={active ? 2.5 : 2} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      route: '/(customer)/account',
      icon: (active) => <User size={19} color={active ? '#FFFFFF' : '#928F9E'} strokeWidth={active ? 2.5 : 2} />,
    },
  ];

  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        left: 16,
        right: 16,
        zIndex: 50,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: 'rgba(28, 27, 29, 0.95)',
          borderColor: '#353437',
          borderWidth: 1,
          borderRadius: 32,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 10,
          paddingVertical: 6,
          paddingHorizontal: 6,
        }}
        className="flex-row items-center justify-between"
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
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 2,
                borderRadius: 24,
                backgroundColor: active ? '#6A5ACD' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tab.icon(active)}
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 10,
                  fontWeight: active ? '700' : '500',
                  color: active ? '#FFFFFF' : '#928F9E',
                  marginTop: 3,
                  letterSpacing: 0.2,
                }}
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
