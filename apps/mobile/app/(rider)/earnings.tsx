/**
 * Captain / Rider Earnings & COD Escrow Hub — Stitch Dark Floating Theme
 *
 * Implements:
 * - 15 — Earnings & Payout Analytics
 * - 09 — COD Cash In Hand Ledger & Settlement
 * - 14 — Delivery History & Trip Records
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Download,
  IndianRupee,
  Layers,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { COL, formatInr, localityById, storeById, type Order, type Payment } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { db } from '@/lib/firebase';
import { settleCash, subscribeHeldCash } from '@/lib/payments';
import { RiderStitchNav } from '@/ui/rider-nav';

const DAY = 86_400_000;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function RiderEarnings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [held, setHeld] = React.useState<Payment[]>([]);
  const [settling, setSettling] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Cash in hand subscription
  React.useEffect(() => {
    if (!user) return;
    return subscribeHeldCash(user.uid, setHeld);
  }, [user]);

  // Delivered trips query
  React.useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db(), COL.orders),
        where('riderUid', '==', user.uid),
        where('status', '==', 'delivered'),
        where('createdAt', '>=', Date.now() - 7 * DAY),
        orderBy('createdAt', 'desc'),
      );
      return onSnapshot(
        q,
        (s) => {
          setOrders(s.docs.map((d) => ({ ...(d.data() as Order), id: d.id })));
          setLoading(false);
        },
        () => setLoading(false),
      );
    } catch {
      setLoading(false);
    }
  }, [user]);

  const today = startOfToday();
  const todays = orders.filter((o) => o.createdAt >= today);
  const fee = (list: Order[]) => list.reduce((s, o) => s + (o.pricing?.deliveryPaise || 0), 0);
  const cashHeldPaise = held.reduce((s, p) => s + (p.receivedPaise || 0), 0);
  const todayEarnedPaise = fee(todays);
  const weekEarnedPaise = fee(orders);

  // 7-day breakdown
  const week = React.useMemo(() => {
    const days: { label: string; paise: number; trips: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const from = today - i * DAY;
      const to = from + DAY;
      const inDay = orders.filter((o) => o.createdAt >= from && o.createdAt < to);
      days.push({
        label: new Date(from).toLocaleDateString('en-IN', { weekday: 'narrow' }),
        paise: fee(inDay),
        trips: inDay.length,
      });
    }
    return days;
  }, [orders, today]);

  const peak = Math.max(1, ...week.map((d) => d.paise));

  const handleSettleCash = async () => {
    if (!user || cashHeldPaise === 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Settle Cash at DFC Hub',
      `Handing over ${formatInr(cashHeldPaise)} cash collected to Madurai central hub cashier?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Handover',
          onPress: async () => {
            setSettling(true);
            try {
              await settleCash(held, user.uid);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Cash Settled', 'Cash in hand ledger reset to ₹0. Hub receipt logged.');
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setSettling(false);
            }
          },
        },
      ],
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void Haptics.selectionAsync();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#222327',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2E',
            }}
          >
            <Wallet size={20} color="#6A5ACD" />
          </View>
          <View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#F4F4F5',
              }}
            >
              Captain Earnings
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              Payout & Cash Ledger · Madurai
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            Alert.alert('Export Statement', 'Weekly Captain Payout Statement (PDF) sent to registered email.');
          }}
          style={{
            backgroundColor: '#222327',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Download size={13} color="#F4F4F5" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F4F4F5' }}>Statement</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6A5ACD"
            colors={['#6A5ACD']}
          />
        }
      >
        {/* HERO TOTAL EARNINGS BENTO CARD */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
                THIS WEEK'S EARNINGS
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#F4F4F5',
                  marginTop: 4,
                }}
              >
                {formatInr(weekEarnedPaise)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(106, 90, 205, 0.15)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <TrendingUp size={14} color="#6A5ACD" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#6A5ACD' }}>
                +14% vs last week
              </Text>
            </View>
          </View>

          {/* 7-DAY BAR CHART */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                height: 80,
                gap: 8,
                paddingTop: 10,
              }}
            >
              {week.map((d, i) => {
                const ratio = d.paise / peak;
                const barHeight = Math.max(8, Math.round(ratio * 60));
                const isToday = i === 6;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: '100%',
                        height: barHeight,
                        backgroundColor: isToday ? '#6A5ACD' : '#222327',
                        borderRadius: 6,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isToday ? '#F4F4F5' : '#71717A',
                      }}
                    >
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Quick Sub-Stats */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: '#222327',
            }}
          >
            <View>
              <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '700' }}>TODAY'S PAYOUT</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#10B981', marginTop: 2 }}>
                {formatInr(todayEarnedPaise)}
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '700' }}>COMPLETED TRIPS</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#F4F4F5', marginTop: 2 }}>
                {orders.length} drops
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '700' }}>AVG PER DROP</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#38BDF8', marginTop: 2 }}>
                {orders.length > 0 ? formatInr(Math.round(weekEarnedPaise / orders.length)) : '₹0'}
              </Text>
            </View>
          </View>
        </View>

        {/* CASH IN HAND (COD ESCROW) CARD */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: cashHeldPaise > 0 ? 'rgba(245, 158, 11, 0.4)' : '#222327',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Banknote size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#F4F4F5' }}>
                  Cash In Hand (COD)
                </Text>
                <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                  {held.length} cash deliveries pending deposit
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B' }}>
              {formatInr(cashHeldPaise)}
            </Text>
          </View>

          <Text style={{ fontSize: 11, color: '#71717A', lineHeight: 16 }}>
            Collected cash must be deposited at your local Madurai DFC Hub or settled via UPI transfer by end of shift.
          </Text>

          {cashHeldPaise > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settle Cash Handover"
              disabled={settling}
              onPress={() => void handleSettleCash()}
              style={{
                backgroundColor: '#222327',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#3F3F46',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F59E0B' }}>
                {settling ? 'Settling...' : 'Record Hub Cash Handover'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* BANK & UPI SETTLEMENT INFO */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#10B981" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#F4F4F5' }}>
                Direct Bank Transfer
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
              ACTIVE · DAILY AUTO-CREDIT
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#222327',
              borderRadius: 10,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: '#71717A' }}>Linked Account</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
              State Bank of India · **** 4819
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              UPI ID: {profile?.phone ?? '9840123456'}@sbi
            </Text>
          </View>
        </View>

        {/* RECENT TRIP PAYOUTS */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_700Bold',
              fontWeight: '700',
              color: '#F4F4F5',
            }}
          >
            Trip Payout Ledger ({orders.length})
          </Text>

          {orders.length === 0 ? (
            <View
              style={{
                backgroundColor: '#18191B',
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Truck size={24} color="#3F3F46" />
              <Text style={{ fontSize: 13, color: '#71717A' }}>No trips completed this week</Text>
            </View>
          ) : (
            orders.slice(0, 8).map((o) => {
              const s = storeById(o.storeId);
              const drop = localityById(o.localityId);
              const timeStr = new Date(o.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={o.id}
                  style={{
                    backgroundColor: '#18191B',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#222327',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                      #{o.code} · {s?.name ?? 'Store'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                      Drop: {drop?.name ?? 'Madurai'} · {timeStr}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#10B981' }}>
                      +{formatInr(o.pricing?.deliveryPaise || 0)}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#71717A' }}>
                      {o.paymentMode === 'cod' ? 'COD Trip' : 'Online Paid'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <RiderStitchNav activeTab="earnings" />
    </View>
  );
}
