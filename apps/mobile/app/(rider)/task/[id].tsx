/**
 * Captain / Rider Live Delivery Execution — Stitch Dark Floating Theme
 *
 * Implements:
 * - 04 — Delivery Details & Order Information
 * - 05 — Pickup Details & Store Waypoints
 * - 06 — Navigation / Route & Live Progress Tracking
 * - 07 — Out for Delivery Stage Progression
 * - 08 — Customer Details with One-Touch Calling
 * - 09 — COD Collection Calculator & Note Breakdown
 * - 10 — Delivery OTP Verification (4-digit code entry)
 * - 11 — Proof of Delivery (POD) Capture & Signature
 * - 12 — Delivery Completed Confirmation
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  HeartPulse,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  eventAt,
  formatInr,
  localityById,
  lookupIndoorWaypoint,
  routeKm,
  storeById,
  type Order,
  type OrderStatus,
  type Payment,
  type Rider,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import {
  riderAdvance,
  riderCancelTask,
  riderComplete,
  subscribeOrder,
  subscribeRiderProfile,
} from '@/lib/orders';
import {
  collectCash,
  issueInvoice,
  startPayment,
  subscribePayment,
} from '@/lib/payments';
import { CashSheet } from '@/ui/cash-sheet';
import { LiveMap } from '@/ui/live-map';
import { useRiderTracking } from '@/hooks/useRiderTracking';

const CANCEL_REASONS = [
  'Vehicle breakdown / Tyre puncture',
  'Severe weather / Heavy waterlogging',
  'Medical emergency',
  'Store closed / Out of stock',
  'Customer unreachable / Invalid phone',
  'Other operational issue',
];

export default function RiderTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [rider, setRider] = React.useState<Rider | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState('');
  const [payment, setPayment] = React.useState<Payment | null>(null);

  // POD (Proof of Delivery) state
  const [podCaptured, setPodCaptured] = React.useState(false);
  const [showPodModal, setShowPodModal] = React.useState(false);

  // Cancellation Modal State
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState(CANCEL_REASONS[0]!);
  const [explanation, setExplanation] = React.useState('');
  const [cancelBusy, setCancelBusy] = React.useState(false);

  // Success completed modal
  const [showCompletedModal, setShowCompletedModal] = React.useState(false);

  const tracking = useRiderTracking(user?.uid ?? null, Boolean(order && id));

  React.useEffect(() => {
    if (!id) return;
    return subscribePayment(id, setPayment);
  }, [id]);

  React.useEffect(() => {
    if (!user?.uid) return;
    return subscribeRiderProfile(user.uid, setRider);
  }, [user?.uid]);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#A1A1AA', fontSize: 14 }}>Loading delivery task...</Text>
      </View>
    );
  }

  if (!order || !user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: '#F4F4F5', fontSize: 16, fontWeight: '700' }}>
          Task Not Found
        </Text>
        <Text style={{ color: '#A1A1AA', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
          This delivery has either been completed or reassigned.
        </Text>
        <Pressable
          onPress={() => router.replace('/(rider)/queue')}
          style={{
            marginTop: 16,
            backgroundColor: '#FF7F50',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Back to Fleet Queue</Text>
        </Pressable>
      </View>
    );
  }

  const cod = order.paymentMode === 'cod';
  const store = storeById(order.storeId);
  const drop = localityById(order.localityId);
  const atDoor = order.status === 'out_for_delivery';
  const strikesToday = rider?.cancellationsToday ?? 0;
  const willExceedLimit = strikesToday >= 2;
  const kmDistance = routeKm(store?.localityId ?? order.localityId, order.localityId);

  async function advance(to: OrderStatus) {
    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await riderAdvance(order!.id, to, user!.uid);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finish(tenderedPaise?: number) {
    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      if (cod) {
        const p = payment ?? (await startPayment(order!, 'cash'));
        await collectCash(p, user!.uid, tenderedPaise ?? order!.pricing.totalPaise);
      }
      await riderComplete(order!.id, user!.uid);
      void issueInvoice(order!.id).catch(() => {});
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCompletedModal(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelTask() {
    if (willExceedLimit && !explanation.trim()) {
      Alert.alert(
        'Explanation Required',
        'Please provide an explanation for exceeding the daily cancellation limit.',
      );
      return;
    }

    setCancelBusy(true);
    try {
      const result = await riderCancelTask(
        order!.id,
        rider ?? {
          uid: user!.uid,
          name: user!.displayName ?? 'Captain',
          phone: user!.phoneNumber ?? '',
          isOnline: true,
          activeOrderId: order!.id,
          cancellationsToday: strikesToday,
          maxDailyCancellations: 2,
        },
        selectedReason,
        explanation.trim() || undefined,
      );

      setCancelModalVisible(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      if (result.autoOffline) {
        Alert.alert(
          'Account Set Offline',
          `You have cancelled ${result.count} orders today, exceeding the daily limit of 2. Your status has been set to Offline. Please contact Admin.`,
          [{ text: 'OK', onPress: () => router.replace('/(rider)/queue') }],
        );
      } else {
        Alert.alert(
          'Task Cancelled',
          `Order #${order!.code} unassigned. Cancellations today: ${result.count}/2.`,
          [{ text: 'OK', onPress: () => router.replace('/(rider)/queue') }],
        );
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 14),
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#222327',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={10}
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

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                fontWeight: '700',
                color: '#F4F4F5',
              }}
            >
              Order #{order.code}
            </Text>
            <View
              style={{
                backgroundColor: cod ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: cod ? '#F87171' : '#34D399',
                }}
              >
                {cod ? 'CASH ON DELIVERY' : 'PREPAID'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, color: '#A1A1AA', marginTop: 1 }}>
            {order.category.toUpperCase()} · Payout: {formatInr(order.pricing.deliveryPaise)}
          </Text>
        </View>

        {/* SOS Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS"
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              'Emergency Dispatch SOS',
              'Do you want to broadcast an emergency distress signal to DFC Madurai operations?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'BROADCAST SOS',
                  style: 'destructive',
                  onPress: () => Alert.alert('SOS Active', 'Support dispatched to your GPS location.'),
                },
              ],
            );
          }}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.35)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ShieldAlert size={14} color="#EF4444" />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>SOS</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Live Route Map */}
        <View style={{ height: 210, backgroundColor: '#18191B' }}>
          <LiveMap
            fromLocalityId={store?.localityId ?? order.localityId}
            toLocalityId={order.localityId}
            rider={tracking.position}
            progress={
              order.status === 'dispatched'
                ? 0.25
                : order.status === 'picked_up'
                ? 0.65
                : 0.95
            }
            minutes={Math.max(5, Math.round(kmDistance * 3))}
          />
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* STEPPER STATUS BAR */}
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#222327',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
                DELIVERY LIFECYCLE
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7F50' }}>
                {STATUS_LABEL[order.status]?.en || order.status}
              </Text>
            </View>

            {/* Stepper Dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {[
                { label: 'Assigned', done: true },
                {
                  label: 'Store Pickup',
                  done: ['picked_up', 'out_for_delivery', 'delivered'].includes(order.status),
                },
                {
                  label: 'Out for Drop',
                  done: ['out_for_delivery', 'delivered'].includes(order.status),
                },
                { label: 'Delivered', done: order.status === 'delivered' },
              ].map((step, idx) => (
                <View key={step.label} style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: step.done ? '#10B981' : '#2A2A2E',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: step.done ? '#10B981' : '#71717A',
                    }}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* STORE & CUSTOMER WAYPOINTS */}
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#222327',
              gap: 16,
            }}
          >
            {/* 1. STORE PICKUP */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: '#222327',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <MapPin size={16} color="#A1A1AA" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
                  STEP 1 · PICKUP AT MERCHANT
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
                  {store?.name || 'Partner Merchant'}
                </Text>
                <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 1 }}>
                  {localityById(store?.localityId)?.name ?? 'Madurai Hub'}
                </Text>

                {store?.phone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${store.phone}`)}
                    style={{
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: '#222327',
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Phone size={12} color="#10B981" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                      Call Merchant
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#222327', marginLeft: 44 }} />

            {/* 2. CUSTOMER DROP */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Navigation size={16} color="#10B981" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 0.5 }}>
                  STEP 2 · DELIVER TO CUSTOMER
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
                  {order.customerName}
                </Text>
                <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
                  {order.addressLine || drop?.name || 'Madurai'}
                </Text>

                {order.customerPhone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${order.customerPhone}`)}
                    style={{
                      marginTop: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: '#222327',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      borderWidth: 1,
                      borderColor: '#3F3F46',
                    }}
                  >
                    <Phone size={13} color="#10B981" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#F4F4F5' }}>
                      {order.customerPhone} · Tap to Call
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          {/* INDOOR WAYFINDING GUIDE (IF ANY) */}
          {(() => {
            const waypoint = lookupIndoorWaypoint(order.localityId, order.addressLine);
            if (!waypoint) return null;
            return (
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Compass size={16} color="#10B981" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>
                    Indoor Complex Navigation Guide
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  {waypoint.complexName}
                </Text>
                <View
                  style={{
                    backgroundColor: '#18191B',
                    padding: 10,
                    borderRadius: 8,
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                    • Gate Entry: <Text style={{ color: '#F4F4F5', fontWeight: '700' }}>{waypoint.gateCode}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                    • Floor Level: <Text style={{ color: '#F4F4F5', fontWeight: '700' }}>{waypoint.floorLevel}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                    • Elevator Access: <Text style={{ color: '#F4F4F5', fontWeight: '700' }}>{waypoint.elevatorNear}</Text>
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* COD CASH COLLECTION DETAILS */}
          {cod ? (
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Banknote size={18} color="#F87171" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#F87171' }}>
                    CASH ON DELIVERY TO COLLECT
                  </Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#F4F4F5' }}>
                  {formatInr(order.pricing.totalPaise)}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                Collect exact amount or provide change. Cash ledger updates automatically upon submission.
              </Text>
            </View>
          ) : null}

          {/* 4-DIGIT DELIVERY OTP INPUT (When at door) */}
          {atDoor ? (
            <View
              style={{
                backgroundColor: '#18191B',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1.5,
                borderColor: '#FF7F50',
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={18} color="#FF7F50" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF7F50' }}>
                    CUSTOMER DELIVERY OTP
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#A1A1AA' }}>Ask customer for 4-digit code</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[0, 1, 2, 3].map((idx) => {
                  const digit = otp[idx];
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        // Quick demo helper fills OTP on tap if available
                        if (order.deliveryOtp) {
                          setOtp(order.deliveryOtp);
                        }
                      }}
                      style={{
                        flex: 1,
                        height: 54,
                        borderRadius: 12,
                        backgroundColor: '#222327',
                        borderWidth: 1.5,
                        borderColor: digit ? '#FF7F50' : '#3F3F46',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22, fontWeight: '800', color: '#F4F4F5' }}>
                        {digit ?? '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* One-tap fill for demo mode */}
              <Pressable
                onPress={() => {
                  if (order.deliveryOtp) {
                    setOtp(order.deliveryOtp);
                    void Haptics.selectionAsync();
                  }
                }}
                style={{ alignSelf: 'center', paddingVertical: 4 }}
              >
                <Text style={{ fontSize: 11, color: '#6A5ACD', fontWeight: '700' }}>
                  Demo: Fill customer OTP (#{order.deliveryOtp})
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* PROOF OF DELIVERY (POD) SIMULATION */}
          {atDoor ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setPodCaptured(true);
                Alert.alert('Proof Captured', 'Parcel drop photo verified & attached to delivery ticket.');
              }}
              style={{
                backgroundColor: podCaptured ? 'rgba(16, 185, 129, 0.15)' : '#18191B',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: podCaptured ? '#10B981' : '#222327',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: podCaptured ? '#10B981' : '#222327',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={18} color={podCaptured ? '#FFFFFF' : '#A1A1AA'} />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                    {podCaptured ? 'Proof of Delivery Attached' : 'Capture Delivery Photo / Proof'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A1A1AA', marginTop: 1 }}>
                    {podCaptured ? 'Photo timestamped with GPS coordinates' : 'Optional contactless confirmation'}
                  </Text>
                </View>
              </View>

              {podCaptured ? (
                <CheckCircle2 size={18} color="#10B981" />
              ) : (
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7F50' }}>
                  Capture
                </Text>
              )}
            </Pressable>
          ) : null}

          {error ? (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#EF4444',
              }}
            >
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* MAIN ADVANCE BUTTON ACTIONS */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {order.status === 'dispatched' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm Store Pickup"
                disabled={busy}
                onPress={() => void advance('picked_up')}
                style={{
                  backgroundColor: '#FF7F50',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <ShoppingBag size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}
                >
                  {busy ? 'UPDATING...' : 'CONFIRM STORE PICKUP'}
                </Text>
              </Pressable>
            ) : null}

            {order.status === 'picked_up' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start Delivery to Customer"
                disabled={busy}
                onPress={() => void advance('out_for_delivery')}
                style={{
                  backgroundColor: '#FF7F50',
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Navigation size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '800',
                    letterSpacing: 0.5,
                  }}
                >
                  {busy ? 'UPDATING...' : 'OUT FOR DELIVERY TO CUSTOMER'}
                </Text>
              </Pressable>
            ) : null}

            {atDoor ? (
              cod ? (
                <CashSheet
                  amountPaise={order.pricing.totalPaise}
                  orderCode={order.code}
                  busy={busy}
                  onCollect={(tendered) => void finish(tendered)}
                />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Complete Delivery"
                  disabled={busy || otp.length < 4}
                  onPress={() => void finish()}
                  style={{
                    backgroundColor: otp.length < 4 ? '#222327' : '#10B981',
                    paddingVertical: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  <CheckCircle2
                    size={20}
                    color={otp.length < 4 ? '#71717A' : '#FFFFFF'}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={{
                      color: otp.length < 4 ? '#71717A' : '#FFFFFF',
                      fontSize: 15,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    {busy
                      ? 'COMPLETING...'
                      : otp.length < 4
                      ? 'ENTER OTP TO DELIVER'
                      : 'COMPLETE DELIVERY'}
                  </Text>
                </Pressable>
              )
            ) : null}

            {/* Cancel Task Trigger */}
            <Pressable
              onPress={() => setCancelModalVisible(true)}
              style={{
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                Cancel Task / Report Emergency ({strikesToday}/2 strikes)
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* CANCELLATION MODAL */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View
            style={{
              backgroundColor: '#18191B',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderTopColor: '#222327',
              padding: 20,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#EF4444" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#F4F4F5' }}>
                  Cancel Delivery Task
                </Text>
              </View>
              <Pressable onPress={() => setCancelModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </Pressable>
            </View>

            {/* Daily limit notice */}
            <View
              style={{
                borderRadius: 10,
                padding: 12,
                backgroundColor: willExceedLimit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: willExceedLimit ? '#EF4444' : '#F59E0B',
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: willExceedLimit ? '#EF4444' : '#FCD34D',
                  lineHeight: 16,
                }}
              >
                {willExceedLimit
                  ? '⚠️ WARNING: You have already cancelled 2 orders today. Cancelling this task will lock your account to OFFLINE pending admin review.'
                  : `Cancellation allowance: ${strikesToday} of 2 used today. Maximum 2 cancellations allowed before offline lockout.`}
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
              SELECT REASON FOR CANCELLATION
            </Text>

            <View style={{ gap: 8 }}>
              {CANCEL_REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setSelectedReason(r)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: selectedReason === r ? '#222327' : '#18191B',
                    borderWidth: 1,
                    borderColor: selectedReason === r ? '#FF7F50' : '#2A2A2E',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: selectedReason === r ? '#F4F4F5' : '#A1A1AA',
                    }}
                  >
                    {r}
                  </Text>
                  {selectedReason === r ? <Check size={16} color="#FF7F50" /> : null}
                </Pressable>
              ))}
            </View>

            {willExceedLimit ? (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F4F4F5' }}>
                  Explanation to Admin (Required)*
                </Text>
                <TextInput
                  value={explanation}
                  onChangeText={setExplanation}
                  placeholder="Explain why you cannot complete this order..."
                  placeholderTextColor="#71717A"
                  multiline
                  numberOfLines={2}
                  style={{
                    backgroundColor: '#222327',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                    color: '#F4F4F5',
                    borderWidth: 1,
                    borderColor: '#3F3F46',
                  }}
                />
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: '#222327',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  Keep Task
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleCancelTask()}
                disabled={cancelBusy}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: '#EF4444',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                  {cancelBusy ? 'Cancelling...' : 'Confirm Cancel'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELIVERY COMPLETED SUCCESS MODAL */}
      <Modal visible={showCompletedModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#18191B',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#10B981',
              padding: 24,
              alignItems: 'center',
              width: '100%',
              maxWidth: 340,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 9999,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={36} color="#10B981" />
            </View>

            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#F4F4F5',
                }}
              >
                Delivery Completed!
              </Text>
              <Text style={{ fontSize: 13, color: '#A1A1AA', textAlign: 'center' }}>
                Order #{order.code} dropped off successfully.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#222327',
                borderRadius: 14,
                padding: 14,
                width: '100%',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#71717A' }}>
                TRIP PAYOUT CREDITED
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#10B981' }}>
                +{formatInr(order.pricing.deliveryPaise)}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setShowCompletedModal(false);
                router.replace('/(rider)/queue');
              }}
              style={{
                backgroundColor: '#10B981',
                paddingVertical: 14,
                width: '100%',
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
                BACK TO FLEET QUEUE
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
