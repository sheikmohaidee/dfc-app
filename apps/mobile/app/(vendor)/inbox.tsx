/**
 * Vendor Inbox & Dashboard — Stitch Dark Floating Theme
 * Implements:
 * - 01 — Vendor Dashboard (Telemetry, Surge Pill, Pipeline Stream, Floor Controls)
 * - 02 — Incoming Orders (Real-time Audio Chime, Auto-reject timers, Captain Proximity, High-Velocity Triage)
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Headphones,
  Info,
  Layers,
  MapPin,
  MoreVertical,
  PauseCircle,
  Percent,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Settings,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  Truck,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import {
  formatInr,
  localityById,
  type Order,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';
import { subscribeStoreOrders, vendorAccept, vendorReject } from '@/lib/orders';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { VendorStitchNav } from '@/ui/vendor-nav';

const ACCEPT_WINDOW_S = 90;

export default function VendorInbox() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const platform = usePlatformStatus();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [online, setOnline] = React.useState(true);
  const [autoAccept, setAutoAccept] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'all' | 'express' | 'preorders'>('all');
  const [pipelineFilter, setPipelineFilter] = React.useState<'incoming' | 'preparing' | 'ready' | 'dispatched'>('incoming');
  const [viewMode, setViewMode] = React.useState<'dashboard' | 'incoming'>('dashboard');

  // Countdowns
  const [timer1, setTimer1] = React.useState(72);
  const [timer2, setTimer2] = React.useState(45);
  const [timerBanner, setTimerBanner] = React.useState(108);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer1((prev) => (prev > 0 ? prev - 1 : 0));
      setTimer2((prev) => (prev > 0 ? prev - 1 : 0));
      setTimerBanner((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const storeId = profile?.storeId ?? 'rest-the-smoke-co';

  React.useEffect(() => {
    return subscribeStoreOrders(storeId, (list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [storeId]);

  const incomingOrders = orders.filter((o) => o.status === 'incoming' || o.status === 'awaiting_payment');
  const preparingOrders = orders.filter((o) => o.status === 'vendor_accepted' || o.status === 'packing');
  const readyOrders = orders.filter((o) => o.status === 'ready_for_pickup');
  const dispatchedOrders = orders.filter((o) => o.status === 'picked_up' || o.status === 'out_for_delivery');

  const todayRevenue = orders.reduce((acc, o) => acc + o.pricing.totalPaise, 4825000);

  const handleAccept = async (orderId: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    mockOrderRepository.startPreparation(orderId);
    router.push(`/(vendor)/kds` as never);
  };

  const handleReject = async (orderId: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Reject Order', 'Are you sure you want to reject this order? This may impact your merchant score.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          mockOrderRepository.cancelOrder(orderId, 'store_busy');
        },
      },
    ]);
  };

  const handleAdjustPrep = (orderId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Adjust Prep Time', 'Add buffer time for kitchen rush:', [
      { text: '+5 Mins', onPress: () => Alert.alert('Updated', '+5m prep buffer notified to rider') },
      { text: '+10 Mins', onPress: () => Alert.alert('Updated', '+10m prep buffer notified to rider') },
      { text: '+15 Mins', onPress: () => Alert.alert('Updated', '+15m prep buffer notified to rider') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#131315' }}>
      {/* 1. Brand Header */}
      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: 'rgba(19, 19, 21, 0.94)',
          borderBottomWidth: 1,
          borderBottomColor: '#201F21',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <Flame size={20} color="#6A5ACD" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                The Smoke Co. & BBQ
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: online ? '#8E2C01' : '#2A2A2C',
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    backgroundColor: online ? '#FFB59C' : '#928F9E',
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: online ? '#FFB59C' : '#928F9E',
                    letterSpacing: 0.5,
                  }}
                >
                  {online ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                {localityById(profile?.localityId)?.name ?? 'Madurai'} · Floor Live
              </Text>
            </View>
          </View>
        </View>

        {/* Header Right Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Audio Chime Toggle"
            onPress={() => {
              void Haptics.selectionAsync();
              setIsMuted(!isMuted);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            {isMuted ? (
              <VolumeX size={18} color="#928F9E" />
            ) : (
              <Volume2 size={18} color="#FFB59C" />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => {
              void Haptics.selectionAsync();
              router.push('/(vendor)/notifications' as never);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
              position: 'relative',
            }}
          >
            <Bell size={18} color="#E5E1E4" />
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: 9999,
                backgroundColor: '#FFB59C',
              }}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {
              void Haptics.selectionAsync();
              router.push('/(vendor)/settings' as never);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <Settings size={18} color="#E5E1E4" />
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 14 }}
        refreshControl={<RefreshControl refreshing={false} tintColor="#6A5ACD" />}
      >
        {/* Real-Time Status & Urgent Audio Chime Header Banner */}
        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#201F21',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 9999,
                backgroundColor: '#FFB59C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} color="#380C00" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#FFB59C',
                    letterSpacing: 0.5,
                  }}
                >
                  NEW ORDERS ALERT
                </Text>
                <View style={{ width: 4, height: 4, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                <Text style={{ fontSize: 11, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {isMuted ? 'Muted' : 'Chime ON'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_400Regular', marginTop: 1 }}>
                Kitchen triage active • Keep display unlocked
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setIsMuted(!isMuted)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 9999,
              backgroundColor: '#353437',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isMuted ? <VolumeX size={13} color="#E5E1E4" /> : <Volume2 size={13} color="#E5E1E4" />}
            <Text style={{ fontSize: 11, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </Pressable>
        </View>

        {/* Live Operational Bar & Status Matrix */}
        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#1C1B1D',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: -0.2,
                }}
              >
                Kitchen Active
              </Text>
              <Text style={{ fontSize: 11, color: '#928F9E' }}>
                • Auto-Accept: {autoAccept ? 'ON' : 'OFF'}
              </Text>
            </View>

            {/* Toggle Switch */}
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Auto Accept Orders"
              onPress={() => {
                void Haptics.selectionAsync();
                setAutoAccept(!autoAccept);
              }}
              style={{
                width: 44,
                height: 24,
                borderRadius: 9999,
                backgroundColor: autoAccept ? '#6A5ACD' : '#353437',
                padding: 2,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  backgroundColor: autoAccept ? '#F0EBFF' : '#928F9E',
                  alignSelf: autoAccept ? 'flex-end' : 'flex-start',
                }}
              />
            </Pressable>
          </View>

          {/* Surge Status Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#2A2A2C',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Zap size={15} color="#FFB59C" />
              <Text style={{ fontSize: 12, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Peak Dinner Rush <Text style={{ color: '#FFB59C' }}>(1.4x Demand in Indiranagar)</Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#8E2C01',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#FFB59C',
                  letterSpacing: 0.5,
                }}
              >
                SURGE LIVE
              </Text>
            </View>
          </View>
        </View>

        {/* Urgent Attention Alert Banner */}
        <Pressable
          onPress={() => router.push('/(vendor)/kds')}
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#8E2C01',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.7,
            shadowRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#FFB59C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Timer size={22} color="#380C00" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#FFAA8D',
                  }}
                >
                  2 Incoming Orders
                </Text>
                <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
              </View>
              <Text style={{ fontSize: 11, color: '#FFAA8D', fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 }}>
                Immediate action required • Auto-cancels in{' '}
                <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>{timerBanner}s</Text>
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#FFB59C',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#5C1A00' }}>
              Queue
            </Text>
            <ArrowRight size={14} color="#5C1A00" />
          </View>
        </Pressable>

        {/* Key KPI Telemetry Cards (2x2 Grid) */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Today's Revenue */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                  Today's Revenue
                </Text>
                <Receipt size={16} color="#C8BFFF" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#E5E1E4',
                  letterSpacing: -0.5,
                }}
              >
                ₹48,250
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <TrendingUp size={13} color="#7BD0FF" />
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700', color: '#7BD0FF' }}>
                  +18%
                </Text>
                <Text style={{ fontSize: 10, color: '#928F9E' }}>vs yesterday</Text>
              </View>
            </View>

            {/* Orders Today */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                  Orders Today
                </Text>
                <Flame size={16} color="#7BD0FF" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                    letterSpacing: -0.5,
                  }}
                >
                  46
                </Text>
                <Text style={{ fontSize: 12, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                  orders
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                <View style={{ backgroundColor: '#2A2A2C', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: '#E5E1E4', fontWeight: '600' }}>32 done</Text>
                </View>
                <View style={{ backgroundColor: '#2A2A2C', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: '#C8BFFF', fontWeight: '600' }}>4 prep</Text>
                </View>
                <View style={{ backgroundColor: '#8E2C01', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: '#FFB59C', fontWeight: '700' }}>2 new</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Avg Prep Time */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                  Avg Prep Time
                </Text>
                <Clock size={16} color="#7BD0FF" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                    letterSpacing: -0.5,
                  }}
                >
                  14.2
                </Text>
                <Text style={{ fontSize: 13, color: '#928F9E', fontWeight: '600' }}>min</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 10, color: '#7BD0FF', fontWeight: '700' }}>Target &lt;15m</Text>
                <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>Optimal</Text>
              </View>
            </View>

            {/* Kitchen Rating */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                  Kitchen Rating
                </Text>
                <Star size={16} color="#FFB59C" fill="#FFB59C" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                    letterSpacing: -0.5,
                  }}
                >
                  4.9
                </Text>
                <Text style={{ fontSize: 14, color: '#FFB59C', fontWeight: '700' }}>★</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 10, color: '#928F9E' }}>184 ratings</Text>
                <Text style={{ fontSize: 10, color: '#C8BFFF', fontWeight: '700' }}>Top 5%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Selector Chips */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => setActiveTab('all')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: activeTab === 'all' ? '#6A5ACD' : '#201F21',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                fontWeight: '600',
                color: activeTab === 'all' ? '#F0EBFF' : '#928F9E',
              }}
            >
              All Incoming
            </Text>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9999,
                backgroundColor: activeTab === 'all' ? '#C8BFFF' : '#2A2A2C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: activeTab === 'all' ? '#2D128F' : '#E5E1E4',
                }}
              >
                2
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('express')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: activeTab === 'express' ? '#6A5ACD' : '#201F21',
            }}
          >
            <Zap size={14} color={activeTab === 'express' ? '#F0EBFF' : '#928F9E'} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                fontWeight: '600',
                color: activeTab === 'express' ? '#F0EBFF' : '#928F9E',
              }}
            >
              Food Express
            </Text>
            <View
              style={{
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 9999,
                backgroundColor: '#2A2A2C',
              }}
            >
              <Text style={{ fontSize: 9, color: '#E5E1E4', fontWeight: '700' }}>1</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('preorders')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: activeTab === 'preorders' ? '#6A5ACD' : '#201F21',
            }}
          >
            <Clock size={14} color={activeTab === 'preorders' ? '#F0EBFF' : '#928F9E'} />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                fontWeight: '600',
                color: activeTab === 'preorders' ? '#F0EBFF' : '#928F9E',
              }}
            >
              Pre-orders
            </Text>
            <View
              style={{
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 9999,
                backgroundColor: '#2A2A2C',
              }}
            >
              <Text style={{ fontSize: 9, color: '#E5E1E4', fontWeight: '700' }}>1</Text>
            </View>
          </Pressable>
        </View>

        {/* Priority Incoming Card 1 — #DFC-9402 */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.8,
            shadowRadius: 28,
          }}
        >
          {/* Card Top & Countdown */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                    letterSpacing: -0.3,
                  }}
                >
                  #DFC-9402
                </Text>
                <View
                  style={{
                    backgroundColor: '#00739C',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontFamily: 'PlusJakartaSans_800ExtraBold',
                      fontWeight: '800',
                      color: '#DBF0FF',
                      letterSpacing: 0.5,
                    }}
                  >
                    EXPRESS
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_400Regular', marginTop: 1 }}>
                Placed 18 seconds ago
              </Text>
            </View>

            {/* Glowing Countdown Badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 9999,
                backgroundColor: '#8E2C01',
              }}
            >
              <Timer size={14} color="#FFAA8D" />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#FFAA8D',
                }}
              >
                Auto-Rejects in {timer1}s
              </Text>
            </View>
          </View>

          {/* Customer & Fleet Live Status Pill */}
          <View
            style={{
              borderRadius: 12,
              backgroundColor: '#1C1B1D',
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9999,
                  backgroundColor: '#2A2A2C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Truck size={17} color="#C8BFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    fontWeight: '600',
                    color: '#E5E1E4',
                  }}
                  numberOfLines={1}
                >
                  Rahul S. • DFC Express Fleet
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: '#7BD0FF',
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  Capt. Suresh Kumar • 4 mins away
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#928F9E" />
          </View>

          {/* Itemised Order Breakdown */}
          <View style={{ borderRadius: 12, backgroundColor: '#1C1B1D', padding: 10, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                  <Text style={{ fontSize: 13, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    1x Smoked Texas Pulled Pork Brioche
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#928F9E', marginLeft: 12, marginTop: 2 }}>
                  Add Apple Cider Slaw, Extra BBQ Glaze
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                ₹380
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                  <Text style={{ fontSize: 13, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    2x Smoked BBQ Chicken Wings
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#928F9E', marginLeft: 12, marginTop: 2 }}>
                  6 pcs, Garlic Herb Dip
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                ₹580
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#FFB59C' }} />
                  <Text style={{ fontSize: 13, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    1x Truffle Parmesan Hand-cut Fries
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                ₹190
              </Text>
            </View>

            {/* Special Prep Alert Pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#2A2A2C',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                marginTop: 2,
              }}
            >
              <Info size={14} color="#FFB59C" />
              <Text style={{ fontSize: 11, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Note: Extra spicy glaze, no plastic cutlery
              </Text>
            </View>
          </View>

          {/* Settlement Footer Preview */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={15} color="#7BD0FF" />
              <Text style={{ fontSize: 12, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Paid via UPI
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#928F9E' }}>Total</Text>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#E5E1E4',
                }}
              >
                ₹1,150
              </Text>
            </View>
          </View>

          {/* High Velocity Kitchen Triage Action Buttons */}
          <View style={{ gap: 8, paddingTop: 4 }}>
            {/* Main Purple Accept Action */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Accept Order 20 mins prep"
              onPress={() => handleAccept('order-9402')}
              style={{
                height: 48,
                borderRadius: 14,
                backgroundColor: '#6A5ACD',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#6A5ACD',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
              }}
            >
              <CheckCircle2 size={18} color="#F0EBFF" />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#F0EBFF',
                }}
              >
                Accept Order (20 mins prep) ⚡
              </Text>
            </Pressable>

            {/* Secondary Dual Controls */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adjust Prep Time"
                onPress={() => handleAdjustPrep('order-9402')}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#2A2A2C',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Clock size={15} color="#E5E1E4" />
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                  Adjust Prep Time
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reject Order"
                onPress={() => handleReject('order-9402')}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(147, 0, 10, 0.4)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <X size={15} color="#FFB4AB" />
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFB4AB' }}>
                  Reject ✕
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Priority Incoming Card 2 — #DFC-9405 */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                  }}
                >
                  #DFC-9405
                </Text>
                <View
                  style={{
                    backgroundColor: '#353437',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#C9C4D5' }}>STANDARD</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 1 }}>Placed 45s ago</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: 'rgba(142, 44, 1, 0.7)',
              }}
            >
              <Timer size={13} color="#FFAA8D" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFAA8D' }}>
                {timer2}s left
              </Text>
            </View>
          </View>

          {/* Quick Items View */}
          <View style={{ borderRadius: 12, backgroundColor: '#1C1B1D', padding: 10, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#E5E1E4' }}>1x Slow-Braised Lamb Tacos</Text>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>₹395</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#E5E1E4' }}>1x Craft Ginger Ale</Text>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>₹120</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopColor: '#2A2A2C',
                paddingTop: 6,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 11, color: '#928F9E' }}>2 items • Paid</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#E5E1E4' }}>Total: ₹515</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Accept 15 mins"
              onPress={() => handleAccept('order-9405')}
              style={{
                flex: 2,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#6A5ACD',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Check size={16} color="#F0EBFF" />
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#F0EBFF' }}>
                Accept (15 mins)
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reject Order"
              onPress={() => handleReject('order-9405')}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#2A2A2C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C9C4D5' }}>
                Reject
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Speed Triage Incentive Note */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#1C1B1D',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 9999,
              backgroundColor: 'rgba(200, 191, 255, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="#C8BFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#C8BFFF',
                letterSpacing: 0.5,
              }}
            >
              SPEED TRIAGE INCENTIVE
            </Text>
            <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 2, lineHeight: 16 }}>
              Orders accepted within 45s earn a{' '}
              <Text style={{ color: '#FFB59C', fontWeight: '700' }}>+2% DFC Quality Score</Text> bonus and premier listing priority.
            </Text>
          </View>
        </View>

        {/* Kitchen Low-Stock / 86 Warning Ticker */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: '#201F21',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#2A2A2C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#FFB4AB" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#FFB4AB',
                  }}
                >
                  STOCK ALERT
                </Text>
                <Text style={{ fontSize: 11, color: '#928F9E' }}>• 2 items critical</Text>
              </View>
              <Text
                style={{ fontSize: 11, color: '#E5E1E4', marginTop: 1 }}
                numberOfLines={1}
              >
                Brioche Buns (4 left) • Truffle Oil (1 bottle)
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(vendor)/menu')}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: '#353437',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
              Update
            </Text>
          </Pressable>
        </View>

        {/* Kitchen Floor Controls */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_800ExtraBold',
              fontWeight: '800',
              color: '#928F9E',
              letterSpacing: 0.8,
            }}
          >
            KITCHEN FLOOR CONTROLS
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => Alert.alert('Orders Paused', 'Kitchen paused for 30 minutes due to rush.')}
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2A2A2C',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  backgroundColor: '#2A2A2C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PauseCircle size={16} color="#FFB59C" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: '#E5E1E4',
                  textAlign: 'center',
                }}
              >
                Pause Orders (30m)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('Thermal KOT', 'Sending Daily KOT summary to kitchen printer...')}
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2A2A2C',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  backgroundColor: '#2A2A2C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Printer size={16} color="#C8BFFF" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: '#E5E1E4',
                  textAlign: 'center',
                }}
              >
                Print Daily KOT
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('Partner Support', 'Connecting to DFC Merchant Operations hotline...')}
              style={{
                flex: 1,
                backgroundColor: '#201F21',
                borderRadius: 14,
                padding: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2A2A2C',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  backgroundColor: '#2A2A2C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Headphones size={16} color="#7BD0FF" />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: '#E5E1E4',
                  textAlign: 'center',
                }}
              >
                Partner Support
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="overview" />
    </View>
  );
}
