/**
 * DFC Live Order & Delivery Tracking Screen — Stitch Dark Floating Theme
 * Map View Canvas with Route Nodes & Live Rider Marker, Pull-up Sheet,
 * 6-Stage Timeline, Captain Info Card, Delivery OTP, and Order Receipt Breakdown.
 */

import * as React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Clock,
  Home,
  KeyRound,
  MessageSquare,
  Phone,
  Pill,
  Sparkles,
  Star,
  Utensils,
  Bike,
  ShieldCheck,
  ShoppingBag,
  Printer,
  Package,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, type Order, type Rider } from '@dfc/core';
import { subscribeOrder } from '@/lib/orders';
import { subscribeRider, subscribeRiderPosition, type LatLng } from '@/lib/riders';
import { DEMO_MODE } from '@/demo/config';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [assignedRider, setAssignedRider] = React.useState<Rider | null>(null);
  const [riderPos, setRiderPos] = React.useState<LatLng | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [advancing, setAdvancing] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  React.useEffect(() => {
    if (!order?.riderUid) {
      setAssignedRider(null);
      setRiderPos(null);
      return;
    }
    const unsubRider = subscribeRider(order.riderUid, (r) => {
      setAssignedRider(r);
    });
    const unsubPos = subscribeRiderPosition(order.riderUid, (pos) => {
      setRiderPos(pos);
    });
    return () => {
      unsubRider();
      unsubPos();
    };
  }, [order?.riderUid]);

  const handleAdvanceStage = async () => {
    if (!order) return;
    setAdvancing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = mockOrderRepository.advanceStatus(order.id);
      if (updated) setOrder(updated);
    } finally {
      setAdvancing(false);
    }
  };

  if (!order && !loading) {
    return (
      <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
        <StitchHeader showBack={true} title="Order Details" />
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '700', color: '#E5E1E4' }}>
            Order not found
          </Text>
          <Pressable
            onPress={() => router.replace('/(customer)/orders')}
            style={{ backgroundColor: '#6A5ACD', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
              Back to Orders
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const isDelivered = order?.status === 'delivered';
  const riderName = assignedRider?.name || order?.riderName || order?.captainName || 'Muthu Kumar';

  // 6 Timeline Stages tailored to dark theme
  const stages = [
    { title: 'Order Confirmed', desc: 'Store acknowledged and queued preparation.', completed: true, active: false },
    {
      title: 'Store Packing & Ready',
      desc: 'Items securely checked and sealed with tamper sticker.',
      completed: order?.status !== 'incoming' && order?.status !== 'admin_review',
      active: order?.status === 'vendor_accepted' || order?.status === 'packing',
    },
    {
      title: 'Captain Assigned',
      desc: `${riderName} allocated for express pickup.`,
      completed: ['ready_for_pickup', 'dispatched', 'picked_up', 'out_for_delivery', 'delivered'].includes(
        order?.status || '',
      ),
      active: order?.status === 'ready_for_pickup' || order?.status === 'dispatched',
    },
    {
      title: 'Picked Up from Store',
      desc: `${riderName} checked items and began delivery run.`,
      completed: ['picked_up', 'out_for_delivery', 'delivered'].includes(order?.status || ''),
      active: order?.status === 'picked_up',
    },
    {
      title: 'On the Way to You',
      desc: `En route to ${order?.addressLine || 'your delivery location'}.`,
      completed: ['out_for_delivery', 'delivered'].includes(order?.status || ''),
      active: order?.status === 'out_for_delivery',
    },
    {
      title: 'Delivered & Completed',
      desc: 'Doorstep verification completed.',
      completed: isDelivered,
      active: isDelivered,
    },
  ];

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <StitchHeader
        showBack={true}
        title={`ORD-#${order?.code || '9824'}`}
        subtitle={order?.storeName || 'Madurai Express'}
        showNotifications={false}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Demo Stage Advance Tool */}
        {DEMO_MODE && !isDelivered ? (
          <View
            style={{
              backgroundColor: '#1E1B10',
              borderBottomWidth: 1,
              borderBottomColor: '#382F10',
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#FBBF24" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#FDE68A' }}>
                DEMO SIMULATION
              </Text>
            </View>
            <Pressable
              onPress={handleAdvanceStage}
              disabled={advancing}
              style={{
                backgroundColor: '#D97706',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                {advancing ? 'Advancing...' : '⚡ Advance Stage →'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Map View Section — Dark Stylized Radar */}
        <View
          style={{
            height: 220,
            backgroundColor: '#121216',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Grid Accent Lines */}
          <View
            style={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: 160,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.03)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              borderWidth: 1,
              borderColor: 'rgba(106, 90, 205, 0.1)',
            }}
          />

          {/* Simulated Origin Store Node */}
          <View
            style={{
              position: 'absolute',
              top: 36,
              left: 40,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#1C1B22',
              borderWidth: 2,
              borderColor: '#6A5ACD',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {order?.category === 'grocery' ? (
              <ShoppingBag size={20} color="#6EE7B7" />
            ) : order?.category === 'print' ? (
              <Printer size={20} color="#C4B5FD" />
            ) : (
              <Utensils size={20} color="#C8BFFF" />
            )}
          </View>

          {/* Dotted Route Curve Line */}
          <View
            style={{
              width: 150,
              height: 2,
              borderStyle: 'dashed',
              borderWidth: 1.5,
              borderColor: '#6A5ACD',
              transform: [{ rotate: '30deg' }],
            }}
          />

          {/* Live Rider Pin */}
          <View
            style={{
              position: 'absolute',
              top: 96,
              left: 140,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#6A5ACD',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.6,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Bike size={18} color="#FFFFFF" />
          </View>

          {/* Destination Node */}
          <View
            style={{
              position: 'absolute',
              bottom: 36,
              right: 40,
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: '#1C1B22',
              borderWidth: 2.5,
              borderColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10B981',
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Home size={20} color="#10B981" />
          </View>
        </View>

        {/* Pull-Up Tracking Canvas */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            marginTop: -20,
            paddingTop: 12,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#26262B',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#35343A',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header row: ETA & Live Pulse */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#26262B',
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#928F9E',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Estimated Arrival
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 28,
                  fontWeight: '800',
                  color: '#E5E1E4',
                  letterSpacing: -0.5,
                }}
              >
                {isDelivered ? 'Delivered' : '15-20'}{' '}
                <Text style={{ fontSize: 16, color: '#928F9E', fontWeight: '500' }}>
                  {isDelivered ? '' : 'mins'}
                </Text>
              </Text>
            </View>

            {/* Live Tracking Pulse */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                }}
              />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 11,
                  fontWeight: '800',
                  color: '#34D399',
                  letterSpacing: 0.5,
                }}
              >
                {isDelivered ? 'ORDER COMPLETE' : 'LIVE TRACKING'}
              </Text>
            </View>
          </View>

          {/* Delivery OTP Card */}
          {!isDelivered ? (
            <View
              style={{
                backgroundColor: '#1F1E26',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(106, 90, 205, 0.3)',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 22,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(106, 90, 205, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={20} color="#C8BFFF" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                    Delivery OTP
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E' }}>
                    Share with captain at doorstep
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#2A2935',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#6A5ACD',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 18,
                    fontWeight: '800',
                    color: '#C8BFFF',
                    letterSpacing: 4,
                  }}
                >
                  {order?.deliveryOtp || '8492'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Vertical 6-Stage Timeline */}
          <View className="mb-6">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '700',
                color: '#C8BFFF',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 16,
              }}
            >
              Order Progress
            </Text>

            <View style={{ paddingLeft: 8 }}>
              {stages.map((stage, i) => {
                return (
                  <View key={stage.title} className="flex-row gap-3">
                    <View className="items-center">
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: stage.completed
                            ? '#6A5ACD'
                            : stage.active
                            ? 'rgba(106, 90, 205, 0.2)'
                            : '#201F24',
                          borderWidth: stage.completed ? 0 : 2,
                          borderColor: stage.active ? '#6A5ACD' : '#35343A',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {stage.completed ? (
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        ) : stage.active ? (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6A5ACD' }} />
                        ) : null}
                      </View>
                      {i < stages.length - 1 ? (
                        <View
                          style={{
                            width: 2,
                            height: 28,
                            backgroundColor: stage.completed ? '#6A5ACD' : '#2C2B32',
                          }}
                        />
                      ) : null}
                    </View>

                    <View className="flex-1 pb-4">
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 14,
                          fontWeight: stage.completed || stage.active ? '700' : '500',
                          color: stage.completed || stage.active ? '#E5E1E4' : '#6E6B77',
                        }}
                      >
                        {stage.title}
                      </Text>
                      {stage.desc ? (
                        <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginTop: 2 }}>
                          {stage.desc}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Captain Info Card */}
          <View
            style={{
              backgroundColor: '#1E1D24',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#2D2C34',
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: '#6A5ACD',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                    {riderName.charAt(0)}
                  </Text>
                </View>

                <View>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
                    {riderName}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <View className="flex-row items-center gap-0.5">
                      <Star size={12} color="#FBBF24" fill="#FBBF24" />
                      <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#E5E1E4' }}>
                        {assignedRider?.rating || 4.9}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E' }}>
                      • {assignedRider?.vehicle || 'TVS Jupiter'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* License Plate Badge */}
              <View
                style={{
                  backgroundColor: '#141416',
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#35343A',
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}
              >
                <View style={{ backgroundColor: '#26252E', paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 10, fontWeight: '800', color: '#928F9E' }}>
                    TN 59
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, fontWeight: '800', color: '#E5E1E4' }}>
                    AZ 1234
                  </Text>
                </View>
              </View>
            </View>

            {/* Call & Chat Action Buttons */}
            <View className="flex-row items-center gap-3">
              <DFCPressable
                scaleTo={0.97}
                onPress={() => void Linking.openURL(`tel:${assignedRider?.phone || '+919876500004'}`)}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#6A5ACD',
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  Call Captain
                </Text>
              </DFCPressable>

              <DFCPressable
                scaleTo={0.92}
                onPress={() => router.push('/(customer)/chat')}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: '#26252E',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#383742',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={18} color="#C8BFFF" />
              </DFCPressable>
            </View>
          </View>

          {/* Bill Summary */}
          <View
            style={{
              backgroundColor: '#141416',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                marginBottom: 12,
              }}
            >
              Order Receipt
            </Text>

            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>Items Subtotal</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4' }}>
                {formatInr((order?.pricing as any)?.itemsPaise || order?.pricing?.totalPaise || 0)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>Delivery Partner Fee</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#10B981' }}>FREE</Text>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#26262B',
                paddingTop: 10,
                marginTop: 6,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Total Paid
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800', color: '#C8BFFF' }}>
                {formatInr(order?.pricing?.totalPaise || 0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
