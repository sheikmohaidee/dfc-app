/**
 * Vendor Merchant Notifications & Operational Alerts — Stitch Dark Floating Theme
 *
 * Implements:
 * - 14 — Notifications & Store Alerts
 * - High priority incoming order alerts
 * - Captain proximity notifications
 * - Low inventory warnings
 * - Settlement & Payout confirmations
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  CloudRain,
  Flame,
  Info,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { VendorStitchNav } from '@/ui/vendor-nav';

interface VendorNotice {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'order' | 'captain' | 'stock' | 'payout' | 'system';
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: VendorNotice[] = [
  {
    id: 'n-1',
    title: 'New Order Received · #9402',
    subtitle: 'Smoked Texas Pulled Pork Brioche (x1), BBQ Wings (x2). Auto-accept timer running.',
    time: '2 mins ago',
    type: 'order',
    unread: true,
  },
  {
    id: 'n-2',
    title: 'Captain Suresh Kumar Arrived',
    subtitle: 'Captain is at your store pickup counter for Order #9401.',
    time: '8 mins ago',
    type: 'captain',
    unread: true,
  },
  {
    id: 'n-3',
    title: 'Weekly Escrow Settled · ₹48,250',
    subtitle: 'Auto-credited to HDFC Bank A/C **** 9102. Reference UTR #HDFC9402819.',
    time: '2 hours ago',
    type: 'payout',
    unread: false,
  },
  {
    id: 'n-4',
    title: 'Low Stock Alert · Brioche Buns',
    subtitle: 'Inventory reached 4 units remaining. Consider restocking or marking 86.',
    time: '4 hours ago',
    type: 'stock',
    unread: false,
  },
  {
    id: 'n-5',
    title: 'Monsoon Demand Advisory',
    subtitle: 'High rain volume in Madurai. Expect 35% surge in food delivery orders this evening.',
    time: 'Yesterday',
    type: 'system',
    unread: false,
  },
];

export default function VendorNotifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState<VendorNotice[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClear = () => {
    void Haptics.selectionAsync();
    setNotifications([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 14),
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#222327',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#222327',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color="#F4F4F5" />
          </Pressable>

          <View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#F4F4F5',
              }}
            >
              Merchant Notifications
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              Operational alerts & ticket events
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all as read"
          onPress={handleMarkAllRead}
          style={{
            backgroundColor: '#222327',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#6A5ACD' }}>
            Mark All Read
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
      >
        {notifications.length === 0 ? (
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#222327',
              gap: 8,
              marginTop: 40,
            }}
          >
            <Bell size={32} color="#3F3F46" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#F4F4F5' }}>
              No Notifications
            </Text>
            <Text style={{ fontSize: 12, color: '#71717A' }}>
              You're all caught up with orders and kitchen events.
            </Text>
          </View>
        ) : (
          notifications.map((n) => {
            const isOrder = n.type === 'order';
            const isCaptain = n.type === 'captain';
            const isPayout = n.type === 'payout';
            const isStock = n.type === 'stock';

            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  if (isOrder) {
                    router.push('/(vendor)/inbox');
                  } else if (isPayout) {
                    router.push('/(vendor)/payouts');
                  } else if (isStock) {
                    router.push('/(vendor)/menu');
                  }
                }}
                style={{
                  backgroundColor: n.unread ? '#201F24' : '#18191B',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: n.unread ? 'rgba(106, 90, 205, 0.4)' : '#222327',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isOrder
                      ? 'rgba(255, 127, 80, 0.15)'
                      : isCaptain
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isPayout
                      ? 'rgba(106, 90, 205, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  {isOrder ? (
                    <Flame size={18} color="#FF7F50" />
                  ) : isCaptain ? (
                    <Truck size={18} color="#10B981" />
                  ) : isPayout ? (
                    <Wallet size={18} color="#6A5ACD" />
                  ) : (
                    <AlertTriangle size={18} color="#F59E0B" />
                  )}
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        fontWeight: '700',
                        color: '#F4F4F5',
                      }}
                    >
                      {n.title}
                    </Text>
                    {n.unread ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 9999,
                          backgroundColor: '#FF7F50',
                        }}
                      />
                    ) : null}
                  </View>

                  <Text style={{ fontSize: 12, color: '#A1A1AA', lineHeight: 17 }}>
                    {n.subtitle}
                  </Text>

                  <Text style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>
                    {n.time}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="overview" />
    </View>
  );
}
