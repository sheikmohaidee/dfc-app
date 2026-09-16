/**
 * DFC Stitch Service Hub Bar
 * Premium category & quick service launcher cards
 */

import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Utensils,
  ShoppingBag,
  Printer,
  Package,
  Search,
  Receipt,
  Truck,
  ShoppingBag as BagIcon,
} from 'lucide-react-native';
import { PressableScale } from './glass';

export interface ServiceItem {
  id: string;
  title: string;
  titleTa: string;
  badge?: string;
  badgeBg: string;
  badgeText: string;
  route: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
}

export function ServiceHub({ only }: { only?: string[] }) {
  const router = useRouter();

  const allServices: ServiceItem[] = [
    {
      id: 'food',
      title: 'Food & Messes',
      titleTa: 'உணவு',
      badge: 'HOT',
      badgeBg: '#FFF7ED',
      badgeText: '#C2410C',
      route: '/(customer)/food',
      icon: <Utensils size={18} color="#EA580C" strokeWidth={2.2} />,
      iconBg: '#FFF7ED',
      iconBorder: '#FED7AA',
    },
    {
      id: 'grocery',
      title: 'Supermarket',
      titleTa: 'மளிகை',
      badge: '15 MIN',
      badgeBg: '#ECFDF5',
      badgeText: '#047857',
      route: '/(customer)/grocery',
      icon: <ShoppingBag size={18} color="#059669" strokeWidth={2.2} />,
      iconBg: '#ECFDF5',
      iconBorder: '#A7F3D0',
    },
    {
      id: 'print',
      title: 'Print & Xerox',
      titleTa: 'ஜெராக்ஸ்',
      badge: 'EXPRESS',
      badgeBg: '#F5F3FF',
      badgeText: '#6D28D9',
      route: '/(customer)/print',
      icon: <Printer size={18} color="#7C3AED" strokeWidth={2.2} />,
      iconBg: '#F5F3FF',
      iconBorder: '#DDD6FE',
    },
    {
      id: 'genie',
      title: 'Genie Errands',
      titleTa: 'சேவைகள்',
      badge: 'RUNNER',
      badgeBg: '#FDF2F5',
      badgeText: '#7A1F3D',
      route: '/(customer)/genie',
      icon: <Package size={18} color="#7A1F3D" strokeWidth={2.2} />,
      iconBg: '#FDF2F5',
      iconBorder: '#FCE7F3',
    },
    {
      id: 'pickup_drop',
      title: 'Pickup & Drop',
      titleTa: 'பிக்அப்',
      badge: 'POINT TO POINT',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      route: '/(customer)/genie',
      icon: <Truck size={18} color="#D97706" strokeWidth={2.2} />,
      iconBg: '#FEF3C7',
      iconBorder: '#FDE68A',
    },
    {
      id: 'buy_deliver',
      title: 'Buy & Deliver',
      titleTa: 'வாங்கி தருதல்',
      badge: 'ANY STORE',
      badgeBg: '#EFF6FF',
      badgeText: '#1D4ED8',
      route: '/(customer)/genie',
      icon: <BagIcon size={18} color="#2563EB" strokeWidth={2.2} />,
      iconBg: '#EFF6FF',
      iconBorder: '#BFDBFE',
    },
    {
      id: 'search',
      title: 'Search All',
      titleTa: 'தேடல்',
      badge: 'DISCOVER',
      badgeBg: '#F3F4F6',
      badgeText: '#4B5563',
      route: '/(customer)/search',
      icon: <Search size={18} color="#4B5563" strokeWidth={2.2} />,
      iconBg: '#F3F4F6',
      iconBorder: '#E5E7EB',
    },
    {
      id: 'orders',
      title: 'My Orders',
      titleTa: 'ஆர்டர்கள்',
      badge: 'TRACK',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
      route: '/(customer)/orders',
      icon: <Receipt size={18} color="#D97706" strokeWidth={2.2} />,
      iconBg: '#FEF3C7',
      iconBorder: '#FDE68A',
    },
  ];

  const services = only ? allServices.filter((s) => only.includes(s.id)) : allServices;

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderBottomColor: '#E5E7EB',
        borderBottomWidth: 1,
        paddingVertical: 10,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {services.map((item) => (
          <PressableScale
            key={item.id}
            to={0.93}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(item.route as any);
            }}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              borderRadius: 14,
              padding: 10,
              minWidth: 116,
              shadowColor: '#000000',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            {/* Top row: Icon + Micro Badge */}
            <View className="flex-row items-center justify-between mb-2">
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: item.iconBg,
                  borderColor: item.iconBorder,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </View>

              {item.badge ? (
                <View
                  style={{
                    backgroundColor: item.badgeBg,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8.5,
                      fontWeight: '800',
                      letterSpacing: 0.4,
                      color: item.badgeText,
                    }}
                  >
                    {item.badge}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Bottom: Title & Tamil Subtitle */}
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '700',
                color: '#111827',
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 10.5,
                color: '#6B7280',
                marginTop: 1,
              }}
              numberOfLines={1}
              className="font-tamil"
            >
              {item.titleTa}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}
