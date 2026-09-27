/**
 * Captain / Rider Queue & Live Dispatch Hub — Stitch Dark Floating Theme
 *
 * Implements:
 * - 01 — Captain Home & Online/Offline Toggle with Radar Pulse
 * - 02 — New Delivery Assignment Card & Countdown
 * - 03 — Assigned Deliveries & Active Orders Pipeline
 * - 13 — Active Deliveries Stream
 * - 14 — Delivery History & Daily Telemetry
 */

import * as React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Bike,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  Flame,
  HeartPulse,
  IndianRupee,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Power,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  Truck,
  User,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  COPY,
  STATUS_LABEL,
  formatInr,
  localityById,
  routeKm,
  storeById,
  type Order,
  type Rider,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';
import {
  setRiderOnline,
  subscribeRiderProfile,
  subscribeRiderTasks,
} from '@/lib/orders';
import { RiderStitchNav } from '@/ui/rider-nav';

export default function RiderQueue() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const platform = usePlatformStatus();

  const [activeTask, setActiveTask] = React.useState<Order | null>(null);
  const [history, setHistory] = React.useState<Order[]>([]);
  const [rider, setRider] = React.useState<Rider | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // New incoming job simulation modal
  const [incomingJob, setIncomingJob] = React.useState<boolean>(false);
  const [jobTimer, setJobTimer] = React.useState<number>(45);

  React.useEffect(() => {
    if (!user?.uid) return;
    const unsubRider = subscribeRiderProfile(user.uid, (r) => {
      setRider(r);
    });
    const unsubTasks = subscribeRiderTasks(user.uid, (act, hist) => {
      setActiveTask(act);
      setHistory(hist);
      setLoading(false);
    });
    return () => {
      unsubRider();
      unsubTasks();
    };
  }, [user]);

  // Incoming offer timer countdown
  React.useEffect(() => {
    if (!incomingJob) return;
    const interval = setInterval(() => {
      setJobTimer((prev) => {
        if (prev <= 1) {
          setIncomingJob(false);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingJob]);

  const strikes = rider?.cancellationsToday ?? 0;
  const isLockedOut = Boolean(rider?.isOfflineDueToCancellations || strikes > 2);
  const online = Boolean(rider?.isOnline && !isLockedOut);

  async function toggleOnline() {
    if (!user) return;
    if (isLockedOut) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Account Locked (Offline)',
        'You have cancelled more than 2 orders today. Please contact DFC Operations with an explanation to reactivate.',
      );
      return;
    }
    const next = !online;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setRiderOnline(user.uid, next);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  const earnedTodayPaise = history.reduce(
    (sum, o) => sum + (o.pricing?.deliveryPaise || 0),
    0,
  );
  const totalKmToday = history.reduce((sum, o) => {
    const s = storeById(o.storeId);
    return sum + routeKm(s?.localityId ?? o.localityId, o.localityId);
  }, 0);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void Haptics.selectionAsync();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Top Floating App Bar */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#222327',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Captain Profile Pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                backgroundColor: '#222327',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: online ? '#10B981' : '#3F3F46',
                position: 'relative',
              }}
            >
              <Bike size={22} color={online ? '#10B981' : '#A1A1AA'} />
              {online ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: 9999,
                    backgroundColor: '#10B981',
                    borderWidth: 2,
                    borderColor: '#18191B',
                  }}
                />
              ) : null}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontWeight: '700',
                    color: '#F4F4F5',
                  }}
                >
                  {profile?.name || 'Captain'}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: '#222327',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>4.92</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: '#A1A1AA', marginTop: 2 }}>
                {localityById(profile?.localityId)?.name ?? 'Madurai Hub'} · DFC Fleet
              </Text>
            </View>
          </View>

          {/* Online / Offline Switch */}
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={online ? 'Go Offline' : 'Go Online'}
            onPress={() => void toggleOnline()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: online ? '#064E3B' : '#222327',
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: online ? '#10B981' : '#3F3F46',
            }}
          >
            <Power size={14} color={online ? '#34D399' : '#A1A1AA'} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 0.5,
                color: online ? '#34D399' : '#A1A1AA',
              }}
            >
              {online ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </Pressable>
        </View>

        {/* Lockout or Cancel Limit Notice */}
        {isLockedOut ? (
          <View
            style={{
              marginTop: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <ShieldAlert size={18} color="#EF4444" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                Account Locked ({strikes}/2 cancellations)
              </Text>
              <Text style={{ fontSize: 11, color: '#FCA5A5', marginTop: 2, lineHeight: 16 }}>
                You have reached the maximum 2 daily cancellation limit. Admin review is required to unblock.
              </Text>
            </View>
          </View>
        ) : strikes > 0 ? (
          <View
            style={{
              marginTop: 10,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={13} color="#F59E0B" />
            <Text style={{ fontSize: 11, color: '#FCD34D', fontWeight: '600' }}>
              Cancellation allowance: {strikes} of 2 used today.
            </Text>
          </View>
        ) : null}

        {/* Telemetry Quick Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#222327',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '600' }}>EARNINGS TODAY</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#F4F4F5', marginTop: 2 }}>
              {formatInr(earnedTodayPaise)}
            </Text>
          </View>

          <View style={{ width: 1, height: 24, backgroundColor: '#222327' }} />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '600' }}>TRIPS</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#F4F4F5', marginTop: 2 }}>
              {history.length}
            </Text>
          </View>

          <View style={{ width: 1, height: 24, backgroundColor: '#222327' }} />

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '600' }}>TOTAL KM</Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#38BDF8', marginTop: 2 }}>
              {totalKmToday.toFixed(1)} km
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF7F50"
            colors={['#FF7F50']}
          />
        }
      >
        {/* Weather / Monsoon Safety Surge Banner */}
        {platform.rainSurge?.active ? (
          <View
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              borderColor: 'rgba(56, 189, 248, 0.3)',
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudRain size={20} color="#38BDF8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#38BDF8' }}>
                Monsoon Rain Safety Bonus Active
              </Text>
              <Text style={{ fontSize: 11, color: '#BAE6FD', marginTop: 2 }}>
                +₹{Math.round(platform.rainSurge.riderSafetyBonusPaise / 100)} extra per delivery order. Ride with headlights ON.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Night Rest Curfew */}
        {platform.status === 'sleep' ? (
          <View
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Moon size={20} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#F59E0B' }}>
                Night Dispatch Curfew · இரவு ஓய்வு
              </Text>
              <Text style={{ fontSize: 11, color: '#FDE68A', marginTop: 2 }}>
                Morning breakfast runs resume at {platform.nextOpenTime ?? '6:00 AM'}.
              </Text>
            </View>
          </View>
        ) : null}

        {/* ACTIVE TASK CARD (Hero) */}
        {activeTask ? (
          <Animated.View entering={FadeInUp.duration(300)}>
            <View
              style={{
                backgroundColor: '#18191B',
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: '#FF7F50',
                overflow: 'hidden',
                shadowColor: '#FF7F50',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Task Header */}
              <View
                style={{
                  backgroundColor: '#FF7F50',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: 0.8,
                    }}
                  >
                    ACTIVE TASK · {activeTask.category.toUpperCase()}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                    #{activeTask.code}
                  </Text>
                </View>
              </View>

              {/* Task Content */}
              <View style={{ padding: 16, gap: 14 }}>
                {/* Store Pickup */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: '#222327',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <MapPin size={14} color="#A1A1AA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#71717A', fontWeight: '700' }}>
                      PICKUP STORE
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        fontWeight: '700',
                        color: '#F4F4F5',
                        marginTop: 2,
                      }}
                    >
                      {storeById(activeTask.storeId)?.name || 'Merchant Partner'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 1 }}>
                      {localityById(storeById(activeTask.storeId)?.localityId)?.name ?? 'Madurai'}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: '#222327',
                    marginLeft: 40,
                  }}
                />

                {/* Customer Drop */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <Navigation size={14} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>
                      DELIVERY DROP
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        fontWeight: '700',
                        color: '#F4F4F5',
                        marginTop: 2,
                      }}
                    >
                      {localityById(activeTask.localityId)?.name ?? 'Customer Address'}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: '#A1A1AA', marginTop: 1 }}
                      numberOfLines={1}
                    >
                      {activeTask.addressLine || 'Madurai'}
                    </Text>
                  </View>
                </View>

                {/* Payout & Payment Mode Footer */}
                <View
                  style={{
                    backgroundColor: '#222327',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 10, color: '#71717A', fontWeight: '700' }}>
                      COLLECTION TYPE
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View
                        style={{
                          backgroundColor:
                            activeTask.paymentMode === 'cod'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color:
                              activeTask.paymentMode === 'cod' ? '#F87171' : '#34D399',
                          }}
                        >
                          {activeTask.paymentMode === 'cod'
                            ? `COLLECT CASH · ${formatInr(activeTask.pricing.totalPaise)}`
                            : 'PREPAID ONLINE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: '#71717A', fontWeight: '700' }}>
                      YOUR PAYOUT
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: '#FF7F50',
                        marginTop: 2,
                      }}
                    >
                      {formatInr(activeTask.pricing.deliveryPaise)}
                    </Text>
                  </View>
                </View>

                {/* Open Task Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open Navigation & Task"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    router.push(`/(rider)/task/${activeTask.id}` as never);
                  }}
                  style={{
                    backgroundColor: '#FF7F50',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <Navigation size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    START NAVIGATION & DELIVERY
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : online ? (
          /* RADAR PULSE WHEN ONLINE WITH NO ACTIVE TASK */
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#222327',
              gap: 16,
            }}
          >
            {/* Concentric Pulse Rings Simulation */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 9999,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderWidth: 1.5,
                borderColor: 'rgba(16, 185, 129, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(16, 185, 129, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9999,
                    backgroundColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Radio size={22} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#F4F4F5',
                }}
              >
                Scanning for Orders...
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#A1A1AA',
                  textAlign: 'center',
                  maxWidth: 240,
                  lineHeight: 18,
                }}
              >
                You are high priority in {localityById(profile?.localityId)?.name ?? 'Madurai Center'}. Stay connected.
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#222327',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
              }}
            >
              <Zap size={13} color="#F59E0B" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#F4F4F5' }}>
                High Demand Zone · 1.2x Payout Surge
              </Text>
            </View>
          </View>
        ) : (
          /* OFFLINE HERO CARD */
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#222327',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 9999,
                backgroundColor: '#222327',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#3F3F46',
              }}
            >
              <Power size={30} color="#71717A" />
            </View>

            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: '700',
                  color: '#F4F4F5',
                }}
              >
                You are currently Offline
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#A1A1AA',
                  textAlign: 'center',
                  maxWidth: 240,
                  lineHeight: 18,
                }}
              >
                Go online to start receiving delivery assignments and earn instant payouts.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go Online Now"
              onPress={() => void toggleOnline()}
              style={{
                backgroundColor: '#10B981',
                paddingVertical: 13,
                paddingHorizontal: 28,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Power size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                GO ONLINE NOW
              </Text>
            </Pressable>
          </View>
        )}

        {/* TODAY'S COMPLETED DELIVERIES */}
        <View style={{ gap: 12, marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: '#F4F4F5',
              }}
            >
              Today's Completed Trips ({history.length})
            </Text>

            <Pressable
              onPress={() => router.push('/(rider)/earnings' as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6A5ACD' }}>
                View All
              </Text>
              <ChevronRight size={14} color="#6A5ACD" />
            </Pressable>
          </View>

          {history.length === 0 ? (
            <View
              style={{
                backgroundColor: '#18191B',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#222327',
                gap: 8,
              }}
            >
              <Truck size={28} color="#3F3F46" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#71717A' }}>
                No completed trips yet today
              </Text>
            </View>
          ) : (
            history.slice(0, 5).map((order) => {
              const s = storeById(order.storeId);
              const drop = localityById(order.localityId);
              return (
                <View
                  key={order.id}
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
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                        #{order.code} · {s?.name ?? 'Store'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#A1A1AA', marginLeft: 20 }}>
                      Drop: {drop?.name ?? 'Madurai'} · {order.category}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                      +{formatInr(order.pricing.deliveryPaise)}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#71717A' }}>
                      {order.paymentMode === 'cod' ? 'COD' : 'PREPAID'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <RiderStitchNav activeTab="tasks" activeCount={activeTask ? 1 : 0} />
    </View>
  );
}
